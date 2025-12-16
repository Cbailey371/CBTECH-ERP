import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api') + '/quotations';

const getAuthHeader = (token, companyId) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'x-company-id': companyId
  }
});

export const getQuotations = async (token, companyId, params = {}) => {
  const response = await axios.get(API_URL, {
    ...getAuthHeader(token, companyId),
    params
  });
  return response.data;
};

export const getQuotationById = async (token, companyId, id) => {
  const response = await axios.get(`${API_URL}/${id}`, getAuthHeader(token, companyId));
  return response.data;
};

export const createQuotation = async (token, companyId, quotationData) => {
  const response = await axios.post(API_URL, quotationData, getAuthHeader(token, companyId));
  return response.data;
};

export const updateQuotation = async (token, companyId, id, quotationData) => {
  const response = await axios.put(`${API_URL}/${id}`, quotationData, getAuthHeader(token, companyId));
  return response.data;
};

export const deleteQuotation = async (token, companyId, id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getAuthHeader(token, companyId));
  return response.data;
};
