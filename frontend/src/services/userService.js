import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api') + '/users';

const getAuthHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const getUsers = async (token, params = {}) => {
  const response = await axios.get(API_URL, {
    ...getAuthHeader(token),
    params
  });
  return response.data;
};

export const createUser = async (token, userData) => {
  const response = await axios.post(API_URL, userData, getAuthHeader(token));
  return response.data;
};

export const updateUser = async (token, id, userData) => {
  const response = await axios.put(`${API_URL}/${id}`, userData, getAuthHeader(token));
  return response.data;
};

export const deleteUser = async (token, id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getAuthHeader(token));
  return response.data;
};

export const assignUserToCompany = async (token, userId, companyId, role = 'user') => {
  const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/user-companies`, {
    userId,
    companyId,
    role
  }, getAuthHeader(token));
  return response.data;
};

export const userService = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  assignUserToCompany
};