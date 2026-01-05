import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api') + '/payments';

const getAuthHeader = (token, companyId) => ({
    headers: {
        Authorization: `Bearer ${token}`,
        'x-company-id': companyId
    }
});

const paymentService = {
    createPayment: async (token, companyId, paymentData) => {
        try {
            const response = await axios.post(API_URL, paymentData, getAuthHeader(token, companyId));
            return response.data;
        } catch (error) {
            console.error('Error creating payment:', error);
            throw error.response?.data || { success: false, message: 'Error de conexión' };
        }
    },

    getStatement: async (token, companyId, customerId) => {
        try {
            const response = await axios.get(`${API_URL}/customers/${customerId}/statement`, getAuthHeader(token, companyId));
            return response.data;
        } catch (error) {
            console.error('Error fetching statement:', error);
            throw error.response?.data || { success: false, message: 'Error de conexión' };
        }
    },

    deletePayment: async (token, companyId, paymentId) => {
        try {
            const response = await axios.delete(`${API_URL}/${paymentId}`, getAuthHeader(token, companyId));
            return response.data;
        } catch (error) {
            console.error('Error deleting payment:', error);
            throw error.response?.data || { success: false, message: 'Error de conexión' };
        }
    }
};

export default paymentService;
