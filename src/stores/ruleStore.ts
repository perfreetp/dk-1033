import { create } from 'zustand';
import { Rule, RuleFilters } from '../types';
import { ruleApi } from '../services/api';

interface RuleState {
  rules: Rule[];
  currentRule: Rule | null;
  loading: boolean;
  filters: RuleFilters;
  fetchRules: () => Promise<void>;
  fetchRuleById: (id: string) => Promise<void>;
  createRule: (rule: Omit<Rule, 'id' | 'version' | 'createdAt' | 'updatedAt'>) => Promise<Rule>;
  updateRule: (id: string, updates: Partial<Rule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  publishRule: (id: string) => Promise<void>;
  disableRule: (id: string) => Promise<void>;
  copyRule: (id: string) => Promise<Rule>;
  testRule: (id: string, input: Record<string, any>) => Promise<any>;
  setFilters: (filters: RuleFilters) => void;
  clearFilters: () => void;
}

export const useRuleStore = create<RuleState>((set, get) => ({
  rules: [],
  currentRule: null,
  loading: false,
  filters: {},

  fetchRules: async () => {
    set({ loading: true });
    try {
      const rules = await ruleApi.getRules(get().filters);
      set({ rules, loading: false });
    } catch (error) {
      console.error('Failed to fetch rules:', error);
      set({ loading: false });
    }
  },

  fetchRuleById: async (id: string) => {
    set({ loading: true });
    try {
      const rule = await ruleApi.getRuleById(id);
      set({ currentRule: rule, loading: false });
    } catch (error) {
      console.error('Failed to fetch rule:', error);
      set({ loading: false });
    }
  },

  createRule: async (ruleData) => {
    set({ loading: true });
    try {
      const newRule = await ruleApi.createRule(ruleData);
      set(state => ({
        rules: [...state.rules, newRule],
        loading: false
      }));
      return newRule;
    } catch (error) {
      console.error('Failed to create rule:', error);
      set({ loading: false });
      throw error;
    }
  },

  updateRule: async (id: string, updates: Partial<Rule>) => {
    set({ loading: true });
    try {
      const updatedRule = await ruleApi.updateRule(id, updates);
      if (updatedRule) {
        set(state => ({
          rules: state.rules.map(r => r.id === id ? updatedRule : r),
          currentRule: updatedRule,
          loading: false
        }));
      }
    } catch (error) {
      console.error('Failed to update rule:', error);
      set({ loading: false });
      throw error;
    }
  },

  deleteRule: async (id: string) => {
    set({ loading: true });
    try {
      await ruleApi.deleteRule(id);
      set(state => ({
        rules: state.rules.filter(r => r.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Failed to delete rule:', error);
      set({ loading: false });
      throw error;
    }
  },

  publishRule: async (id: string) => {
    set({ loading: true });
    try {
      const publishedRule = await ruleApi.publishRule(id);
      if (publishedRule) {
        set(state => ({
          rules: state.rules.map(r => r.id === id ? publishedRule : r),
          loading: false
        }));
      }
    } catch (error) {
      console.error('Failed to publish rule:', error);
      set({ loading: false });
      throw error;
    }
  },

  disableRule: async (id: string) => {
    set({ loading: true });
    try {
      const disabledRule = await ruleApi.disableRule(id);
      if (disabledRule) {
        set(state => ({
          rules: state.rules.map(r => r.id === id ? disabledRule : r),
          loading: false
        }));
      }
    } catch (error) {
      console.error('Failed to disable rule:', error);
      set({ loading: false });
      throw error;
    }
  },

  copyRule: async (id: string) => {
    set({ loading: true });
    try {
      const copiedRule = await ruleApi.copyRule(id);
      if (copiedRule) {
        set(state => ({
          rules: [...state.rules, copiedRule],
          loading: false
        }));
        return copiedRule;
      }
      throw new Error('Failed to copy rule');
    } catch (error) {
      console.error('Failed to copy rule:', error);
      set({ loading: false });
      throw error;
    }
  },

  testRule: async (id: string, input: Record<string, any>) => {
    try {
      return await ruleApi.testRule(id, input);
    } catch (error) {
      console.error('Failed to test rule:', error);
      throw error;
    }
  },

  setFilters: (filters: RuleFilters) => {
    set({ filters });
    get().fetchRules();
  },

  clearFilters: () => {
    set({ filters: {} });
    get().fetchRules();
  }
}));
