const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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

// Servicio para manejo de user-roles
const userRolesService = {
  // Obtener todos los usuarios con sus roles
  getUserRoles: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/user-roles?${queryString}` : '/user-roles';
    return await apiRequest(endpoint);
  },

  // Obtener roles de un usuario específico
  getUserRolesByUserId: async (userId) => {
    return await apiRequest(`/user-roles/${userId}/roles`);
  },

  // Asignar roles a un usuario
  assignRolesToUser: async (userId, roleIds) => {
    return await apiRequest(`/user-roles/${userId}/roles/add`, {
      method: 'POST',
      body: JSON.stringify({ role_ids: roleIds }),
    });
  },

  // Actualizar roles de un usuario (reemplaza todos los roles)
  updateUserRoles: async (userId, roleIds) => {
    return await apiRequest(`/user-roles/${userId}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ role_ids: roleIds }),
    });
  },

  // Remover roles de un usuario
  removeRolesFromUser: async (userId, roleIds) => {
    return await apiRequest(`/user-roles/${userId}/roles/remove`, {
      method: 'DELETE',
      body: JSON.stringify({ role_ids: roleIds }),
    });
  },

  // Remover un rol específico de un usuario
  removeRoleFromUser: async (userId, roleId) => {
    return await apiRequest(`/user-roles/${userId}/roles/${roleId}`, {
      method: 'DELETE',
    });
  },
};

export default userRolesService;