import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import { isAdmin } from './utils/auth';
import './index.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // بررسی وضعیت احراز هویت
    const checkAuth = () => {
      const authenticated = isAdmin();
      setIsAuthenticated(authenticated);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">در حال بارگذاری...</div>
      </div>
    );
  }

  return isAuthenticated ? (
    <AdminPanel />
  ) : (
    <AdminLogin onLoginSuccess={handleLoginSuccess} />
  );
};

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

