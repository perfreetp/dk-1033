import React from 'react';
import { Layout, Breadcrumb, Dropdown, Avatar, Space } from 'antd';
import type { MenuProps } from 'antd';
import { UserOutlined, BellOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  breadcrumbs?: Array<{ label: string; path?: string }>;
}

const Header: React.FC<HeaderProps> = ({ breadcrumbs }) => {
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  return (
    <AntHeader
      style={{
        background: 'white',
        padding: '0 var(--spacing-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 64,
      }}
    >
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb
            items={breadcrumbs.map(item => ({
              title: item.path ? (
                <a href={item.path}>{item.label}</a>
              ) : (
                item.label
              ),
            }))}
          />
        )}
      </div>

      <Space size="middle">
        <BellOutlined style={{ fontSize: 'var(--font-size-lg)', cursor: 'pointer' }} />

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar
              style={{ backgroundColor: 'var(--color-secondary)' }}
              icon={<UserOutlined />}
            />
            <span style={{ fontWeight: 500 }}>系统管理员</span>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
