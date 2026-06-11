import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Input, message, Descriptions, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { useRuleStore } from '../../stores';
import type { Rule } from '../../types';

const { TextArea } = Input;

const ApprovalQueue: React.FC = () => {
  const navigate = useNavigate();
  const { rules, loading, fetchRules, approveRule, rejectRule } = useRuleStore();
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const pendingRules = rules.filter(r => r.status === 'pending');

  const handleApprove = async (id: string) => {
    try {
      await approveRule(id);
      message.success('规则审批通过');
    } catch (error) {
      message.error('审批失败');
    }
  };

  const handleReject = () => {
    if (!selectedRule || !rejectReason.trim()) {
      message.warning('请输入驳回原因');
      return;
    }

    Modal.confirm({
      title: '确认驳回',
      content: `确定要驳回规则"${selectedRule.name}"吗？`,
      okText: '确认驳回',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await rejectRule(selectedRule.id, rejectReason);
          message.success('规则已驳回');
          setShowRejectModal(false);
          setRejectReason('');
          setSelectedRule(null);
        } catch (error) {
          message.error('驳回失败');
        }
      },
    });
  };

  const handleViewDetail = (rule: Rule) => {
    setSelectedRule(rule);
    setShowDetailModal(true);
  };

  const handleRejectClick = (rule: Rule) => {
    setSelectedRule(rule);
    setShowRejectModal(true);
  };

  const getBusinessLineTag = (businessLine: string) => {
    const lineMap: Record<string, { color: string; text: string }> = {
      approval: { color: 'blue', text: '审批' },
      risk: { color: 'red', text: '风控' },
      operation: { color: 'green', text: '运营' },
    };
    return <Tag color={lineMap[businessLine]?.color}>{lineMap[businessLine]?.text}</Tag>;
  };

  const columns: ColumnsType<Rule> = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span style={{ fontWeight: 600 }}>{name}</span>
      ),
    },
    {
      title: '业务线',
      dataIndex: 'businessLine',
      key: 'businessLine',
      render: getBusinessLineTag,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      render: (version: number) => <Tag>v{version}</Tag>,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: number) => (
        <Tag color={priority <= 2 ? 'red' : priority <= 4 ? 'orange' : 'default'}>
          P{priority}
        </Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看详情
          </Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleApprove(record.id)}
            style={{ backgroundColor: 'var(--color-success)' }}
          >
            通过
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleRejectClick(record)}
          >
            驳回
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <MainLayout breadcrumbs={[{ label: '规则列表', path: '/rules' }, { label: '待审批规则' }]}>
      <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', margin: 0, fontWeight: 700 }}>
              待审批规则
            </h1>
            <p style={{ marginTop: 'var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>
              共 {pendingRules.length} 条规则待审批
            </p>
          </div>
          <Button onClick={() => fetchRules()}>
            刷新
          </Button>
        </div>

        <Card
          style={{
            borderRadius: 'var(--border-radius-md)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {pendingRules.length > 0 ? (
            <Table
              columns={columns}
              dataSource={pendingRules}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-md)' }}>
                    暂无待审批的规则
                  </p>
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    所有规则都已处理完毕
                  </p>
                </div>
              }
            />
          )}
        </Card>
      </div>

      <Modal
        title="规则详情"
        open={showDetailModal}
        onCancel={() => {
          setShowDetailModal(false);
          setSelectedRule(null);
        }}
        footer={null}
        width={800}
      >
        {selectedRule && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="规则名称" span={2}>
                {selectedRule.name}
              </Descriptions.Item>
              <Descriptions.Item label="规则ID">
                {selectedRule.id}
              </Descriptions.Item>
              <Descriptions.Item label="业务线">
                {getBusinessLineTag(selectedRule.businessLine)}
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                P{selectedRule.priority}
              </Descriptions.Item>
              <Descriptions.Item label="版本">
                v{selectedRule.version}
              </Descriptions.Item>
              <Descriptions.Item label="规则描述" span={2}>
                {selectedRule.description}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 'var(--spacing-lg)' }}>
              <strong>条件配置：</strong>
              <pre style={{
                background: 'var(--color-bg)',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--border-radius-sm)',
                marginTop: 'var(--spacing-sm)',
                maxHeight: 300,
                overflow: 'auto',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-mono)'
              }}>
                {JSON.stringify(selectedRule.conditions, null, 2)}
              </pre>
            </div>

            <div style={{ marginTop: 'var(--spacing-lg)' }}>
              <strong>动作配置：</strong>
              <pre style={{
                background: 'var(--color-bg)',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--border-radius-sm)',
                marginTop: 'var(--spacing-sm)',
                maxHeight: 300,
                overflow: 'auto',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-mono)'
              }}>
                {JSON.stringify(selectedRule.actions, null, 2)}
              </pre>
            </div>

            <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
              <Button onClick={() => {
                setShowDetailModal(false);
                navigate(`/rules/${selectedRule.id}/test`);
              }}>
                测试规则
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={async () => {
                  await handleApprove(selectedRule.id);
                  setShowDetailModal(false);
                }}
                style={{ backgroundColor: 'var(--color-success)' }}
              >
                通过
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => {
                  setShowDetailModal(false);
                  handleRejectClick(selectedRule);
                }}
              >
                驳回
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="驳回规则"
        open={showRejectModal}
        onCancel={() => {
          setShowRejectModal(false);
          setRejectReason('');
          setSelectedRule(null);
        }}
        onOk={handleReject}
        okText="确认驳回"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginTop: 'var(--spacing-lg)' }}>
          <p>请输入驳回原因：</p>
          <TextArea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="请详细说明驳回原因，以便规则编辑者修改..."
          />
        </div>
      </Modal>
    </MainLayout>
  );
};

export default ApprovalQueue;
