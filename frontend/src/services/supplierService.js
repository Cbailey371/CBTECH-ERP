import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const getSuppliers = async (token, companyId, params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/suppliers`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'x-company-id': companyId
            },
            params
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        return { success: false, message: error.message };
    }
};

const getSupplier = async (token, companyId, id) => {
    try {
        const response = await axios.get(`${API_URL}/suppliers/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'x-company-id': companyId
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching supplier:', error);
        return { success: false, message: error.message };
    }
};

const createSupplier = async (token, companyId, supplierData) => {
    try {
        const response = await axios.post(`${API_URL}/suppliers`, supplierData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'x-company-id': companyId
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating supplier:', error);
        return { success: false, message: error.response?.data?.message || error.message };
    }
};

const updateSupplier = async (token, companyId, id, supplierData) => {
    try {
        const response = await axios.put(`${API_URL}/suppliers/${id}`, supplierData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'x-company-id': companyId
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating supplier:', error);
        return { success: false, message: error.response?.data?.message || error.message };
    }
};

const deleteSupplier = async (token, companyId, id) => {
    try {
        const response = await axios.delete(`${API_URL}/suppliers/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'x-company-id': companyId
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting supplier:', error);
        return { success: false, message: error.message };
    }
};

export const supplierService = {
    getSuppliers,
    getSupplier,
    createSupplier,
    updateSupplier,
    deleteSupplier
};
