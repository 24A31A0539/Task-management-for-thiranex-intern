// src/api.js – thin wrapper around Axios with auth token handling
import axios from 'axios';

const api = axios.create({
 baseURL: 'https://task-management-for-thiranex-intern.onrender.com',
});

// Attach token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
