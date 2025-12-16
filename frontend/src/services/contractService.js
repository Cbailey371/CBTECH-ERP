import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const getContracts = async (token, companyId, params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/contracts`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'x-company-id': companyId
            },
            params
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching contracts:', error);
        return { success: false, message: error.message };
    }
};

const getContract = async (token, companyId, id) => {
    try {
        const response = await axios.get(`${API_URL}/contracts/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'x-company-id': companyId
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching contract:', error);
        return { success: false, message: error.message };
    }
};

const createContract = async (token, companyId, contractData) => {
    try {
        const response = await axios.post(`${API_URL}/contracts`, contractData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'x-company-id': companyId
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating contract:', error);
        return { success: false, message: error.response?.data?.message || error.message };
    }
};

const updateContract = async (token, companyId, id, contractData) => {
    try {
        const response = await axios.put(`${API_URL}/contracts/${id}`, contractData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'x-company-id': companyId
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating contract:', error);
        return { success: false, message: error.response?.data?.message || error.message };
    }
};

const deleteContract = async (token, companyId, id) => {
    try {
        const response = await axios.delete(`${API_URL}/contracts/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'x-company-id': companyId
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting contract:', error);
        return { success: false, message: error.message };
    }
};

export const contractService = {
    getContracts,
    getContract,
    createContract,
    updateContract,
    deleteContract
};
