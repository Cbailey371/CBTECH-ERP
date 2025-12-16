import api from './api';

const advancedPermissionsService = {
  // Obtener permisos disponibles del usuario actual
  getAvailablePermissions: async () => {
    try {
      const response = await api.get('/advanced-permissions/available');
      return response.data;
    } catch (error) {
      console.error('Error al obtener permisos:', error);
      throw error;
    }
  },

  // Obtener estructura de módulos y permisos
  getModulesStructure: async () => {
    try {
      const response = await api.get('/advanced-permissions/modules');
      return response.data;
    } catch (error) {
      console.error('Error al obtener módulos:', error);
      throw error;
    }
  },

  // Verificar un permiso específico
  checkPermission: async (permission) => {
    try {
      const response = await api.get(`/advanced-permissions/check/${permission}`);
      return response.data;
    } catch (error) {
      console.error('Error al verificar permiso:', error);
      throw error;
    }
  },

  // Verificar múltiples permisos
  checkMultiplePermissions: async (permissions) => {
    try {
      const response = await api.post('/advanced-permissions/check-multiple', {
        permissions
      });
      return response.data;
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      throw error;
    }
  },

  // Obtener resumen de permisos del usuario
  getUserSummary: async () => {
    try {
      const response = await api.get('/advanced-permissions/user-summary');
      return response.data;
    } catch (error) {
      console.error('Error al obtener resumen:', error);
      throw error;
    }
  }
};

export default advancedPermissionsService;