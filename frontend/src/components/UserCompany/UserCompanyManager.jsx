import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import userCompanyService from '../../services/userCompanyService';
import { userService } from '../../services/userService';
import companyService from '../../services/companyService';
import UserCompanyList from './UserCompanyList';
import AssignUserToCompany from './AssignUserToCompany';

const UserCompanyManager = () => {
  const { isDarkMode } = useTheme();
  
  // Estados principales
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados de datos
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [userCompanies, setUserCompanies] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de modales
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUserCompany, setEditingUserCompany] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [usersResponse, companiesResponse] = await Promise.all([
        userService.getUsers(),
        companyService.getCompanies()
      ]);
      
      console.log('Respuesta usuarios:', usersResponse);
      console.log('Respuesta empresas:', companiesResponse);
      
      setUsers(usersResponse.data || []);
      setCompanies(companiesResponse.data?.companies || []);
      
      console.log('Usuarios cargados:', usersResponse.data || []);
      console.log('Empresas cargadas:', companiesResponse.data?.companies || []);
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  // Cargar accesos de usuario específico
  const loadUserCompanies = async (userId) => {
    try {
      setLoading(true);
      const response = await userCompanyService.getUserCompanies(userId);
      setUserCompanies(response.data?.userCompanies || []);
    } catch (error) {
      console.error('Error al cargar empresas del usuario:', error);
      setError('Error al cargar empresas del usuario');
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios de empresa específica
  const loadCompanyUsers = async (companyId) => {
    try {
      setLoading(true);
      const response = await userCompanyService.getCompanyUsers(companyId);
      setUserCompanies(response.data?.companyUsers || []);
    } catch (error) {
      console.error('Error al cargar usuarios de la empresa:', error);
      setError('Error al cargar usuarios de la empresa');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de tab
  const handleTabChange = (newValue) => {
    setTabValue(newValue);
    setSelectedUser(null);
    setSelectedCompany(null);
    setUserCompanies([]);
    setSearchTerm('');
  };

  // Manejar selección de usuario
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSelectedCompany(null);
    loadUserCompanies(user.id);
  };

  // Manejar selección de empresa
  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setSelectedUser(null);
    loadCompanyUsers(company.id);
  };

  // Manejar asignación exitosa
  const handleAssignSuccess = (data) => {
    setSuccess('Usuario asignado a empresa exitosamente');
    setAssignModalOpen(false);
    
    // Recargar datos según el contexto actual
    if (selectedUser) {
      loadUserCompanies(selectedUser.id);
    } else if (selectedCompany) {
      loadCompanyUsers(selectedCompany.id);
    }
  };

  // Manejar eliminación de acceso
  const handleRemoveAccess = async (userCompanyId) => {
    try {
      await userCompanyService.removeUserFromCompany(userCompanyId);
      setSuccess('Acceso eliminado exitosamente');
      
      // Recargar datos
      if (selectedUser) {
        loadUserCompanies(selectedUser.id);
      } else if (selectedCompany) {
        loadCompanyUsers(selectedCompany.id);
      }
    } catch (error) {
      console.error('Error al eliminar acceso:', error);
      setError('Error al eliminar acceso');
    }
  };

  // Manejar actualización de acceso
  const handleUpdateAccess = async (userCompanyId, updateData) => {
    try {
      await userCompanyService.updateUserCompany(userCompanyId, updateData);
      setSuccess('Acceso actualizado exitosamente');
      
      // Recargar datos
      if (selectedUser) {
        loadUserCompanies(selectedUser.id);
      } else if (selectedCompany) {
        loadCompanyUsers(selectedCompany.id);
      }
    } catch (error) {
      console.error('Error al actualizar acceso:', error);
      setError('Error al actualizar acceso');
    }
  };

  // Manejar edición de acceso
  const handleEditAccess = (userCompanyItem) => {
    setEditingUserCompany(userCompanyItem);
    setEditModalOpen(true);
  };

  // Manejar éxito de edición
  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setEditingUserCompany(null);
    setSuccess('Acceso editado exitosamente');
    
    // Recargar datos
    if (selectedUser) {
      loadUserCompanies(selectedUser.id);
    } else if (selectedCompany) {
      loadCompanyUsers(selectedCompany.id);
    }
  };

  // Cerrar alertas
  const handleCloseAlert = () => {
    setError('');
    setSuccess('');
  };

  if (loading && !users.length && !companies.length) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const filteredUsers = users.filter(user =>
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompanies = companies.filter(company =>
    company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.legalName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-4">
          <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121L16 16l-4 4h5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestión de Accesos Usuario-Empresa
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Administra qué usuarios tienen acceso a qué empresas y con qué permisos
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="ml-auto -mx-1.5 -my-1.5 text-red-500 rounded-lg p-1.5 hover:bg-red-100 dark:hover:bg-red-800"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-green-700 dark:text-green-200">{success}</p>
            </div>
            <button
              onClick={() => setSuccess('')}
              className="ml-auto -mx-1.5 -my-1.5 text-green-500 rounded-lg p-1.5 hover:bg-green-100 dark:hover:bg-green-800"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => handleTabChange(0)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                tabValue === 0
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span>Por Usuario</span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange(1)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                tabValue === 1
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H7m5 0H9m0 0H7m6 0h2M9 7h6m-6 4h6m-6 4h6" />
                </svg>
                <span>Por Empresa</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Vista por Usuario */}
          {tabValue === 0 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Selecciona un Usuario
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Haz clic en un usuario para ver y gestionar sus accesos a empresas
                </p>
                
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar usuarios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                        selectedUser?.id === user.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {user.username} • {user.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedUser && (
                <UserCompanyList
                  userCompanies={userCompanies}
                  viewMode="user"
                  loading={loading}
                  onRemove={handleRemoveAccess}
                  onUpdate={handleUpdateAccess}
                  onEdit={handleEditAccess}
                />
              )}
            </div>
          )}

          {/* Vista por Empresa */}
          {tabValue === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Selecciona una Empresa
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Haz clic en una empresa para ver y gestionar qué usuarios tienen acceso
                </p>
                
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar empresas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCompanies.map((company) => (
                    <div
                      key={company.id}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                        selectedCompany?.id === company.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                      onClick={() => handleCompanySelect(company)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H7m5 0H9m0 0H7m6 0h2M9 7h6m-6 4h6m-6 4h6" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {company.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {company.legalName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {company.city}, {company.country}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedCompany && (
                <UserCompanyList
                  userCompanies={userCompanies}
                  viewMode="company"
                  loading={loading}
                  onRemove={handleRemoveAccess}
                  onUpdate={handleUpdateAccess}
                  onEdit={handleEditAccess}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* FAB para agregar acceso */}
      {(selectedUser || selectedCompany) && (
        <button
          onClick={() => setAssignModalOpen(true)}
          className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg transition-colors duration-200 z-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      )}

      {/* Modal de asignación */}
      <AssignUserToCompany
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onSuccess={handleAssignSuccess}
        preselectedUser={selectedUser}
        preselectedCompany={selectedCompany}
        users={users}
        companies={companies}
      />

      {/* Modal de edición */}
      <AssignUserToCompany
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingUserCompany(null);
        }}
        onSuccess={handleEditSuccess}
        editMode={true}
        editingUserCompany={editingUserCompany}
        users={users}
        companies={companies}
      />
    </div>
  );
};

export default UserCompanyManager;