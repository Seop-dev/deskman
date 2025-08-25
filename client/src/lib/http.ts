import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const http = axios.create({
  baseURL: API_BASE, // 예: '/api'
  timeout: 15000
});

http.interceptors.response.use(
  (r) => r,
  (e) => {
    console.error('[API ERROR]', {
      url: e?.config?.url,
      baseURL: e?.config?.baseURL,
      status: e?.response?.status,
      code: e?.code,
      message: e?.message
    });
    return Promise.reject(e);
  }
);

export default http;
