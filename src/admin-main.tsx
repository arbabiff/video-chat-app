import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminPanel from '../admin-panel';
import './App.css';
import { isAdmin } from './utils/auth';

function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="bg-black/70 border border-white/10 rounded-2xl p-8 max-w-md text-center">
        <h1 className="text-2xl font-extrabold text-white mb-2">دسترسی غیرمجاز</h1>
        <p className="text-gray-300 mb-6">برای دسترسی به این صفحه باید ادمین باشید.</p>
        <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl">بازگشت به صفحه اصلی</a>
      </div>
    </div>
  );
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

import { AuthProvider } from '@/contexts/AuthContext';

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <AuthProvider>
      {isAdmin() ? <AdminPanel /> : <AccessDenied />}
    </AuthProvider>
  </React.StrictMode>
);
