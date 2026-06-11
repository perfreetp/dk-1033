import React, { useEffect, useState } from 'react';
import { Card, Timeline, Button, Space, Tag, Modal, message, Descriptions, Empty } from 'antd';
import {
  RollbackOutlined,
  DiffOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { ruleApi } from '../../services/api';
import type { Rule, RuleVersion } from '../../types';

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
          await ruleApi.rollbackRule(id!, version.version);
          message.success('回滚成功');
          loadData();
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

  return (
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
          <Button onClick={() => navigate(`/rules/${id}/edit`)}>
            返回编辑
          </Button>
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
                  {currentRule.status}
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
            <Timeline
              items={versions.map((version, index) => ({
                dot: index === 0 ? <ClockCircleOutlined style={{ fontSize: 16 }} /> : undefined,
                children: (
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
                ),
              }))}
            />
          ) : (
            <Empty description="暂无版本记录" />
          )}
        </Card>
      </div>

      <Modal
        title="版本对比"
        open={showCompare}
        onCancel={() => setShowCompare(false)}
        footer={null}
        width={900}
      >
        {selectedVersion && compareVersion && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
              <Card size="small" title={`v${selectedVersion.version} (新版本)`}>
                <pre style={{ fontSize: 'var(--font-size-xs)', maxHeight: 400, overflow: 'auto' }}>
                  {JSON.stringify(selectedVersion.rule, null, 2)}
                </pre>
              </Card>
              <Card size="small" title={`v${compareVersion.version} (旧版本)`}>
                <pre style={{ fontSize: 'var(--font-size-xs)', maxHeight: 400, overflow: 'auto' }}>
                  {JSON.stringify(compareVersion.rule, null, 2)}
                </pre>
              </Card>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
};

export default ReleaseHistory;
