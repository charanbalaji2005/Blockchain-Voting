import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login/', { email, password });
          set({
            tokens: { access: data.access, refresh: data.refresh },
            isAuthenticated: true,
            isLoading: false,
          });
          // Fetch profile
          get().fetchProfile();
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, error: err.response?.data?.detail || 'Login failed' };
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          await api.post('/auth/register/', formData);
          set({ isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          const errors = err.response?.data;
          return { success: false, error: errors };
        }
      },

      fetchProfile: async () => {
        try {
          const { data } = await api.get('/auth/me/');
          set({ user: data });
        } catch (_) {}
      },

      logout: () => {
        set({ user: null, tokens: null, isAuthenticated: false });
      },

      updateWallet: (address) => {
        set(state => ({ user: { ...state.user, wallet_address: address } }));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ tokens: state.tokens, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useAuthStore;