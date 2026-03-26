import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  try {
    const storage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const token = storage?.state?.tokens?.access;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {}
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const storage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
        const refresh = storage?.state?.tokens?.refresh;
        if (refresh) {
          const { data } = await axios.post('/api/auth/refresh/', { refresh });
          // Update stored token
          storage.state.tokens.access = data.access;
          localStorage.setItem('auth-storage', JSON.stringify(storage));
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        }
      } catch (_) {}
    }
    return Promise.reject(error);
  }
);

export default api;