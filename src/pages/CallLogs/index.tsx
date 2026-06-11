import React, { useEffect, useState } from 'react';
import { Card, Table, DatePicker, Select, Space, Tag, Button, Row, Col, Statistic, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  LineChartOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { MainLayout } from '../../components/layout';
import { useLogStore } from '../../stores';
import type { CallLog, HitResult } from '../../types';

const { RangePicker } = DatePicker;
const { Option } = Select;

const CallLogs: React.FC = () => {
  const { logs, stats, alerts, loading, fetchLogs, fetchStats, fetchAlerts, resolveAlert } = useLogStore();
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);
  const [showLogDetail, setShowLogDetail] = useState(false);

  useEffect(() => {
    fetchLogs();
    fetchStats();
    fetchAlerts();
  }, [fetchLogs, fetchStats, fetchAlerts]);

  const handleRefresh = () => {
    fetchLogs();
    fetchStats();
    fetchAlerts();
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert(alertId);
    } catch (error) {
      console.error('Failed to resolve alert');
    }
  };

  const getHitResultTag = (result: HitResult) => {
    const config = {
      hit: { color: 'green', text: '命中' },
      miss: { color: 'default', text: '未命中' },
      error: { color: 'red', text: '错误' },
    };
    return <Tag color={config[result].color}>{config[result].text}</Tag>;
  };

  const columns: ColumnsType<CallLog> = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      sorter: (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '规则名称',
      dataIndex: 'ruleName',
      key: 'ruleName',
      render: (name: string, record) => (
        <a onClick={() => {
          setSelectedLog(record);
          setShowLogDetail(true);
        }}>
          {name}
        </a>
      ),
    },
    {
      title: '规则ID',
      dataIndex: 'ruleId',
      key: 'ruleId',
      render: (id: string) => (
        <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-sm)' }}>
          {id}
        </span>
      ),
    },
    {
      title: '命中结果',
      dataIndex: 'hitResult',
      key: 'hitResult',
      render: getHitResultTag,
      filters: [
        { text: '命中', value: 'hit' },
        { text: '未命中', value: 'miss' },
        { text: '错误', value: 'error' },
      ],
      onFilter: (value, record) => record.hitResult === value,
    },
    {
      title: '执行时间',
      dataIndex: 'executionTime',
      key: 'executionTime',
      sorter: (a, b) => a.executionTime - b.executionTime,
      render: (time: number) => (
        <span style={{ fontFamily: 'var(--font-family-mono)' }}>
          {time}ms
        </span>
      ),
    },
    {
      title: '输入',
      dataIndex: 'input',
      key: 'input',
      ellipsis: true,
      render: (input: Record<string, any>) => (
        <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-sm)' }}>
          {JSON.stringify(input).slice(0, 50)}...
        </span>
      ),
    },
  ];

  return (
    <MainLayout breadcrumbs={[{ label: '调用日志' }]}>
      <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', margin: 0, fontWeight: 700 }}>
            调用日志
          </h1>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>
        </div>

        {stats && (
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
                  title="总调用次数"
                  value={stats.totalCalls}
                  prefix={<LineChartOutlined style={{ color: 'var(--color-primary)' }} />}
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
                  title="命中率"
                  value={stats.hitRate}
                  suffix="%"
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
                  title="平均执行时间"
                  value={stats.avgExecutionTime}
                  suffix="ms"
                  valueStyle={{ fontWeight: 700 }}
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
                  title="错误率"
                  value={stats.errorRate}
                  suffix="%"
                  prefix={<CloseCircleOutlined style={{ color: 'var(--color-error)' }} />}
                  valueStyle={{ color: 'var(--color-error)', fontWeight: 700 }}
                />
              </Card>
            </Col>
          </Row>
        )}

        <Row gutter={[16, 16]} style={{ marginBottom: 'var(--spacing-xl)' }}>
          <Col span={24}>
            <Card
              title={
                <Space>
                  <WarningOutlined style={{ color: 'var(--color-warning)' }} />
                  <span>待处理告警 ({alerts.filter(a => !a.resolved).length})</span>
                </Space>
              }
              style={{
                borderRadius: 'var(--border-radius-md)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <Space wrap>
                {alerts.filter(a => !a.resolved).map(alert => (
                  <Tag
                    key={alert.id}
                    color={alert.type === 'error' ? 'red' : alert.type === 'performance' ? 'orange' : 'purple'}
                    style={{ padding: '8px 12px', fontSize: 'var(--font-size-sm)' }}
                    closable
                    onClose={() => handleResolveAlert(alert.id)}
                  >
                    {alert.ruleName} - {alert.message}
                  </Tag>
                ))}
                {alerts.filter(a => !a.resolved).length === 0 && (
                  <span style={{ color: 'var(--color-text-secondary)' }}>暂无待处理告警</span>
                )}
              </Space>
            </Card>
          </Col>
        </Row>

        <Card
          style={{
            borderRadius: 'var(--border-radius-md)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <Space wrap>
              <RangePicker />
              <Select placeholder="命中结果" style={{ width: 150 }} allowClear>
                <Option value="hit">命中</Option>
                <Option value="miss">未命中</Option>
                <Option value="error">错误</Option>
              </Select>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={logs}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              defaultPageSize: 20,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
          />
        </Card>
      </div>

      <Modal
        title="调用详情"
        open={showLogDetail}
        onCancel={() => setShowLogDetail(false)}
        footer={null}
        width={800}
      >
        {selectedLog && (
          <div>
            <Card size="small" title="基本信息" style={{ marginBottom: 'var(--spacing-md)' }}>
              <p><strong>规则名称：</strong>{selectedLog.ruleName}</p>
              <p><strong>规则ID：</strong>{selectedLog.ruleId}</p>
              <p><strong>时间：</strong>{new Date(selectedLog.timestamp).toLocaleString('zh-CN')}</p>
              <p><strong>命中结果：</strong>{getHitResultTag(selectedLog.hitResult)}</p>
              <p><strong>执行时间：</strong>{selectedLog.executionTime}ms</p>
            </Card>

            <Card size="small" title="输入参数" style={{ marginBottom: 'var(--spacing-md)' }}>
              <pre style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-sm)' }}>
                {JSON.stringify(selectedLog.input, null, 2)}
              </pre>
            </Card>

            <Card size="small" title="输出结果">
              <pre style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-sm)' }}>
                {JSON.stringify(selectedLog.output, null, 2)}
              </pre>
            </Card>

            {selectedLog.error && (
              <Card size="small" title="错误信息" style={{ marginTop: 'var(--spacing-md)' }}>
                <p style={{ color: 'var(--color-error)' }}>{selectedLog.error}</p>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </MainLayout>
  );
};

export default CallLogs;
