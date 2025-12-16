import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api') + '/tasks';

const getTasks = async (token, companyId, params = {}) => {
    try {
        const response = await axios.get(API_URL, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-company-id': companyId
            },
            params
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

const createTask = async (token, companyId, data) => {
    try {
        const response = await axios.post(API_URL, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-company-id': companyId
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

const updateTask = async (token, companyId, id, data) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-company-id': companyId
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

const deleteTask = async (token, companyId, id) => {
    try {
        const response = await axios.delete(`${API_URL}/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-company-id': companyId
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const taskService = {
    getTasks,
    createTask,
    updateTask,
    deleteTask
};
