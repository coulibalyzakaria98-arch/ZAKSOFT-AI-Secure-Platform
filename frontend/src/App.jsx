import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import Assistant from './pages/Assistant';
import Training from './pages/Training';
import DevAssistant from './pages/DevAssistant';
import Reports from './pages/Reports';

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { isAuth } = useAuth();

  if (!isAuth) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-bg1">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setCollapsed(c => !c)} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/scanner"    element={<Scanner />} />
            <Route path="/assistant"  element={<Assistant />} />
            <Route path="/training"   element={<Training />} />
            <Route path="/dev"        element={<DevAssistant />} />
            <Route path="/reports"    element={<Reports />} />
            <Route path="*"           element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*"     element={<AppLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
