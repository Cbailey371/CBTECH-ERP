import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api') + '/sales-orders';
const FEPA_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api') + '/fepa';

const getAuthHeader = (token, companyId) => ({
    headers: {
        Authorization: `Bearer ${token}`,
        'x-company-id': companyId
    }
});

export const getOrders = async (token, companyId, params = {}) => {
    const response = await axios.get(API_URL, {
        ...getAuthHeader(token, companyId),
        params
    });
    return response.data;
};

export const getOrderById = async (token, companyId, id) => {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeader(token, companyId));
    return response.data;
};

export const createOrder = async (token, companyId, orderData) => {
    const response = await axios.post(API_URL, orderData, getAuthHeader(token, companyId));
    return response.data;
};

export const createFromQuotation = async (token, companyId, quotationId) => {
    const response = await axios.post(`${API_URL}/from-quotation`, { quotationId }, getAuthHeader(token, companyId));
    return response.data; // Expected { success: true, orderId: ... }
};

export const emitFiscalDocument = async (token, companyId, orderId) => {
    const response = await axios.post(`${FEPA_URL}/emit/${orderId}`, {}, getAuthHeader(token, companyId));
    return response.data;
};
