import api from './api';

const userCompanyService = {
  // Obtener empresas de un usuario (usuario actual del token)
  getUserCompanies: async (userId = null) => {
    try {
      // Si no se proporciona userId, obtener las empresas del usuario logueado
      const endpoint = userId ? `/user-companies/user/${userId}` : '/user-companies/my-companies';
      console.log('getUserCompanies - endpoint:', endpoint);
      
      const response = await api.get(endpoint, { headers: { 'X-No-Company-Context': 'true' } });
      console.log('getUserCompanies - response:', response);
      console.log('getUserCompanies - response.data:', response.data);

      // El backend devuelve { success: true, data: [...] }
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      // Fallback para otras estructuras posibles
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.data?.data?.userCompanies)) return response.data.data.userCompanies;
      
      console.warn('Estructura de respuesta inesperada:', response.data);
      return [];
    } catch (error) {
      console.error('Error al obtener empresas del usuario:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  // Obtener usuarios de una empresa
  getCompanyUsers: async (companyId) => {
    try {
      const response = await api.get(`/user-companies/company/${companyId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios de la empresa:', error);
      throw error;
    }
  },

  // Asignar usuario a empresa
  assignUserToCompany: async (userData) => {
    try {
      // Validaciones del frontend
      if (!userData.userId || !userData.companyId) {
        throw new Error('Usuario y empresa son requeridos');
      }

      if (!userData.role || !['admin', 'manager', 'user', 'viewer'].includes(userData.role)) {
        throw new Error('Rol inválido');
      }

      // Validar estructura de permisos
      if (userData.permissions && typeof userData.permissions !== 'object') {
        throw new Error('Permisos deben ser un objeto');
      }

      const response = await api.post('/user-companies', userData);
      console.log('Respuesta del servidor:', response);
      return response.data;
    } catch (error) {
      console.error('Error al asignar usuario a empresa:', error);
      throw error;
    }
  },

  // Actualizar relación usuario-empresa
  updateUserCompany: async (id, updateData) => {
    try {
      // Validaciones del frontend
      if (!id) {
        throw new Error('ID de relación usuario-empresa es requerido');
      }

      if (updateData.role && !['admin', 'manager', 'user', 'viewer'].includes(updateData.role)) {
        throw new Error('Rol inválido');
      }

      if (updateData.permissions && typeof updateData.permissions !== 'object') {
        throw new Error('Permisos deben ser un objeto');
      }

      const response = await api.put(`/user-companies/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar relación usuario-empresa:', error);
      throw error;
    }
  },

  // Eliminar acceso de usuario a empresa
  removeUserFromCompany: async (id) => {
    try {
      // Validación del frontend
      if (!id) {
        throw new Error('ID de relación usuario-empresa es requerido');
      }

      // Confirmar eliminación (esta validación puede ser opcional si se maneja en el componente)
      const confirmation = window.confirm('¿Estás seguro de que deseas eliminar este acceso?');
      if (!confirmation) {
        throw new Error('Operación cancelada por el usuario');
      }

      const response = await api.delete(`/user-companies/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar acceso de usuario a empresa:', error);
      throw error;
    }
  },

  // Establecer empresa por defecto
  setDefaultCompany: async (userId, companyId) => {
    try {
      // Validaciones del frontend
      if (!userId || !companyId) {
        throw new Error('Usuario y empresa son requeridos');
      }

      if (typeof userId !== 'number' || typeof companyId !== 'number') {
        throw new Error('Usuario y empresa deben ser números válidos');
      }

      const response = await api.post('/user-companies/set-default', {
        userId,
        companyId
      });
      return response.data;
    } catch (error) {
      console.error('Error al establecer empresa por defecto:', error);
      throw error;
    }
  }
};

export default userCompanyService;