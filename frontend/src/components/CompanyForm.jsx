import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const CompanyForm = ({ company, isEdit = false, onSave, onCancel }) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    taxId: '',
    taxIdType: 'RUC',
    email: '',
    phone: '',
    address: '',
    website: '',
    industry: '',
    description: '',
    defaultCurrency: 'USD',
    taxRate: 0, // Sin valor predefinido
    taxName: 'ITBMS',
    isActive: true
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit && company) {
      setFormData({
        name: company.name || '',
        legalName: company.legalName || '',
        taxId: company.taxId || '',
        taxIdType: company.taxIdType || 'RUC',
        email: company.email || '',
        phone: company.phone || '',
        address: company.addressLine1 || '', // Mapear addressLine1 a address
        website: company.website || '',
        industry: company.industry || '',
        description: company.notes || '',    // Mapear notes a description
        defaultCurrency: company.defaultCurrency || 'USD',
        taxRate: company.taxRate !== undefined ? company.taxRate : 0,
        taxName: company.taxName || 'ITBMS',
        isActive: company.isActive !== undefined ? company.isActive : true
      });
    }
  }, [isEdit, company]);

  const handleInputChange = (field, value) => {
    console.log(`🔄 Cambiando campo ${field}:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre comercial es requerido';
    }

    if (!formData.legalName.trim()) {
      newErrors.legalName = 'La razón social es requerida';
    }

    if (!formData.taxId.trim()) {
      newErrors.taxId = 'El número de identificación es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Mapear los datos del frontend a los campos esperados por el backend
      const backendData = {
        ...formData,
        address_line1: formData.address, // Mapear address a address_line1
        notes: formData.description,     // Mapear description a notes
      };
      
      // Remover los campos del frontend que no existen en el backend
      delete backendData.address;
      delete backendData.description;
      
      console.log('🚀 Frontend enviando datos:', JSON.stringify(backendData, null, 2));
      console.log('🔍 Descripción mapeada:', backendData.notes);
      console.log('🔍 Dirección mapeada:', backendData.address_line1);
      
      await onSave(backendData);
    } catch (error) {
      console.error('Error al guardar empresa:', error);
    } finally {
      setLoading(false);
    }
  };

  const taxIdTypes = [
    { value: 'RUC', label: 'RUC' },
    { value: 'DV', label: 'Dígito Verificador' },
    { value: 'PASSPORT', label: 'Pasaporte' },
    { value: 'OTHER', label: 'Otro' }
  ];

  const industries = [
    { value: 'technology', label: 'Tecnología' },
    { value: 'manufacturing', label: 'Manufactura' },
    { value: 'retail', label: 'Retail' },
    { value: 'services', label: 'Servicios' },
    { value: 'healthcare', label: 'Salud' },
    { value: 'education', label: 'Educación' },
    { value: 'finance', label: 'Finanzas' },
    { value: 'construction', label: 'Construcción' },
    { value: 'agriculture', label: 'Agricultura' },
    { value: 'other', label: 'Otro' }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-4">
          <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H7m5 0H9m0 0H7m6 0h2M9 7h6m-6 4h6m-6 4h6" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Editar Empresa' : 'Nueva Empresa'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isEdit ? 'Modifica la información de la empresa' : 'Completa la información para crear una nueva empresa'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Información Básica
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre Comercial *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.name ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Nombre que aparecerá en el sistema"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="legalName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Razón Social *
              </label>
              <input
                type="text"
                id="legalName"
                value={formData.legalName}
                onChange={(e) => handleInputChange('legalName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.legalName ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Razón social oficial"
              />
              {errors.legalName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.legalName}</p>
              )}
            </div>

            <div>
              <label htmlFor="taxIdType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Identificación
              </label>
              <select
                id="taxIdType"
                value={formData.taxIdType}
                onChange={(e) => handleInputChange('taxIdType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {taxIdTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número de Identificación *
              </label>
              <input
                type="text"
                id="taxId"
                value={formData.taxId}
                onChange={(e) => handleInputChange('taxId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.taxId ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="RUC, cédula o identificación fiscal"
              />
              {errors.taxId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.taxId}</p>
              )}
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Información de Contacto
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.email ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="contacto@empresa.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="+507 1234-5678"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dirección
              </label>
              <textarea
                id="address"
                rows={3}
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Dirección completa de la empresa"
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sitio Web
              </label>
              <input
                type="url"
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://www.empresa.com"
              />
            </div>

            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Industria
              </label>
              <select
                id="industry"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Seleccionar industria</option>
                {industries.map((industry) => (
                  <option key={industry.value} value={industry.value}>
                    {industry.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Configuración Financiera */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Configuración Financiera
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="defaultCurrency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Moneda Principal
              </label>
              <select
                id="defaultCurrency"
                value={formData.defaultCurrency}
                onChange={(e) => handleInputChange('defaultCurrency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="USD">Dólar Estadounidense (USD)</option>
                <option value="PAB">Balboa Panameño (PAB)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="CAD">Dólar Canadiense (CAD)</option>
                <option value="GBP">Libra Esterlina (GBP)</option>
              </select>
            </div>

            <div>
              <label htmlFor="taxName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Impuesto
              </label>
              <input
                type="text"
                id="taxName"
                value={formData.taxName}
                onChange={(e) => handleInputChange('taxName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="ITBMS"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tasa de Impuesto (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="taxRate"
                  value={formData.taxRate > 0 ? (formData.taxRate * 100).toFixed(2) : ''} // Mostrar vacío si es 0
                  onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) / 100 || 0)}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: 15.00"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400">%</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Ingrese la tasa de impuesto aplicable. En Panamá el ITBMS es del 7%. Este impuesto se aplicará automáticamente en todas las cotizaciones.
              </p>
            </div>
          </div>
        </div>

        {/* Información Adicional */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Información Adicional
          </h4>
          <div className="space-y-4">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Descripción de la empresa, actividades principales, etc."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Empresa activa
              </label>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Cancelar</span>
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{isEdit ? 'Actualizar' : 'Crear'} Empresa</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyForm;