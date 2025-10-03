import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminLogin from './components/AdminLogin';
import './App.css';

const AdminLoginApp = () => {
  const handleLoginSuccess = () => {
    // هدایت به پنل ادمین پس از ورود موفق
    window.location.href = '/admin.html';
  };

  return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
};

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <AdminLoginApp />
  </React.StrictMode>
);