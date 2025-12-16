import React, { createContext, useContext, useState, useEffect } from 'react';
import userCompanyService from '../services/userCompanyService';
import { useAuth } from './AuthContext';
import { registerCompanyCallbacks } from '../services/api';

const CompanyContext = createContext();

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany debe ser usado dentro de un CompanyProvider');
  }
  return context;
};

export const CompanyProvider = ({ children }) => {
  const { user } = useAuth();
  const [userCompanies, setUserCompanies] = useState([]);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar empresas del usuario cuando se autentica
  useEffect(() => {
    if (user?.id) {
      loadUserCompanies();
    } else {
      // Limpiar estado cuando no hay usuario
      setUserCompanies([]);
      setCurrentCompany(null);
    }
  }, [user]);

  // Cargar empresa desde localStorage al inicializar (si hay usuario autenticado)
  useEffect(() => {
    if (user?.id) {
      const savedCompany = localStorage.getItem('currentCompany');
      if (savedCompany) {
        try {
          const companyData = JSON.parse(savedCompany);
          setCurrentCompany(companyData);
        } catch (error) {
          console.error('Error al cargar empresa desde localStorage:', error);
          localStorage.removeItem('currentCompany');
        }
      }
    }
  }, [user]);

  // Registrar callbacks para el servicio API
  useEffect(() => {
    registerCompanyCallbacks({
      getCurrentCompany: () => currentCompany,
      onAccessDenied: (errorData) => {
        console.error('Acceso denegado a empresa:', errorData);
        setError('Acceso denegado a la empresa seleccionada');
        // Cambiar a la primera empresa disponible
        if (userCompanies.length > 0) {
          const firstCompany = userCompanies[0];
          setCurrentCompany(firstCompany);
        }
      }
    });
  }, [currentCompany, userCompanies]);

  // Sincronizar empresa actual con localStorage
  useEffect(() => {
    console.log('currentCompany cambió:', currentCompany);
    if (currentCompany) {
      localStorage.setItem('currentCompany', JSON.stringify(currentCompany));
    } else {
      localStorage.removeItem('currentCompany');
    }
  }, [currentCompany]);

  // Cargar empresas del usuario
  const loadUserCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Cargando empresas del usuario logueado...');
      const companies = await userCompanyService.getUserCompanies(); // Sin parámetro para usar el endpoint /my-companies
      console.log('Empresas obtenidas:', companies);
      
      setUserCompanies(companies);
      console.log('userCompanies establecidas en contexto:', companies);
      
      // Establecer empresa por defecto
      const defaultCompany = companies.find(uc => uc.isDefault || uc.is_default);
      console.log('Empresa por defecto encontrada:', defaultCompany);
      
      if (defaultCompany) {
        setCurrentCompany(defaultCompany);
      } else if (companies.length > 0) {
        // Si no hay empresa por defecto, tomar la primera
        console.log('No hay empresa por defecto, tomando la primera:', companies[0]);
        setCurrentCompany(companies[0]);
      }
      
    } catch (error) {
      console.error('Error al cargar empresas del usuario:', error);
      setError('Error al cargar empresas del usuario');
    } finally {
      setLoading(false);
    }
  };

  // Cambiar empresa activa
  const switchCompany = async (companyData) => {
    try {
      console.log('switchCompany llamado con:', companyData);
      setCurrentCompany(companyData);
      
      // Opcionalmente, actualizar la empresa por defecto en el servidor
      if (companyData && user?.id) {
        const idForDefault = companyData.companyId || companyData.company_id || companyData.company?.id;
        await userCompanyService.setDefaultCompany(user.id, idForDefault);
        
        // Actualizar estado local
        setUserCompanies(prev => 
          prev.map(uc => ({
            ...uc,
            isDefault: uc.id === companyData.id
          }))
        );
      }
    } catch (error) {
      console.error('Error al cambiar empresa:', error);
      setError('Error al cambiar empresa');
    }
  };

  // Refrescar empresas
  const refreshCompanies = () => {
    if (user?.id) {
      loadUserCompanies();
    }
  };

  // Obtener empresa por ID
  const getCompanyById = (companyId) => {
    return userCompanies.find(uc => (uc.companyId || uc.company_id || uc.company?.id) === companyId);
  };

  // Verificar si el usuario tiene permiso en la empresa actual
  const hasPermission = (permission) => {
    if (!currentCompany) return false;
    
    // Verificar permisos específicos
    if (currentCompany.permissions && currentCompany.permissions[permission]) {
      return true;
    }
    
    // Verificar rol (admin y manager tienen más permisos)
    if (currentCompany.role === 'admin') return true;
    if (currentCompany.role === 'manager' && ['read', 'create', 'update'].includes(permission)) return true;
    if (currentCompany.role === 'user' && ['read', 'create'].includes(permission)) return true;
    if (currentCompany.role === 'viewer' && permission === 'read') return true;
    
    return false;
  };

  // Verificar si es admin en la empresa actual
  const isCompanyAdmin = () => {
    return currentCompany?.role === 'admin';
  };

  // Verificar si es manager o superior en la empresa actual
  const isCompanyManager = () => {
    return ['admin', 'manager'].includes(currentCompany?.role);
  };

  const value = {
    // Estado
    userCompanies,
    currentCompany,
    loading,
    error,
    
    // Acciones
    switchCompany,
    refreshCompanies,
    loadUserCompanies,
    
    // Utilidades
    getCompanyById,
    hasPermission,
    isCompanyAdmin,
    isCompanyManager,
    
    // Información calculada
    hasMultipleCompanies: userCompanies.length > 1,
    companyCount: userCompanies.length
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};