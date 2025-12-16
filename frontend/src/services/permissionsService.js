const API_BASE_URL = 'http://localhost:5001/api';

// Función auxiliar para hacer peticiones HTTP
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Error de conexión al servidor');
    }
    throw error;
  }
};

// Servicio para manejo de permisos
const permissionsService = {
  // Obtener todos los permisos
  getPermissions: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/permissions?${queryString}` : '/permissions';
    return await apiRequest(endpoint);
  },

  // Obtener permisos agrupados por módulo
  getGroupedPermissions: async () => {
    return await apiRequest('/permissions/grouped/by-module');
  },

  // Obtener un permiso específico
  getPermission: async (id) => {
    return await apiRequest(`/permissions/${id}`);
  },

  // Crear un nuevo permiso
  createPermission: async (permissionData) => {
    return await apiRequest('/permissions', {
      method: 'POST',
      body: JSON.stringify(permissionData),
    });
  },

  // Actualizar un permiso
  updatePermission: async (id, permissionData) => {
    return await apiRequest(`/permissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(permissionData),
    });
  },

  // Eliminar un permiso
  deletePermission: async (id) => {
    return await apiRequest(`/permissions/${id}`, {
      method: 'DELETE',
    });
  },
};

export default permissionsService;