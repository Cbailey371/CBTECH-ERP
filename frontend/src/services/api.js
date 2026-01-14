import axios from 'axios';

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// Interceptor para añadir el token de autenticación y contexto de empresa automáticamente
api.interceptors.request.use(
  (config) => {
    // Añadir token de autenticación
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Añadir contexto de empresa, a menos que se indique lo contrario
    const noContext = config.headers['X-No-Company-Context'] || config.headers['x-no-company-context'];

    if (!noContext) {
      const currentCompany = getCurrentCompany();
      const headerCompanyId = currentCompany?.companyId
        || currentCompany?.company_id
        || currentCompany?.company?.id;
      if (headerCompanyId) {
        config.headers['X-Company-Id'] = String(headerCompanyId);
      }
    }

    // Limpiar la cabecera de control para que no llegue al backend
    delete config.headers['X-No-Company-Context'];
    delete config.headers['x-no-company-context'];

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejar errores de autenticación
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirigir al login si no estamos ya ahí
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Manejar errores de contexto de empresa
    if (error.response?.status === 403 && error.response?.data?.code === 'COMPANY_ACCESS_DENIED') {
      // Usuario no tiene acceso a la empresa
      console.error('Acceso denegado a la empresa:', error.response.data.message);

      // Notificar al contexto de empresa para cambiar a una empresa válida
      notifyCompanyAccessDenied(error.response.data);
    }

    // Manejar otros errores de red
    if (!error.response) {
      console.error('Error de conexión:', error.message);
    }

    return Promise.reject(error);
  }
);

// Variable global para almacenar callbacks del contexto de empresa
let companyContextCallbacks = {
  getCurrentCompany: null,
  onAccessDenied: null
};

/**
 * Función para obtener la empresa actual desde el contexto
 * Se establece desde el CompanyContext cuando se inicializa
 */
const getCurrentCompany = () => {
  if (companyContextCallbacks.getCurrentCompany) {
    return companyContextCallbacks.getCurrentCompany();
  }

  // Fallback: intentar obtener desde localStorage si está disponible
  try {
    const stored = localStorage.getItem('currentCompany');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Función para notificar cuando hay un error de acceso a empresa
 */
const notifyCompanyAccessDenied = (errorData) => {
  if (companyContextCallbacks.onAccessDenied) {
    companyContextCallbacks.onAccessDenied(errorData);
  } else {
    console.warn('Error de acceso a empresa pero no hay callback configurado:', errorData);
  }
};

/**
 * Función para registrar callbacks del contexto de empresa
 * Debe ser llamada desde CompanyContext
 */
export const registerCompanyCallbacks = (callbacks) => {
  companyContextCallbacks = { ...companyContextCallbacks, ...callbacks };
};

/**
 * Función para hacer requests con contexto de empresa específico
 * Útil cuando necesitas especificar una empresa diferente a la actual
 */
export const apiWithCompany = (companyId) => {
  const companyApi = axios.create(api.defaults);

  // Registrar interceptores explícitamente (sin depender de internals)
  companyApi.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (companyId) {
        config.headers['X-Company-Id'] = companyId.toString();
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  companyApi.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      if (error.response?.status === 403 && error.response?.data?.code === 'COMPANY_ACCESS_DENIED') {
        notifyCompanyAccessDenied(error.response.data);
      }
      if (!error.response) {
        console.error('Error de conexión:', error.message);
      }
      return Promise.reject(error);
    }
  );

  return companyApi;
};

export default api;