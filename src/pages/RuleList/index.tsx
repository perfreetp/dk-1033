import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Input, Select, Space, Tag, Dropdown, Modal, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  PlayCircleOutlined,
  StopOutlined,
  HistoryOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { useRuleStore } from '../../stores';
import type { Rule, BusinessLine, RuleStatus } from '../../types';

const { Option } = Select;

const RuleList: React.FC = () => {
  const navigate = useNavigate();
  const { rules, loading, fetchRules, deleteRule, disableRule, copyRule } = useRuleStore();
  const [searchText, setSearchText] = useState('');
  const [businessLineFilter, setBusinessLineFilter] = useState<BusinessLine | undefined>();
  const [statusFilter, setStatusFilter] = useState<RuleStatus | undefined>();

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleCopyRule = async (id: string) => {
    try {
      await copyRule(id);
      message.success('规则复制成功');
    } catch (error) {
      message.error('规则复制失败');
    }
  };

  const handleDeleteRule = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条规则吗？此操作不可撤销。',
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteRule(id);
          message.success('规则删除成功');
        } catch (error) {
          message.error('规则删除失败');
        }
      },
    });
  };

  const handleDisableRule = async (id: string) => {
    try {
      await disableRule(id);
      message.success('规则停用成功');
    } catch (error) {
      message.error('规则停用失败');
    }
  };

  const getActionItems = (record: Rule): MenuProps['items'] => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑',
      onClick: () => navigate(`/rules/${record.id}/edit`),
    },
    {
      key: 'test',
      icon: <PlayCircleOutlined />,
      label: '测试',
      onClick: () => navigate(`/rules/${record.id}/test`),
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: '历史版本',
      onClick: () => navigate(`/rules/${record.id}/history`),
    },
    {
      key: 'copy',
      icon: <CopyOutlined />,
      label: '复制规则',
      onClick: () => handleCopyRule(record.id),
    },
    {
      type: 'divider',
    },
    {
      key: 'disable',
      icon: <StopOutlined />,
      label: '停用规则',
      onClick: () => handleDisableRule(record.id),
      danger: record.status !== 'disabled',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除规则',
      danger: true,
      onClick: () => handleDeleteRule(record.id),
    },
  ];

  const getStatusTag = (status: RuleStatus) => {
    const statusMap: Record<RuleStatus, { color: string; text: string }> = {
      draft: { color: 'default', text: '草稿' },
      pending: { color: 'orange', text: '待审批' },
      published: { color: 'green', text: '已发布' },
      disabled: { color: 'red', text: '已停用' },
      gray: { color: 'blue', text: '灰度中' },
    };
    return <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>;
  };

  const getBusinessLineTag = (businessLine: BusinessLine) => {
    const lineMap: Record<BusinessLine, { color: string; text: string }> = {
      approval: { color: 'blue', text: '审批' },
      risk: { color: 'red', text: '风控' },
      operation: { color: 'green', text: '运营' },
    };
    return <Tag color={lineMap[businessLine].color}>{lineMap[businessLine].text}</Tag>;
  };

  const columns: ColumnsType<Rule> = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Rule) => (
        <Space direction="vertical" size="small">
          <a
            onClick={() => navigate(`/rules/${record.id}/edit`)}
            style={{ fontWeight: 600, fontSize: 'var(--font-size-base)' }}
          >
            {name}
          </a>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {record.id}
          </span>
        </Space>
      ),
    },
    {
      title: '业务线',
      dataIndex: 'businessLine',
      key: 'businessLine',
      render: getBusinessLineTag,
      filters: [
        { text: '审批', value: 'approval' },
        { text: '风控', value: 'risk' },
        { text: '运营', value: 'operation' },
      ],
      onFilter: (value, record) => record.businessLine === value,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
      filters: [
        { text: '草稿', value: 'draft' },
        { text: '待审批', value: 'pending' },
        { text: '已发布', value: 'published' },
        { text: '已停用', value: 'disabled' },
        { text: '灰度中', value: 'gray' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      sorter: (a, b) => a.priority - b.priority,
      render: (priority: number) => (
        <Tag color={priority <= 2 ? 'red' : priority <= 4 ? 'orange' : 'default'}>
          P{priority}
        </Tag>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <Space wrap>
          {tags.slice(0, 3).map(tag => (
            <Tag key={tag}>{tag}</Tag>
          ))}
          {tags.length > 3 && <Tag>+{tags.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      render: (version: number) => <span>v{version}</span>,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Dropdown menu={{ items: getActionItems(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const filteredRules = rules.filter(rule => {
    const matchesSearch = searchText
      ? rule.name.toLowerCase().includes(searchText.toLowerCase()) ||
        rule.id.toLowerCase().includes(searchText.toLowerCase())
      : true;
    const matchesBusinessLine = businessLineFilter ? rule.businessLine === businessLineFilter : true;
    const matchesStatus = statusFilter ? rule.status === statusFilter : true;

    return matchesSearch && matchesBusinessLine && matchesStatus;
  });

  return (
    <MainLayout breadcrumbs={[{ label: '规则列表' }]}>
      <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', margin: 0, fontWeight: 700 }}>
            规则管理
          </h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => navigate('/rules/new')}
            style={{ borderRadius: 'var(--border-radius-md)' }}
          >
            新建规则
          </Button>
        </div>

        <Card
          style={{
            borderRadius: 'var(--border-radius-md)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <Space wrap>
              <Input
                placeholder="搜索规则名称或ID"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
              <Select
                placeholder="业务线"
                value={businessLineFilter}
                onChange={setBusinessLineFilter}
                style={{ width: 150 }}
                allowClear
              >
                <Option value="approval">审批</Option>
                <Option value="risk">风控</Option>
                <Option value="operation">运营</Option>
              </Select>
              <Select
                placeholder="状态"
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 150 }}
                allowClear
              >
                <Option value="draft">草稿</Option>
                <Option value="pending">待审批</Option>
                <Option value="published">已发布</Option>
                <Option value="disabled">已停用</Option>
                <Option value="gray">灰度中</Option>
              </Select>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={filteredRules}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条规则`,
              defaultPageSize: 10,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            onRow={(record) => ({
              style: { cursor: 'pointer' },
              onClick: () => navigate(`/rules/${record.id}/edit`),
            })}
          />
        </Card>
      </div>
    </MainLayout>
  );
};

export default RuleList;
