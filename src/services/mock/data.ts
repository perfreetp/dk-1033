import { Rule, CallLog, User, Alert, RuleVersion, CallStats } from '../../types';

export const mockRules: Rule[] = [
  {
    id: 'rule-001',
    name: '高风险用户审批',
    description: '针对高风险等级用户进行额外的审批流程，需要部门主管确认',
    businessLine: 'risk',
    status: 'published',
    priority: 1,
    tags: ['高风险', '审批', '风控'],
    conditions: [
      {
        id: 'cond-001',
        field: 'user.riskLevel',
        operator: 'eq',
        value: 'high'
      }
    ],
    actions: [
      {
        id: 'action-001',
        type: 'notify',
        params: { recipients: ['risk-team'], message: '高风险用户审批通知' },
        order: 1
      },
      {
        id: 'action-002',
        type: 'route',
        params: { path: '/approval/senior' },
        order: 2
      }
    ],
    effectiveTime: {
      startTime: '2024-01-01',
      endTime: null,
      permanent: true
    },
    scope: {
      scenarios: ['loan', 'credit', 'investment'],
      regions: ['全国']
    },
    version: 3,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-03-20T14:20:00Z',
    createdBy: 'admin',
    updatedBy: 'risk-admin'
  },
  {
    id: 'rule-002',
    name: '大额交易告警',
    description: '单笔交易金额超过50万时触发告警，通知风控部门',
    businessLine: 'risk',
    status: 'published',
    priority: 2,
    tags: ['交易', '告警', '大额'],
    conditions: [
      {
        id: 'cond-002',
        field: 'transaction.amount',
        operator: 'gt',
        value: 500000
      }
    ],
    actions: [
      {
        id: 'action-003',
        type: 'notify',
        params: { recipients: ['risk-control', 'compliance'], message: '大额交易告警' },
        order: 1
      }
    ],
    effectiveTime: {
      startTime: '2024-02-01',
      endTime: null,
      permanent: true
    },
    scope: {
      scenarios: ['transfer', 'payment'],
      regions: ['全国']
    },
    version: 2,
    createdAt: '2024-01-20T09:15:00Z',
    updatedAt: '2024-03-15T11:30:00Z',
    createdBy: 'risk-admin',
    updatedBy: 'risk-admin'
  },
  {
    id: 'rule-003',
    name: '新用户首单优惠',
    description: '新注册用户在首次下单时给予折扣优惠',
    businessLine: 'operation',
    status: 'published',
    priority: 5,
    tags: ['新用户', '优惠', '运营'],
    conditions: [
      {
        id: 'cond-003',
        field: 'user.isNew',
        operator: 'eq',
        value: true
      },
      {
        id: 'cond-004',
        field: 'order.orderCount',
        operator: 'eq',
        value: 1,
        logicalOperator: 'AND'
      }
    ],
    actions: [
      {
        id: 'action-004',
        type: 'score',
        params: { discount: 0.15, maxAmount: 100 },
        order: 1
      }
    ],
    effectiveTime: {
      startTime: '2024-03-01',
      endTime: '2024-12-31',
      permanent: false
    },
    scope: {
      scenarios: ['retail', 'ecomm'],
      regions: ['华东', '华北', '华南']
    },
    version: 1,
    createdAt: '2024-02-28T16:45:00Z',
    updatedAt: '2024-02-28T16:45:00Z',
    createdBy: 'operation-admin',
    updatedBy: 'operation-admin'
  },
  {
    id: 'rule-004',
    name: 'VIP用户优先处理',
    description: 'VIP等级用户提交的申请享有优先处理权',
    businessLine: 'approval',
    status: 'published',
    priority: 3,
    tags: ['VIP', '优先', '审批'],
    conditions: [
      {
        id: 'cond-005',
        field: 'user.vipLevel',
        operator: 'gte',
        value: 3
      }
    ],
    actions: [
      {
        id: 'action-005',
        type: 'route',
        params: { path: '/approval/vip', priority: 'high' },
        order: 1
      }
    ],
    effectiveTime: {
      startTime: '2024-01-01',
      endTime: null,
      permanent: true
    },
    scope: {
      scenarios: ['loan', 'credit', 'card'],
      regions: ['全国']
    },
    version: 2,
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-02-15T10:20:00Z',
    createdBy: 'approval-admin',
    updatedBy: 'approval-admin'
  },
  {
    id: 'rule-005',
    name: '夜间交易限制',
    description: '限制凌晨0点到6点的大额交易',
    businessLine: 'risk',
    status: 'gray',
    priority: 1,
    tags: ['夜间', '限制', '风控'],
    conditions: [
      {
        id: 'cond-006',
        field: 'transaction.time',
        operator: 'between',
        value: ['00:00', '06:00']
      },
      {
        id: 'cond-007',
        field: 'transaction.amount',
        operator: 'gt',
        value: 100000,
        logicalOperator: 'AND'
      }
    ],
    actions: [
      {
        id: 'action-006',
        type: 'reject',
        params: { reason: '夜间交易限额' },
        order: 1
      },
      {
        id: 'action-007',
        type: 'notify',
        params: { recipients: ['risk-team'], message: '夜间异常交易拦截' },
        order: 2
      }
    ],
    effectiveTime: {
      startTime: '2024-04-01',
      endTime: null,
      permanent: false
    },
    scope: {
      scenarios: ['transfer'],
      regions: ['全国']
    },
    version: 1,
    createdAt: '2024-03-25T14:00:00Z',
    updatedAt: '2024-03-25T14:00:00Z',
    createdBy: 'risk-admin',
    updatedBy: 'risk-admin'
  },
  {
    id: 'rule-006',
    name: '营销活动参与条件',
    description: '判断用户是否符合营销活动的参与条件',
    businessLine: 'operation',
    status: 'draft',
    priority: 4,
    tags: ['营销', '活动', '条件'],
    conditions: [
      {
        id: 'cond-008',
        field: 'user.registerDays',
        operator: 'gte',
        value: 30
      },
      {
        id: 'cond-009',
        field: 'user.orderCount',
        operator: 'gte',
        value: 3,
        logicalOperator: 'AND'
      }
    ],
    actions: [
      {
        id: 'action-008',
        type: 'tag',
        params: { eligible: true, tag: 'activity-2024-spring' },
        order: 1
      }
    ],
    effectiveTime: {
      startTime: '2024-04-01',
      endTime: '2024-05-31',
      permanent: false
    },
    scope: {
      scenarios: ['retail'],
      regions: ['全国']
    },
    version: 1,
    createdAt: '2024-03-26T09:30:00Z',
    updatedAt: '2024-03-26T09:30:00Z',
    createdBy: 'operation-admin',
    updatedBy: 'operation-admin'
  },
  {
    id: 'rule-007',
    name: '异常IP地址检测',
    description: '检测并标记来自异常IP地址的请求',
    businessLine: 'risk',
    status: 'published',
    priority: 1,
    tags: ['安全', 'IP', '风控'],
    conditions: [
      {
        id: 'cond-010',
        field: 'ip.isProxy',
        operator: 'eq',
        value: true
      },
      {
        id: 'cond-011',
        field: 'ip.isTor',
        operator: 'eq',
        value: true,
        logicalOperator: 'OR'
      }
    ],
    actions: [
      {
        id: 'action-009',
        type: 'tag',
        params: { tag: 'suspicious-ip' },
        order: 1
      },
      {
        id: 'action-010',
        type: 'score',
        params: { riskScore: 30 },
        order: 2
      }
    ],
    effectiveTime: {
      startTime: '2024-01-01',
      endTime: null,
      permanent: true
    },
    scope: {
      scenarios: ['login', 'transaction'],
      regions: ['全国']
    },
    version: 1,
    createdAt: '2024-01-05T11:00:00Z',
    updatedAt: '2024-01-05T11:00:00Z',
    createdBy: 'security-admin',
    updatedBy: 'security-admin'
  },
  {
    id: 'rule-008',
    name: '贷款额度评估',
    description: '根据用户信用评分和收入情况评估贷款额度',
    businessLine: 'approval',
    status: 'pending',
    priority: 2,
    tags: ['贷款', '额度', '评估'],
    conditions: [
      {
        id: 'cond-012',
        field: 'user.creditScore',
        operator: 'gte',
        value: 650
      }
    ],
    actions: [
      {
        id: 'action-011',
        type: 'score',
        params: { multiplier: 2.5, baseAmount: 10000 },
        order: 1
      }
    ],
    effectiveTime: {
      startTime: '2024-04-10',
      endTime: null,
      permanent: false
    },
    scope: {
      scenarios: ['loan'],
      regions: ['华东', '华南']
    },
    version: 2,
    createdAt: '2024-03-20T15:30:00Z',
    updatedAt: '2024-03-27T10:15:00Z',
    createdBy: 'approval-admin',
    updatedBy: 'approval-admin'
  }
];

export const mockCallLogs: CallLog[] = [
  {
    id: 'log-001',
    ruleId: 'rule-001',
    ruleName: '高风险用户审批',
    input: { userId: 'user-123', riskLevel: 'high', amount: 50000 },
    output: { action: 'notify', status: 'success' },
    hitResult: 'hit',
    executionTime: 45,
    timestamp: '2024-03-25T15:30:00Z'
  },
  {
    id: 'log-002',
    ruleId: 'rule-002',
    ruleName: '大额交易告警',
    input: { transactionId: 'tx-456', amount: 600000 },
    output: { action: 'notify', status: 'sent' },
    hitResult: 'hit',
    executionTime: 32,
    timestamp: '2024-03-25T15:25:00Z'
  },
  {
    id: 'log-003',
    ruleId: 'rule-003',
    ruleName: '新用户首单优惠',
    input: { userId: 'user-789', isNew: true, orderCount: 1 },
    output: { action: 'discount', discount: 0.15 },
    hitResult: 'hit',
    executionTime: 28,
    timestamp: '2024-03-25T15:20:00Z'
  },
  {
    id: 'log-004',
    ruleId: 'rule-007',
    ruleName: '异常IP地址检测',
    input: { ip: '192.168.1.1', isProxy: true },
    output: { action: 'tag', tag: 'suspicious-ip', riskScore: 30 },
    hitResult: 'hit',
    executionTime: 15,
    timestamp: '2024-03-25T15:15:00Z'
  },
  {
    id: 'log-005',
    ruleId: 'rule-001',
    ruleName: '高风险用户审批',
    input: { userId: 'user-321', riskLevel: 'medium', amount: 10000 },
    output: null,
    hitResult: 'miss',
    executionTime: 12,
    timestamp: '2024-03-25T15:10:00Z'
  },
  {
    id: 'log-006',
    ruleId: 'rule-005',
    ruleName: '夜间交易限制',
    input: { transactionId: 'tx-999', amount: 200000, time: '02:30' },
    output: { action: 'reject', reason: '夜间交易限额' },
    hitResult: 'hit',
    executionTime: 38,
    timestamp: '2024-03-25T02:30:00Z'
  },
  {
    id: 'log-007',
    ruleId: 'rule-004',
    ruleName: 'VIP用户优先处理',
    input: { userId: 'user-vip', vipLevel: 4 },
    output: { action: 'route', path: '/approval/vip', priority: 'high' },
    hitResult: 'hit',
    executionTime: 22,
    timestamp: '2024-03-25T14:50:00Z'
  },
  {
    id: 'log-008',
    ruleId: 'rule-002',
    ruleName: '大额交易告警',
    input: { transactionId: 'tx-111', amount: 300000 },
    output: null,
    hitResult: 'miss',
    executionTime: 10,
    timestamp: '2024-03-25T14:45:00Z'
  },
  {
    id: 'log-009',
    ruleId: 'rule-003',
    ruleName: '新用户首单优惠',
    input: { userId: 'user-222', isNew: true, orderCount: 2 },
    output: null,
    hitResult: 'miss',
    executionTime: 8,
    timestamp: '2024-03-25T14:40:00Z'
  },
  {
    id: 'log-010',
    ruleId: 'rule-007',
    ruleName: '异常IP地址检测',
    input: { ip: '10.0.0.1', isProxy: false },
    output: null,
    hitResult: 'miss',
    executionTime: 5,
    timestamp: '2024-03-25T14:35:00Z'
  }
];

export const mockUsers: User[] = [
  {
    id: 'user-001',
    username: 'admin',
    name: '系统管理员',
    email: 'admin@example.com',
    role: 'super_admin',
    businessLines: ['approval', 'risk', 'operation'],
    status: 'active',
    lastLogin: '2024-03-25T15:00:00Z'
  },
  {
    id: 'user-002',
    username: 'risk-admin',
    name: '风控管理员',
    email: 'risk-admin@example.com',
    role: 'admin',
    businessLines: ['risk'],
    status: 'active',
    lastLogin: '2024-03-25T14:30:00Z'
  },
  {
    id: 'user-003',
    username: 'approval-admin',
    name: '审批管理员',
    email: 'approval-admin@example.com',
    role: 'admin',
    businessLines: ['approval'],
    status: 'active',
    lastLogin: '2024-03-25T14:20:00Z'
  },
  {
    id: 'user-004',
    username: 'operation-admin',
    name: '运营管理员',
    email: 'operation-admin@example.com',
    role: 'admin',
    businessLines: ['operation'],
    status: 'active',
    lastLogin: '2024-03-25T14:10:00Z'
  },
  {
    id: 'user-005',
    username: 'editor01',
    name: '规则编辑者A',
    email: 'editor01@example.com',
    role: 'editor',
    businessLines: ['risk'],
    status: 'active',
    lastLogin: '2024-03-25T13:50:00Z'
  },
  {
    id: 'user-006',
    username: 'reviewer01',
    name: '规则审核者',
    email: 'reviewer01@example.com',
    role: 'reviewer',
    businessLines: ['approval', 'risk', 'operation'],
    status: 'active',
    lastLogin: '2024-03-25T13:30:00Z'
  },
  {
    id: 'user-007',
    username: 'operator01',
    name: '运营人员',
    email: 'operator01@example.com',
    role: 'operator',
    businessLines: ['operation'],
    status: 'active',
    lastLogin: '2024-03-25T13:00:00Z'
  },
  {
    id: 'user-008',
    username: 'inactive-user',
    name: '已停用用户',
    email: 'inactive@example.com',
    role: 'editor',
    businessLines: ['risk'],
    status: 'inactive',
    lastLogin: '2024-03-20T10:00:00Z'
  }
];

export const mockAlerts: Alert[] = [
  {
    id: 'alert-001',
    ruleId: 'rule-002',
    ruleName: '大额交易告警',
    type: 'performance',
    message: '规则执行时间超过阈值，当前50ms，阈值30ms',
    timestamp: '2024-03-25T15:25:00Z',
    resolved: false
  },
  {
    id: 'alert-002',
    ruleId: 'rule-005',
    ruleName: '夜间交易限制',
    type: 'error',
    message: '规则执行失败：时间格式解析错误',
    timestamp: '2024-03-25T02:35:00Z',
    resolved: true
  },
  {
    id: 'alert-003',
    ruleId: 'rule-001',
    ruleName: '高风险用户审批',
    type: 'conflict',
    message: '检测到规则冲突：rule-001 与 rule-007 存在优先级冲突',
    timestamp: '2024-03-25T10:00:00Z',
    resolved: false
  },
  {
    id: 'alert-004',
    ruleId: 'rule-003',
    ruleName: '新用户首单优惠',
    type: 'performance',
    message: '规则执行时间超过阈值，当前35ms，阈值30ms',
    timestamp: '2024-03-24T16:20:00Z',
    resolved: true
  }
];

export const mockRuleVersions: RuleVersion[] = [
  {
    id: 'version-001',
    ruleId: 'rule-001',
    version: 1,
    rule: { ...mockRules[0] },
    changedAt: '2024-01-15T10:30:00Z',
    changedBy: 'admin',
    changeDescription: '初始创建规则'
  },
  {
    id: 'version-002',
    ruleId: 'rule-001',
    version: 2,
    rule: { ...mockRules[0], version: 2 },
    changedAt: '2024-02-10T14:20:00Z',
    changedBy: 'risk-admin',
    changeDescription: '调整通知接收人列表'
  },
  {
    id: 'version-003',
    ruleId: 'rule-001',
    version: 3,
    rule: { ...mockRules[0], version: 3 },
    changedAt: '2024-03-20T14:20:00Z',
    changedBy: 'risk-admin',
    changeDescription: '新增路由动作，添加华东地区'
  },
  {
    id: 'version-004',
    ruleId: 'rule-003',
    version: 1,
    rule: { ...mockRules[2] },
    changedAt: '2024-02-28T16:45:00Z',
    changedBy: 'operation-admin',
    changeDescription: '创建新用户优惠规则'
  }
];

export const mockCallStats: CallStats = {
  totalCalls: 15420,
  hitRate: 78.5,
  avgExecutionTime: 28,
  errorRate: 2.3,
  timeSeriesData: [
    { timestamp: '2024-03-19', calls: 2100, hits: 1680, errors: 45 },
    { timestamp: '2024-03-20', calls: 2250, hits: 1800, errors: 52 },
    { timestamp: '2024-03-21', calls: 1980, hits: 1580, errors: 38 },
    { timestamp: '2024-03-22', calls: 2400, hits: 1920, errors: 55 },
    { timestamp: '2024-03-23', calls: 2150, hits: 1720, errors: 48 },
    { timestamp: '2024-03-24', calls: 2300, hits: 1840, errors: 53 },
    { timestamp: '2024-03-25', calls: 2240, hits: 1792, errors: 52 }
  ]
};
