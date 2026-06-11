import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { MainLayout } from '../../components/layout';
import { useUserStore } from '../../stores';
import type { User, UserRole, BusinessLine } from '../../types';

const { Option } = Select;

const Permission: React.FC = () => {
  const { users, loading, fetchUsers, createUser, updateUser, deleteUser } = useUserStore();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      form.setFieldsValue({
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        businessLines: user.businessLines,
        status: user.status,
      });
    } else {
      setEditingUser(null);
      form.resetFields();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingUser) {
        await updateUser(editingUser.id, values);
        message.success('用户更新成功');
      } else {
        await createUser({
          ...values,
          username: values.username,
          name: values.name,
          email: values.email,
          role: values.role,
          businessLines: values.businessLines,
          status: 'active',
        });
        message.success('用户创建成功');
      }

      handleCloseModal();
      fetchUsers();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      message.success('用户删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const getRoleTag = (role: UserRole) => {
    const roleMap: Record<UserRole, { color: string; text: string }> = {
      super_admin: { color: 'red', text: '超级管理员' },
      admin: { color: 'orange', text: '管理员' },
      editor: { color: 'blue', text: '规则编辑者' },
      reviewer: { color: 'purple', text: '规则审核者' },
      operator: { color: 'green', text: '运营人员' },
    };
    return <Tag color={roleMap[role].color}>{roleMap[role].text}</Tag>;
  };

  const getStatusTag = (status: string) => {
    return status === 'active' ? (
      <Tag color="green">启用</Tag>
    ) : (
      <Tag color="red">停用</Tag>
    );
  };

  const getBusinessLineTags = (lines: BusinessLine[]) => {
    const lineMap: Record<BusinessLine, string> = {
      approval: '审批',
      risk: '风控',
      operation: '运营',
    };
    return lines.map(line => (
      <Tag key={line}>{lineMap[line]}</Tag>
    ));
  };

  const columns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (username: string) => (
        <Space>
          <UserOutlined />
          <span style={{ fontWeight: 600 }}>{username}</span>
        </Space>
      ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: getRoleTag,
      filters: [
        { text: '超级管理员', value: 'super_admin' },
        { text: '管理员', value: 'admin' },
        { text: '规则编辑者', value: 'editor' },
        { text: '规则审核者', value: 'reviewer' },
        { text: '运营人员', value: 'operator' },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: '业务线',
      dataIndex: 'businessLines',
      key: 'businessLines',
      render: getBusinessLineTags,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
      filters: [
        { text: '启用', value: 'active' },
        { text: '停用', value: 'inactive' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      sorter: (a, b) => new Date(a.lastLogin).getTime() - new Date(b.lastLogin).getTime(),
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          />
          <Popconfirm
            title="确认删除"
            description="确定要删除这个用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <MainLayout breadcrumbs={[{ label: '权限管理' }]}>
      <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', margin: 0, fontWeight: 700 }}>
            用户权限管理
          </h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            添加用户
          </Button>
        </div>

        <Card
          style={{
            borderRadius: 'var(--border-radius-md)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个用户`,
              defaultPageSize: 10,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        </Card>
      </div>

      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={showModal}
        onCancel={handleCloseModal}
        onOk={handleSubmit}
        okText={editingUser ? '更新' : '创建'}
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 'var(--spacing-lg)' }}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="super_admin">超级管理员</Option>
              <Option value="admin">管理员</Option>
              <Option value="editor">规则编辑者</Option>
              <Option value="reviewer">规则审核者</Option>
              <Option value="operator">运营人员</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="业务线"
            name="businessLines"
            rules={[{ required: true, message: '请选择业务线' }]}
          >
            <Select mode="multiple" placeholder="请选择业务线">
              <Option value="approval">审批</Option>
              <Option value="risk">风控</Option>
              <Option value="operation">运营</Option>
            </Select>
          </Form.Item>

          {editingUser && (
            <Form.Item
              label="状态"
              name="status"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                <Option value="active">启用</Option>
                <Option value="inactive">停用</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </MainLayout>
  );
};

export default Permission;
