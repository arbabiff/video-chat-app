import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminPanel from './components/AdminPanel';
import './App.css';

// برای تست - مستقیماً AdminPanel را نمایش می‌دهیم
const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <AdminPanel />
  </React.StrictMode>
);
