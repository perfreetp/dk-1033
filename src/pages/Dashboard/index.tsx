import React, { useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Space, Progress } from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { MainLayout } from '../../components/layout';
import { useRuleStore, useLogStore } from '../../stores';
import type { Alert } from '../../types';

const Dashboard: React.FC = () => {
  const { rules, fetchRules } = useRuleStore();
  const { stats, alerts, fetchStats, fetchAlerts } = useLogStore();

  useEffect(() => {
    fetchRules();
    fetchStats();
    fetchAlerts();
  }, [fetchRules, fetchStats, fetchAlerts]);

  const ruleStats = {
    total: rules.length,
    published: rules.filter(r => r.status === 'published').length,
    draft: rules.filter(r => r.status === 'draft').length,
    pending: rules.filter(r => r.status === 'pending').length,
  };

  const alertColumns: ColumnsType<Alert> = [
    {
      title: '规则名称',
      dataIndex: 'ruleName',
      key: 'ruleName',
    },
    {
      title: '告警类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colors: Record<string, string> = {
          error: 'red',
          performance: 'orange',
          conflict: 'purple',
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      },
    },
    {
      title: '告警信息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'resolved',
      key: 'resolved',
      render: (resolved: boolean) =>
        resolved ? (
          <Tag color="green">已解决</Tag>
        ) : (
          <Tag color="red">未解决</Tag>
        ),
    },
  ];

  return (
    <MainLayout breadcrumbs={[{ label: '仪表盘' }]}>
      <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-lg)', fontWeight: 700 }}>
          规则引擎中心概览
        </h1>

        <Row gutter={[16, 16]} style={{ marginBottom: 'var(--spacing-xl)' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              style={{
                borderRadius: 'var(--border-radius-md)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <Statistic
                title="规则总数"
                value={ruleStats.total}
                prefix={<FileTextOutlined style={{ color: 'var(--color-primary)' }} />}
                valueStyle={{ color: 'var(--color-primary)', fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              style={{
                borderRadius: 'var(--border-radius-md)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <Statistic
                title="已发布规则"
                value={ruleStats.published}
                prefix={<CheckCircleOutlined style={{ color: 'var(--color-success)' }} />}
                valueStyle={{ color: 'var(--color-success)', fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              style={{
                borderRadius: 'var(--border-radius-md)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <Statistic
                title="待审批规则"
                value={ruleStats.pending}
                prefix={<ClockCircleOutlined style={{ color: 'var(--color-warning)' }} />}
                valueStyle={{ color: 'var(--color-warning)', fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              style={{
                borderRadius: 'var(--border-radius-md)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <Statistic
                title="草稿规则"
                value={ruleStats.draft}
                prefix={<FileTextOutlined style={{ color: 'var(--color-text-secondary)' }} />}
                valueStyle={{ color: 'var(--color-text-secondary)', fontWeight: 700 }}
              />
            </Card>
          </Col>
        </Row>

        {stats && (
          <Row gutter={[16, 16]} style={{ marginBottom: 'var(--spacing-xl)' }}>
            <Col xs={24} lg={12}>
              <Card
                title="调用统计"
                style={{
                  borderRadius: 'var(--border-radius-md)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="总调用次数"
                        value={stats.totalCalls}
                        valueStyle={{ fontWeight: 700 }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="平均执行时间"
                        value={stats.avgExecutionTime}
                        suffix="ms"
                        valueStyle={{ fontWeight: 700 }}
                      />
                    </Col>
                  </Row>
                  <div>
                    <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                      <Space>
                        <span>命中率</span>
                        <ArrowUpOutlined style={{ color: 'var(--color-success)' }} />
                      </Space>
                    </div>
                    <Progress
                      percent={stats.hitRate}
                      strokeColor="var(--color-success)"
                      format={(percent) => `${percent}%`}
                    />
                  </div>
                  <div>
                    <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                      <Space>
                        <span>错误率</span>
                        <ArrowDownOutlined style={{ color: 'var(--color-error)' }} />
                      </Space>
                    </div>
                    <Progress
                      percent={stats.errorRate}
                      strokeColor="var(--color-error)"
                      format={(percent) => `${percent}%`}
                    />
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                title="规则分布"
                style={{
                  borderRadius: 'var(--border-radius-md)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)' }}>
                      <span>审批规则</span>
                      <span style={{ fontWeight: 700 }}>
                        {rules.filter(r => r.businessLine === 'approval').length}
                      </span>
                    </div>
                    <Progress
                      percent={(rules.filter(r => r.businessLine === 'approval').length / ruleStats.total) * 100}
                      strokeColor="var(--color-primary)"
                      showInfo={false}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)' }}>
                      <span>风控规则</span>
                      <span style={{ fontWeight: 700 }}>
                        {rules.filter(r => r.businessLine === 'risk').length}
                      </span>
                    </div>
                    <Progress
                      percent={(rules.filter(r => r.businessLine === 'risk').length / ruleStats.total) * 100}
                      strokeColor="var(--color-accent)"
                      showInfo={false}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)' }}>
                      <span>运营规则</span>
                      <span style={{ fontWeight: 700 }}>
                        {rules.filter(r => r.businessLine === 'operation').length}
                      </span>
                    </div>
                    <Progress
                      percent={(rules.filter(r => r.businessLine === 'operation').length / ruleStats.total) * 100}
                      strokeColor="var(--color-secondary)"
                      showInfo={false}
                    />
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        )}

        <Card
          title={
            <Space>
              <WarningOutlined style={{ color: 'var(--color-error)' }} />
              <span>最新告警</span>
            </Space>
          }
          style={{
            borderRadius: 'var(--border-radius-md)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <Table
            columns={alertColumns}
            dataSource={alerts.filter(a => !a.resolved)}
            rowKey="id"
            pagination={false}
          />
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
