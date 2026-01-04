import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const getAuthHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const getMyCompanies = async (token) => {
  const response = await axios.get(`${API_URL}/user-companies/my-companies`, getAuthHeader(token));
  return response.data;
};

// Admin methods
export const getAllCompanies = async (token, params = {}) => {
  const response = await axios.get(`${API_URL}/companies`, {
    ...getAuthHeader(token),
    params
  });
  return response.data;
};

export const getCompanyById = async (token, id) => {
  const response = await axios.get(`${API_URL}/companies/${id}`, getAuthHeader(token));
  return response.data;
};

export const createCompany = async (token, companyData) => {
  const response = await axios.post(`${API_URL}/companies`, companyData, getAuthHeader(token));
  return response.data;
};

export const updateCompany = async (token, id, companyData) => {
  const response = await axios.put(`${API_URL}/companies/${id}`, companyData, getAuthHeader(token));
  return response.data;
};

export const deleteCompany = async (token, id) => {
  const response = await axios.delete(`${API_URL}/companies/${id}`, getAuthHeader(token));
  return response.data;
};

export const getFiscalConfig = async (token, companyId) => {
  const response = await axios.get(`${API_URL}/companies/${companyId}/fiscal-config`, getAuthHeader(token));
  return response.data;
};

export const updateFiscalConfig = async (token, companyId, data) => {
  const response = await axios.put(`${API_URL}/companies/${companyId}/fiscal-config`, data, getAuthHeader(token));
  return response.data;
};