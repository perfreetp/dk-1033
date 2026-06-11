import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Space, Result, Tag, Spin, Collapse, Timeline, message } from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { useRuleStore } from '../../stores';

const { Panel } = Collapse;
const { TextArea } = Input;

interface TestResult {
  hit: boolean;
  result: any;
  executionTime: number;
  details?: any[];
}

const RuleTest: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentRule, fetchRuleById, testRule } = useRuleStore();
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      fetchRuleById(id);
    }
  }, [id, fetchRuleById]);

  const handleTest = async () => {
    if (!id || id === 'new') {
      message.warning('请先保存规则');
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
      const result = await testRule(id, input);
      setTestResult(result);
      message.success('测试完成');
    } catch (error) {
      message.error('测试失败');
    } finally {
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
                    header={`条件 ${index + 1}`}
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
                subTitle={`执行时间: ${testResult.executionTime}ms`}
                extra={
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Card size="small" title="执行结果">
                      <pre style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-sm)' }}>
                        {JSON.stringify(testResult.result, null, 2)}
                      </pre>
                    </Card>

                    <Card size="small" title="执行流程">
                      <Timeline
                        items={[
                          {
                            color: 'green',
                            children: '接收输入参数',
                          },
                          {
                            color: 'green',
                            children: '解析规则条件',
                          },
                          {
                            color: testResult.hit ? 'green' : 'blue',
                            children: testResult.hit ? '条件匹配成功' : '条件不匹配',
                          },
                          {
                            color: 'green',
                            children: '执行动作',
                          },
                          {
                            color: 'green',
                            children: `返回结果 (${testResult.executionTime}ms)`,
                          },
                        ]}
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
