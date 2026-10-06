import { create } from 'zustand';

export interface User {
  id: string;
  userId: string;
  name?: string;
  email: string;
  tenantId: string;
  role: 'superAdmin' | 'orgAdmin' | 'manager' | 'member' | 'viewer';
  avatarUrl?: string;
  department?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  let initialUser: User | null = null;
  if (typeof window !== 'undefined') {
    try {
      const savedUser = localStorage.getItem('worksphere_user');
      initialUser = savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem('worksphere_user');
      initialUser = null;
    }
  }

  return {
    user: initialUser,
    accessToken: null,
    isAuthenticated: !!initialUser,
    isLoading: true,

    setAuth: (user, accessToken) => {
      localStorage.setItem('worksphere_user', JSON.stringify(user));
      set({ user, accessToken, isAuthenticated: true, isLoading: false });
    },

    setAccessToken: (accessToken) => {
      set({ accessToken });
    },

    clearAuth: () => {
      localStorage.removeItem('worksphere_user');
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    },

    setLoading: (isLoading) => set({ isLoading }),
  };
});
