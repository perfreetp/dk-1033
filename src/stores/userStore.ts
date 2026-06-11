import { create } from 'zustand';
import { User } from '../types';
import { userApi } from '../services/api';

interface UserState {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  fetchUsers: () => Promise<void>;
  fetchUserById: (id: string) => Promise<void>;
  createUser: (user: Omit<User, 'id' | 'lastLogin'>) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  currentUser: null,
  loading: false,

  fetchUsers: async () => {
    set({ loading: true });
    try {
      const users = await userApi.getUsers();
      set({ users, loading: false });
    } catch (error) {
      console.error('Failed to fetch users:', error);
      set({ loading: false });
    }
  },

  fetchUserById: async (id: string) => {
    set({ loading: true });
    try {
      const user = await userApi.getUserById(id);
      set({ currentUser: user, loading: false });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      set({ loading: false });
    }
  },

  createUser: async (userData) => {
    set({ loading: true });
    try {
      const newUser = await userApi.createUser(userData);
      set(state => ({
        users: [...state.users, newUser],
        loading: false
      }));
      return newUser;
    } catch (error) {
      console.error('Failed to create user:', error);
      set({ loading: false });
      throw error;
    }
  },

  updateUser: async (id: string, updates: Partial<User>) => {
    set({ loading: true });
    try {
      const updatedUser = await userApi.updateUser(id, updates);
      if (updatedUser) {
        set(state => ({
          users: state.users.map(u => u.id === id ? updatedUser : u),
          currentUser: updatedUser,
          loading: false
        }));
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      set({ loading: false });
      throw error;
    }
  },

  deleteUser: async (id: string) => {
    set({ loading: true });
    try {
      await userApi.deleteUser(id);
      set(state => ({
        users: state.users.filter(u => u.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Failed to delete user:', error);
      set({ loading: false });
      throw error;
    }
  }
}));
