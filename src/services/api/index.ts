import { Rule, CallLog, User, Alert, RuleVersion, CallStats, RuleFilters } from '../../types';
import { storageService } from '../storage';
import { mockCallStats } from '../mock/data';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ruleApi = {
  getRules: async (filters?: RuleFilters): Promise<Rule[]> => {
    await delay(500);
    let rules = storageService.getRules();

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
    return storageService.getRuleById(id);
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
    storageService.addRule(newRule);

    storageService.addRuleVersion({
      id: `version-${Date.now()}`,
      ruleId: newRule.id,
      version: 1,
      rule: newRule,
      changedAt: new Date().toISOString(),
      changedBy: 'current-user',
      changeDescription: '创建规则'
    });

    return newRule;
  },

  updateRule: async (id: string, updates: Partial<Rule>): Promise<Rule | null> => {
    await delay(500);
    const existingRule = storageService.getRuleById(id);
    if (!existingRule) return null;

    const updatedRule = storageService.updateRule(id, {
      ...updates,
      version: existingRule.version + 1
    });

    if (updatedRule) {
      storageService.addRuleVersion({
        id: `version-${Date.now()}`,
        ruleId: updatedRule.id,
        version: updatedRule.version,
        rule: updatedRule,
        changedAt: new Date().toISOString(),
        changedBy: 'current-user',
        changeDescription: updates.description || '更新规则'
      });
    }

    return updatedRule;
  },

  deleteRule: async (id: string): Promise<boolean> => {
    await delay(400);
    return storageService.deleteRule(id);
  },

  publishRule: async (id: string): Promise<Rule | null> => {
    await delay(700);
    const rule = storageService.getRuleById(id);
    if (!rule) return null;

    const updatedRule = storageService.updateRule(id, {
      status: 'published',
      version: rule.version + 1
    });

    if (updatedRule) {
      storageService.addRuleVersion({
        id: `version-${Date.now()}`,
        ruleId: updatedRule.id,
        version: updatedRule.version,
        rule: updatedRule,
        changedAt: new Date().toISOString(),
        changedBy: 'current-user',
        changeDescription: '发布规则'
      });
    }

    return updatedRule;
  },

  disableRule: async (id: string): Promise<Rule | null> => {
    await delay(500);
    const rule = storageService.getRuleById(id);
    if (!rule) return null;

    const updatedRule = storageService.updateRule(id, {
      status: 'disabled',
      version: rule.version + 1
    });

    if (updatedRule) {
      storageService.addRuleVersion({
        id: `version-${Date.now()}`,
        ruleId: updatedRule.id,
        version: updatedRule.version,
        rule: updatedRule,
        changedAt: new Date().toISOString(),
        changedBy: 'current-user',
        changeDescription: '停用规则'
      });
    }

    return updatedRule;
  },

  enableGrayRule: async (id: string): Promise<Rule | null> => {
    await delay(600);
    const rule = storageService.getRuleById(id);
    if (!rule) return null;

    const updatedRule = storageService.updateRule(id, {
      status: 'gray',
      version: rule.version + 1
    });

    if (updatedRule) {
      storageService.addRuleVersion({
        id: `version-${Date.now()}`,
        ruleId: updatedRule.id,
        version: updatedRule.version,
        rule: updatedRule,
        changedAt: new Date().toISOString(),
        changedBy: 'current-user',
        changeDescription: '启用灰度'
      });
    }

    return updatedRule;
  },

  copyRule: async (id: string): Promise<Rule | null> => {
    await delay(500);
    const original = storageService.getRuleById(id);
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
    storageService.addRule(copy);

    storageService.addRuleVersion({
      id: `version-${Date.now()}`,
      ruleId: copy.id,
      version: 1,
      rule: copy,
      changedAt: new Date().toISOString(),
      changedBy: 'current-user',
      changeDescription: '复制规则'
    });

    return copy;
  },

  testRule: async (id: string, input: Record<string, any>): Promise<{ hit: boolean; result: any; executionTime: number }> => {
    await delay(800);
    const rule = storageService.getRuleById(id);
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

    storageService.addCallLog({
      id: `log-${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      input,
      output: result,
      hitResult: hit ? 'hit' : 'miss',
      executionTime,
      timestamp: new Date().toISOString()
    });

    return { hit, result, executionTime };
  },

  getRuleVersions: async (ruleId: string): Promise<RuleVersion[]> => {
    await delay(400);
    return storageService.getRuleVersions(ruleId);
  },

  rollbackRule: async (ruleId: string, version: number): Promise<Rule | null> => {
    await delay(600);
    const rule = storageService.getRuleById(ruleId);
    const versions = storageService.getRuleVersions(ruleId);
    const targetVersion = versions.find(v => v.version === version);

    if (!rule || !targetVersion) return null;

    const updatedRule = storageService.updateRule(ruleId, {
      ...targetVersion.rule,
      version: rule.version + 1
    });

    if (updatedRule) {
      storageService.addRuleVersion({
        id: `version-${Date.now()}`,
        ruleId: updatedRule.id,
        version: updatedRule.version,
        rule: updatedRule,
        changedAt: new Date().toISOString(),
        changedBy: 'current-user',
        changeDescription: `回滚到版本 ${version}`
      });
    }

    return updatedRule;
  },

  approveRule: async (id: string): Promise<Rule | null> => {
    await delay(700);
    const rule = storageService.getRuleById(id);
    if (!rule) return null;

    const updatedRule = storageService.updateRule(id, {
      status: 'published',
      version: rule.version + 1
    });

    if (updatedRule) {
      storageService.addRuleVersion({
        id: `version-${Date.now()}`,
        ruleId: updatedRule.id,
        version: updatedRule.version,
        rule: updatedRule,
        changedAt: new Date().toISOString(),
        changedBy: 'current-user',
        changeDescription: '审批通过'
      });
    }

    return updatedRule;
  },

  rejectRule: async (id: string, reason: string): Promise<Rule | null> => {
    await delay(700);
    const rule = storageService.getRuleById(id);
    if (!rule) return null;

    const updatedRule = storageService.updateRule(id, {
      status: 'draft',
      version: rule.version + 1
    });

    if (updatedRule) {
      storageService.addRuleVersion({
        id: `version-${Date.now()}`,
        ruleId: updatedRule.id,
        version: updatedRule.version,
        rule: updatedRule,
        changedAt: new Date().toISOString(),
        changedBy: 'current-user',
        changeDescription: `审批驳回: ${reason}`
      });
    }

    return updatedRule;
  }
};

export const logApi = {
  getCallLogs: async (params?: { ruleId?: string; startDate?: string; endDate?: string; hitResult?: string }): Promise<CallLog[]> => {
    await delay(500);
    let logs = storageService.getCallLogs();

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
    const logs = storageService.getCallLogs();
    const errors = logs.filter(l => l.hitResult === 'error').slice(0, 10);

    return errors.map((log, index) => ({
      id: `alert-${index}`,
      ruleId: log.ruleId,
      ruleName: log.ruleName,
      type: 'error' as const,
      message: log.error || '执行错误',
      timestamp: log.timestamp,
      resolved: false
    }));
  },

  resolveAlert: async (alertId: string): Promise<boolean> => {
    await delay(300);
    return true;
  }
};

export const userApi = {
  getUsers: async (): Promise<User[]> => {
    await delay(500);
    return storageService.getUsers();
  },

  getUserById: async (id: string): Promise<User | null> => {
    await delay(300);
    const users = storageService.getUsers();
    return users.find(u => u.id === id) || null;
  },

  createUser: async (user: Omit<User, 'id' | 'lastLogin'>): Promise<User> => {
    await delay(600);
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
      lastLogin: new Date().toISOString()
    };
    storageService.addUser(newUser);
    return newUser;
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User | null> => {
    await delay(500);
    return storageService.updateUser(id, updates);
  },

  deleteUser: async (id: string): Promise<boolean> => {
    await delay(400);
    return storageService.deleteUser(id);
  }
};
