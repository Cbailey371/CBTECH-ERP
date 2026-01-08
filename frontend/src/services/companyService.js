import api from './api';

const getCompanies = async (params = {}) => {
  const response = await api.get('/companies', { params });
  return response.data;
};

const getMyCompanies = async () => {
  const response = await api.get('/user-companies/my-companies');
  return response.data;
};

const getCompanyById = async (id) => {
  const response = await api.get(`/companies/${id}`);
  return response.data;
};

const createCompany = async (companyData) => {
  const response = await api.post('/companies', companyData);
  return response.data;
};

const updateCompany = async (id, companyData) => {
  const response = await api.put(`/companies/${id}`, companyData);
  return response.data;
};

const deleteCompany = async (id) => {
  const response = await api.delete(`/companies/${id}`);
  return response.data;
};

const getFiscalConfig = async (companyId) => {
  const response = await api.get(`/companies/${companyId}/fiscal-config`);
  return response.data;
};

const updateFiscalConfig = async (companyId, data) => {
  const response = await api.put(`/companies/${companyId}/fiscal-config`, data);
  return response.data;
};

// Default export for compatibility with GestionEmpresas.jsx
const companyService = {
  getCompanies, // Aliased to match usage in GestionEmpresas
  getAllCompanies: getCompanies, // Keep named export alias
  getMyCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getFiscalConfig,
  updateFiscalConfig
};

export default companyService;

// Named exports
export {
  getCompanies,
  getCompanies as getAllCompanies,
  getMyCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getFiscalConfig,
  updateFiscalConfig
};