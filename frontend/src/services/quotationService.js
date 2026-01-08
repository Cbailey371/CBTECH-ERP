import api from './api';

const getQuotations = async (params = {}) => {
  const response = await api.get('/quotations', { params });
  return response.data;
};

const getQuotationById = async (id) => {
  const response = await api.get(`/quotations/${id}`);
  return response.data;
};

const createQuotation = async (quotationData) => {
  const response = await api.post('/quotations', quotationData);
  return response.data;
};

const updateQuotation = async (id, quotationData) => {
  const response = await api.put(`/quotations/${id}`, quotationData);
  return response.data;
};

const deleteQuotation = async (id) => {
  const response = await api.delete(`/quotations/${id}`);
  return response.data;
};

const quotationService = {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation
};

export default quotationService;

export {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation
};
