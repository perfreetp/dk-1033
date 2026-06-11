import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Dashboard from './pages/Dashboard';
import RuleList from './pages/RuleList';
import RuleEditor from './pages/RuleEditor';
import RuleTest from './pages/RuleTest';
import ReleaseHistory from './pages/ReleaseHistory';
import CallLogs from './pages/CallLogs';
import Permission from './pages/Permission';
import ApprovalQueue from './pages/ApprovalQueue';
import './assets/styles/global.css';

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1a365d',
          colorSuccess: '#38a169',
          colorWarning: '#d69e2e',
          colorError: '#e53e3e',
          colorInfo: '#319795',
          borderRadius: 8,
          fontFamily: "'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
      }}
    >
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rules" element={<RuleList />} />
          <Route path="/rules/new" element={<RuleEditor />} />
          <Route path="/rules/:id/edit" element={<RuleEditor />} />
          <Route path="/rules/:id/test" element={<RuleTest />} />
          <Route path="/rules/:id/history" element={<ReleaseHistory />} />
          <Route path="/logs" element={<CallLogs />} />
          <Route path="/permissions" element={<Permission />} />
          <Route path="/approvals" element={<ApprovalQueue />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App;
