import { Rule, RuleVersion, User, CallLog } from '../types';
import { mockRules, mockRuleVersions, mockUsers, mockCallLogs } from '../services/mock/data';

const STORAGE_KEYS = {
  RULES: 'rule-engine-rules',
  RULE_VERSIONS: 'rule-engine-versions',
  USERS: 'rule-engine-users',
  CALL_LOGS: 'rule-engine-logs',
};

class StorageService {
  private initialized = false;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    if (this.initialized) return;

    if (!localStorage.getItem(STORAGE_KEYS.RULES)) {
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(mockRules));
    }

    if (!localStorage.getItem(STORAGE_KEYS.RULE_VERSIONS)) {
      localStorage.setItem(STORAGE_KEYS.RULE_VERSIONS, JSON.stringify(mockRuleVersions));
    }

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mockUsers));
    }

    if (!localStorage.getItem(STORAGE_KEYS.CALL_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.CALL_LOGS, JSON.stringify(mockCallLogs));
    }

    this.initialized = true;
  }

  getRules(): Rule[] {
    const data = localStorage.getItem(STORAGE_KEYS.RULES);
    return data ? JSON.parse(data) : [];
  }

  setRules(rules: Rule[]) {
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
  }

  getRuleById(id: string): Rule | null {
    const rules = this.getRules();
    return rules.find(r => r.id === id) || null;
  }

  addRule(rule: Rule) {
    const rules = this.getRules();
    rules.push(rule);
    this.setRules(rules);
  }

  updateRule(id: string, updates: Partial<Rule>): Rule | null {
    const rules = this.getRules();
    const index = rules.findIndex(r => r.id === id);
    if (index === -1) return null;

    rules[index] = { ...rules[index], ...updates, updatedAt: new Date().toISOString() };
    this.setRules(rules);
    return rules[index];
  }

  deleteRule(id: string): boolean {
    const rules = this.getRules();
    const filtered = rules.filter(r => r.id !== id);
    if (filtered.length === rules.length) return false;

    this.setRules(filtered);
    return true;
  }

  getRuleVersions(ruleId: string): RuleVersion[] {
    const data = localStorage.getItem(STORAGE_KEYS.RULE_VERSIONS);
    const versions: RuleVersion[] = data ? JSON.parse(data) : [];
    return versions.filter(v => v.ruleId === ruleId).sort((a, b) => b.version - a.version);
  }

  addRuleVersion(version: RuleVersion) {
    const data = localStorage.getItem(STORAGE_KEYS.RULE_VERSIONS);
    const versions: RuleVersion[] = data ? JSON.parse(data) : [];
    versions.push(version);
    localStorage.setItem(STORAGE_KEYS.RULE_VERSIONS, JSON.stringify(versions));
  }

  getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  }

  setUsers(users: User[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  addUser(user: User) {
    const users = this.getUsers();
    users.push(user);
    this.setUsers(users);
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;

    users[index] = { ...users[index], ...updates };
    this.setUsers(users);
    return users[index];
  }

  deleteUser(id: string): boolean {
    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== id);
    if (filtered.length === users.length) return false;

    this.setUsers(filtered);
    return true;
  }

  getCallLogs(): CallLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.CALL_LOGS);
    return data ? JSON.parse(data) : [];
  }

  addCallLog(log: CallLog) {
    const logs = this.getCallLogs();
    logs.unshift(log);
    localStorage.setItem(STORAGE_KEYS.CALL_LOGS, JSON.stringify(logs.slice(0, 1000)));
  }

  clearAll() {
    localStorage.removeItem(STORAGE_KEYS.RULES);
    localStorage.removeItem(STORAGE_KEYS.RULE_VERSIONS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CALL_LOGS);
    this.initialized = false;
    this.initializeData();
  }
}

export const storageService = new StorageService();
