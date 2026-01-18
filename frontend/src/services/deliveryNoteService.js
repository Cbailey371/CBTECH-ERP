import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api') + '/delivery-notes';

const getAuthHeader = (token, companyId) => ({
    headers: {
        Authorization: `Bearer ${token}`,
        'x-company-id': companyId
    }
});

export const getDeliveryNotes = async (token, companyId, params = {}) => {
    const response = await axios.get(API_URL, {
        ...getAuthHeader(token, companyId),
        params
    });
    return response.data;
};

export const getDeliveryNoteById = async (token, companyId, id) => {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeader(token, companyId));
    return response.data;
};

export const createDeliveryNote = async (token, companyId, noteData) => {
    const response = await axios.post(API_URL, noteData, getAuthHeader(token, companyId));
    return response.data;
};

export const updateDeliveryNoteStatus = async (token, companyId, id, status) => {
    const response = await axios.patch(`${API_URL}/${id}/status`, { status }, getAuthHeader(token, companyId));
    return response.data;
};

export const deleteDeliveryNote = async (token, companyId, id) => {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeader(token, companyId));
    return response.data;
};

export const downloadDeliveryNotePdf = async (token, companyId, id) => {
    const response = await axios.get(`${API_URL}/${id}/download`, {
        ...getAuthHeader(token, companyId),
        responseType: 'blob'
    });
    return response.data;
};
