import axios from 'axios';

// In production (Vercel), VITE_API_URL is empty — Vercel proxies /api/* to Render.
// In development, falls back to localhost:8000.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('zaksoft_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('zaksoft_token');
      localStorage.removeItem('zaksoft_user');
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => API.post('/api/auth/register', data),
  login:    (data) => API.post('/api/auth/login', data),
  me:       ()     => API.get('/api/auth/me'),
};

export const scanAPI = {
  scan:    (url) => API.post('/api/scan', { url, save: false }),
  save:    (url, name) => API.post('/api/scan/save', { url, website_name: name }),
  history: ()    => API.get('/api/scans'),
  chat:    (msg) => API.post('/api/chat', { message: msg }),
  health:  ()    => API.get('/api/health'),
};

export default API;
