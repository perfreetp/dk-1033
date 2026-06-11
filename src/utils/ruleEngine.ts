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

  let overallHit = evaluateWithLogic(conditions, input, matchedConditions, executionSteps);

  if (overallHit) {
    executionSteps.push(`最终结果: 规则命中`);
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

function evaluateWithLogic(
  conditions: Condition[],
  input: Record<string, any>,
  matchedConditions: EvaluationResult['matchedConditions'],
  executionSteps: string[]
): boolean {
  let currentLogic: 'AND' | 'OR' = 'AND';
  let logicGroupResults: boolean[] = [];
  let orGroupConditions: Array<{condition: Condition; inputValue: any; result: boolean}> = [];

  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i];
    let inputValue = getNestedValue(input, condition.field);
    let flatSuggestion = '';

    if (inputValue === undefined) {
      const flatResult = getFlatValue(input, condition.field);
      if (flatResult.found) {
        inputValue = flatResult.value;
        flatSuggestion = flatResult.suggestion;
      } else if (flatResult.suggestion) {
        executionSteps.push(`  ⚠ ${flatResult.suggestion}`);
      }
    }

    if (i === 0) {
      executionSteps.push(`【条件 ${i + 1}】字段: ${condition.field}`);
      if (flatSuggestion) {
        executionSteps.push(`  ℹ ${flatSuggestion}`);
      }
      if (condition.logicalOperator === 'OR') {
        currentLogic = 'OR';
        executionSteps.push(`  逻辑: OR (与前一个条件用 OR 连接)`);
      } else {
        executionSteps.push(`  逻辑: AND`);
      }
    } else {
      const prevCondition = conditions[i - 1];
      if (prevCondition.logicalOperator) {
        if (currentLogic === 'OR' && prevCondition.logicalOperator !== 'OR') {
          const orGroupHit = orGroupConditions.some(c => c.result);
          executionSteps.push(`  → OR组结束: ${orGroupHit ? '满足' : '不满足'}`);
          logicGroupResults.push(orGroupHit);
          orGroupConditions = [];
        }
        currentLogic = prevCondition.logicalOperator;

        if (currentLogic === 'OR') {
          executionSteps.push(`【条件 ${i + 1}】字段: ${condition.field}`);
          if (flatSuggestion) {
            executionSteps.push(`  ℹ ${flatSuggestion}`);
          }
          executionSteps.push(`  逻辑: OR (与前一个条件用 OR 连接)`);
        } else {
          executionSteps.push(`【条件 ${i + 1}】字段: ${condition.field}`);
          if (flatSuggestion) {
            executionSteps.push(`  ℹ ${flatSuggestion}`);
          }
          executionSteps.push(`  逻辑: AND`);
        }
      } else {
        executionSteps.push(`【条件 ${i + 1}】字段: ${condition.field}`);
        if (flatSuggestion) {
          executionSteps.push(`  ℹ ${flatSuggestion}`);
        }
        executionSteps.push(`  逻辑: AND`);
      }
    }

    const conditionResult = evaluateCondition(condition, inputValue, executionSteps);

    matchedConditions.push({
      condition,
      result: conditionResult,
      inputValue
    });

    if (currentLogic === 'AND') {
      logicGroupResults.push(conditionResult);
      if (!conditionResult) {
        executionSteps.push(`  结果: ✗ 不匹配`);
      } else {
        executionSteps.push(`  结果: ✓ 匹配`);
      }
    } else {
      orGroupConditions.push({ condition, inputValue, result: conditionResult });
      if (conditionResult) {
        executionSteps.push(`  结果: ✓ 匹配 (OR条件下任意一个匹配即可)`);
      } else {
        executionSteps.push(`  结果: ✗ 不匹配`);
      }
    }
  }

  if (currentLogic === 'OR' && orGroupConditions.length > 0) {
    const orGroupHit = orGroupConditions.some(c => c.result);
    executionSteps.push(`  → OR组结束: ${orGroupHit ? '满足' : '不满足'}`);
    logicGroupResults.push(orGroupHit);
  }

  const finalResult = logicGroupResults.every(r => r);

  if (logicGroupResults.length > 1) {
    const details = logicGroupResults.map((r, idx) => {
      if (idx === logicGroupResults.length - 1 && conditions.length > 0) {
        const lastCondition = conditions[conditions.length - 1];
        if (lastCondition.logicalOperator === 'OR') {
          const orConditions = conditions.filter(c => c.logicalOperator === 'OR');
          return `OR组(${orConditions.length}个条件, ${r ? '满足' : '不满足'})`;
        }
      }
      return `AND条件${idx + 1}(${r ? '满足' : '不满足'})`;
    });
    
    executionSteps.push(`  → 逻辑组合: ${details.join(' × ')}`);
    
    if (finalResult) {
      executionSteps.push(`  → 最终结果: 所有条件满足 = 命中 ✓`);
    } else {
      executionSteps.push(`  → 最终结果: 未满足全部条件 = 未命中 ✗`);
    }
  } else if (logicGroupResults.length === 1) {
    if (finalResult) {
      executionSteps.push(`  → 最终结果: 条件满足 = 命中 ✓`);
    } else {
      executionSteps.push(`  → 最终结果: 条件不满足 = 未命中 ✗`);
    }
  }

  return finalResult;
}

function getFlatValue(input: Record<string, any>, field: string): any {
  if (field.includes('.')) {
    const parts = field.split('.');
    const directField = parts[parts.length - 1];
    if (directField in input) {
      return { value: input[directField], found: true, suggestion: `使用扁平字段 "${directField}" 替代路径 "${field}"` };
    }
  }
  return { value: undefined, found: false, suggestion: field.includes('.') ? `路径字段 "${field}" 未找到，可尝试使用扁平写法或提供完整嵌套结构` : undefined };
}

function evaluateCondition(
  condition: Condition,
  inputValue: any,
  executionSteps: string[]
): boolean {
  const { operator, value } = condition;
  const parsedValue = parseValue(value);

  switch (operator) {
    case 'eq':
      return inputValue === parsedValue;

    case 'ne':
      return inputValue !== parsedValue;

    case 'gt':
      if (typeof inputValue === 'number' && typeof parsedValue === 'number') {
        executionSteps.push(`  比较: ${inputValue} > ${parsedValue} = ${inputValue > parsedValue}`);
        return inputValue > parsedValue;
      }
      if (typeof inputValue === 'string' && typeof parsedValue === 'string') {
        executionSteps.push(`  比较: "${inputValue}" > "${parsedValue}" = ${inputValue > parsedValue}`);
        return inputValue > parsedValue;
      }
      executionSteps.push(`  比较: 无法比较类型 ${typeof inputValue} > ${typeof parsedValue} = false`);
      return false;

    case 'lt':
      if (typeof inputValue === 'number' && typeof parsedValue === 'number') {
        executionSteps.push(`  比较: ${inputValue} < ${parsedValue} = ${inputValue < parsedValue}`);
        return inputValue < parsedValue;
      }
      if (typeof inputValue === 'string' && typeof parsedValue === 'string') {
        executionSteps.push(`  比较: "${inputValue}" < "${parsedValue}" = ${inputValue < parsedValue}`);
        return inputValue < parsedValue;
      }
      executionSteps.push(`  比较: 无法比较类型 ${typeof inputValue} < ${typeof parsedValue} = false`);
      return false;

    case 'gte':
      if (typeof inputValue === 'number' && typeof parsedValue === 'number') {
        executionSteps.push(`  比较: ${inputValue} ≥ ${parsedValue} = ${inputValue >= parsedValue}`);
        return inputValue >= parsedValue;
      }
      if (typeof inputValue === 'string' && typeof parsedValue === 'string') {
        executionSteps.push(`  比较: "${inputValue}" ≥ "${parsedValue}" = ${inputValue >= parsedValue}`);
        return inputValue >= parsedValue;
      }
      executionSteps.push(`  比较: 无法比较类型 ${typeof inputValue} ≥ ${typeof parsedValue} = false`);
      return false;

    case 'lte':
      if (typeof inputValue === 'number' && typeof parsedValue === 'number') {
        executionSteps.push(`  比较: ${inputValue} ≤ ${parsedValue} = ${inputValue <= parsedValue}`);
        return inputValue <= parsedValue;
      }
      if (typeof inputValue === 'string' && typeof parsedValue === 'string') {
        executionSteps.push(`  比较: "${inputValue}" ≤ "${parsedValue}" = ${inputValue <= parsedValue}`);
        return inputValue <= parsedValue;
      }
      executionSteps.push(`  比较: 无法比较类型 ${typeof inputValue} ≤ ${typeof parsedValue} = false`);
      return false;

    case 'contains':
      if (typeof inputValue === 'string') {
        const contains = inputValue.includes(String(parsedValue));
        executionSteps.push(`  检查: "${inputValue}" 包含 "${parsedValue}" = ${contains}`);
        return contains;
      }
      if (Array.isArray(inputValue)) {
        const contains = inputValue.includes(parsedValue);
        executionSteps.push(`  检查: 数组包含 ${JSON.stringify(parsedValue)} = ${contains}`);
        return contains;
      }
      executionSteps.push(`  检查: 无法对 ${typeof inputValue} 类型执行 contains`);
      return false;

    case 'in':
      if (Array.isArray(parsedValue)) {
        const inList = parsedValue.includes(inputValue);
        executionSteps.push(`  检查: ${JSON.stringify(inputValue)} ∈ ${JSON.stringify(parsedValue)} = ${inList}`);
        return inList;
      }
      executionSteps.push(`  检查: in 操作符需要数组值`);
      return false;

    case 'between':
      if (Array.isArray(parsedValue) && parsedValue.length === 2) {
        const [min, max] = parsedValue.map(v => parseValue(v));

        if (typeof min === 'string' && typeof max === 'string' &&
            typeof inputValue === 'string') {
          const isTimeFormat = /^([01]?\d|2[0-3]):([0-5]?\d)$/.test(inputValue) &&
                              /^([01]?\d|2[0-3]):([0-5]?\d)$/.test(min) &&
                              /^([01]?\d|2[0-3]):([0-5]?\d)$/.test(max);
          
          if (isTimeFormat) {
            const result = inputValue >= min && inputValue <= max;
            executionSteps.push(`  时间比较: ${inputValue} ≥ ${min} 且 ${inputValue} ≤ ${max}`);
            executionSteps.push(`  区间: ${inputValue} 在时间范围 [${min}, ${max}] 内 = ${result ? '是 ✓' : '否 ✗'}`);
            return result;
          } else {
            const result = inputValue >= min && inputValue <= max;
            executionSteps.push(`  区间: "${inputValue}" ≥ "${min}" 且 "${inputValue}" ≤ "${max}"`);
            executionSteps.push(`  范围: "${inputValue}" 在 ["${min}", "${max}"] 内 = ${result ? '是 ✓' : '否 ✗'}`);
            return result;
          }
        }

        if (typeof inputValue === 'number' &&
            typeof min === 'number' &&
            typeof max === 'number') {
          const result = inputValue >= min && inputValue <= max;
          executionSteps.push(`  数值比较: ${inputValue} ≥ ${min} 且 ${inputValue} ≤ ${max}`);
          executionSteps.push(`  区间: ${inputValue} 在 [${min}, ${max}] 内 = ${result ? '是 ✓' : '否 ✗'}`);
          return result;
        }

        if (typeof inputValue === 'string' &&
            typeof min === 'number' &&
            typeof max === 'number') {
          const inputNum = parseFloat(inputValue);
          if (!isNaN(inputNum)) {
            const result = inputNum >= min && inputNum <= max;
            executionSteps.push(`  类型转换: 字符串 "${inputValue}" → 数字 ${inputNum}`);
            executionSteps.push(`  数值比较: ${inputNum} ≥ ${min} 且 ${inputNum} ≤ ${max}`);
            executionSteps.push(`  区间: ${inputNum} 在 [${min}, ${max}] 内 = ${result ? '是 ✓' : '否 ✗'}`);
            return result;
          }
        }
        
        if (typeof inputValue === 'string' && typeof min === 'string' && typeof max === 'string') {
          const result = inputValue >= min && inputValue <= max;
          executionSteps.push(`  区间: "${inputValue}" 在 ["${min}", "${max}"] 内 = ${result ? '是 ✓' : '否 ✗'}`);
          return result;
        }
      }
      executionSteps.push(`  ⚠ between 需要 [最小值, 最大值] 格式，例如 ["02:00", "06:00"] 或 [1000, 2000]`);
      return false;

    default:
      executionSteps.push(`  操作符: ${operator} 不支持`);
      return false;
  }
}

function parseValue(value: any): any {
  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;

    if (trimmed === 'null') return null;
    if (trimmed === 'undefined') return undefined;

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        const inner = trimmed.slice(1, -1).trim();
        if (inner) {
          const items = inner.split(',').map(s => {
            const item = s.trim();
            if (item === 'true') return true;
            if (item === 'false') return false;
            if (!isNaN(Number(item))) return Number(item);
            if ((item.startsWith('"') && item.endsWith('"')) ||
                (item.startsWith("'") && item.endsWith("'"))) {
              return item.slice(1, -1);
            }
            return item;
          });
          return items;
        }
        return [];
      }
    }

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    }

    if (!isNaN(Number(trimmed))) {
      const num = Number(trimmed);
      if (Number.isInteger(num)) {
        return num;
      }
      return num;
    }

    return trimmed;
  }

  return value;
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

export function executeActions(
  actions: Action[],
  evaluationResult: EvaluationResult
): EvaluationResult {
  const result = { ...evaluationResult };
  const executedActions: Action[] = [];

  result.executionSteps.push('');
  result.executionSteps.push('开始执行动作');

  if (result.hit) {
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      result.executionSteps.push(`【动作 ${i + 1}】类型: ${action.type}`);
      result.executionSteps.push(`  参数: ${JSON.stringify(action.params)}`);
      executedActions.push(action);
    }
    result.executionSteps.push('');
    result.executionSteps.push('所有动作执行完成 ✓');
  } else {
    result.executionSteps.push('跳过动作执行（规则未命中）');
  }

  return {
    ...result,
    executedActions,
    executionSteps: result.executionSteps
  };
}
