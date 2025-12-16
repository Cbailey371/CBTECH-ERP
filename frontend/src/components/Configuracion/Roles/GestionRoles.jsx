import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import RoleForm from './RoleForm';
import DeleteRoleModal from './DeleteRoleModal';

const GestionRoles = () => {
  const { isDarkMode } = useTheme();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create', 'edit', 'delete'
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');

  // Función para hacer peticiones a la API
  const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const url = `http://localhost:5001/api${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}`);
    }

    return await response.json();
  };

  // Cargar roles desde la API
  const loadRoles = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest('/roles?include_permissions=true');
      setRoles(data.roles || []);
    } catch (error) {
      console.error('Error al cargar roles:', error);
      setError(error.message || 'Error de conexión al cargar roles');
    } finally {
      setLoading(false);
    }
  };

  // Cargar permisos
  const loadPermissions = async () => {
    try {
      const data = await apiRequest('/permissions/grouped/by-module');
      setPermissions(data || {});
    } catch (error) {
      console.error('Error al cargar permisos:', error);
      setError('Error al cargar permisos: ' + error.message);
    }
  };

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const filteredRoles = roles.filter(role =>
    (role.name && role.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (role.displayName && role.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateRole = () => {
    setModalType('create');
    setSelectedRole(null);
    setShowModal(true);
  };

  const handleEditRole = async (role) => {
    try {
      setModalType('edit');
      setError('');
      
      // Cargar el rol completo con permisos
      const response = await apiRequest(`/roles/${role.id}?include_permissions=true`);
      setSelectedRole(response);
      setShowModal(true);
    } catch (error) {
      console.error('Error al cargar rol para editar:', error);
      setError('Error al cargar rol: ' + error.message);
    }
  };

  const handleDeleteRole = (role) => {
    setModalType('delete');
    setSelectedRole(role);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRole(null);
    setModalType('create');
  };

  // Manejar creación/edición de rol
  const handleSaveRole = async (roleData) => {
    try {
      setError('');
      let response;

      const backendData = {
        name: roleData.name,
        display_name: roleData.displayName,
        description: roleData.description,
        is_active: roleData.isActive,
        permission_ids: roleData.permissions || []
      };

      if (modalType === 'create') {
        response = await apiRequest('/roles', {
          method: 'POST',
          body: JSON.stringify(backendData)
        });
        loadRoles(); // Recargar la lista
      } else if (modalType === 'edit') {
        response = await apiRequest(`/roles/${roleData.id}`, {
          method: 'PUT',
          body: JSON.stringify(backendData)
        });
        loadRoles(); // Recargar la lista
      }
      
      setShowModal(false);
      setSelectedRole(null);
    } catch (error) {
      console.error('Error al guardar rol:', error);
      setError(error.message || 'Error al guardar rol');
    }
  };

  const confirmDeleteRole = async (roleId) => {
    setDeleteLoading(true);
    try {
      setError('');
      await apiRequest(`/roles/${roleId}`, { method: 'DELETE' });
      setRoles(prev => prev.filter(role => role.id !== roleId));
      setShowModal(false);
      setSelectedRole(null);
    } catch (error) {
      console.error('Error al eliminar rol:', error);
      setError(error.message || 'Error al eliminar rol');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Roles
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Administra los roles del sistema y sus permisos
          </p>
        </div>
        <button
          onClick={handleCreateRole}
          className="mt-4 sm:mt-0 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nuevo Rol</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <span>⚠️</span>
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Roles del Sistema
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredRoles.length} {filteredRoles.length === 1 ? 'rol' : 'roles'}
            </span>
          </div>

          {filteredRoles.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'No se encontraron roles' : 'No hay roles'}
              </h4>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Comienza creando tu primer rol'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Rol</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Descripción</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Permisos</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map((role) => (
                    <tr key={role.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {role.displayName || role.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {role.name}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-600 dark:text-gray-300">
                          {role.description || '-'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {role.permissions ? role.permissions.length : 0} permisos
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          role.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {role.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditRole(role)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm transition-colors duration-200"
                          >
                            Editar
                          </button>
                          {!role.isSystem && (
                            <button
                              onClick={() => handleDeleteRole(role)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm transition-colors duration-200"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showModal && (modalType === 'create' || modalType === 'edit') && (
        <RoleForm
          role={selectedRole}
          permissions={permissions}
          onSave={handleSaveRole}
          onCancel={handleCloseModal}
          isEditing={modalType === 'edit'}
        />
      )}

      {showModal && modalType === 'delete' && (
        <DeleteRoleModal
          role={selectedRole}
          onConfirm={confirmDeleteRole}
          onCancel={handleCloseModal}
          loading={deleteLoading}
        />
      )}
    </div>
  );
};

export default GestionRoles;