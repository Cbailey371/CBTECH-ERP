import axios from 'axios';

const API_URL = 'http://localhost:5001/api/purchase-orders';

const getAuthHeader = (token, companyId) => ({
    headers: {
        Authorization: `Bearer ${token}`,
        'x-company-id': companyId
    }
});

export const getPurchaseOrders = async (token, companyId, params = {}) => {
    const response = await axios.get(API_URL, {
        ...getAuthHeader(token, companyId),
        params
    });
    return response.data;
};

export const getPurchaseOrder = async (token, companyId, id) => {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeader(token, companyId));
    return response.data;
};

export const createPurchaseOrder = async (token, companyId, poData) => {
    const response = await axios.post(API_URL, poData, getAuthHeader(token, companyId));
    return response.data;
};

export const updatePurchaseOrder = async (token, companyId, id, poData) => {
    const response = await axios.put(`${API_URL}/${id}`, poData, getAuthHeader(token, companyId));
    return response.data;
};

export const updatePOStatus = async (token, companyId, id, status) => {
    const response = await axios.put(`${API_URL}/${id}/status`, { status }, getAuthHeader(token, companyId));
    return response.data;
};

export const receivePOItems = async (token, companyId, id, receivedItems) => {
    // receivedItems: [{ itemId, quantityReceived }]
    const response = await axios.post(`${API_URL}/${id}/receive`, { receivedItems }, getAuthHeader(token, companyId));
    return response.data;
};

export const deletePurchaseOrder = async (token, companyId, id) => {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeader(token, companyId));
    return response.data;
};

export const purchaseOrderService = {
    getPurchaseOrders,
    getPurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    updatePOStatus,
    receivePOItems,
    deletePurchaseOrder
};
