import React, { useCallback, useEffect, useMemo, useState } from 'react';
import productService from '../../services/productService';
import { PermissionGuard } from '../Permissions/PermissionComponents';

const defaultProductForm = {
  name: '',
  type: 'product',
  sku: '',
  price: 0,
  description: '',
  isActive: true
};

const ProductsModule = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(defaultProductForm);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts({ limit: 200 });
      setProducts(data.data || []);
    } catch (err) {
      setError(err.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    try {
      const payload = {
        ...form,
        price: Number(form.price) || 0
      };

      if (editingId) {
        await productService.updateProduct(editingId, payload);
      } else {
        await productService.createProduct(payload);
      }

      setForm(defaultProductForm);
      setEditingId(null);
      await loadProducts();
    } catch (err) {
      setFormError(err.message || 'No se pudo guardar el producto');
    }
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      type: product.type,
      sku: product.sku || '',
      price: Number(product.price || 0),
      description: product.description || '',
      isActive: product.isActive
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(defaultProductForm);
  };

  const toggleStatus = async (product) => {
    try {
      await productService.updateProductStatus(product.id, !product.isActive);
      if (editingId === product.id) {
        setForm((prev) => ({
          ...prev,
          isActive: !product.isActive
        }));
      }
      await loadProducts();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el estado');
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const term = searchTerm.trim().toLowerCase();
    return products.filter((product) => (
      [product.name, product.sku, product.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    ));
  }, [products, searchTerm]);

  return (
    <PermissionGuard permissions={['sales.view']} fallback={null}>
      <div className="p-6 space-y-8 animate-fadeIn">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Productos y Servicios
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Administra tu catálogo comercial para usar en cotizaciones y ventas.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingId ? 'Editar producto/servicio' : 'Nuevo producto/servicio'}
            </h3>

            {formError && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Nombre del producto o servicio"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Tipo
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="product">Producto</option>
                    <option value="service">Servicio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    SKU/Código
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={form.sku}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="SKU opcional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Precio (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  value={form.price}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Detalles relevantes, características, etc."
                />
              </div>

              {editingId && (
                <div className="flex items-center space-x-2">
                  <input
                    id="product-active"
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="product-active" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Producto activo
                  </label>
                </div>
              )}

              <div className="flex justify-between">
                <div>
                  {editingId && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold transition hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition"
                >
                  {editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 space-y-3 lg:space-y-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Catálogo
              </h3>
              <div className="relative w-full lg:w-72">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, SKU o descripción"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
              </div>
            </div>

            {loading ? (
              <div className="py-10 text-center text-gray-500 dark:text-gray-400">
                Cargando productos...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-10 text-center text-gray-500 dark:text-gray-400">
                No hay productos registrados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Producto / Servicio
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {product.sku || 'Sin SKU'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 capitalize">
                          {product.type === 'product' ? 'Producto' : 'Servicio'}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          ${Number(product.price || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                product.isActive
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                              }`}
                            >
                              {product.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                            <button
                              type="button"
                              onClick={() => startEdit(product)}
                              className="text-primary-600 dark:text-primary-300 text-xs font-semibold hover:underline"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleStatus(product)}
                              className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:underline"
                            >
                              {product.isActive ? 'Desactivar' : 'Activar'}
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
      </div>
    </PermissionGuard>
  );
};

export default ProductsModule;
