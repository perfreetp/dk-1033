import { Rule, CallLog, User, Alert, RuleVersion, CallStats, RuleFilters } from '../../types';
import { mockRules, mockCallLogs, mockUsers, mockAlerts, mockRuleVersions, mockCallStats } from '../mock/data';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ruleApi = {
  getRules: async (filters?: RuleFilters): Promise<Rule[]> => {
    await delay(500);
    let rules = [...mockRules];

    if (filters) {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        rules = rules.filter(r =>
          r.name.toLowerCase().includes(search) ||
          r.description.toLowerCase().includes(search) ||
          r.id.toLowerCase().includes(search)
        );
      }
      if (filters.businessLine) {
        rules = rules.filter(r => r.businessLine === filters.businessLine);
      }
      if (filters.status) {
        rules = rules.filter(r => r.status === filters.status);
      }
      if (filters.priority !== undefined) {
        rules = rules.filter(r => r.priority === filters.priority);
      }
      if (filters.tags && filters.tags.length > 0) {
        rules = rules.filter(r =>
          filters.tags!.some(tag => r.tags.includes(tag))
        );
      }
    }

    return rules;
  },

  getRuleById: async (id: string): Promise<Rule | null> => {
    await delay(300);
    return mockRules.find(r => r.id === id) || null;
  },

  createRule: async (rule: Omit<Rule, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<Rule> => {
    await delay(600);
    const newRule: Rule = {
      ...rule,
      id: `rule-${Date.now()}`,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockRules.push(newRule);
    return newRule;
  },

  updateRule: async (id: string, updates: Partial<Rule>): Promise<Rule | null> => {
    await delay(500);
    const index = mockRules.findIndex(r => r.id === id);
    if (index === -1) return null;

    mockRules[index] = {
      ...mockRules[index],
      ...updates,
      version: mockRules[index].version + 1,
      updatedAt: new Date().toISOString()
    };
    return mockRules[index];
  },

  deleteRule: async (id: string): Promise<boolean> => {
    await delay(400);
    const index = mockRules.findIndex(r => r.id === id);
    if (index === -1) return false;
    mockRules.splice(index, 1);
    return true;
  },

  publishRule: async (id: string): Promise<Rule | null> => {
    await delay(700);
    const rule = mockRules.find(r => r.id === id);
    if (!rule) return null;

    rule.status = 'published';
    rule.version += 1;
    rule.updatedAt = new Date().toISOString();
    return rule;
  },

  disableRule: async (id: string): Promise<Rule | null> => {
    await delay(500);
    const rule = mockRules.find(r => r.id === id);
    if (!rule) return null;

    rule.status = 'disabled';
    rule.updatedAt = new Date().toISOString();
    return rule;
  },

  enableGrayRule: async (id: string): Promise<Rule | null> => {
    await delay(600);
    const rule = mockRules.find(r => r.id === id);
    if (!rule) return null;

    rule.status = 'gray';
    rule.updatedAt = new Date().toISOString();
    return rule;
  },

  copyRule: async (id: string): Promise<Rule | null> => {
    await delay(500);
    const original = mockRules.find(r => r.id === id);
    if (!original) return null;

    const copy: Rule = {
      ...original,
      id: `rule-${Date.now()}`,
      name: `${original.name} (副本)`,
      status: 'draft',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockRules.push(copy);
    return copy;
  },

  testRule: async (id: string, _input: Record<string, any>): Promise<{ hit: boolean; result: any; executionTime: number }> => {
    await delay(800);
    const rule = mockRules.find(r => r.id === id);
    if (!rule) {
      return { hit: false, result: null, executionTime: 0 };
    }

    const startTime = Date.now();
    const hit = true;
    const result = {
      ruleId: rule.id,
      ruleName: rule.name,
      action: rule.actions[0]?.type || 'none',
      output: rule.actions[0]?.params || {}
    };
    const executionTime = Date.now() - startTime;

    return { hit, result, executionTime };
  },

  getRuleVersions: async (ruleId: string): Promise<RuleVersion[]> => {
    await delay(400);
    return mockRuleVersions.filter(v => v.ruleId === ruleId);
  },

  rollbackRule: async (ruleId: string, version: number): Promise<Rule | null> => {
    await delay(600);
    const rule = mockRules.find(r => r.id === ruleId);
    const targetVersion = mockRuleVersions.find(v => v.ruleId === ruleId && v.version === version);

    if (!rule || !targetVersion) return null;

    Object.assign(rule, targetVersion.rule, {
      version: rule.version + 1,
      updatedAt: new Date().toISOString()
    });
    return rule;
  }
};

export const logApi = {
  getCallLogs: async (params?: { ruleId?: string; startDate?: string; endDate?: string; hitResult?: string }): Promise<CallLog[]> => {
    await delay(500);
    let logs = [...mockCallLogs];

    if (params?.ruleId) {
      logs = logs.filter(l => l.ruleId === params.ruleId);
    }
    if (params?.hitResult) {
      logs = logs.filter(l => l.hitResult === params.hitResult);
    }

    return logs;
  },

  getCallStats: async (): Promise<CallStats> => {
    await delay(600);
    return mockCallStats;
  },

  getAlerts: async (): Promise<Alert[]> => {
    await delay(400);
    return mockAlerts;
  },

  resolveAlert: async (alertId: string): Promise<boolean> => {
    await delay(300);
    const alert = mockAlerts.find(a => a.id === alertId);
    if (!alert) return false;
    alert.resolved = true;
    return true;
  }
};

export const userApi = {
  getUsers: async (): Promise<User[]> => {
    await delay(500);
    return mockUsers;
  },

  getUserById: async (id: string): Promise<User | null> => {
    await delay(300);
    return mockUsers.find(u => u.id === id) || null;
  },

  createUser: async (user: Omit<User, 'id' | 'lastLogin'>): Promise<User> => {
    await delay(600);
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
      lastLogin: new Date().toISOString()
    };
    mockUsers.push(newUser);
    return newUser;
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User | null> => {
    await delay(500);
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) return null;

    mockUsers[index] = { ...mockUsers[index], ...updates };
    return mockUsers[index];
  },

  deleteUser: async (id: string): Promise<boolean> => {
    await delay(400);
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) return false;
    mockUsers.splice(index, 1);
    return true;
  }
};
