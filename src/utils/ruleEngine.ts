import { Condition, Action } from '../types';

export interface EvaluationResult {
  hit: boolean;
  matchedConditions: Array<{
    condition: Condition;
    result: boolean;
    inputValue: any;
  }>;
  executedActions: Action[];
  executionSteps: string[];
}

export function evaluateConditions(
  conditions: Condition[],
  input: Record<string, any>
): EvaluationResult {
  const matchedConditions: EvaluationResult['matchedConditions'] = [];
  const executionSteps: string[] = [];

  executionSteps.push('开始评估条件');

  if (conditions.length === 0) {
    executionSteps.push('无条件配置');
    return {
      hit: false,
      matchedConditions: [],
      executedActions: [],
      executionSteps
    };
  }

  let currentLogic: 'AND' | 'OR' = 'AND';
  let groupResults: boolean[] = [];

  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i];
    const inputValue = getNestedValue(input, condition.field);

    if (i === 0) {
      executionSteps.push(`评估条件 ${i + 1}: ${condition.field} ${getOperatorText(condition.operator)} ${JSON.stringify(condition.value)}`);
      if (condition.logicalOperator === 'OR') {
        currentLogic = 'OR';
        executionSteps.push(`逻辑: 后续条件使用 OR 运算`);
      }
    } else {
      const prevCondition = conditions[i - 1];
      if (prevCondition.logicalOperator) {
        currentLogic = prevCondition.logicalOperator;
        if (currentLogic === 'OR') {
          executionSteps.push(`逻辑: OR 条件组结束`);
          executionSteps.push(`OR组结果: ${groupResults.some(r => r) ? '满足' : '不满足'}`);
          groupResults = [];
        }
        executionSteps.push(`逻辑: 后续条件使用 ${currentLogic} 运算`);
      }

      executionSteps.push(`评估条件 ${i + 1}: ${condition.field} ${getOperatorText(condition.operator)} ${JSON.stringify(condition.value)}`);
      if (condition.logicalOperator === 'OR') {
        currentLogic = 'OR';
        executionSteps.push(`逻辑: 后续条件使用 OR 运算`);
      }
    }

    const conditionResult = evaluateCondition(condition, inputValue);
    matchedConditions.push({
      condition,
      result: conditionResult,
      inputValue
    });

    if (currentLogic === 'AND') {
      groupResults.push(conditionResult);
      if (!conditionResult) {
        executionSteps.push(`结果: 不匹配`);
      } else {
        executionSteps.push(`结果: 匹配`);
      }
    } else {
      groupResults.push(conditionResult);
      if (conditionResult) {
        executionSteps.push(`结果: 匹配 (OR条件下任意一个匹配即可)`);
      } else {
        executionSteps.push(`结果: 不匹配`);
      }
    }
  }

  const finalResult = groupResults.length > 0 && (
    currentLogic === 'AND' ? groupResults.every(r => r) : groupResults.some(r => r)
  );

  const allResults = matchedConditions.map(mc => mc.result);
  const hasAndGroups = conditions.some(c => !c.logicalOperator || c.logicalOperator === 'AND');
  const hasOrGroups = conditions.some(c => c.logicalOperator === 'OR');

  let overallHit = false;
  if (hasOrGroups) {
    overallHit = finalResult;
  } else if (hasAndGroups) {
    overallHit = allResults.every(r => r);
  } else {
    overallHit = allResults.every(r => r);
  }

  if (overallHit) {
    executionSteps.push(`最终结果: 规则命中 (${currentLogic === 'AND' ? '所有AND条件满足' : 'OR条件满足'})`);
  } else {
    executionSteps.push(`最终结果: 规则未命中`);
  }

  return {
    hit: overallHit,
    matchedConditions,
    executedActions: [],
    executionSteps
  };
}

function getOperatorText(operator: string): string {
  const operatorMap: Record<string, string> = {
    eq: '=',
    ne: '≠',
    gt: '>',
    lt: '<',
    gte: '≥',
    lte: '≤',
    contains: '包含',
    in: '∈',
    between: '区间',
  };
  return operatorMap[operator] || operator;
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }

  return value;
}

function evaluateCondition(condition: Condition, inputValue: any): boolean {
  const { operator, value } = condition;

  switch (operator) {
    case 'eq':
      return inputValue === value;

    case 'ne':
      return inputValue !== value;

    case 'gt':
      if (typeof inputValue === 'number' && typeof value === 'number') {
        return inputValue > value;
      }
      if (typeof inputValue === 'string' && typeof value === 'string') {
        return inputValue > value;
      }
      return false;

    case 'lt':
      if (typeof inputValue === 'number' && typeof value === 'number') {
        return inputValue < value;
      }
      if (typeof inputValue === 'string' && typeof value === 'string') {
        return inputValue < value;
      }
      return false;

    case 'gte':
      if (typeof inputValue === 'number' && typeof value === 'number') {
        return inputValue >= value;
      }
      if (typeof inputValue === 'string' && typeof value === 'string') {
        return inputValue >= value;
      }
      return false;

    case 'lte':
      if (typeof inputValue === 'number' && typeof value === 'number') {
        return inputValue <= value;
      }
      if (typeof inputValue === 'string' && typeof value === 'string') {
        return inputValue <= value;
      }
      return false;

    case 'contains':
      if (typeof inputValue === 'string') {
        return inputValue.includes(String(value));
      }
      if (Array.isArray(inputValue)) {
        return inputValue.includes(value);
      }
      return false;

    case 'in':
      if (Array.isArray(value)) {
        return value.includes(inputValue);
      }
      return false;

    case 'between':
      if (Array.isArray(value) && value.length === 2) {
        const [min, max] = value;

        if (typeof min === 'string' && typeof max === 'string' &&
            typeof inputValue === 'string') {
          return inputValue >= min && inputValue <= max;
        }

        if (typeof inputValue === 'number' &&
            typeof min === 'number' &&
            typeof max === 'number') {
          return inputValue >= min && inputValue <= max;
        }
      }
      return false;

    default:
      return false;
  }
}

export function executeActions(
  actions: Action[],
  evaluationResult: EvaluationResult
): EvaluationResult {
  const result = { ...evaluationResult };
  const executedActions: Action[] = [];

  result.executionSteps.push('开始执行动作');

  if (result.hit) {
    for (const action of actions) {
      result.executionSteps.push(`执行动作 ${action.order}: ${action.type} - ${JSON.stringify(action.params)}`);
      executedActions.push(action);
    }
    result.executionSteps.push('所有动作执行完成');
  } else {
    result.executionSteps.push('条件不满足，跳过动作执行');
  }

  return {
    ...result,
    executedActions,
    executionSteps: result.executionSteps
  };
}
