import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeProvider';

const RoleForm = ({ role = null, permissions = {}, onSave, onCancel, isEditing }) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    isActive: true,
    permissions: []
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});

  useEffect(() => {
    if (role) {
      setFormData({
        id: role.id,
        name: role.name || '',
        displayName: role.displayName || role.name || '',
        description: role.description || '',
        isActive: role.isActive !== undefined ? role.isActive : true,
        permissions: role.permissions ? role.permissions.map(p => p.id) : []
      });
    } else {
      setFormData({
        name: '',
        displayName: '',
        description: '',
        isActive: true,
        permissions: []
      });
    }
    setErrors({});
  }, [role]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre interno es requerido';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.name)) {
      newErrors.name = 'El nombre solo puede contener letras, números, guiones y guiones bajos';
    }
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'El nombre para mostrar es requerido';
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
      await onSave(formData);
    } catch (error) {
      console.error('Error al guardar rol:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePermissionChange = (permissionId, checked) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(id => id !== permissionId)
    }));
  };

  const toggleModule = (module) => {
    setExpandedModules(prev => ({
      ...prev,
      [module]: !prev[module]
    }));
  };

  const selectAllModulePermissions = (module, modulePermissions) => {
    const permissionIds = modulePermissions.map(p => p.id);
    const allSelected = permissionIds.every(id => formData.permissions.includes(id));
    
    if (allSelected) {
      // Deseleccionar todos
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(id => !permissionIds.includes(id))
      }));
    } else {
      // Seleccionar todos
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...permissionIds])]
      }));
    }
  };

  if (!onSave) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {isEditing ? 'Editar Rol' : 'Crear Nuevo Rol'}
              </h3>
              <button
                type="button"
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre interno *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 ${
                      errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="admin, editor, usuario, etc."
                    disabled={loading}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Nombre técnico del rol (sin espacios ni caracteres especiales)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre para mostrar *
                  </label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 ${
                      errors.displayName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Administrador, Editor, Usuario, etc."
                    disabled={loading}
                  />
                  {errors.displayName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.displayName}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Nombre que se mostrará en la interfaz
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                  placeholder="Descripción del rol y sus responsabilidades..."
                  disabled={loading}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Rol activo
                </label>
              </div>

              {/* Permisos */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Permisos del Rol
                </h4>
                <div className="space-y-3">
                  {Object.entries(permissions).map(([module, modulePermissions]) => {
                    const isExpanded = expandedModules[module];
                    const modulePermissionIds = modulePermissions.map(p => p.id);
                    const selectedCount = modulePermissionIds.filter(id => formData.permissions.includes(id)).length;
                    const allSelected = selectedCount === modulePermissionIds.length;
                    const someSelected = selectedCount > 0 && selectedCount < modulePermissionIds.length;

                    return (
                      <div key={module} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => toggleModule(module)}
                              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                            >
                              <svg 
                                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span className="font-medium">{module}</span>
                            </button>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {selectedCount} de {modulePermissionIds.length} permisos
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => selectAllModulePermissions(module, modulePermissions)}
                            className={`text-sm font-medium transition-colors duration-200 ${
                              allSelected 
                                ? 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
                                : 'text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300'
                            }`}
                          >
                            {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                          </button>
                        </div>
                        
                        {isExpanded && (
                          <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {modulePermissions.map((permission) => (
                              <label key={permission.id} className="flex items-start space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.includes(permission.id)}
                                  onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
                                  disabled={loading}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {permission.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {permission.description}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{isEditing ? 'Actualizar Rol' : 'Crear Rol'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleForm;