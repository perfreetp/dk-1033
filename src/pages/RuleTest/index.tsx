import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Space, Result, Tag, Spin, Collapse, Timeline, message, Table } from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { useRuleStore } from '../../stores';
import { evaluateConditions, executeActions, EvaluationResult } from '../../utils/ruleEngine';

const { Panel } = Collapse;
const { TextArea } = Input;

const RuleTest: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentRule, fetchRuleById } = useRuleStore();
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<EvaluationResult | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      fetchRuleById(id);
    }
  }, [id, fetchRuleById]);

  const handleTest = () => {
    if (!id || id === 'new') {
      message.warning('请先保存规则');
      return;
    }

    if (!currentRule) {
      message.warning('规则加载中，请稍后');
      return;
    }

    try {
      let input: Record<string, any>;
      try {
        input = JSON.parse(testInput);
      } catch {
        message.error('请输入有效的JSON格式');
        return;
      }

      setTesting(true);

      const evaluationResult = evaluateConditions(currentRule.conditions, input);
      const finalResult = executeActions(currentRule.actions, evaluationResult);

      setTimeout(() => {
        setTestResult(finalResult);
        setTesting(false);

        if (finalResult.hit) {
          message.success('规则命中！');
        } else {
          message.info('规则未命中');
        }
      }, 500);

    } catch (error) {
      message.error('测试执行失败');
      setTesting(false);
    }
  };

  const getResultIcon = () => {
    if (!testResult) return null;
    if (testResult.hit) {
      return <CheckCircleOutlined style={{ color: 'var(--color-success)', fontSize: 48 }} />;
    } else {
      return <CloseCircleOutlined style={{ color: 'var(--color-error)', fontSize: 48 }} />;
    }
  };

  const getResultStatus = () => {
    if (!testResult) return undefined;
    return testResult.hit ? 'success' : 'error';
  };

  const getResultTitle = () => {
    if (!testResult) return '';
    return testResult.hit ? '规则命中' : '规则未命中';
  };

  const conditionColumns = [
    {
      title: '字段',
      dataIndex: 'field',
      key: 'field',
      width: 200,
    },
    {
      title: '运算符',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
      render: (op: string) => {
        const operatorMap: Record<string, string> = {
          eq: '等于',
          ne: '不等于',
          gt: '大于',
          lt: '小于',
          gte: '大于等于',
          lte: '小于等于',
          contains: '包含',
          in: '在列表中',
          between: '区间',
        };
        return operatorMap[op] || op;
      }
    },
    {
      title: '条件值',
      dataIndex: 'value',
      key: 'value',
      width: 150,
      render: (val: any) => JSON.stringify(val),
    },
    {
      title: '输入值',
      dataIndex: 'inputValue',
      key: 'inputValue',
      width: 150,
      render: (val: any) => val !== undefined ? JSON.stringify(val) : <Tag color="red">未找到</Tag>,
    },
    {
      title: '匹配结果',
      dataIndex: 'result',
      key: 'result',
      width: 120,
      render: (result: boolean) => (
        result ?
          <Tag color="green">✓ 匹配</Tag> :
          <Tag color="red">✗ 不匹配</Tag>
      ),
    },
  ];

  return (
    <MainLayout
      breadcrumbs={[
        { label: '规则列表', path: '/rules' },
        { label: currentRule?.name || '规则', path: `/rules/${id}/edit` },
        { label: '测试' },
      ]}
    >
      <div style={{ animation: 'fadeIn 0.3s ease-out', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', margin: 0, fontWeight: 700 }}>
            规则测试台
          </h1>
          <Space>
            <Button onClick={() => navigate(`/rules/${id}/edit`)}>
              返回编辑
            </Button>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleTest}
              loading={testing}
            >
              执行测试
            </Button>
          </Space>
        </div>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {currentRule && (
            <Card
              title="规则信息"
              style={{
                borderRadius: 'var(--border-radius-md)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <strong>规则名称：</strong>
                  <span>{currentRule.name}</span>
                </div>
                <div>
                  <strong>规则ID：</strong>
                  <span style={{ fontFamily: 'var(--font-family-mono)' }}>{currentRule.id}</span>
                </div>
                <div>
                  <strong>条件数量：</strong>
                  <Tag color="blue">{currentRule.conditions.length} 个</Tag>
                </div>
                <div>
                  <strong>动作数量：</strong>
                  <Tag color="green">{currentRule.actions.length} 个</Tag>
                </div>
              </Space>
            </Card>
          )}

          <Card
            title="输入参数"
            style={{
              borderRadius: 'var(--border-radius-md)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <Form.Item
              label="测试输入 (JSON格式)"
              required
            >
              <TextArea
                rows={8}
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder='{"userId": "user-123", "riskLevel": "high", "amount": 50000}'
                style={{ fontFamily: 'var(--font-family-mono)' }}
              />
            </Form.Item>
            <div style={{ marginTop: 16, color: 'var(--color-text-secondary)' }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}><strong>字段填写说明：</strong></div>
              <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
                <li style={{ marginBottom: 4 }}>
                  <strong>扁平写法（推荐）：</strong>直接填写字段名，如 <code>{'{'}isProxy: true{'}'}</code> 可匹配条件中的 <code>ip.isProxy</code>
                </li>
                <li style={{ marginBottom: 4 }}>
                  <strong>嵌套写法：</strong>支持完整路径，如 <code>{'{'}ip: {'{'}isProxy: true{'}'}{'}'}</code>
                </li>
                <li style={{ marginBottom: 4 }}>
                  <strong>类型自动解析：</strong>数字（如 <code>100000</code>）、布尔值（如 <code>true</code>）、数组（如 <code>{"[\"A\", \"B\"]"}</code>）会自动识别
                </li>
              </ul>
              <strong>常用测试数据示例：</strong>
              <div style={{ marginTop: 8 }}>
                <Tag color="blue" style={{ marginBottom: 4 }}>风控规则</Tag>
                <code style={{ display: 'block', marginBottom: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                  {`{"userId": "user-123", "riskLevel": "high", "amount": 50000}`}
                </code>
                <Tag color="green" style={{ marginBottom: 4 }}>运营规则</Tag>
                <code style={{ display: 'block', marginBottom: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                  {`{"userId": "user-789", "isNew": true, "orderCount": 1}`}
                </code>
                <Tag color="orange" style={{ marginBottom: 4 }}>审批规则</Tag>
                <code style={{ display: 'block', padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                  {`{"userId": "user-vip", "vipLevel": 4}`}
                </code>
              </div>
            </div>
          </Card>

          <Card
            title="规则条件预览"
            style={{
              borderRadius: 'var(--border-radius-md)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {currentRule && currentRule.conditions.length > 0 ? (
              <Collapse accordion>
                {currentRule.conditions.map((condition, index) => (
                  <Panel
                    header={`条件 ${index + 1}: ${condition.field}`}
                    key={condition.id}
                  >
                    <pre style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-sm)' }}>
                      {JSON.stringify(condition, null, 2)}
                    </pre>
                  </Panel>
                ))}
              </Collapse>
            ) : (
              <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                暂无条件配置
              </div>
            )}
          </Card>

          <Card
            title="测试结果"
            style={{
              borderRadius: 'var(--border-radius-md)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {testing ? (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                <Spin size="large" />
                <div style={{ marginTop: 'var(--spacing-md)' }}>测试执行中...</div>
              </div>
            ) : testResult ? (
              <Result
                icon={getResultIcon()}
                status={getResultStatus()}
                title={getResultTitle()}
                subTitle={`命中条件: ${testResult.matchedConditions.filter(c => c.result).length}/${testResult.matchedConditions.length}`}
                extra={
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Card size="small" title="条件匹配详情">
                      <Table
                        columns={conditionColumns}
                        dataSource={testResult.matchedConditions.map((mc, idx) => ({
                          key: idx,
                          field: mc.condition.field,
                          operator: mc.condition.operator,
                          value: mc.condition.value,
                          inputValue: mc.inputValue,
                          result: mc.result,
                        }))}
                        pagination={false}
                        size="small"
                      />
                    </Card>

                    {testResult.hit && testResult.executedActions.length > 0 && (
                      <Card size="small" title="执行动作">
                        {testResult.executedActions.map((action, idx) => (
                          <Tag key={idx} color="blue" style={{ marginBottom: 8, marginRight: 8, padding: '4px 12px' }}>
                            {action.type}: {JSON.stringify(action.params)}
                          </Tag>
                        ))}
                      </Card>
                    )}

                    <Card size="small" title="执行流程">
                      <Timeline
                        items={testResult.executionSteps.map((step) => ({
                          color: step.includes('匹配成功') || step.includes('执行完成') ? 'green' :
                                 step.includes('不匹配') || step.includes('跳过') ? 'red' : 'blue',
                          children: step,
                        }))}
                      />
                    </Card>
                  </Space>
                }
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-secondary)' }}>
                <BulbOutlined style={{ fontSize: 48, marginBottom: 'var(--spacing-md)' }} />
                <div>输入测试参数并点击"执行测试"开始测试</div>
              </div>
            )}
          </Card>
        </Space>
      </div>
    </MainLayout>
  );
};

export default RuleTest;
