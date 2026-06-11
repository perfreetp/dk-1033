import React from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import Header from './Header';

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: Array<{ label: string; path?: string }>;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, breadcrumbs }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout style={{ marginLeft: 240 }}>
        <Header breadcrumbs={breadcrumbs} />
        <Content
          style={{
            padding: 'var(--spacing-lg)',
            background: 'var(--color-bg)',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
