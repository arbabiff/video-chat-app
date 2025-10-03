import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RandomVideoChatApp from '../random-video-chat-app';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import './App.css';
import { isAdmin, logout } from './utils/auth';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const [showLogin, setShowLogin] = React.useState(false);
  
  // بررسی احراز هویت ادمین
  if (isAdmin()) {
    return <>{children}</>;
  }
  
  // نمایش صفحه ورود ادمین
  if (showLogin) {
    return (
      <AdminLogin 
        onLoginSuccess={() => {
          setShowLogin(false);
          window.location.reload(); // رفرش صفحه برای بارگذاری مجدد AdminPanel
        }} 
      />
    );
  }
  
  // نمایش صفحه دسترسی غیرمجاز با دکمه ورود ادمین
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="bg-black/70 border border-white/10 rounded-2xl p-8 max-w-md text-center">
        <h1 className="text-2xl font-extrabold text-white mb-2">دسترسی غیرمجاز</h1>
        <p className="text-gray-300 mb-6">برای دسترسی به این صفحه باید ادمین باشید.</p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => setShowLogin(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors"
          >
            ورود ادمین
          </button>
          <a 
            href="/" 
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl transition-colors"
          >
            بازگشت به صفحه اصلی
          </a>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RandomVideoChatApp />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
