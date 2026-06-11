import { create } from 'zustand';
import { CallLog, CallStats, Alert } from '../types';
import { logApi } from '../services/api';

interface LogState {
  logs: CallLog[];
  stats: CallStats | null;
  alerts: Alert[];
  loading: boolean;
  fetchLogs: (params?: { ruleId?: string; hitResult?: string }) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
}

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  stats: null,
  alerts: [],
  loading: false,

  fetchLogs: async (params) => {
    set({ loading: true });
    try {
      const logs = await logApi.getCallLogs(params);
      set({ logs, loading: false });
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      set({ loading: false });
    }
  },

  fetchStats: async () => {
    set({ loading: true });
    try {
      const stats = await logApi.getCallStats();
      set({ stats, loading: false });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      set({ loading: false });
    }
  },

  fetchAlerts: async () => {
    set({ loading: true });
    try {
      const alerts = await logApi.getAlerts();
      set({ alerts, loading: false });
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      set({ loading: false });
    }
  },

  resolveAlert: async (alertId: string) => {
    try {
      const success = await logApi.resolveAlert(alertId);
      if (success) {
        set(state => ({
          alerts: state.alerts.map(a =>
            a.id === alertId ? { ...a, resolved: true } : a
          )
        }));
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      throw error;
    }
  }
}));
