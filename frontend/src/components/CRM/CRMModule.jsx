import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import customerService from '../../services/customerService';
import quotationService from '../../services/quotationService';
import productService from '../../services/productService';
import { PermissionGuard } from '../Permissions/PermissionComponents';

const defaultCustomerForm = {
  name: '',
  tradeName: '',
  taxId: '',
  dv: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
  isActive: true
};

const defaultQuotationForm = {
  code: '',
  customerId: '',
  issueDate: new Date().toISOString().slice(0, 10),
  expirationDate: '',
  currency: 'USD',
  itbmsRate: 0.07,
  subtotal: 0,
  notes: ''
};

const CRMModule = ({ mode = 'customers' }) => {
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [customerForm, setCustomerForm] = useState(defaultCustomerForm);
  const [quotationForm, setQuotationForm] = useState(defaultQuotationForm);
  const [customerError, setCustomerError] = useState('');
  const [quotationError, setQuotationError] = useState('');
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerLookup, setCustomerLookup] = useState('');
  const [quickProductOpen, setQuickProductOpen] = useState(false);
  const [quickProductForm, setQuickProductForm] = useState({
    name: '',
    type: 'product',
    sku: '',
    price: 0,
    description: ''
  });
  const [quickProductMessage, setQuickProductMessage] = useState('');
  const [quickProductError, setQuickProductError] = useState('');
  const [lastGeneratedCode, setLastGeneratedCode] = useState('');

  const loadCustomers = useCallback(async () => {
    try {
      setLoadingCustomers(true);
      const data = await customerService.getCustomers({ limit: 50 });
      setCustomers(data.customers || []);
    } catch (error) {
      setCustomerError(error.message || 'Error al cargar clientes');
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  const loadQuotations = useCallback(async () => {
    try {
      setLoadingQuotations(true);
      const data = await quotationService.getQuotations({ limit: 50 });
      setQuotations(data.data || []);
    } catch (error) {
      setQuotationError(error.message || 'Error al cargar cotizaciones');
    } finally {
      setLoadingQuotations(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
    loadQuotations();
  }, [loadCustomers, loadQuotations]);

  useEffect(() => {
    if (mode !== 'quotations') {
      setLastGeneratedCode('');
    }
  }, [mode]);

const handleCustomerChange = (event) => {
  const { name, value, type, checked } = event.target;
  setCustomerForm((prev) => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value
  }));
};

  const handleQuotationChange = (event) => {
    const { name, value } = event.target;
    setQuotationForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCustomerLookupChange = (event) => {
    setCustomerLookup(event.target.value);
  };

  const handleQuickProductChange = (event) => {
    const { name, value } = event.target;
    setQuickProductForm((prev) => ({
      ...prev,
      [name]: name === 'price' ? value : value
    }));
  };

  const handleQuickProductSubmit = async (event) => {
    event.preventDefault();
    setQuickProductError('');
    setQuickProductMessage('');

    try {
      await productService.createProduct({
        ...quickProductForm,
        price: Number(quickProductForm.price) || 0
      });
      setQuickProductMessage('Producto/servicio creado correctamente');
      setQuickProductForm({
        name: '',
        type: 'product',
        sku: '',
        price: 0,
        description: ''
      });
    } catch (err) {
      setQuickProductError(err.message || 'No se pudo crear el producto');
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const computedQuotationTotals = useMemo(() => {
    const subtotal = Number(quotationForm.subtotal) || 0;
    const rate = Number(quotationForm.itbmsRate) || 0;
    const taxTotal = Number((subtotal * rate).toFixed(2));
    const total = Number((subtotal + taxTotal).toFixed(2));
    return { subtotal, rate, taxTotal, total };
  }, [quotationForm.subtotal, quotationForm.itbmsRate]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const term = searchTerm.trim().toLowerCase();
    return customers.filter((customer) => {
      return [
        customer.name,
        customer.tradeName,
        customer.taxId,
        customer.dv,
        customer.email
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [customers, searchTerm]);

  const filteredQuotationCustomers = useMemo(() => {
    if (!customerLookup.trim()) return customers;
    const term = customerLookup.trim().toLowerCase();
    return customers.filter((customer) =>
      [customer.tradeName, customer.name, customer.taxId, customer.dv, customer.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [customers, customerLookup]);

const startEditCustomer = (customer) => {
  setEditingCustomerId(customer.id);
  setCustomerForm({
    name: customer.name || '',
    tradeName: customer.tradeName || '',
    taxId: customer.taxId || '',
    dv: customer.dv || '',
    email: customer.email || '',
    phone: customer.phone || '',
    address: customer.address || '',
    notes: customer.notes || '',
    isActive: customer.isActive ?? true
  });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetCustomerForm = () => {
    setEditingCustomerId(null);
    setCustomerForm(defaultCustomerForm);
  };

  const handleSubmitCustomer = async (event) => {
    event.preventDefault();
    setCustomerError('');

    try {
      const payload = {
        ...customerForm,
        taxId: customerForm.taxId.trim(),
        dv: customerForm.dv.trim().toUpperCase(),
        isActive: Boolean(customerForm.isActive)
      };

      if (editingCustomerId) {
        await customerService.updateCustomer(editingCustomerId, payload);
      } else {
        await customerService.createCustomer(payload);
      }

      resetCustomerForm();
      await loadCustomers();
    } catch (error) {
      setCustomerError(error.message || 'No se pudo crear el cliente');
    }
  };

  const toggleCustomerStatus = async (customer) => {
    try {
      await customerService.updateCustomerStatus(customer.id, !customer.isActive);
      await loadCustomers();
    } catch (error) {
      setCustomerError(error.message || 'No se pudo actualizar el estado del cliente');
    }
  };

  const handleSubmitQuotation = async (event) => {
    event.preventDefault();
    setQuotationError('');

    if (!quotationForm.customerId) {
      setQuotationError('Selecciona un cliente');
      return;
    }

    try {
      const response = await quotationService.createQuotation({
        ...quotationForm,
        customerId: parseInt(quotationForm.customerId, 10),
        subtotal: computedQuotationTotals.subtotal,
        itbmsRate: computedQuotationTotals.rate,
        taxTotal: computedQuotationTotals.taxTotal,
        total: computedQuotationTotals.total
      });
      setQuotationForm(defaultQuotationForm);
      setCustomerLookup('');
      if (response?.data?.data?.code) {
        setLastGeneratedCode(response.data.data.code);
      } else {
        setLastGeneratedCode('');
      }
      await loadQuotations();
    } catch (error) {
      setQuotationError(error.message || 'No se pudo crear la cotización');
    }
  };

  return (
    <div className="p-6 space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {mode === 'customers' ? 'Gestión de Clientes' : 'Gestión de Cotizaciones'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {mode === 'customers'
            ? 'Registra y consulta clientes con información fiscal panameña.'
            : 'Genera cotizaciones vinculadas a clientes y calcula ITBMS automáticamente.'}
        </p>
        {mode === 'quotations' && lastGeneratedCode && (
          <div className="mt-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-2 rounded text-sm">
            Última cotización generada: <strong>{lastGeneratedCode}</strong>
          </div>
        )}
      </div>

      {mode === 'customers' ? (
        <PermissionGuard permissions={['customers.view']} fallback={null}>
          <section className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingCustomerId ? 'Editar Cliente' : 'Registro de Cliente'}
              </h3>

              {customerError && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                  {customerError}
                </div>
              )}

              <form onSubmit={handleSubmitCustomer} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Nombre Legal *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={customerForm.name}
                      onChange={handleCustomerChange}
                      required
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Nombre registrado"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Nombre Comercial *
                    </label>
                    <input
                      type="text"
                      name="tradeName"
                      value={customerForm.tradeName}
                      onChange={handleCustomerChange}
                      required
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Nombre comercial"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      RUC *
                    </label>
                    <input
                      type="text"
                      name="taxId"
                      value={customerForm.taxId}
                      onChange={handleCustomerChange}
                      required
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="RUC del cliente"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      DV *
                    </label>
                    <input
                      type="text"
                      name="dv"
                      value={customerForm.dv}
                      onChange={handleCustomerChange}
                      required
                      maxLength={4}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase"
                      placeholder="DV"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={customerForm.email}
                      onChange={handleCustomerChange}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="correo@cliente.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={customerForm.phone}
                      onChange={handleCustomerChange}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="+507 6000-0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Dirección
                  </label>
                  <textarea
                    name="address"
                    value={customerForm.address}
                    onChange={handleCustomerChange}
                    rows={3}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Dirección fiscal o comercial"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Notas
                  </label>
                  <textarea
                    name="notes"
                    value={customerForm.notes}
                    onChange={handleCustomerChange}
                    rows={3}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Información adicional, términos o comentarios"
                  />
                </div>

                {editingCustomerId && (
                  <div className="flex items-center space-x-2">
                    <input
                      id="customer-active"
                      type="checkbox"
                      name="isActive"
                      checked={Boolean(customerForm.isActive)}
                      onChange={handleCustomerChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="customer-active"
                      className="text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                      Cliente activo
                    </label>
                  </div>
                )}

                <div className="flex justify-between">
                  <div>
                    {editingCustomerId && (
                      <button
                        type="button"
                        onClick={resetCustomerForm}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold transition hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loadingCustomers}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loadingCustomers
                      ? 'Guardando...'
                      : editingCustomerId
                        ? 'Actualizar Cliente'
                        : 'Guardar Cliente'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 space-y-3 lg:space-y-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Clientes Registrados
                </h3>
                <div className="relative w-full lg:w-72">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Buscar por nombre, RUC, DV o correo"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                </div>
              </div>

              {loadingCustomers ? (
                <div className="py-10 text-center text-gray-500 dark:text-gray-400">
                  Cargando clientes...
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="py-10 text-center text-gray-500 dark:text-gray-400">
                  Aún no has registrado clientes.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          RUC / DV
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Contacto
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {customer.tradeName || customer.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {customer.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {customer.taxId} / {customer.dv}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            <div>{customer.email || '—'}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {customer.phone || '—'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                  customer.isActive
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                                }`}
                              >
                                {customer.isActive ? 'Activo' : 'Inactivo'}
                              </span>
                              <button
                                type="button"
                                onClick={() => startEditCustomer(customer)}
                                className="text-primary-600 dark:text-primary-300 text-xs font-semibold hover:underline"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleCustomerStatus(customer)}
                                className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:underline"
                              >
                                {customer.isActive ? 'Desactivar' : 'Activar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </PermissionGuard>
      ) : (
        <PermissionGuard permissions={['sales.view']} fallback={null}>
          <section className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Generar Cotización
              </h3>

              {quotationError && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                  {quotationError}
                </div>
              )}

              <form onSubmit={handleSubmitQuotation} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Código
                    </label>
                    <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                      {lastGeneratedCode || 'Se generará automáticamente'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Cliente *
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={customerLookup}
                        onChange={handleCustomerLookupChange}
                        placeholder="Buscar cliente por nombre, RUC o correo"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <select
                        name="customerId"
                        value={quotationForm.customerId}
                        onChange={handleQuotationChange}
                        required
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Selecciona un cliente</option>
                        {filteredQuotationCustomers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.tradeName || customer.name} ({customer.taxId}-{customer.dv})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Fecha de emisión *
                    </label>
                    <input
                      type="date"
                      name="issueDate"
                      value={quotationForm.issueDate}
                      onChange={handleQuotationChange}
                      required
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Fecha de expiración
                    </label>
                    <input
                      type="date"
                      name="expirationDate"
                      value={quotationForm.expirationDate}
                      onChange={handleQuotationChange}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Subtotal (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="subtotal"
                      value={quotationForm.subtotal}
                      onChange={handleQuotationChange}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      ITBMS
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      name="itbmsRate"
                      value={quotationForm.itbmsRate}
                      onChange={handleQuotationChange}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Total estimado
                    </label>
                    <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
                      ${computedQuotationTotals.total.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/40 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        ¿Necesitas un producto o servicio nuevo?
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Crea elementos rápidamente para usarlos en tus cotizaciones.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickProductOpen((prev) => !prev);
                        setQuickProductMessage('');
                        setQuickProductError('');
                      }}
                      className="px-3 py-1 text-xs font-semibold rounded-lg border border-primary-500 text-primary-600 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    >
                      {quickProductOpen ? 'Ocultar' : 'Crear producto/servicio'}
                    </button>
                  </div>

                  {quickProductOpen && (
                    <form onSubmit={handleQuickProductSubmit} className="space-y-3">
                      {quickProductMessage && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-3 py-2 rounded text-xs">
                          {quickProductMessage}
                        </div>
                      )}
                      {quickProductError && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-3 py-2 rounded text-xs">
                          {quickProductError}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          name="name"
                          value={quickProductForm.name}
                          onChange={handleQuickProductChange}
                          required
                          placeholder="Nombre"
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <select
                          name="type"
                          value={quickProductForm.type}
                          onChange={handleQuickProductChange}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="product">Producto</option>
                          <option value="service">Servicio</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          name="sku"
                          value={quickProductForm.sku || ''}
                          onChange={handleQuickProductChange}
                          placeholder="SKU opcional"
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                          type="number"
                          name="price"
                          step="0.01"
                          min="0"
                          value={quickProductForm.price}
                          onChange={handleQuickProductChange}
                          placeholder="Precio"
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <textarea
                        name="description"
                        value={quickProductForm.description}
                        onChange={handleQuickProductChange}
                        rows={2}
                        placeholder="Descripción"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg font-semibold transition"
                        >
                          Guardar producto
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Notas
                  </label>
                  <textarea
                    name="notes"
                    value={quotationForm.notes}
                    onChange={handleQuotationChange}
                    rows={3}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Condiciones, entregables, forma de pago..."
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loadingQuotations}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loadingQuotations ? 'Guardando...' : 'Guardar Cotización'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cotizaciones Recientes
                </h3>
              </div>

              {loadingQuotations ? (
                <div className="py-10 text-center text-gray-500 dark:text-gray-400">
                  Cargando cotizaciones...
                </div>
              ) : quotations.length === 0 ? (
                <div className="py-10 text-center text-gray-500 dark:text-gray-400">
                  Aún no has registrado cotizaciones.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Código
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {quotations.map((quotation) => (
                        <tr key={quotation.id}>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            {quotation.code}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {quotation.customer?.tradeName || quotation.customer?.name || 'Cliente'}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {formatDate(quotation.issueDate)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-semibold">
                            ${Number(quotation.total).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                quotation.status === 'accepted'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : quotation.status === 'rejected'
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              }`}
                            >
                              {quotation.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </PermissionGuard>
      )}
    </div>
  );
};

export default CRMModule;
const formatDate = (value) => {
  if (!value) return '—';
  try {
    return format(new Date(value), 'dd/MM/yyyy');
  } catch (error) {
    return value;
  }
};
