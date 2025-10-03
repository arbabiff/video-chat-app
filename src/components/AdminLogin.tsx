import React, { useState } from 'react';
import { Phone, Shield, ArrowRight, Check, Loader } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // حالت development - همه شماره‌ها قابل قبول
  const isDevelopment = import.meta.env.DEV;

  // شماره‌های ادمین مجاز (در پروژه واقعی باید از backend دریافت شود)
  const adminPhones = [
    '09123456789', 
    '09121234567', 
    '09133334444',
    '09111111111', // شماره تست
    '09999999999', // شماره تست عمومی
    '09100000000'  // شماره تست ادمین
  ];

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // بررسی فرمت شماره تلفن
    if (!/^09\d{9}$/.test(phoneNumber)) {
      setError('شماره تلفن باید با 09 شروع شده و 11 رقم باشد');
      setLoading(false);
      return;
    }

    // بررسی اینکه آیا شماره در لیست ادمین‌ها است (فقط در production)
    if (!isDevelopment && !adminPhones.includes(phoneNumber)) {
      setError('شماره تلفن وارد شده دسترسی ادمین ندارد');
      setLoading(false);
      return;
    }

    // شبیه‌سازی ارسال کد تایید
    setTimeout(() => {
      setStep('verify');
      setLoading(false);
      // در پروژه واقعی کد به شماره ارسال می‌شود
      console.log(`کد تایید برای ${phoneNumber}: 1234`);
    }, 2000);
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // بررسی کد تایید (در پروژه واقعی باید از backend بررسی شود)
    if (verificationCode !== '1234') {
      setError('کد تایید اشتباه است');
      setLoading(false);
      return;
    }

    // شبیه‌سازی احراز هویت موفق
    setTimeout(() => {
      // ذخیره اطلاعات ادمین در localStorage
      const adminToken = btoa(JSON.stringify({
        phone: phoneNumber,
        role: 'admin',
        loginTime: Date.now()
      }));
      
      localStorage.setItem('admin_token', adminToken);
      localStorage.setItem('admin_authenticated', 'true');
      localStorage.setItem('admin_phone', phoneNumber);
      
      setLoading(false);
      onLoginSuccess();
    }, 1500);
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setVerificationCode('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-500/20 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Shield className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-2">ورود به پنل ادمین</h1>
          <p className="text-gray-300">
            {step === 'phone' 
              ? 'شماره تلفن خود را وارد کنید' 
              : 'کد تایید ارسال شده را وارد کنید'
            }
          </p>
        </div>

        {/* Phone Step */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="09123456789"
                className="w-full bg-gray-800/50 text-white border border-gray-600 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                maxLength={11}
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  ارسال کد تایید
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="text-center space-y-2">
              <p className="text-gray-400 text-sm">
                کد تایید به شماره شما پیامک خواهد شد
              </p>
              {isDevelopment && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 px-3 py-2 rounded-lg text-xs">
                  حالت توسعه: همه شماره‌ها قابل قبول هستند
                </div>
              )}
            </div>
          </form>
        )}

        {/* Verification Step */}
        {step === 'verify' && (
          <form onSubmit={handleVerificationSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-gray-300 text-sm mb-2">
                کد تایید به شماره
              </p>
              <p className="text-white font-semibold text-lg">
                {phoneNumber}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                ارسال شد
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                className="w-full bg-gray-800/50 text-white text-center text-2xl font-bold border border-gray-600 rounded-xl py-4 tracking-widest focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                maxLength={4}
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBackToPhone}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 rounded-xl transition-all"
              >
                بازگشت
              </button>
              <button
                type="submit"
                disabled={loading || verificationCode.length !== 4}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    تایید
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                className="text-blue-400 hover:text-blue-300 text-sm underline transition-colors"
                onClick={() => {
                  // شبیه‌سازی ارسال مجدد کد
                  console.log(`کد تایید دوباره برای ${phoneNumber} ارسال شد`);
                }}
              >
                ارسال مجدد کد
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-gray-500 text-xs">
            فقط ادمین‌های مجاز می‌توانند وارد شوند
          </p>
          {isDevelopment && (
            <div className="bg-blue-500/20 border border-blue-500/50 text-blue-400 px-3 py-2 rounded-lg text-xs">
              <div className="font-semibold mb-1">برای تست:</div>
              <div>شماره: هر شماره معتبر | کد: 1234</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;