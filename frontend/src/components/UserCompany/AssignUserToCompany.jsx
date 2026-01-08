import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeProvider';
import userCompanyService from '../../services/userCompanyService';

const AssignUserToCompany = ({ 
  open, 
  onClose, 
  onSuccess, 
  preselectedUser, 
  preselectedCompany,
  users = [],
  companies = [],
  editMode = false,
  editingUserCompany = null
}) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    userId: '',
    companyId: '',
    role: 'user',
    isDefault: false,
    notes: '',
    permissions: {
      create: false,
      read: true,
      update: false,
      delete: false,
      manage_users: false,
      manage_companies: false,
      view_reports: false,
      manage_settings: false
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      console.log('AssignUserToCompany - Modal abierto');
      console.log('Modo edición:', editMode);
      console.log('Datos de edición:', editingUserCompany);
      console.log('Usuarios disponibles:', users);
      console.log('Empresas disponibles:', companies);
      
      if (editMode && editingUserCompany) {
        // Modo edición: cargar datos existentes
        setFormData({
          userId: editingUserCompany.userId || editingUserCompany.user?.id || '',
          companyId: editingUserCompany.companyId || editingUserCompany.company?.id || '',
          role: editingUserCompany.role || 'user',
          isDefault: editingUserCompany.isDefault || false,
          notes: editingUserCompany.notes || '',
          permissions: editingUserCompany.permissions || {
            create: false,
            read: true,
            update: false,
            delete: false,
            manage_users: false,
            manage_companies: false,
            view_reports: false,
            manage_settings: false
          }
        });
      } else {
        // Modo creación: datos por defecto
        setFormData({
          userId: preselectedUser?.id || '',
          companyId: preselectedCompany?.id || '',
          role: 'user',
          isDefault: false,
          notes: '',
          permissions: {
            create: false,
            read: true,
            update: false,
            delete: false,
            manage_users: false,
            manage_companies: false,
            view_reports: false,
            manage_settings: false
          }
        });
      }
      setError('');
    }
  }, [open, editMode, editingUserCompany, preselectedUser, preselectedCompany, users, companies]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionChange = (permission, value) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value
      }
    }));
  };

  const handleRoleChange = (role) => {
    let defaultPermissions = {
      create: false,
      read: true,
      update: false,
      delete: false,
      manage_users: false,
      manage_companies: false,
      view_reports: false,
      manage_settings: false
    };

    switch (role) {
      case 'admin':
        defaultPermissions = {
          create: true,
          read: true,
          update: true,
          delete: true,
          manage_users: true,
          manage_companies: true,
          view_reports: true,
          manage_settings: true
        };
        break;
      case 'manager':
        defaultPermissions = {
          create: true,
          read: true,
          update: true,
          delete: false,
          manage_users: false,
          manage_companies: false,
          view_reports: true,
          manage_settings: false
        };
        break;
      case 'user':
        defaultPermissions = {
          create: false,
          read: true,
          update: false,
          delete: false,
          manage_users: false,
          manage_companies: false,
          view_reports: false,
          manage_settings: false
        };
        break;
      case 'viewer':
        defaultPermissions = {
          create: false,
          read: true,
          update: false,
          delete: false,
          manage_users: false,
          manage_companies: false,
          view_reports: false,
          manage_settings: false
        };
        break;
    }

    setFormData(prev => ({
      ...prev,
      role,
      permissions: defaultPermissions
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.companyId) {
      setError('Usuario y empresa son requeridos');
      return;
    }

    setLoading(true);
    setError('');

    const dataToSend = {
      userId: parseInt(formData.userId),
      companyId: parseInt(formData.companyId),
      role: formData.role,
      isDefault: formData.isDefault,
      permissions: formData.permissions,
      notes: formData.notes
    };

    console.log('Datos a enviar:', dataToSend);
    console.log('Empresas disponibles:', companies);
    console.log('Usuarios disponibles:', users);

    try {
      if (editMode && editingUserCompany) {
        // Modo edición: actualizar registro existente
        await userCompanyService.updateUserCompany(editingUserCompany.id, {
          role: formData.role,
          isDefault: formData.isDefault,
          permissions: formData.permissions,
          notes: formData.notes
        });
      } else {
        // Modo creación: crear nuevo registro
        await userCompanyService.assignUserToCompany(dataToSend);
      }

      onSuccess();
    } catch (error) {
      console.error(`Error al ${editMode ? 'editar' : 'asignar'} usuario:`, error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setError(error.response?.data?.message || error.message || `Error al ${editMode ? 'editar' : 'asignar'} usuario a empresa`);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const selectedUser = users.find(u => u.id === parseInt(formData.userId));
  const selectedCompany = companies.find(c => c.id === parseInt(formData.companyId));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editMode ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 6v6m0 0v6m0-6h6m-6 0H6"} />
                </svg>
              </div>
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  {editMode ? 'Editar Acceso de Usuario' : 'Asignar Usuario a Empresa'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {editMode ? 'Modifica el acceso y permisos del usuario en la empresa' : 'Configura el acceso y permisos del usuario en la empresa'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-gray-800 px-6 pb-4">
              {/* Error Alert */}
              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Usuario y Empresa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Usuario */}
                  <div>
                    <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Usuario *
                    </label>
                    <select
                      id="userId"
                      value={formData.userId}
                      onChange={(e) => handleInputChange('userId', e.target.value)}
                      disabled={!!preselectedUser || editMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-600"
                      required
                    >
                      <option value="">Seleccionar usuario</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Empresa */}
                  <div>
                    <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Empresa *
                    </label>
                    <select
                      id="companyId"
                      value={formData.companyId}
                      onChange={(e) => handleInputChange('companyId', e.target.value)}
                      disabled={!!preselectedCompany || editMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-600"
                      required
                    >
                      <option value="">Seleccionar empresa</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Rol */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rol en la Empresa *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: 'viewer', label: 'Visualizador', desc: 'Solo lectura' },
                      { value: 'user', label: 'Usuario', desc: 'Acceso básico' },
                      { value: 'manager', label: 'Gerente', desc: 'Gestión limitada' },
                      { value: 'admin', label: 'Administrador', desc: 'Control total' }
                    ].map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => handleRoleChange(role.value)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          formData.role === role.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {role.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {role.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Configuración Adicional */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Marcar como empresa predeterminada para este usuario
                    </label>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notas (opcional)
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Información adicional sobre este acceso..."
                    />
                  </div>
                </div>

                {/* Permisos */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Permisos Específicos
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(formData.permissions).map(([permission, granted]) => (
                        <div key={permission} className="flex items-center">
                          <input
                            type="checkbox"
                            id={permission}
                            checked={granted}
                            onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                          />
                          <label htmlFor={permission} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {loading ? (editMode ? 'Guardando...' : 'Asignando...') : (editMode ? 'Guardar Cambios' : 'Asignar Acceso')}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignUserToCompany;