import axios from 'axios';

const getApiRoot = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const hostname = window.location.hostname;
  // If running locally, connect to the local server on port 5000
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return `http://${hostname}:5000`;
  }
  // Bulletproof fallback: Deployed production sites automatically use the Railway backend URL
  return 'https://kashmirmove-production.up.railway.app';
};

export const API_ROOT_URL = getApiRoot();

export const getFileUrl = (fileUrl) => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
  
  // Ensure the file path starts with a slash
  const cleanPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  
  // Strip any trailing slash or /api from API_ROOT_URL
  const cleanRoot = API_ROOT_URL.replace(/\/api$/, '').replace(/\/$/, '');
  
  return `${cleanRoot}${cleanPath}`;
};

const API_BASE_URL = `${API_ROOT_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

