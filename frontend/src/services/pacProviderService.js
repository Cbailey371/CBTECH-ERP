import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const getAuthHeader = (token) => ({
    headers: { Authorization: `Bearer ${token}` }
});

export const getPacProviders = async (token) => {
    const response = await axios.get(`${API_URL}/pac-providers`, getAuthHeader(token));
    return response.data;
};

export const createPacProvider = async (token, data) => {
    const response = await axios.post(`${API_URL}/pac-providers`, data, getAuthHeader(token));
    return response.data;
};

export const updatePacProvider = async (token, id, data) => {
    const response = await axios.put(`${API_URL}/pac-providers/${id}`, data, getAuthHeader(token));
    return response.data;
};

export const deletePacProvider = async (token, id) => {
    const response = await axios.delete(`${API_URL}/pac-providers/${id}`, getAuthHeader(token));
    return response.data;
};
