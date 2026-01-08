import api from './api';

const getCustomers = async (params = {}) => {
  const response = await api.get('/customers', { params });
  return response.data;
};

const getCustomerById = async (id) => {
  const response = await api.get(`/customers/${id}`);
  return response.data;
};

const createCustomer = async (customerData) => {
  const response = await api.post('/customers', customerData);
  return response.data;
};

const updateCustomer = async (id, customerData) => {
  const response = await api.put(`/customers/${id}`, customerData);
  return response.data;
};

const deleteCustomer = async (id) => {
  const response = await api.delete(`/customers/${id}`);
  return response.data;
};

const updateCustomerStatus = async (id, isActive) => {
  const response = await api.patch(`/customers/${id}/status`, { isActive });
  return response.data;
};

const customerService = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  updateCustomerStatus
};

export default customerService;

export {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  updateCustomerStatus
};
