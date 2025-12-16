import axios from 'axios';

const API_URL = 'http://localhost:5001/api/customers';

const getAuthHeader = (token, companyId) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'x-company-id': companyId
  }
});

export const getCustomers = async (token, companyId, params = {}) => {
  const response = await axios.get(API_URL, {
    ...getAuthHeader(token, companyId), // Fixed: Use local getAuthHeader
    params
  });
  return response.data;
};

export const getCustomerById = async (token, companyId, id) => {
  const response = await axios.get(`${API_URL}/${id}`, getAuthHeader(token, companyId));
  return response.data;
};

export const createCustomer = async (token, companyId, customerData) => {
  const response = await axios.post(API_URL, customerData, getAuthHeader(token, companyId));
  return response.data;
};

export const updateCustomer = async (token, companyId, id, customerData) => {
  const response = await axios.put(`${API_URL}/${id}`, customerData, getAuthHeader(token, companyId));
  return response.data;
};

export const deleteCustomer = async (token, companyId, id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getAuthHeader(token, companyId));
  return response.data;
};

export const updateCustomerStatus = async (token, companyId, id, isActive) => {
  const response = await axios.patch(`${API_URL}/${id}/status`, { isActive }, getAuthHeader(token, companyId));
  return response.data;
};

export const customerService = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  updateCustomerStatus
};
