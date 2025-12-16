import axios from 'axios';

const API_URL = 'http://localhost:5001/api/projects';

const getProjects = async (token, companyId, params = {}) => {
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

const getProject = async (token, companyId, id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`, {
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

const createProject = async (token, companyId, data) => {
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

const updateProject = async (token, companyId, id, data) => {
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

const deleteProject = async (token, companyId, id) => {
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

export const projectService = {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject
};
