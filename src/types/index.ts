export interface Condition {
  id: string;
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in' | 'between';
  value: any;
  logicalOperator?: 'AND' | 'OR';
  children?: Condition[];
}

export interface Action {
  id: string;
  type: 'approve' | 'reject' | 'notify' | 'score' | 'tag' | 'route';
  params: Record<string, any>;
  order: number;
}

export interface EffectiveTime {
  startTime: string | null;
  endTime: string | null;
  permanent: boolean;
}

export interface Scope {
  scenarios: string[];
  regions: string[];
}

export type BusinessLine = 'approval' | 'risk' | 'operation';
export type RuleStatus = 'draft' | 'pending' | 'published' | 'disabled' | 'gray';

export interface Rule {
  id: string;
  name: string;
  description: string;
  businessLine: BusinessLine;
  status: RuleStatus;
  priority: number;
  tags: string[];
  conditions: Condition[];
  actions: Action[];
  effectiveTime: EffectiveTime;
  scope: Scope;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface RuleVersion {
  id: string;
  ruleId: string;
  version: number;
  rule: Rule;
  changedAt: string;
  changedBy: string;
  changeDescription: string;
}

export type HitResult = 'hit' | 'miss' | 'error';

export interface CallLog {
  id: string;
  ruleId: string;
  ruleName: string;
  input: Record<string, any>;
  output: any;
  hitResult: HitResult;
  executionTime: number;
  timestamp: string;
  error?: string;
}

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'reviewer' | 'operator';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  businessLines: BusinessLine[];
  status: UserStatus;
  lastLogin: string;
}

export interface Permission {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface CallStats {
  totalCalls: number;
  hitRate: number;
  avgExecutionTime: number;
  errorRate: number;
  timeSeriesData: Array<{
    timestamp: string;
    calls: number;
    hits: number;
    errors: number;
  }>;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  type: 'error' | 'performance' | 'conflict';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface RuleFilters {
  search?: string;
  businessLine?: BusinessLine;
  status?: RuleStatus;
  priority?: number;
  createdBy?: string;
  tags?: string[];
}
