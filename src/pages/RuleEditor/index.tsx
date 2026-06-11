import React, { useEffect, useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  InputNumber,
  DatePicker,
  Switch,
  message,
  Row,
  Col,
} from 'antd';
import {
  SaveOutlined,
  PlayCircleOutlined,
  SendOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { MainLayout } from '../../components/layout';
import { useRuleStore } from '../../stores';
import type { Condition, Action } from '../../types';

const { Option } = Select;
const { TextArea } = Input;

const RuleEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id && id !== 'new';
  const { currentRule, fetchRuleById, createRule, updateRule, loading } = useRuleStore();
  const [form] = Form.useForm();
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [isPermanent, setIsPermanent] = useState(true);

  useEffect(() => {
    if (isEdit) {
      fetchRuleById(id);
    }
  }, [isEdit, id, fetchRuleById]);

  useEffect(() => {
    if (currentRule && isEdit) {
      const permanent = currentRule.effectiveTime.permanent;
      setIsPermanent(permanent);

      form.setFieldsValue({
        name: currentRule.name,
        description: currentRule.description,
        businessLine: currentRule.businessLine,
        priority: currentRule.priority,
        tags: currentRule.tags,
        permanent: permanent,
        startTime: currentRule.effectiveTime.startTime ? dayjs(currentRule.effectiveTime.startTime) : null,
        endTime: currentRule.effectiveTime.endTime ? dayjs(currentRule.effectiveTime.endTime) : null,
        scenarios: currentRule.scope.scenarios,
        regions: currentRule.scope.regions,
      });
      setConditions(currentRule.conditions);
      setActions(currentRule.actions);
    }
  }, [currentRule, isEdit, form]);

  const handleAddCondition = () => {
    const newCondition: Condition = {
      id: `cond-${Date.now()}`,
      field: '',
      operator: 'eq',
      value: '',
    };
    setConditions([...conditions, newCondition]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleConditionChange = (index: number, field: keyof Condition, value: any) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  const handleAddAction = () => {
    const newAction: Action = {
      id: `action-${Date.now()}`,
      type: 'notify',
      params: {},
      order: actions.length + 1,
    };
    setActions([...actions, newAction]);
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleActionChange = (index: number, field: keyof Action, value: any) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], [field]: value };
    setActions(updated);
  };

  const handlePermanentChange = (checked: boolean) => {
    setIsPermanent(checked);
    form.setFieldsValue({
      permanent: checked,
    });
  };

  const handleSave = async (status: 'draft' | 'pending' = 'draft') => {
    try {
      const values = await form.validateFields();
      const ruleData = {
        name: values.name,
        description: values.description,
        businessLine: values.businessLine,
        status,
        priority: values.priority,
        tags: values.tags || [],
        conditions,
        actions,
        effectiveTime: {
          startTime: values.startTime ? values.startTime.format('YYYY-MM-DDTHH:mm:ss[Z]') : null,
          endTime: values.endTime ? values.endTime.format('YYYY-MM-DDTHH:mm:ss[Z]') : null,
          permanent: values.permanent,
        },
        scope: {
          scenarios: values.scenarios || [],
          regions: values.regions || [],
        },
        createdBy: 'current-user',
        updatedBy: 'current-user',
      };

      if (isEdit) {
        await updateRule(id, ruleData);
        message.success('规则保存成功');
      } else {
        const newRule = await createRule(ruleData);
        message.success('规则创建成功');
        navigate(`/rules/${newRule.id}/edit`);
      }
    } catch (error) {
      message.error('保存失败，请检查表单');
    }
  };

  return (
    <MainLayout
      breadcrumbs={[
        { label: '规则列表', path: '/rules' },
        { label: isEdit ? '编辑规则' : '新建规则' },
      ]}
    >
      <div style={{ animation: 'fadeIn 0.3s ease-out', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', margin: 0, fontWeight: 700 }}>
            {isEdit ? '编辑规则' : '新建规则'}
          </h1>
          <Space>
            <Button
              icon={<SaveOutlined />}
              onClick={() => handleSave('draft')}
              loading={loading}
            >
              保存草稿
            </Button>
            <Button
              icon={<PlayCircleOutlined />}
              onClick={() => navigate(`/rules/${id || 'new'}/test`)}
            >
              测试规则
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleSave('pending')}
              loading={loading}
            >
              提交审批
            </Button>
          </Space>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            priority: 5,
            permanent: true,
          }}
        >
          <Row gutter={24}>
            <Col span={16}>
              <Card
                title="基本信息"
                style={{
                  borderRadius: 'var(--border-radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  marginBottom: 'var(--spacing-lg)',
                }}
              >
                <Form.Item
                  label="规则名称"
                  name="name"
                  rules={[{ required: true, message: '请输入规则名称' }]}
                >
                  <Input placeholder="请输入规则名称" size="large" />
                </Form.Item>

                <Form.Item
                  label="规则描述"
                  name="description"
                >
                  <TextArea
                    rows={3}
                    placeholder="请输入规则描述"
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="业务线"
                      name="businessLine"
                      rules={[{ required: true, message: '请选择业务线' }]}
                    >
                      <Select size="large" placeholder="请选择业务线">
                        <Option value="approval">审批</Option>
                        <Option value="risk">风控</Option>
                        <Option value="operation">运营</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="优先级"
                      name="priority"
                      rules={[{ required: true, message: '请输入优先级' }]}
                    >
                      <InputNumber
                        min={1}
                        max={100}
                        size="large"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="标签"
                  name="tags"
                >
                  <Select
                    mode="tags"
                    placeholder="输入标签后按回车添加"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Card>

              <Card
                title="条件配置"
                extra={
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={handleAddCondition}
                  >
                    添加条件
                  </Button>
                }
                style={{
                  borderRadius: 'var(--border-radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  marginBottom: 'var(--spacing-lg)',
                }}
              >
                {conditions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-secondary)' }}>
                    暂无条件，点击"添加条件"开始配置
                  </div>
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {conditions.map((condition, index) => (
                      <div key={condition.id}>
                        {index > 0 && (
                          <Form.Item label="逻辑运算符" style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <Select
                              value={condition.logicalOperator}
                              onChange={(value) => handleConditionChange(index, 'logicalOperator', value)}
                              style={{ width: 120 }}
                            >
                              <Option value="AND">且 (AND)</Option>
                              <Option value="OR">或 (OR)</Option>
                            </Select>
                          </Form.Item>
                        )}
                        <Space.Compact style={{ width: '100%' }}>
                          <Form.Item label="字段" style={{ flex: 1, marginBottom: 0 }}>
                            <Input
                              placeholder="字段路径，如 user.riskLevel"
                              value={condition.field}
                              onChange={(e) => handleConditionChange(index, 'field', e.target.value)}
                            />
                          </Form.Item>
                          <Form.Item label="运算符" style={{ width: 150, marginBottom: 0 }}>
                            <Select
                              value={condition.operator}
                              onChange={(value) => handleConditionChange(index, 'operator', value)}
                            >
                              <Option value="eq">等于</Option>
                              <Option value="ne">不等于</Option>
                              <Option value="gt">大于</Option>
                              <Option value="lt">小于</Option>
                              <Option value="gte">大于等于</Option>
                              <Option value="lte">小于等于</Option>
                              <Option value="contains">包含</Option>
                              <Option value="in">在列表中</Option>
                              <Option value="between">区间</Option>
                            </Select>
                          </Form.Item>
                          <Form.Item label="值" style={{ flex: 1, marginBottom: 0 }}>
                            <Input
                              placeholder="值"
                              value={condition.value}
                              onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                            />
                          </Form.Item>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveCondition(index)}
                          />
                        </Space.Compact>
                      </div>
                    ))}
                  </Space>
                )}
              </Card>

              <Card
                title="动作配置"
                extra={
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={handleAddAction}
                  >
                    添加动作
                  </Button>
                }
                style={{
                  borderRadius: 'var(--border-radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  marginBottom: 'var(--spacing-lg)',
                }}
              >
                {actions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-secondary)' }}>
                    暂无动作，点击"添加动作"开始配置
                  </div>
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {actions.map((action, index) => (
                      <Card
                        key={action.id}
                        size="small"
                        title={`动作 ${index + 1}`}
                        extra={
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveAction(index)}
                          />
                        }
                      >
                        <Space.Compact style={{ width: '100%' }}>
                          <Form.Item label="动作类型" style={{ flex: 1, marginBottom: 0 }}>
                            <Select
                              value={action.type}
                              onChange={(value) => handleActionChange(index, 'type', value)}
                            >
                              <Option value="approve">审批通过</Option>
                              <Option value="reject">审批拒绝</Option>
                              <Option value="notify">发送通知</Option>
                              <Option value="score">评分</Option>
                              <Option value="tag">打标签</Option>
                              <Option value="route">路由</Option>
                            </Select>
                          </Form.Item>
                          <Form.Item label="参数" style={{ flex: 2, marginBottom: 0 }}>
                            <TextArea
                              placeholder='JSON格式，如 {"key": "value"}'
                              rows={1}
                              value={JSON.stringify(action.params)}
                              onChange={(e) => {
                                try {
                                  const params = JSON.parse(e.target.value);
                                  handleActionChange(index, 'params', params);
                                } catch {}
                              }}
                            />
                          </Form.Item>
                        </Space.Compact>
                      </Card>
                    ))}
                  </Space>
                )}
              </Card>
            </Col>

            <Col span={8}>
              <Card
                title="生效时间"
                style={{
                  borderRadius: 'var(--border-radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  marginBottom: 'var(--spacing-lg)',
                }}
              >
                <Form.Item
                  label="永久有效"
                  name="permanent"
                  valuePropName="checked"
                >
                  <Switch
                    checked={isPermanent}
                    onChange={handlePermanentChange}
                  />
                </Form.Item>

                {!isPermanent && (
                  <>
                    <Form.Item
                      label="开始时间"
                      name="startTime"
                    >
                      <DatePicker
                        showTime
                        format="YYYY-MM-DD HH:mm:ss"
                        style={{ width: '100%' }}
                        placeholder="选择开始时间"
                      />
                    </Form.Item>

                    <Form.Item
                      label="结束时间"
                      name="endTime"
                    >
                      <DatePicker
                        showTime
                        format="YYYY-MM-DD HH:mm:ss"
                        style={{ width: '100%' }}
                        placeholder="选择结束时间"
                      />
                    </Form.Item>
                  </>
                )}
              </Card>

              <Card
                title="适用范围"
                style={{
                  borderRadius: 'var(--border-radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  marginBottom: 'var(--spacing-lg)',
                }}
              >
                <Form.Item
                  label="适用场景"
                  name="scenarios"
                >
                  <Select
                    mode="multiple"
                    placeholder="选择适用场景"
                    style={{ width: '100%' }}
                  >
                    <Option value="loan">贷款</Option>
                    <Option value="credit">信用卡</Option>
                    <Option value="investment">投资</Option>
                    <Option value="transfer">转账</Option>
                    <Option value="payment">支付</Option>
                    <Option value="retail">零售</Option>
                    <Option value="ecomm">电商</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="适用地区"
                  name="regions"
                >
                  <Select
                    mode="multiple"
                    placeholder="选择适用地区"
                    style={{ width: '100%' }}
                  >
                    <Option value="全国">全国</Option>
                    <Option value="华东">华东</Option>
                    <Option value="华北">华北</Option>
                    <Option value="华南">华南</Option>
                    <Option value="西南">西南</Option>
                    <Option value="西北">西北</Option>
                    <Option value="东北">东北</Option>
                  </Select>
                </Form.Item>
              </Card>

              <Card
                title="规则预览"
                style={{
                  borderRadius: 'var(--border-radius-md)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <pre
                  style={{
                    background: 'var(--color-bg)',
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--border-radius-sm)',
                    fontSize: 'var(--font-size-xs)',
                    overflow: 'auto',
                    maxHeight: 400,
                  }}
                >
                  {JSON.stringify(
                    {
                      conditions,
                      actions,
                    },
                    null,
                    2
                  )}
                </pre>
              </Card>
            </Col>
          </Row>
        </Form>
      </div>
    </MainLayout>
  );
};

export default RuleEditor;
