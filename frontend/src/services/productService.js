import api from './api';

const getProducts = async (params = {}) => {
  const response = await api.get('/products', { params });
  return response.data;
};

const getProduct = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

const createProduct = async (data) => {
  const response = await api.post('/products', data);
  return response.data;
};

const updateProduct = async (id, data) => {
  const response = await api.put(`/products/${id}`, data);
  return response.data;
};

const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

const productService = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};

export default productService;

export {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};
