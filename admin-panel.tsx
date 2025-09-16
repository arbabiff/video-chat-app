import React, { useState, useEffect } from 'react';
import { Users, Settings, BarChart3, Shield, MessageCircle, Gift, DollarSign, Image, Upload, Save, Edit3, Trash2, Eye, EyeOff, Plus, X, Check, AlertTriangle, Phone, Clock, Ban, UserX, FileText, Zap } from 'lucide-react';

const AdminPanel = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [subscriptions, setSubscriptions] = useState([
    { id: 1, name: 'یک ماهه', price: 150000, duration: 30, description: 'اشتراک یک ماهه', features: ['تصویر HD', 'قفل ۱۰ ثانیه', 'بدون محدودیت'], active: true },
    { id: 2, name: 'شش ماهه', price: 630000, duration: 180, description: 'اشتراک شش ماهه', features: ['تمام مزایا', '۳۰٪ تخفیف', 'پشتیبانی ویژه'], active: true },
    { id: 3, name: 'سالانه', price: 900000, duration: 365, description: 'اشتراک سالانه', features: ['تمام مزایا', '۵۰٪ تخفیف', 'قفل نامحدود'], active: true }
  ]);
  
  const [messages, setMessages] = useState([
    { id: 1, type: 'violation', text: 'گزارش تخلف دریافت شد', active: true },
    { id: 2, type: 'welcome', text: 'به اپلیکیشن چت تصویری خوش آمدید!', active: true },
    { id: 3, type: 'subscription', text: 'اشتراک شما تمدید شد', active: true }
  ]);

  const [rules, setRules] = useState([
    { id: 1, title: 'محتوای نامناسب', punishment: 'محدودیت ۲۴ ساعته', violationCount: 3 },
    { id: 2, title: 'زبان نامناسب', punishment: 'محدودیت ۴۸ ساعته', violationCount: 2 },
    { id: 3, title: 'رفتار غیراخلاقی', punishment: 'محدودیت دائم', violationCount: 1 }
  ]);

  const [features, setFeatures] = useState({
    inviteReward: true,
    inviteRewardCount: 5,
    lockPrice: 50000,
    lockCount: 3,
    videoQuality: 'HD',
    showPurchaseSection: true
  });

  const [stats, setStats] = useState({
    totalUsers: 1250,
    activeUsers: 890,
    totalSubscriptions: 340,
    totalRevenue: 51000000,
    onlineUsers: 145,
    dailyChats: 2300
  });

  const [users, setUsers] = useState([
    { id: 1, phone: '09121234567', status: 'active', subscription: 'یک ماهه', joinDate: '1402/08/15', violations: 0 },
    { id: 2, phone: '09129876543', status: 'banned', subscription: 'رایگان', joinDate: '1402/08/10', violations: 3 },
    { id: 3, phone: '09135554444', status: 'active', subscription: 'سالانه', joinDate: '1402/07/20', violations: 1 }
  ]);

  const [reports, setReports] = useState([
    { id: 1, reporter: '09121234567', reported: '09129876543', reason: 'محتوای نامناسب', date: '1402/08/20', status: 'pending' },
    { id: 2, reporter: '09135554444', reported: '09121111111', reason: 'زبان نامناسب', date: '1402/08/19', status: 'resolved' }
  ]);

  const [logo, setLogo] = useState('');
  const [watermark, setWatermark] = useState('');
  const [paymentLink, setPaymentLink] = useState('');

  const [newSubscription, setNewSubscription] = useState<{ id?: number; name: string; price: string; duration: string; description: string; features: string[]}>({
    name: '',
    price: '',
    duration: '',
    description: '',
    features: []
  });

  const [newMessage, setNewMessage] = useState({
    type: 'general',
    text: ''
  });

  const [newRule, setNewRule] = useState({
    title: '',
    punishment: '',
    violationCount: 1
  });

  const [editingItem, setEditingItem] = useState<null | 'newSubscription' | 'editSubscription' | 'newMessage' | 'newRule'>(null);

  // Dashboard Section
  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">داشبورد مدیریت</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">کل کاربران</h3>
              <p className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <Users className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">کاربران آنلاین</h3>
              <p className="text-3xl font-bold">{stats.onlineUsers}</p>
            </div>
            <Zap className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">اشتراک‌های فعال</h3>
              <p className="text-3xl font-bold">{stats.totalSubscriptions}</p>
            </div>
            <Gift className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">درآمد کل (تومان)</h3>
              <p className="text-3xl font-bold">{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">چت‌های امروز</h3>
              <p className="text-3xl font-bold">{stats.dailyChats}</p>
            </div>
            <MessageCircle className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">کاربران فعال</h3>
              <p className="text-3xl font-bold">{stats.activeUsers}</p>
            </div>
            <BarChart3 className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">فعالیت‌های اخیر</h3>
        <div className="space-y-3">
          {reports.slice(0, 5).map(report => (
            <div key={report.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
              <div>
                <p className="text-white">گزارش جدید: {report.reason}</p>
                <p className="text-gray-400 text-sm">{report.date}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs ${
                report.status === 'pending' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'
              }`}>
                {report.status === 'pending' ? 'در انتظار' : 'حل شده'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Subscription Management
  const renderSubscriptions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">مدیریت اشتراک‌ها</h2>
        <button 
          onClick={() => setEditingItem('newSubscription')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          اشتراک جدید
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subscriptions.map(sub => (
          <div key={sub.id} className="bg-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">{sub.name}</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setNewSubscription({
                      ...sub,
                      price: String(sub.price),
                      duration: String(sub.duration)
                    });
                    setEditingItem('editSubscription');
                  }}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setSubscriptions(subscriptions.map(s => 
                    s.id === sub.id ? {...s, active: !s.active} : s
                  ))}
                  className={sub.active ? "text-green-400" : "text-gray-400"}
                >
                  {sub.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <p className="text-gray-300">قیمت: {sub.price.toLocaleString()} تومان</p>
              <p className="text-gray-300">مدت: {sub.duration} روز</p>
              <p className="text-gray-300">{sub.description}</p>
            </div>

            <div className="space-y-1">
              <p className="text-white font-semibold">ویژگی‌ها:</p>
              {sub.features.map((feature, idx) => (
                <p key={idx} className="text-gray-400 text-sm">• {feature}</p>
              ))}
            </div>

            <div className={`mt-4 px-3 py-1 rounded-full text-xs w-fit ${
              sub.active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
            }`}>
              {sub.active ? 'فعال' : 'غیرفعال'}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Subscription Modal */}
      {editingItem === 'newSubscription' || editingItem === 'editSubscription' ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {editingItem === 'newSubscription' ? 'اشتراک جدید' : 'ویرایش اشتراک'}
              </h3>
              <button onClick={() => setEditingItem(null)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="نام اشتراک"
                value={newSubscription.name}
                onChange={(e) => setNewSubscription({...newSubscription, name: e.target.value})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
              />
              <input
                type="number"
                placeholder="قیمت (تومان)"
                value={newSubscription.price}
                onChange={(e) => setNewSubscription({...newSubscription, price: e.target.value})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
              />
              <input
                type="number"
                placeholder="مدت (روز)"
                value={newSubscription.duration}
                onChange={(e) => setNewSubscription({...newSubscription, duration: e.target.value})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
              />
              <textarea
                placeholder="توضیحات"
                value={newSubscription.description}
                onChange={(e) => setNewSubscription({...newSubscription, description: e.target.value})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
                rows={3}
              />
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (editingItem === 'newSubscription') {
                      setSubscriptions([
                        ...subscriptions,
                        {
                          id: Date.now(),
                          name: newSubscription.name,
                          price: parseInt(newSubscription.price),
                          duration: parseInt(newSubscription.duration),
                          description: newSubscription.description,
                          features: ['تصویر HD', 'پشتیبانی'],
                          active: true
                        }
                      ]);
                    } else {
                      setSubscriptions(
                        subscriptions.map(s =>
                          s.id === newSubscription.id
                            ? {
                                ...s,
                                name: newSubscription.name,
                                price: parseInt(newSubscription.price),
                                duration: parseInt(newSubscription.duration),
                                description: newSubscription.description
                              }
                            : s
                        )
                      );
                    }
                    setNewSubscription({ name: '', price: '', duration: '', description: '', features: [] });
                    setEditingItem(null);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  ذخیره
                </button>
                <button
                  onClick={() => setEditingItem(null)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  // Messages Management
  const renderMessages = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">مدیریت پیام‌ها</h2>
        <button 
          onClick={() => setEditingItem('newMessage')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          پیام جدید
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">پیام‌های پیش‌فرض</h3>
        <div className="space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg">
              <div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    msg.type === 'violation' ? 'bg-red-500' :
                    msg.type === 'welcome' ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    {msg.type === 'violation' ? 'تخلف' : 
                     msg.type === 'welcome' ? 'خوشامد' : 'عمومی'}
                  </span>
                  <span className={`${msg.active ? 'text-green-400' : 'text-gray-400'}`}>
                    {msg.active ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>
                <p className="text-white mt-2">{msg.text}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setMessages(messages.map(m => 
                    m.id === msg.id ? {...m, active: !m.active} : m
                  ))}
                  className={msg.active ? "text-green-400" : "text-gray-400"}
                >
                  {msg.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button className="text-blue-400">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button className="text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">ارسال پیام همگانی</h3>
        <div className="space-y-4">
          <select className="w-full bg-gray-700 text-white p-3 rounded-lg">
            <option>همه کاربران</option>
            <option>کاربران دارای اشتراک</option>
            <option>کاربران رایگان</option>
          </select>
          <textarea
            placeholder="متن پیام..."
            className="w-full bg-gray-700 text-white p-3 rounded-lg"
            rows={4}
          />
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg">
            ارسال پیام
          </button>
        </div>
      </div>
    </div>
  );

  // Rules Management
  const renderRules = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">مدیریت قوانین</h2>
        <button 
          onClick={() => setEditingItem('newRule')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          قانون جدید
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">عناوین تخلف و مجازات‌ها</h3>
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-white font-semibold">{rule.title}</h4>
                  <p className="text-gray-300">مجازات: {rule.punishment}</p>
                  <p className="text-gray-400 text-sm">حداکثر تخلف: {rule.violationCount} بار</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-400">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button className="text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">متن قوانین عمومی</h3>
              <textarea
            defaultValue="احترام به سایر کاربران الزامی است. استفاده از زبان نامناسب و ارسال محتوای غیراخلاقی ممنوع می‌باشد."
            className="w-full bg-gray-700 text-white p-3 rounded-lg"
            rows={6}
          />
        <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg">
          ذخیره قوانین
        </button>
      </div>
    </div>
  );

  // Features Management
  const renderFeatures = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">مدیریت ویژگی‌ها</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">جایزه معرفی دوستان</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={features.inviteReward}
                onChange={(e) => setFeatures({...features, inviteReward: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-white">فعال بودن جایزه معرفی</span>
            </label>
            <div>
              <label className="block text-gray-300 mb-2">تعداد دعوت برای یک ماه اشتراک:</label>
              <input
                type="number"
                value={features.inviteRewardCount}
                onChange={(e) => setFeatures({...features, inviteRewardCount: parseInt(e.target.value)})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">تنظیمات قفل</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">قیمت هر قفل (تومان):</label>
              <input
                type="number"
                value={features.lockPrice}
                onChange={(e) => setFeatures({...features, lockPrice: parseInt(e.target.value)})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">تعداد قفل پیش‌فرض:</label>
              <input
                type="number"
                value={features.lockCount}
                onChange={(e) => setFeatures({...features, lockCount: parseInt(e.target.value)})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">تنظیمات تصویر</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">کیفیت تصویر عمومی:</label>
              <select
                value={features.videoQuality}
                onChange={(e) => setFeatures({...features, videoQuality: e.target.value})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
              >
                <option value="SD">SD (480p)</option>
                <option value="HD">HD (720p)</option>
                <option value="FHD">Full HD (1080p)</option>
              </select>
            </div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={features.showPurchaseSection}
                onChange={(e) => setFeatures({...features, showPurchaseSection: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-white">نمایش بخش خرید اشتراک</span>
            </label>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">تنظیمات</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">لینک درگاه پرداخت:</label>
              <input
                type="text"
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
                placeholder="https://payment.example.com"
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2">آپلود لوگو:</label>
                <div className="bg-gray-700 p-8 rounded-lg border-2 border-dashed border-gray-600 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">کلیک کنید</p>
                </div>
              </div>
              <div>
                <label className="block text-gray-300 mb-2">آپلود واترمارک:</label>
                <div className="bg-gray-700 p-8 rounded-lg border-2 border-dashed border-gray-600 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">کلیک کنید</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button className="bg-green-600 text-white px-8 py-3 rounded-lg flex items-center gap-2">
        <Save className="w-5 h-5" />
        ذخیره تنظیمات
      </button>
    </div>
  );

  // Users Management
  const renderUsers = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">مدیریت کاربران</h2>

      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">لیست کاربران</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="جستجو شماره تلفن..."
              className="bg-gray-700 text-white p-2 rounded-lg"
            />
            <select className="bg-gray-700 text-white p-2 rounded-lg">
              <option>همه کاربران</option>
              <option>فعال</option>
              <option>مسدود شده</option>
              <option>دارای اشتراک</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-right text-gray-300 p-3">شماره تلفن</th>
                <th className="text-right text-gray-300 p-3">وضعیت</th>
                <th className="text-right text-gray-300 p-3">اشتراک</th>
                <th className="text-right text-gray-300 p-3">تاریخ عضویت</th>
                <th className="text-right text-gray-300 p-3">تخلفات</th>
                <th className="text-right text-gray-300 p-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-gray-700">
                  <td className="text-white p-3">{user.phone}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {user.status === 'active' ? 'فعال' : 'مسدود'}
                    </span>
                  </td>
                  <td className="text-gray-300 p-3">{user.subscription}</td>
                  <td className="text-gray-300 p-3">{user.joinDate}</td>
                  <td className="text-gray-300 p-3">{user.violations}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setUsers(users.map(u => 
                          u.id === user.id ? {...u, status: u.status === 'active' ? 'banned' : 'active'} : u
                        ))}
                        className={`p-1 rounded ${user.status === 'active' ? 'text-red-400' : 'text-green-400'}`}
                      >
                        {user.status === 'active' ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button className="text-blue-400 p-1">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Reports Management
  const renderReports = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">مدیریت گزارشات</h2>

      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">گزارشات اخیر</h3>
        <div className="space-y-3">
          {reports.map(report => (
            <div key={report.id} className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white">گزارش‌دهنده: {report.reporter}</p>
                  <p className="text-gray-300">گزارش‌شده: {report.reported}</p>
                  <p className="text-gray-300">دلیل: {report.reason}</p>
                  <p className="text-gray-400 text-sm">{report.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    report.status === 'pending' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'
                  }`}>
                    {report.status === 'pending' ? 'در انتظار' : 'حل شده'}
                  </span>
                  <div className="flex gap-1">
                    <button className="bg-green-600 text-white px-3 py-1 rounded text-xs">
                      تأیید
                    </button>
                    <button className="bg-red-600 text-white px-3 py-1 rounded text-xs">
                      رد
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Server Management
  const renderServer = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">مدیریت سرور</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-2">استفاده CPU</h3>
          <div className="text-3xl font-bold text-blue-400">45%</div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{width: '45%'}}></div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-2">استفاده RAM</h3>
          <div className="text-3xl font-bold text-green-400">68%</div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div className="bg-green-500 h-2 rounded-full" style={{width: '68%'}}></div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-2">فضای دیسک</h3>
          <div className="text-3xl font-bold text-yellow-400">32%</div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div className="bg-yellow-500 h-2 rounded-full" style={{width: '32%'}}></div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-2">ترافیک شبکه</h3>
          <div className="text-3xl font-bold text-purple-400">156MB/s</div>
          <div className="text-gray-400 text-sm mt-1">آپلود: 45MB/s</div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">وضعیت سرویس‌ها</h3>
        <div className="space-y-3">
          {[
            { name: 'سرور وب', status: 'online' },
            { name: 'پایگاه داده', status: 'online' },
            { name: 'سرور چت', status: 'online' },
            { name: 'درگاه پرداخت', status: 'warning' },
            { name: 'سرور فایل', status: 'online' }
          ].map((service, idx) => (
            <div key={idx} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
              <span className="text-white">{service.name}</span>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                service.status === 'online' ? 'bg-green-500 text-white' : 
                service.status === 'warning' ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  service.status === 'online' ? 'bg-white' : 
                  service.status === 'warning' ? 'bg-black' : 'bg-white'
                }`}></div>
                {service.status === 'online' ? 'آنلاین' : 
                 service.status === 'warning' ? 'هشدار' : 'آفلاین'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const sidebarItems = [
    { key: 'dashboard', label: 'داشبورد', icon: BarChart3 },
    { key: 'subscriptions', label: 'مدیریت اشتراک‌ها', icon: Gift },
    { key: 'messages', label: 'مدیریت پیام‌ها', icon: MessageCircle },
    { key: 'rules', label: 'مدیریت قوانین', icon: Shield },
    { key: 'features', label: 'مدیریت ویژگی‌ها', icon: Settings },
    { key: 'users', label: 'مدیریت کاربران', icon: Users },
    { key: 'reports', label: 'مدیریت گزارشات', icon: AlertTriangle },
    { key: 'server', label: 'مدیریت سرور', icon: Zap }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex" dir="rtl">
      {/* Sidebar */}
      <div className="w-80 bg-gray-800/90 backdrop-blur-lg border-l border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-400" />
            پنل مدیریت
          </h1>
          <p className="text-gray-400 text-sm mt-2">چت تصویری تصادفی</p>
        </div>

        <nav className="p-4">
          <div className="space-y-2">
            {sidebarItems.map(item => (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-right ${
                  activeSection === item.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="absolute bottom-4 right-4 left-4">
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <p className="text-white font-semibold">آخرین به‌روزرسانی</p>
            <p className="text-gray-400 text-sm">۲۰ شهریور ۱۴۰۲</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'subscriptions' && renderSubscriptions()}
          {activeSection === 'messages' && renderMessages()}
          {activeSection === 'rules' && renderRules()}
          {activeSection === 'features' && renderFeatures()}
          {activeSection === 'users' && renderUsers()}
          {activeSection === 'reports' && renderReports()}
          {activeSection === 'server' && renderServer()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;