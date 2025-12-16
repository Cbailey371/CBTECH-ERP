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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

// Servicios para Roles
const rolesService = {
  // Obtener todos los roles
  getRoles: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/roles${queryParams ? `?${queryParams}` : ''}`);
  },

  // Obtener un rol por ID
  getRoleById: async (id, includePermissions = false, includeUsers = false) => {
    const params = new URLSearchParams();
    if (includePermissions) params.append('include_permissions', 'true');
    if (includeUsers) params.append('include_users', 'true');
    
    return apiRequest(`/roles/${id}${params.toString() ? `?${params.toString()}` : ''}`);
  },

  // Crear un nuevo rol
  createRole: async (roleData) => {
    return apiRequest('/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  },

  // Actualizar un rol
  updateRole: async (id, roleData) => {
    return apiRequest(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  },

  // Eliminar un rol
  deleteRole: async (id) => {
    return apiRequest(`/roles/${id}`, {
      method: 'DELETE',
    });
  },

  // Asignar permisos a un rol
  assignPermissions: async (roleId, permissionIds) => {
    return apiRequest(`/roles/${roleId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permission_ids: permissionIds }),
    });
  },

  // Remover permisos de un rol
  removePermissions: async (roleId, permissionIds) => {
    return apiRequest(`/roles/${roleId}/permissions`, {
      method: 'DELETE',
      body: JSON.stringify({ permission_ids: permissionIds }),
    });
  },
};

// Servicios para Permisos
const permissionsService = {
  // Obtener todos los permisos
  getPermissions: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/permissions${queryParams ? `?${queryParams}` : ''}`);
  },

  // Obtener permisos agrupados por módulo
  getGroupedPermissions: async () => {
    return apiRequest('/permissions/grouped/by-module');
  },

  // Obtener lista de módulos únicos
  getModules: async () => {
    return apiRequest('/permissions/modules');
  },

  // Obtener lista de acciones únicas
  getActions: async () => {
    return apiRequest('/permissions/actions');
  },

  // Obtener un permiso por ID
  getPermissionById: async (id, includeRoles = false) => {
    const params = includeRoles ? '?include_roles=true' : '';
    return apiRequest(`/permissions/${id}${params}`);
  },

  // Crear un nuevo permiso
  createPermission: async (permissionData) => {
    return apiRequest('/permissions', {
      method: 'POST',
      body: JSON.stringify(permissionData),
    });
  },

  // Actualizar un permiso
  updatePermission: async (id, permissionData) => {
    return apiRequest(`/permissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(permissionData),
    });
  },

  // Eliminar un permiso
  deletePermission: async (id) => {
    return apiRequest(`/permissions/${id}`, {
      method: 'DELETE',
    });
  },

  // Obtener estadísticas de permisos
  getPermissionsStats: async () => {
    return apiRequest('/permissions/stats/overview');
  },
};

// Servicios para Asignación de Roles a Usuarios
const userRolesService = {
  // Obtener todos los usuarios con sus roles
  getUsersWithRoles: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/user-roles${queryParams ? `?${queryParams}` : ''}`);
  },

  // Obtener roles de un usuario específico
  getUserRoles: async (userId) => {
    return apiRequest(`/user-roles/${userId}/roles`);
  },

  // Asignar roles a un usuario (reemplaza existentes)
  assignRolesToUser: async (userId, roleIds) => {
    return apiRequest(`/user-roles/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ role_ids: roleIds }),
    });
  },

  // Agregar roles adicionales a un usuario
  addRolesToUser: async (userId, roleIds) => {
    return apiRequest(`/user-roles/${userId}/roles/add`, {
      method: 'PUT',
      body: JSON.stringify({ role_ids: roleIds }),
    });
  },

  // Remover roles específicos de un usuario
  removeRolesFromUser: async (userId, roleIds) => {
    return apiRequest(`/user-roles/${userId}/roles`, {
      method: 'DELETE',
      body: JSON.stringify({ role_ids: roleIds }),
    });
  },

  // Obtener usuarios que tienen un rol específico
  getUsersByRole: async (roleId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/user-roles/by-role/${roleId}${queryParams ? `?${queryParams}` : ''}`);
  },

  // Asignar múltiples roles a un usuario en lote
  bulkAssignRoles: async (userId, roleIds) => {
    return apiRequest('/user-roles/bulk-assign', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, role_ids: roleIds }),
    });
  },

  // Remover múltiples roles de un usuario en lote
  bulkRemoveRoles: async (userId, roleIds) => {
    return apiRequest('/user-roles/bulk-remove', {
      method: 'DELETE',
      body: JSON.stringify({ user_id: userId, role_ids: roleIds }),
    });
  },
};

// Función de utilidad para manejar errores de la API
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.message.includes('401') || error.message.includes('403')) {
    // Token expirado o sin permisos
    localStorage.removeItem('token');
    window.location.href = '/login';
    return 'Sesión expirada. Por favor, inicia sesión nuevamente.';
  }
  
  if (error.message.includes('404')) {
    return 'Recurso no encontrado.';
  }
  
  if (error.message.includes('409')) {
    return 'Conflicto: El recurso ya existe.';
  }
  
  if (error.message.includes('500')) {
    return 'Error interno del servidor. Por favor, intenta más tarde.';
  }
  
  return error.message || 'Error desconocido. Por favor, intenta más tarde.';
};

// Exportaciones
export { rolesService, permissionsService, userRolesService };
export default rolesService;