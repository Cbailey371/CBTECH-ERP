import api from './api';

const USERS_URL = '/users';

export const getUsers = async (params = {}) => {
  const response = await api.get(USERS_URL, { params });
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post(USERS_URL, userData);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await api.put(`${USERS_URL}/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`${USERS_URL}/${id}`);
  return response.data;
};

export const assignUserToCompany = async (userId, companyId, role = 'user') => {
  const response = await api.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/user-companies`, {
    userId,
    companyId,
    role
  });
  return response.data;
};

export const userService = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  assignUserToCompany
};

export default userService;