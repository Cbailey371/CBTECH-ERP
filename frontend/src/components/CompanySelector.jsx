import React, { useState } from 'react';
import { useCompany } from '../context/CompanyContext';

const CompanySelector = () => {
  const {
    userCompanies,
    currentCompany,
    loading,
    error,
    switchCompany,
    hasMultipleCompanies
  } = useCompany();

  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    if (hasMultipleCompanies) {
      setIsOpen(!isOpen);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleCompanySelect = async (userCompany) => {
    try {
      await switchCompany(userCompany);
      setIsOpen(false);
    } catch (error) {
      console.error('Error al cambiar de empresa:', error);
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'manager':
        return 'Gerente';
      case 'user':
        return 'Usuario';
      case 'viewer':
        return 'Observador';
      default:
        return 'Usuario';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'manager':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'user':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 p-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
        <span className="text-sm text-gray-600 dark:text-gray-400">Cargando empresas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-800 px-3 py-2 rounded-lg text-sm dark:bg-red-900/20 dark:text-red-400 max-w-xs">
        Error al cargar empresas
      </div>
    );
  }

  // Si no hay empresa actual, mostrar un selector mejorado
  if (!currentCompany) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md dark:bg-amber-900/20 dark:border-amber-800">
        <div className="flex items-center space-x-3 mb-3">
          <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <div>
            <h3 className="font-medium text-amber-800 dark:text-amber-200">Selecciona una Empresa</h3>
            <p className="text-sm text-amber-600 dark:text-amber-300">
              {userCompanies && userCompanies.length > 0 
                ? 'Elige la empresa con la que deseas trabajar:'
                : 'No tienes empresas asignadas'
              }
            </p>
          </div>
        </div>
        
        {userCompanies && userCompanies.length > 0 ? (
          <div className="space-y-2">
            {userCompanies.map((userCompany) => (
              <button
                key={userCompany.company.id}
                onClick={() => handleCompanySelect(userCompany)}
                className="w-full text-left p-3 border border-amber-200 rounded-lg hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/30 transition-colors duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center dark:bg-primary-900/30">
                      <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-300">
                        {userCompany.company.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {userCompany.company.description || 'Sin descripción'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(userCompany.role)}`}>
                      {getRoleText(userCompany.role)}
                    </span>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <svg className="w-12 h-12 text-amber-400 mx-auto mb-2 dark:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.664-2.437M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-amber-700 dark:text-amber-300 text-sm">
              Contacta al administrador para que te asigne a una empresa
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 ${
          hasMultipleCompanies 
            ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md active:scale-95' 
            : 'cursor-default border border-gray-200 dark:border-gray-600'
          }`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleToggle();
        }}
        title={hasMultipleCompanies ? "Haz clic para cambiar empresa" : "Empresa actual"}
      >
        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center dark:bg-primary-900/30">
          <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {currentCompany.company?.name || currentCompany.name || 'Empresa no definida'}
          </p>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(currentCompany.role || currentCompany.userRole)}`}>
              {getRoleText(currentCompany.role || currentCompany.userRole)}
            </span>
            {hasMultipleCompanies && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{userCompanies.length - 1} más
              </span>
            )}
          </div>
        </div>
        
        {hasMultipleCompanies && (
          <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>

      {isOpen && hasMultipleCompanies && (
        <>
          <div className="fixed inset-0 z-50" onClick={handleClose}></div>
          
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Cambiar Empresa</span>
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Selecciona la empresa con la que deseas trabajar</p>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {userCompanies.map((userCompany) => (
                <button
                  key={userCompany.company.id}
                  onClick={() => handleCompanySelect(userCompany)}
                  className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group border-l-4 ${
                    (currentCompany.company?.id || currentCompany.id) === userCompany.company.id 
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-l-primary-500' 
                      : 'border-l-transparent hover:border-l-gray-300 dark:hover:border-l-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center dark:bg-primary-900/30">
                      <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className={`font-medium truncate ${
                          (currentCompany.company?.id || currentCompany.id) === userCompany.company.id 
                            ? 'text-primary-700 dark:text-primary-300' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {userCompany.company.name}
                        </h4>
                        {(currentCompany.company?.id || currentCompany.id) === userCompany.company.id && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                            Activa
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {userCompany.company.description || 'Sin descripción'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getRoleText(userCompany.role)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CompanySelector;
