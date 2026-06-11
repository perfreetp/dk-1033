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
  let overallHit = true;

  executionSteps.push('开始评估条件');

  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i];
    const inputValue = getNestedValue(input, condition.field);

    executionSteps.push(`评估条件 ${i + 1}: ${condition.field} ${condition.operator} ${condition.value}`);

    const conditionResult = evaluateCondition(condition, inputValue);
    matchedConditions.push({
      condition,
      result: conditionResult,
      inputValue
    });

    if (!conditionResult) {
      overallHit = false;
    }
  }

  if (overallHit && conditions.length > 0) {
    executionSteps.push('所有条件匹配成功');
  } else if (conditions.length === 0) {
    overallHit = false;
    executionSteps.push('无条件配置');
  } else {
    executionSteps.push('条件不匹配');
  }

  return {
    hit: overallHit,
    matchedConditions,
    executedActions: [],
    executionSteps
  };
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
      return typeof inputValue === 'number' && typeof value === 'number' && inputValue > value;

    case 'lt':
      return typeof inputValue === 'number' && typeof value === 'number' && inputValue < value;

    case 'gte':
      return typeof inputValue === 'number' && typeof value === 'number' && inputValue >= value;

    case 'lte':
      return typeof inputValue === 'number' && typeof value === 'number' && inputValue <= value;

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
        return typeof inputValue === 'number' &&
               typeof min === 'number' &&
               typeof max === 'number' &&
               inputValue >= min &&
               inputValue <= max;
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
      result.executionSteps.push(`执行动作 ${action.order}: ${action.type}`);
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
