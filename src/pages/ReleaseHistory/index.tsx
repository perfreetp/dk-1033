import React, { useEffect, useState } from 'react';
import { Card, Timeline, Button, Space, Tag, Modal, message, Descriptions, Empty, Collapse } from 'antd';
import {
  RollbackOutlined,
  ClockCircleOutlined,
  DiffOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { ruleApi } from '../../services/api';
import type { Rule, RuleVersion } from '../../types';

const { Panel } = Collapse;

const ReleaseHistory: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [versions, setVersions] = useState<RuleVersion[]>([]);
  const [currentRule, setCurrentRule] = useState<Rule | null>(null);
  const [, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<RuleVersion | null>(null);
  const [compareVersion, setCompareVersion] = useState<RuleVersion | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const rule = await ruleApi.getRuleById(id);
      const versionList = await ruleApi.getRuleVersions(id);
      setCurrentRule(rule);
      setVersions(versionList.sort((a, b) => b.version - a.version));
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = (version: RuleVersion) => {
    Modal.confirm({
      title: '确认回滚',
      content: `确定要回滚到版本 ${version.version} 吗？这将创建一个新的版本。`,
      okText: '确认回滚',
      cancelText: '取消',
      onOk: async () => {
        try {
          const result = await ruleApi.rollbackRule(id!, version.version);
          if (result) {
            message.success('回滚成功');
            loadData();
            navigate(`/rules/${id}/edit`);
          } else {
            message.error('回滚失败');
          }
        } catch (error) {
          message.error('回滚失败');
        }
      },
    });
  };

  const handleCompare = (version: RuleVersion) => {
    if (versions.length < 2) {
      message.warning('需要至少两个版本才能对比');
      return;
    }

    const latestVersion = versions[0];
    if (version.id === latestVersion.id) {
      message.warning('请选择一个历史版本进行对比');
      return;
    }

    setSelectedVersion(latestVersion);
    setCompareVersion(version);
    setShowCompare(true);
  };

  const renderVersionDetails = (version: RuleVersion) => (
    <Card size="small" style={{ marginTop: 'var(--spacing-md)' }}>
      <Descriptions column={2} size="small">
        <Descriptions.Item label="版本号">v{version.version}</Descriptions.Item>
        <Descriptions.Item label="变更人">{version.changedBy}</Descriptions.Item>
        <Descriptions.Item label="变更时间">
          {new Date(version.changedAt).toLocaleString('zh-CN')}
        </Descriptions.Item>
        <Descriptions.Item label="变更描述" span={2}>
          {version.changeDescription}
        </Descriptions.Item>
      </Descriptions>

      <div style={{ marginTop: 'var(--spacing-md)' }}>
        <strong>条件数量：</strong>
        <Tag color="blue">{version.rule.conditions.length} 个</Tag>
        <strong style={{ marginLeft: 'var(--spacing-md)' }}>动作数量：</strong>
        <Tag color="green">{version.rule.actions.length} 个</Tag>
      </div>

      <Space style={{ marginTop: 'var(--spacing-md)' }}>
        <Button
          size="small"
          icon={<DiffOutlined />}
          onClick={() => handleCompare(version)}
        >
          版本对比
        </Button>
        <Button
          size="small"
          icon={<RollbackOutlined />}
          onClick={() => handleRollback(version)}
        >
          回滚到此版本
        </Button>
      </Space>
    </Card>
  );

  const renderDiff = () => {
    if (!selectedVersion || !compareVersion) return null;

    const newRule = selectedVersion.rule;
    const oldRule = compareVersion.rule;

    const diffs: Array<{ field: string; oldValue: any; newValue: any }> = [];

    if (newRule.name !== oldRule.name) {
      diffs.push({ field: '规则名称', oldValue: oldRule.name, newValue: newRule.name });
    }
    if (newRule.description !== oldRule.description) {
      diffs.push({ field: '规则描述', oldValue: oldRule.description, newValue: newRule.description });
    }
    if (newRule.priority !== oldRule.priority) {
      diffs.push({ field: '优先级', oldValue: `P${oldRule.priority}`, newValue: `P${newRule.priority}` });
    }
    if (newRule.businessLine !== oldRule.businessLine) {
      diffs.push({ field: '业务线', oldValue: oldRule.businessLine, newValue: newRule.businessLine });
    }
    if (JSON.stringify(newRule.tags) !== JSON.stringify(oldRule.tags)) {
      diffs.push({ field: '标签', oldValue: oldRule.tags.join(', '), newValue: newRule.tags.join(', ') });
    }

    const conditionDiffs = [];
    const maxConditions = Math.max(newRule.conditions.length, oldRule.conditions.length);
    for (let i = 0; i < maxConditions; i++) {
      const oldCond = oldRule.conditions[i];
      const newCond = newRule.conditions[i];

      if (!oldCond && newCond) {
        conditionDiffs.push({
          type: '新增',
          index: i,
          oldField: '-',
          oldOperator: '-',
          oldValue: '-',
          newField: newCond.field,
          newOperator: newCond.operator,
          newValue: newCond.value
        });
      } else if (oldCond && !newCond) {
        conditionDiffs.push({
          type: '删除',
          index: i,
          oldField: oldCond.field,
          oldOperator: oldCond.operator,
          oldValue: oldCond.value,
          newField: '-',
          newOperator: '-',
          newValue: '-'
        });
      } else if (oldCond && newCond) {
        const fieldChanged = oldCond.field !== newCond.field;
        const operatorChanged = oldCond.operator !== newCond.operator;
        const valueChanged = JSON.stringify(oldCond.value) !== JSON.stringify(newCond.value);

        if (fieldChanged || operatorChanged || valueChanged) {
          conditionDiffs.push({
            type: '修改',
            index: i,
            oldField: oldCond.field,
            oldOperator: oldCond.operator,
            oldValue: oldCond.value,
            newField: newCond.field,
            newOperator: newCond.operator,
            newValue: newCond.value,
            fieldChanged,
            operatorChanged,
            valueChanged
          });
        }
      }
    }

    const actionDiffs = [];
    const maxActions = Math.max(newRule.actions.length, oldRule.actions.length);
    for (let i = 0; i < maxActions; i++) {
      const oldAction = oldRule.actions[i];
      const newAction = newRule.actions[i];

      if (!oldAction && newAction) {
        actionDiffs.push({
          type: '新增',
          index: i,
          oldType: '-',
          oldParams: '-',
          newType: newAction.type,
          newParams: newAction.params
        });
      } else if (oldAction && !newAction) {
        actionDiffs.push({
          type: '删除',
          index: i,
          oldType: oldAction.type,
          oldParams: oldAction.params,
          newType: '-',
          newParams: '-'
        });
      } else if (oldAction && newAction) {
        const typeChanged = oldAction.type !== newAction.type;
        const paramsChanged = JSON.stringify(oldAction.params) !== JSON.stringify(newAction.params);

        if (typeChanged || paramsChanged) {
          actionDiffs.push({
            type: '修改',
            index: i,
            oldType: oldAction.type,
            oldParams: oldAction.params,
            newType: newAction.type,
            newParams: newAction.params,
            typeChanged,
            paramsChanged
          });
        }
      }
    }

    return (
      <div>
        {diffs.length > 0 && (
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h4>基本信息变更：</h4>
            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              {diffs.map((diff, idx) => (
                <Card
                  key={idx}
                  size="small"
                  style={{
                    marginBottom: 'var(--spacing-sm)',
                    borderLeft: '3px solid var(--color-warning)'
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                    {diff.field}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                    <Tag color="red">
                      <span>旧: {String(diff.oldValue)}</span>
                    </Tag>
                    <Tag color="green">
                      <span>新: {String(diff.newValue)}</span>
                    </Tag>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {conditionDiffs.length > 0 && (
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h4>条件变更（{conditionDiffs.length} 处）：</h4>
            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              {conditionDiffs.map((diff, idx) => (
                <Card
                  key={idx}
                  size="small"
                  style={{
                    marginBottom: 'var(--spacing-sm)',
                    borderLeft: `3px solid ${
                      diff.type === '新增' ? 'var(--color-success)' :
                      diff.type === '删除' ? 'var(--color-error)' :
                      'var(--color-warning)'
                    }`
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                    条件 {diff.index + 1} - <Tag color={
                      diff.type === '新增' ? 'green' :
                      diff.type === '删除' ? 'red' : 'orange'
                    }>{diff.type}</Tag>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)' }}>
                    <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                      <strong>字段：</strong>
                      {diff.oldField !== diff.newField ? (
                        <>
                          <Tag color="red">{diff.oldField}</Tag>
                          <Tag color="green">{diff.newField}</Tag>
                        </>
                      ) : (
                        <span>{diff.newField}</span>
                      )}
                    </div>
                    <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                      <strong>运算符：</strong>
                      {diff.oldOperator !== diff.newOperator ? (
                        <>
                          <Tag color="red">{diff.oldOperator}</Tag>
                          <Tag color="green">{diff.newOperator}</Tag>
                        </>
                      ) : (
                        <span>{diff.newOperator}</span>
                      )}
                    </div>
                    <div>
                      <strong>值：</strong>
                      {diff.oldValue !== diff.newValue ? (
                        <>
                          <Tag color="red">{JSON.stringify(diff.oldValue)}</Tag>
                          <Tag color="green">{JSON.stringify(diff.newValue)}</Tag>
                        </>
                      ) : (
                        <span>{JSON.stringify(diff.newValue)}</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {actionDiffs.length > 0 && (
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h4>动作变更（{actionDiffs.length} 处）：</h4>
            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              {actionDiffs.map((diff, idx) => (
                <Card
                  key={idx}
                  size="small"
                  style={{
                    marginBottom: 'var(--spacing-sm)',
                    borderLeft: `3px solid ${
                      diff.type === '新增' ? 'var(--color-success)' :
                      diff.type === '删除' ? 'var(--color-error)' :
                      'var(--color-warning)'
                    }`
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                    动作 {diff.index + 1} - <Tag color={
                      diff.type === '新增' ? 'green' :
                      diff.type === '删除' ? 'red' : 'orange'
                    }>{diff.type}</Tag>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)' }}>
                    <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                      <strong>类型：</strong>
                      {diff.oldType !== diff.newType ? (
                        <>
                          <Tag color="red">{diff.oldType}</Tag>
                          <Tag color="green">{diff.newType}</Tag>
                        </>
                      ) : (
                        <span>{diff.newType}</span>
                      )}
                    </div>
                    <div>
                      <strong>参数：</strong>
                      {diff.oldParams !== diff.newParams ? (
                        <>
                          <Tag color="red">{JSON.stringify(diff.oldParams)}</Tag>
                          <Tag color="green">{JSON.stringify(diff.newParams)}</Tag>
                        </>
                      ) : (
                        <span>{JSON.stringify(diff.newParams)}</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {diffs.length === 0 && conditionDiffs.length === 0 && actionDiffs.length === 0 && (
          <Tag color="blue" style={{ marginBottom: 'var(--spacing-lg)' }}>两个版本无关键差异</Tag>
        )}

        <Collapse accordion>
          <Panel header={`v${selectedVersion.version} 完整内容`} key="new">
            <pre style={{ fontSize: 'var(--font-size-xs)', maxHeight: 400, overflow: 'auto' }}>
              {JSON.stringify(selectedVersion.rule, null, 2)}
            </pre>
          </Panel>
          <Panel header={`v${compareVersion.version} 完整内容`} key="old">
            <pre style={{ fontSize: 'var(--font-size-xs)', maxHeight: 400, overflow: 'auto' }}>
              {JSON.stringify(compareVersion.rule, null, 2)}
            </pre>
          </Panel>
        </Collapse>
      </div>
    );
  };

  return (
    <>
      <MainLayout
        breadcrumbs={[
          { label: '规则列表', path: '/rules' },
          { label: currentRule?.name || '规则', path: `/rules/${id}/edit` },
          { label: '发布记录' },
        ]}
      >
        <div style={{ animation: 'fadeIn 0.3s ease-out', maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', margin: 0, fontWeight: 700 }}>
              发布记录
            </h1>
            <Space>
              <Button onClick={() => navigate(`/rules/${id}/edit`)}>
                返回编辑
              </Button>
              <Button onClick={loadData}>
                刷新
              </Button>
            </Space>
          </div>

          {currentRule && (
            <Card
              title="当前规则"
              style={{
                borderRadius: 'var(--border-radius-md)',
                boxShadow: 'var(--shadow-md)',
                marginBottom: 'var(--spacing-lg)',
              }}
            >
              <Descriptions>
                <Descriptions.Item label="规则名称">{currentRule.name}</Descriptions.Item>
                <Descriptions.Item label="规则ID">{currentRule.id}</Descriptions.Item>
                <Descriptions.Item label="当前版本">v{currentRule.version}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={currentRule.status === 'published' ? 'green' : 'default'}>
                    {currentRule.status === 'published' ? '已发布' :
                     currentRule.status === 'draft' ? '草稿' :
                     currentRule.status === 'pending' ? '待审批' :
                     currentRule.status === 'disabled' ? '已停用' : '灰度中'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          <Card
            title="版本历史"
            style={{
              borderRadius: 'var(--border-radius-md)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {versions.length > 0 ? (
              <Timeline>
                {versions.map((version, index) => (
                  <Timeline.Item
                    key={version.id}
                    dot={index === 0 ? <ClockCircleOutlined style={{ fontSize: 16 }} /> : undefined}
                  >
                    <div
                      style={{
                        padding: 'var(--spacing-md)',
                        background: index === 0 ? 'var(--color-bg)' : 'white',
                        borderRadius: 'var(--border-radius-sm)',
                        border: index === 0 ? '2px solid var(--color-secondary)' : '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Space>
                            <strong style={{ fontSize: 'var(--font-size-lg)' }}>
                              版本 {version.version}
                            </strong>
                            {index === 0 && (
                              <Tag color="blue">最新</Tag>
                            )}
                          </Space>
                          <div style={{ marginTop: 'var(--spacing-xs)', color: 'var(--color-text-secondary)' }}>
                            {version.changeDescription}
                          </div>
                        </div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                          {version.changedBy} · {new Date(version.changedAt).toLocaleDateString('zh-CN')}
                        </div>
                      </div>

                      {renderVersionDetails(version)}
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Empty description="暂无版本记录" />
            )}
          </Card>
        </div>
      </MainLayout>

      <Modal
        title="版本对比"
        open={showCompare}
        onCancel={() => setShowCompare(false)}
        footer={null}
        width={1000}
      >
        {selectedVersion && compareVersion && (
          <div>
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <Space>
                <Tag color="green">v{selectedVersion.version} (新版本)</Tag>
                <span>vs</span>
                <Tag color="red">v{compareVersion.version} (旧版本)</Tag>
              </Space>
            </div>
            {renderDiff()}
          </div>
        )}
      </Modal>
    </>
  );
};

export default ReleaseHistory;
