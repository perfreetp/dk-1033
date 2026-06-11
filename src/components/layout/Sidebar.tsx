import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Badge } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useRuleStore } from '../../stores';
import { useEffect } from 'react';

const { Sider } = Layout;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rules, fetchRules } = useRuleStore();

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const pendingCount = rules.filter(r => r.status === 'pending').length;

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/rules',
      icon: <FileTextOutlined />,
      label: '规则列表',
    },
    {
      key: '/approvals',
      icon: <CheckCircleOutlined />,
      label: (
        <span>
          审批队列
          {pendingCount > 0 && (
            <Badge count={pendingCount} size="small" offset={[10, 0]} />
          )}
        </span>
      ),
    },
    {
      key: '/logs',
      icon: <BarChartOutlined />,
      label: '调用日志',
    },
    {
      key: '/permissions',
      icon: <SafetyOutlined />,
      label: '权限管理',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  return (
    <Sider
      width={240}
      style={{
        background: 'var(--color-primary)',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h1 style={{ color: 'white', fontSize: 'var(--font-size-xl)', margin: 0, fontWeight: 700 }}>
          规则引擎中心
        </h1>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          background: 'transparent',
          borderRight: 0,
          marginTop: 'var(--spacing-md)',
        }}
      />
    </Sider>
  );
};

export default Sidebar;
