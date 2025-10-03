import React, { useState, useEffect } from 'react';
import { Users, Settings, BarChart3, Shield, MessageCircle, Gift, DollarSign, Image, Upload, Save, Trash2, Eye, EyeOff, Plus, X, Check, AlertTriangle, Phone, Clock, Ban, UserX, FileText, Zap, Menu, LogOut, Lock } from 'lucide-react';
import { logout, getAdminInfo } from '../utils/auth';
import { subscriptionApi, Subscription } from '../services/adminApi';

type AppUser = {
  id: number;
  phone: string;
  status: 'active' | 'banned';
  subscription: string;
  joinDate: string;
  violations: number;
  lastActive: string;
  totalChats: number;
  reportsMade: number;
  reportsReceived: number;
  invitedUsers: number;
};

type Rule = {
  id: number;
  title: string;
  punishment: string;
  punishmentType: '24h' | '48h' | 'permanent';
  violationCount: number;
  notificationText: string;
  warningEnabled: boolean;
};

const AdminPanel = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    {
      id: 1,
      name: 'اشتراک یک ماهه',
      price: 150000,
      duration: 30,
      description: 'اشتراک یک ماهه با امکانات کامل',
      features: [
        'قابلیت قفل تا 3 دقیقه‌ای',
        'ادامه ارتباط بالای 3 دقیقه'
      ],
      giftLocks: 10,
      videoQuality: 'HD',
      unlimitedTime: true,
      giftEnabled: true,
      active: true
    },
    {
      id: 2,
      name: 'اشتراک شش ماهه',
      price: 630000,
      duration: 180,
      description: 'اشتراک شش ماهه با تخفیف ویژه',
      features: [
        'پشتیبانی اولویت‌دار',
        'قفل نامحدود'
      ],
      giftLocks: 60,
      videoQuality: 'FHD',
      unlimitedTime: true,
      giftEnabled: true,
      active: true
    },
    {
      id: 3,
      name: 'اشتراک سالانه',
      price: 900000,
      duration: 365,
      description: 'اشتراک سالانه با پیشینهاز تخفیف',
      features: [
        'تمام مزایای عضویت',
        'ارتقاء تخفیف',
        'قفل نامحدود'
      ],
      giftLocks: 120,
      videoQuality: 'UHD',
      unlimitedTime: true,
      giftEnabled: true,
      active: true
    }
  ]);

  useEffect(() => {
    (async () => {
      try {
        const res = await subscriptionApi.getAll();
        if (res.data && res.data.length > 0) {
          setSubscriptions(res.data);
        }
      } catch (e) {
        console.error('Failed to load subscriptions, using defaults', e);
        // اگر API کار نکند، از پلن‌های پیش‌فرض استفاده می‌کنیم
      }
    })();
  }, []);

  const [subscriptionSettings, setSubscriptionSettings] = useState({
    displayInApp: true,
    additionalText: 'شما هم می‌توانید اشتراک بخرید و هم دوستان خود را دعوت کنید و اشتراک یک ماه رایگان ببرید.',
    giftSubscriptionEnabled: true,
    giftLockTimeSeconds: 30, // زمان قفل برای اشتراک هدیه
    buyerRequestMessage: 'آیا می‌خواهید اشتراک هدیه بخرید؟ با خرید اشتراک هدیه شما از مزایای ویژه و قفل زمان‌دار با هدیه‌گیرنده بهره‌مند می‌شوید.',
    receiverAcceptMessage: 'شما اشتراک هدیه دریافت کردید. توجه: هر زمان آنلاین باشید ابتدا با خریدار گفتگو می‌کنید. در هر ماه فقط یک نفر می‌تواند برایتان بخرد. آیا شرایط را می‌پذیرید؟',
    monthlyGiftLimit: 1, // حداکثر اشتراک هدیه در ماه
    giftWorkflowEnabled: true // فعال/غیرفعال کردن کل فرآیند هدیه
  });
  
  const [messages, setMessages] = useState([
    // پیام‌های پیش‌فرض عمومی
    { id: 1, type: 'welcome', text: 'به اپلیکیشن چت تصویری خوش آمدید!', active: true, category: 'default' },
    { id: 2, type: 'friend_joined', text: 'دوست شما ثبت‌نام کرد', active: true, category: 'default' },
    
    // پیام‌های پیش‌فرض اشتراک
    { id: 3, type: 'subscription_expiring', text: 'اشتراک شما ۵ روز دیگر به پایان می‌رسد. **https://example.com/renew** برای تمدید', active: true, category: 'default' },
    { id: 4, type: 'subscription_expired', text: 'اشتراک شما به پایان رسید. **https://example.com/subscribe** برای تهیه اشتراک', active: true, category: 'default' },
    { id: 5, type: 'subscription_purchased', text: 'اشتراک شما با موفقیت خریداری شد', active: true, category: 'default' },
    { id: 6, type: 'free_subscription_reward', text: 'تبریک! شما اشتراک یک ماه رایگان دریافت کردید', active: true, category: 'default' },
    { id: 7, type: 'lock_purchased', text: 'خرید قفل شما با موفقیت انجام شد', active: true, category: 'default' },
    
    // پیام‌های پیش‌فرض تخلف
    { id: 8, type: 'violation_warning', text: 'گزارشی بر علیه شما با موضوع {reason} ثبت گردید. اگر یک کاربر دیگر نیز چنین گزارشی بدهد، شما مسدود می‌شوید.', active: true, category: 'default' },
    { id: 9, type: 'violation_ban', text: 'شما به دلیل {reason} تا تاریخ {date} مسدود شدید. زمان باقیمانده: {time_left}', active: true, category: 'default' }
  ]);

  const [messageSettings, setMessageSettings] = useState({
    linkFormat: '**URL**', // فرمت لینک - بین 4 ستاره تبدیل به لینک می‌شود
    activeTab: 'default' // default, general
  });

  const [rules, setRules] = useState<Rule[]>([
    { id: 1, title: 'محتوای نامناسب', punishment: 'محدودیت ۲۴ ساعته', punishmentType: '24h', violationCount: 3, notificationText: 'شما به دلیل ارسال محتوای نامناسب مسدود شدید.', warningEnabled: true },
    { id: 2, title: 'زبان نامناسب', punishment: 'محدودیت ۴۸ ساعته', punishmentType: '48h', violationCount: 2, notificationText: 'شما به دلیل استفاده از زبان نامناسب مسدود شدید.', warningEnabled: true },
    { id: 3, title: 'رفتار غیراخلاقی', punishment: 'محدودیت دائم', punishmentType: 'permanent', violationCount: 1, notificationText: 'شما به دلیل رفتار غیراخلاقی به طور دائم مسدود شدید.', warningEnabled: false }
  ]);

  const [ruleSettings, setRuleSettings] = useState({
    autoSendNotification: true,
    permanentBanThreshold: 10, // تعداد تخلف برای مسدودی دائم در سال
    defaultNotificationTemplate: 'شما به دلیل {reason} تا تاریخ {date} مسدود شدید. لطفاً قوانین را رعایت کنید.',
    // Warning system settings
    globalWarningSystemEnabled: true,
    defaultWarningDuration: 168, // 7 روز
    defaultWarningTemplate: 'گزارشی بر علیه شما با موضوع {violationType} ثبت گردید و حالا اگر یک کاربر دیگر بر علیه شما چنین گزارشی ثبت کند شما مسدود خواهید شد پس اگر این گزارش درست است لطفا رفتار خود را برای گفتگوهای بعدی اصلاح نمایید تا گزارشی دریافت ننمایید'
  });

  const [features, setFeatures] = useState({
    inviteReward: true,
    inviteRewardCount: 5,
    inviteRewardText: 'با دعوت از دوستان خود، یک ماه اشتراک رایگان دریافت کنید! هر ۵ دعوت موفق = ۱ ماه اشتراک رایگان.',
    inviteGiftLocksPerInvite: 1, // تعداد دعوت برای دریافت یک قفل
    lockPrice: 50000,
    lockDurationSeconds: 10, // مدت زمان هر قفل بر حسب ثانیه
    lockCount: 3, // تعداد قفل پیش‌فرض رایگان برای کاربران جدید
    lockPopupEnabled: true,
    lockPopupText: 'برای ادامه چت، نیاز به قفل دارید. قفل خود را خریداری کنید.',
    lockPopupIcon: true, // نمایش آیکون قفل در پاپ‌آپ
    videoQuality: 'HD',
    showPurchaseSection: true,
    callTimeLimit: 30 // حداکثر زمان مکالمه (دقیقه) - 0 یعنی نامحدود
  });

  const [stats, setStats] = useState({
    totalUsers: 1250,
    activeUsers: 890,
    totalSubscriptions: 340,
    totalRevenue: 51000000,
    onlineUsers: 145,
    dailyChats: 2300
  });

  const [users, setUsers] = useState<AppUser[]>([
    { id: 1, phone: '09121234567', status: 'active', subscription: 'یک ماهه', joinDate: '1402/08/15', violations: 0, lastActive: '1402/08/21', totalChats: 156, reportsMade: 2, reportsReceived: 0, invitedUsers: 3 },
    { id: 2, phone: '09129876543', status: 'banned', subscription: 'رایگان', joinDate: '1402/08/10', violations: 3, lastActive: '1402/08/18', totalChats: 45, reportsMade: 0, reportsReceived: 3, invitedUsers: 0 },
    { id: 3, phone: '09135554444', status: 'active', subscription: 'سالانه', joinDate: '1402/07/20', violations: 1, lastActive: '1402/08/20', totalChats: 234, reportsMade: 1, reportsReceived: 1, invitedUsers: 7 },
    { id: 4, phone: '09191234567', status: 'active', subscription: 'شش ماهه', joinDate: '1402/06/10', violations: 0, lastActive: '1402/08/21', totalChats: 89, reportsMade: 0, reportsReceived: 0, invitedUsers: 2 },
    { id: 5, phone: '09361234567', status: 'active', subscription: 'رایگان', joinDate: '1402/08/01', violations: 2, lastActive: '1402/08/19', totalChats: 34, reportsMade: 1, reportsReceived: 2, invitedUsers: 0 },
    { id: 6, phone: '09381234567', status: 'banned', subscription: 'یک ماهه', joinDate: '1402/07/15', violations: 5, lastActive: '1402/08/10', totalChats: 123, reportsMade: 3, reportsReceived: 5, invitedUsers: 1 },
    { id: 7, phone: '09151234567', status: 'active', subscription: 'رایگان', joinDate: '1402/08/20', violations: 0, lastActive: '1402/08/21', totalChats: 12, reportsMade: 0, reportsReceived: 0, invitedUsers: 0 },
    { id: 8, phone: '09331234567', status: 'active', subscription: 'یک ماهه', joinDate: '1402/07/25', violations: 1, lastActive: '1402/08/21', totalChats: 178, reportsMade: 1, reportsReceived: 1, invitedUsers: 4 },
    { id: 9, phone: '09371234567', status: 'active', subscription: 'سالانه', joinDate: '1402/05/10', violations: 0, lastActive: '1402/08/21', totalChats: 456, reportsMade: 2, reportsReceived: 0, invitedUsers: 12 },
    { id: 10, phone: '09301234567', status: 'active', subscription: 'رایگان', joinDate: '1402/08/18', violations: 0, lastActive: '1402/08/20', totalChats: 23, reportsMade: 0, reportsReceived: 0, invitedUsers: 1 },
    { id: 11, phone: '09211234567', status: 'active', subscription: 'شش ماهه', joinDate: '1402/06/20', violations: 1, lastActive: '1402/08/21', totalChats: 267, reportsMade: 1, reportsReceived: 1, invitedUsers: 6 },
    { id: 12, phone: '09901234567', status: 'banned', subscription: 'رایگان', joinDate: '1402/08/05', violations: 4, lastActive: '1402/08/15', totalChats: 78, reportsMade: 2, reportsReceived: 4, invitedUsers: 0 }
  ]);

  const [userFilters, setUserFilters] = useState({
    searchQuery: '',
    statusFilter: 'all', // all, active, banned
    subscriptionFilter: 'all', // all, free, subscribed
    activityFilter: 'all', // all, active_week, active_month, inactive
    currentPage: 1,
    itemsPerPage: 10
  });

  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  const [reports, setReports] = useState([
    { id: 1, reporter: '09121234567', reported: '09129876543', reason: 'محتوای نامناسب', date: '1402/08/20', status: 'resolved', violationType: 'temporary', punishment: '24h' },
    { id: 2, reporter: '09135554444', reported: '09121111111', reason: 'زبان نامناسب', date: '1402/08/19', status: 'resolved', violationType: 'temporary', punishment: '48h' },
    { id: 3, reporter: '09123456789', reported: '09129876543', reason: 'رفتار غیراخلاقی', date: '1402/08/18', status: 'resolved', violationType: 'permanent', punishment: 'permanent' },
    { id: 4, reporter: '09134567890', reported: '09121111111', reason: 'محتوای نامناسب', date: '1402/08/17', status: 'resolved', violationType: 'temporary', punishment: '24h' },
    { id: 5, reporter: '09145678901', reported: '09123456789', reason: 'زبان نامناسب', date: '1402/08/16', status: 'resolved', violationType: 'temporary', punishment: '48h' }
  ]);

  const [reportFilters, setReportFilters] = useState({
    violationType: 'all', // all, temporary, permanent
    reasonType: 'all', // all, محتوای نامناسب, زبان نامناسب, رفتار غیراخلاقی
    currentPage: 1,
    itemsPerPage: 10
  });

  const [manualBanSettings, setManualBanSettings] = useState({
    phoneNumber: '',
    maxReportsPerDay: 10,
    firstBanDuration: 30, // روز
    secondBanDuration: 60 // روز
  });

  const [logo, setLogo] = useState('');
  const [watermark, setWatermark] = useState('');
  const [paymentLink, setPaymentLink] = useState('');

  const [newSubscription, setNewSubscription] = useState<{ 
    id?: number; 
    name: string; 
    price: string; 
    duration: string; 
    description: string; 
    features: string[];
    giftLocks?: number;
    videoQuality?: string;
    unlimitedTime?: boolean;
    giftEnabled?: boolean;
    isSystem?: boolean;
  }>({
    name: '',
    price: '',
    duration: '',
    description: '',
    features: [],
    giftLocks: 0,
    videoQuality: 'HD',
    unlimitedTime: false,
    giftEnabled: false
  });

  const [newMessage, setNewMessage] = useState({
    type: 'general',
    text: ''
  });

  const [newRule, setNewRule] = useState<Omit<Rule, 'id'> & { id: number | null}>({
    id: null,
    title: '',
    punishment: '',
    punishmentType: '24h',
    violationCount: 1,
    notificationText: '',
    warningEnabled: false // افزودن گزینه تذکر برای هر قانون
  });

  const [editingItem, setEditingItem] = useState<null | 'newSubscription' | 'editSubscription' | 'newMessage' | 'newRule' | 'editMessage'>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // Dashboard Section
  const renderDashboard = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white mb-4">داشبورد مدیریت</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">کل کاربران</h3>
              <p className="text-xl font-bold">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">کاربران آنلاین</h3>
              <p className="text-xl font-bold">{stats.onlineUsers}</p>
            </div>
            <Zap className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 p-4 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">اشتراک‌های فعال</h3>
              <p className="text-xl font-bold">{stats.totalSubscriptions}</p>
            </div>
            <Gift className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">درآمد کل (تومان)</h3>
              <p className="text-xl font-bold">{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">چت‌های امروز</h3>
              <p className="text-xl font-bold">{stats.dailyChats}</p>
            </div>
            <MessageCircle className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-4 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">کاربران فعال</h3>
              <p className="text-xl font-bold">{stats.activeUsers}</p>
            </div>
            <BarChart3 className="w-8 h-8 opacity-80" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-xl p-4">
        <h3 className="text-lg font-bold text-white mb-3">فعالیت‌های اخیر</h3>
        <div className="space-y-2">
          {reports.slice(0, 5).map(report => (
            <div key={report.id} className="flex items-center justify-between bg-gray-700 p-2 rounded-lg">
              <div>
                <p className="text-white text-sm">گزارش جدید: {report.reason}</p>
                <p className="text-gray-400 text-xs">{report.date}</p>
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">مدیریت اشتراک‌ها</h2>
        <button 
          onClick={() => setEditingItem('newSubscription')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          اشتراک جدید
        </button>
      </div>

      {/* تنظیمات کلی اشتراک‌ها */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">تنظیمات کلی اشتراک‌ها</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={subscriptionSettings.displayInApp}
                onChange={(e) => setSubscriptionSettings({...subscriptionSettings, displayInApp: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-white">نمایش اشتراک‌ها در پنل کاربری</span>
            </label>
            
            <div>
              <label className="block text-gray-300 mb-2">متن اضافی برای بخش اشتراک‌ها:</label>
              <textarea
                value={subscriptionSettings.additionalText}
                onChange={(e) => setSubscriptionSettings({...subscriptionSettings, additionalText: e.target.value})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
                rows={3}
                placeholder="متنی که زیر بخش خرید اشتراک نمایش داده شود"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={subscriptionSettings.giftSubscriptionEnabled}
                onChange={(e) => setSubscriptionSettings({...subscriptionSettings, giftSubscriptionEnabled: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-white">فعال بودن بخش اشتراک هدیه</span>
            </label>
            
            <div>
              <label className="block text-gray-300 mb-2">زمان قفل اشتراک هدیه (ثانیه):</label>
              <input
                type="number"
                value={subscriptionSettings.giftLockTimeSeconds}
                onChange={(e) => setSubscriptionSettings({...subscriptionSettings, giftLockTimeSeconds: parseInt(e.target.value)})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
                min="10"
                max="300"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">حداکثر اشتراک هدیه در ماه:</label>
              <input
                type="number"
                value={subscriptionSettings.monthlyGiftLimit}
                onChange={(e) => setSubscriptionSettings({...subscriptionSettings, monthlyGiftLimit: parseInt(e.target.value)})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
                min="1"
                max="10"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <label className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={subscriptionSettings.giftWorkflowEnabled}
              onChange={(e) => setSubscriptionSettings({...subscriptionSettings, giftWorkflowEnabled: e.target.checked})}
              className="w-4 h-4"
            />
            <span className="text-white">فعال بودن کل فرآیند اشتراک هدیه</span>
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-300 mb-2">پیام درخواست خرید هدیه (برای خریدار):</label>
              <textarea
                value={subscriptionSettings.buyerRequestMessage}
                onChange={(e) => setSubscriptionSettings({...subscriptionSettings, buyerRequestMessage: e.target.value})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
                rows={3}
                placeholder="پیامی که هنگام کلیک روی دکمه خرید هدیه نمایش داده می‌شود"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">پیام پذیرش شرایط (برای هدیه‌گیرنده):</label>
              <textarea
                value={subscriptionSettings.receiverAcceptMessage}
                onChange={(e) => setSubscriptionSettings({...subscriptionSettings, receiverAcceptMessage: e.target.value})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
                rows={3}
                placeholder="پیامی که برای پذیرش شرایط هدیه نمایش داده می‌شود"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subscriptions.map(sub => (
          <div key={sub.id} className="bg-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-white">{sub.name}</h3>
              <div className="flex gap-2">
                <button 
                  onClick={async () => {
                    try {
                      const updated = await subscriptionApi.update(sub.id, { active: !sub.active });
                      setSubscriptions(subscriptions.map(s => s.id === sub.id ? updated.data : s));
                    } catch (e) {
                      alert('خطا در به‌روزرسانی وضعیت اشتراک');
                    }
                  }}
                  className={sub.active ? "text-green-400" : "text-gray-400"}
                  title={sub.active ? 'غیرفعال کردن' : 'فعال کردن'}
                >
                  {sub.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => {
                    setNewSubscription({
                      id: sub.id,
                      name: sub.name,
                      price: String(sub.price),
                      duration: String(sub.duration),
                      description: sub.description,
                      features: sub.features,
                      giftLocks: sub.giftLocks,
                      videoQuality: sub.videoQuality,
                      unlimitedTime: sub.unlimitedTime,
                      giftEnabled: sub.giftEnabled
                    });
                    setEditingItem('editSubscription');
                  }}
                  className="text-blue-400 hover:text-blue-300"
                  title="ویرایش"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('آیا از حذف این اشتراک مطمئن هستید؟')) return;
                    try {
                      await subscriptionApi.delete(sub.id);
                      setSubscriptions(subscriptions.filter(s => s.id !== sub.id));
                    } catch (e) {
                      alert('خطا در حذف اشتراک');
                    }
                  }}
                  className="text-red-400 hover:text-red-300"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <p className="text-gray-300">قیمت: {sub.price.toLocaleString()} تومان</p>
              <p className="text-gray-300">مدت: {sub.duration} روز</p>
              <p className="text-gray-300">{sub.description}</p>
              <p className="text-gray-300">قفل هدیه: {sub.giftLocks} عدد</p>
              <p className="text-gray-300">کیفیت ویدیو: {sub.videoQuality}</p>
              <p className="text-gray-300">زمان نامحدود: {sub.unlimitedTime ? 'بله' : 'خیر'}</p>
              <p className="text-gray-300">هدیه فعال: {sub.giftEnabled ? 'بله' : 'خیر'}</p>
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
          <div className="bg-gray-800 p-4 rounded-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">
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
              
              <div>
                <label className="block text-gray-300 mb-2">ویژگی‌ها (هر خط یک مورد):</label>
                <textarea
                  placeholder="مثال:\nتصویر با کیفیت بالا\nقابلیت قفل ۲ دقیقه‌ای\nادامه ارتباط بالای ۳ دقیقه"
                  value={(newSubscription.features || []).join('\n')}
                  onChange={(e) => setNewSubscription({
                    ...newSubscription,
                    features: e.target.value
                      .split('\n')
                      .map(s => s.trim())
                      .filter(Boolean)
                  })}
                  className="w-full bg-gray-700 text-white p-3 rounded-lg"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">تعداد قفل هدیه:</label>
                  <input
                    type="number"
                    placeholder="تعداد قفل"
                    value={newSubscription.giftLocks || ''}
                    onChange={(e) => setNewSubscription({...newSubscription, giftLocks: parseInt(e.target.value) || 0})}
                    className="w-full bg-gray-700 text-white p-3 rounded-lg"
                    min="0"
                    max="100"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2">کیفیت ویدیو:</label>
                  <select
                    value={newSubscription.videoQuality || 'HD'}
                    onChange={(e) => setNewSubscription({...newSubscription, videoQuality: e.target.value})}
                    className="w-full bg-gray-700 text-white p-3 rounded-lg"
                  >
                    <option value="SD">SD (480p)</option>
                    <option value="HD">HD (720p)</option>
                    <option value="FHD">Full HD (1080p)</option>
                    <option value="UHD">Ultra HD (4K)</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={newSubscription.unlimitedTime || false}
                    onChange={(e) => setNewSubscription({...newSubscription, unlimitedTime: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="text-white">زمان نامحدود</span>
                </label>
                
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={newSubscription.giftEnabled || false}
                    onChange={(e) => setNewSubscription({...newSubscription, giftEnabled: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="text-white">قابل هدیه دادن</span>
                </label>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      if (editingItem === 'newSubscription') {
                        const created = await subscriptionApi.create({
                          name: newSubscription.name,
                          price: parseInt(newSubscription.price),
                          duration: parseInt(newSubscription.duration),
                          description: newSubscription.description,
                          giftLocks: newSubscription.giftLocks || 0,
                          videoQuality: newSubscription.videoQuality || 'HD',
                          unlimitedTime: newSubscription.unlimitedTime || false,
                          giftEnabled: newSubscription.giftEnabled || false,
                          features: newSubscription.features || []
                        } as any);
                        setSubscriptions([...subscriptions, created.data]);
                      } else {
                        if (newSubscription.id != null) {
                          const updated = await subscriptionApi.update(newSubscription.id, {
                            name: newSubscription.name,
                            price: parseInt(newSubscription.price),
                            duration: parseInt(newSubscription.duration),
                            description: newSubscription.description,
                            giftLocks: newSubscription.giftLocks || 0,
                            videoQuality: newSubscription.videoQuality || 'HD',
                            unlimitedTime: newSubscription.unlimitedTime || false,
                            giftEnabled: newSubscription.giftEnabled || false,
                            features: newSubscription.features || [],
                          } as any);
                          setSubscriptions(subscriptions.map(s => s.id === updated.data.id ? updated.data : s));
                        }
                      }
                      setNewSubscription({ name: '', price: '', duration: '', description: '', features: [], giftLocks: 0, videoQuality: 'HD', unlimitedTime: false, giftEnabled: false });
                      setEditingItem(null);
                    } catch (e) {
                      alert('خطا در ذخیره اشتراک');
                    }
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">مدیریت پیام‌ها</h2>
        <button 
          onClick={() => setEditingItem('newMessage')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          پیام جدید
        </button>
      </div>

      {/* تب‌بندی پیام‌ها */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setMessageSettings({...messageSettings, activeTab: 'default'})}
            className={`px-4 py-2 rounded-lg transition-colors ${
              messageSettings.activeTab === 'default' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            پیش‌فرض (سیستمی)
          </button>
          <button
            onClick={() => setMessageSettings({...messageSettings, activeTab: 'general'})}
            className={`px-4 py-2 rounded-lg transition-colors ${
              messageSettings.activeTab === 'general' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            عمومی (ادمین)
          </button>
        </div>

        {messageSettings.activeTab === 'default' && (
          <>
            <h3 className="text-lg font-bold text-white mb-4">پیام‌های پیش‌فرض سیستم</h3>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">فرمت لینک (فرمت بین 4 ستاره به لینک تبدیل می‌شود):</label>
              <input
                type="text"
                value={messageSettings.linkFormat}
                onChange={(e) => setMessageSettings({...messageSettings, linkFormat: e.target.value})}
                placeholder="مثال: **URL**"
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
              />
              <p className="text-gray-400 text-sm mt-2">مثال: **https://example.com** به لینک قابل کلیک تبدیل می‌شود</p>
            </div>
            
            <div className="space-y-3">
              {messages.filter(msg => msg.category === 'default').map(msg => (
                <div key={msg.id} className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          msg.type.includes('violation') ? 'bg-red-500' :
                          msg.type.includes('subscription') ? 'bg-blue-500' :
                          msg.type.includes('friend') ? 'bg-purple-500' :
                          'bg-green-500'
                        }`}>
                          {msg.type === 'welcome' ? 'خوشامد' :
                           msg.type === 'friend_joined' ? 'دوست' :
                           msg.type.includes('subscription') ? 'اشتراک' :
                           msg.type.includes('lock') ? 'قفل' :
                           msg.type.includes('violation') ? 'تخلف' : 'عمومی'}
                        </span>
                        <span className={`text-xs ${msg.active ? 'text-green-400' : 'text-gray-400'}`}>
                          {msg.active ? 'فعال' : 'غیرفعال'}
                        </span>
                      </div>
                      <p className="text-white text-sm mb-2 font-semibold">{msg.type}</p>
                      <p className="text-gray-300 leading-relaxed">{msg.text}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setMessages(messages.map(m => 
                          m.id === msg.id ? {...m, active: !m.active} : m
                        ))}
                        className={msg.active ? "text-green-400" : "text-gray-400"}
                        title="فعال/غیرفعال"
                      >
                        {msg.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => {
                          setEditingMessage(msg);
                          setEditingItem('editMessage');
                        }}
                        className="text-blue-400 hover:text-blue-300"
                        title="ویرایش پیام"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {messageSettings.activeTab === 'general' && (
          <>
            <h3 className="text-lg font-bold text-white mb-4">پیام‌های عمومی ادمین</h3>
            <div className="space-y-3">
              {messages.filter(msg => msg.category === 'general').length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>هنوز پیام عمومی اضافه نشده است</p>
                  <p className="text-sm">از دکمه "پیام جدید" برای افزودن استفاده کنید</p>
                </div>
              ) : (
                messages.filter(msg => msg.category === 'general').map(msg => (
                  <div key={msg.id} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 rounded text-xs bg-orange-500">
                          {msg.type === 'general' ? 'عمومی' : msg.type}
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
                      <button 
                        onClick={() => setMessages(messages.filter(m => m.id !== msg.id))}
                        className="text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>


      {/* مودال ویرایش پیام پیش‌فرض */}
      {editingItem === 'editMessage' && editingMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-4 rounded-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">ویرایش پیام سیستمی</h3>
              <button onClick={() => {
                setEditingItem(null);
                setEditingMessage(null);
              }}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">نوع پیام:</label>
                <input
                  type="text"
                  value={editingMessage.type}
                  disabled
                  className="w-full bg-gray-600 text-gray-400 p-3 rounded-lg cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">متن پیام:</label>
                <textarea
                  value={editingMessage.text}
                  onChange={(e) => setEditingMessage({...editingMessage, text: e.target.value})}
                  className="w-full bg-gray-700 text-white p-3 rounded-lg"
                  rows={4}
                />
                <p className="text-gray-400 text-xs mt-2">
                  متغیرهای قابل استفاده: {'{reason}'}, {'{date}'}, {'{time_left}'}
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMessages(messages.map(m => 
                      m.id === editingMessage.id ? editingMessage : m
                    ));
                    setEditingItem(null);
                    setEditingMessage(null);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  ذخیره تغییرات
                </button>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setEditingMessage(null);
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال افزودن پیام جدید */}
      {editingItem === 'newMessage' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-4 rounded-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">پیام جدید</h3>
              <button onClick={() => setEditingItem(null)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">نوع پیام:</label>
                <select
                  value={newMessage.type}
                  onChange={(e) => setNewMessage({...newMessage, type: e.target.value})}
                  className="w-full bg-gray-700 text-white p-3 rounded-lg"
                >
                  <option value="general">عمومی</option>
                  <option value="announcement">اطلاعیه</option>
                  <option value="promotion">تبلیغات</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">متن پیام:</label>
                <textarea
                  placeholder="متن پیام را اینجا بنویسید..."
                  value={newMessage.text}
                  onChange={(e) => setNewMessage({...newMessage, text: e.target.value})}
                  className="w-full bg-gray-700 text-white p-3 rounded-lg"
                  rows={4}
                />
                <p className="text-gray-400 text-xs mt-2">برای افزودن لینک از فرمت {messageSettings.linkFormat} استفاده کنید</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (newMessage.text.trim()) {
                      setMessages([
                        ...messages,
                        {
                          id: Date.now(),
                          type: newMessage.type,
                          text: newMessage.text,
                          active: true,
                          category: 'general'
                        }
                      ]);
                      setNewMessage({ type: 'general', text: '' });
                      setEditingItem(null);
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  ذخیره
                </button>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setNewMessage({ type: 'general', text: '' });
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Rules Management
  const renderRules = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">مدیریت قوانین</h2>
        <button 
          onClick={() => setEditingItem('newRule')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          قانون جدید
        </button>
      </div>

      {/* تنظیمات سیستم تذکر (Warning System) */}
      <div className="bg-gray-800 rounded-xl p-6 mb-4">
        <h3 className="text-lg font-bold text-white mb-4">🚨 سیستم تذکر قبل از اعمال قانون</h3>
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-blue-400" />
            <h4 className="text-blue-300 font-semibold">نحوه کارکرد سیستم تذکر</h4>
          </div>
          <p className="text-blue-200 text-sm leading-relaxed">
            وقتی این گزینه برای یک قانون فعال باشد، بجای اعمال مستقیم مجازات، ابتدا یک تذکر به کاربر ارسال می‌شود.
            اگر در مدت زمان مشخص شده کاربر دوباره همان تخلف را انجام دهد، آنگاه قانون اعمال می‌شود.
            این ویژگی برای کاهش تخلفات و دادن فرصت اصلاح رفتار به کاربران مفید است.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={ruleSettings.globalWarningSystemEnabled}
                onChange={(e) => setRuleSettings({...ruleSettings, globalWarningSystemEnabled: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-white">فعال‌سازی کلی سیستم تذکر</span>
            </label>
            
            <div>
              <label className="block text-gray-300 mb-2">مدت پیش‌فرض اعتبار تذکر (ساعت):</label>
              <input
                type="number"
                value={ruleSettings.defaultWarningDuration}
                onChange={(e) => setRuleSettings({...ruleSettings, defaultWarningDuration: parseInt(e.target.value)})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
                min="1"
                max="720"
                placeholder="168"
              />
              <p className="text-gray-400 text-xs mt-1">پیش‌فرض: ۱۶۸ ساعت (۷ روز)</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">قالب پیام تذکر پیش‌فرض:</label>
              <textarea
                value={ruleSettings.defaultWarningTemplate}
                onChange={(e) => setRuleSettings({...ruleSettings, defaultWarningTemplate: e.target.value})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
                rows={4}
                placeholder="گزارشی بر علیه شما با موضوع {violationType} ثبت گردید..."
              />
              <p className="text-gray-400 text-xs mt-1">
                متغیرها: {'{violationType}'} نوع تخلف، {'{username}'} نام کاربر
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* تنظیمات کلی قوانین */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">تنظیمات کلی مجازات</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={ruleSettings.autoSendNotification}
                onChange={(e) => setRuleSettings({...ruleSettings, autoSendNotification: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-white">ارسال خودکار نوتیفیکیشن به کاربران</span>
            </label>
            
            <div>
              <label className="block text-gray-300 mb-2">حد آستانه تخلف برای مسدودی دائم در سال:</label>
              <input
                type="number"
                value={ruleSettings.permanentBanThreshold}
                onChange={(e) => setRuleSettings({...ruleSettings, permanentBanThreshold: parseInt(e.target.value)})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
                min="1"
                max="50"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2">قالب پیام پیش‌فرض نوتیفیکیشن:</label>
            <textarea
              value={ruleSettings.defaultNotificationTemplate}
              onChange={(e) => setRuleSettings({...ruleSettings, defaultNotificationTemplate: e.target.value})}
              className="w-full bg-gray-700 text-white p-3 rounded-lg"
              rows={4}
              placeholder="از متغیرهای {reason} و {date} استفاده کنید"
            />
            <p className="text-gray-400 text-sm mt-2">
              متغیرهای قابل استفاده: {'{reason}'} برای دلیل تخلف، {'{date}'} برای تاریخ پایان مسدودی
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">عناوین تخلف و مجازات‌ها</h3>
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-white font-semibold">{rule.title}</h4>
                  <p className="text-gray-300">مجازات: {rule.punishment}</p>
                  <p className="text-gray-400 text-sm">حداکثر تخلف: {rule.violationCount} بار</p>
                  <div className="mt-2 flex gap-2 items-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      rule.punishmentType === '24h' ? 'bg-yellow-500 text-black' :
                      rule.punishmentType === '48h' ? 'bg-orange-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {rule.punishmentType === '24h' ? '24 ساعته' :
                       rule.punishmentType === '48h' ? '48 ساعته' : 'دائم'}
                    </span>
                    {rule.warningEnabled && (
                      <span className="px-2 py-1 rounded text-xs bg-blue-500 text-white">
                        تذکر اولیه فعال
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mt-2">پیام نوتیف: {rule.notificationText}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setNewRule({...rule, warningEnabled: rule.warningEnabled || false});
                      setEditingItem('newRule');
                    }}
                    className="text-blue-400 hover:text-blue-300"
                    title="ویرایش"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => setRules(rules.filter(r => r.id !== rule.id))}
                    className="text-red-400 hover:text-red-300"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* مودال افزودن/ویرایش قانون */}
      {editingItem === 'newRule' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-4 rounded-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">
                {newRule.id ? 'ویرایش قانون' : 'قانون جدید'}
              </h3>
              <button onClick={() => {
                  setEditingItem(null);
                  setNewRule({ id: null, title: '', punishment: '', punishmentType: '24h', violationCount: 1, notificationText: '', warningEnabled: false });
              }}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="عنوان تخلف"
                value={newRule.title}
                onChange={(e) => setNewRule({...newRule, title: e.target.value})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
              />
              
              <div>
                <label className="block text-gray-300 mb-2">نوع مجازات:</label>
                <select
                  value={newRule.punishmentType}
                  onChange={(e) => {
                    const type = e.target.value as Rule['punishmentType'];
                    let punishment = '';
                    if (type === '24h') punishment = 'محدودیت ۲۴ ساعته';
                    else if (type === '48h') punishment = 'محدودیت ۴۸ ساعته';
                    else punishment = 'محدودیت دائم';
                    setNewRule({...newRule, punishmentType: type, punishment});
                  }}
                  className="w-full bg-gray-700 text-white p-3 rounded-lg"
                >
                  <option value="24h">24 ساعته</option>
                  <option value="48h">48 ساعته</option>
                  <option value="permanent">دائم</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">حداکثر تعداد تخلف:</label>
                <input
                  type="number"
                  value={newRule.violationCount}
                  onChange={(e) => setNewRule({...newRule, violationCount: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 text-white p-3 rounded-lg"
                  min="1"
                  max="10"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">متن نوتیفیکیشن:</label>
                <textarea
                  placeholder="پیام خاص برای این تخلف"
                  value={newRule.notificationText}
                  onChange={(e) => setNewRule({...newRule, notificationText: e.target.value})}
                  className="w-full bg-gray-700 text-white p-3 rounded-lg"
                  rows={3}
                />
              </div>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={newRule.warningEnabled}
                  onChange={(e) => setNewRule({...newRule, warningEnabled: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-white">ارسال تذکر قبل از اعمال قانون</span>
              </label>
              <p className="text-gray-400 text-xs -mt-2">
                در صورت فعال بودن، برای اولین تخلف فقط تذکر ارسال می‌شود و در صورت تکرار، قانون اعمال می‌گردد.
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (newRule.id !== null) {
                      // ویرایش
                      setRules(rules.map(r => (r.id === newRule.id ? { ...r, ...newRule, id: newRule.id } as Rule : r)));
                    } else {
                      // افزودن جدید
                      setRules([...rules, { ...newRule, id: Date.now() }]);
                    }
                    setNewRule({ id: null, title: '', punishment: '', punishmentType: '24h', violationCount: 1, notificationText: '', warningEnabled: false });
                    setEditingItem(null);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  ذخیره
                </button>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setNewRule({ id: null, title: '', punishment: '', punishmentType: '24h', violationCount: 1, notificationText: '', warningEnabled: false });
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">متن قوانین عمومی</h3>
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
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">مدیریت ویژگی‌ها</h2>

      {/* جایزه معرفی دوستان */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">جایزه معرفی دوستان</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                min="1"
                max="20"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">تعداد دعوت برای دریافت یک قفل:</label>
              <input
                type="number"
                value={features.inviteGiftLocksPerInvite}
                onChange={(e) => setFeatures({...features, inviteGiftLocksPerInvite: parseInt(e.target.value)})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
                min="1"
                max="10"
                placeholder="به ازای چند دعوت یک قفل"
              />
              <p className="text-gray-400 text-xs mt-1">به ازای این تعداد دعوت، کاربر یک قفل رایگان دریافت می‌کند</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">متن توضیحات مزایای معرفی:</label>
              <textarea
                value={features.inviteRewardText}
                onChange={(e) => setFeatures({...features, inviteRewardText: e.target.value})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
                rows={4}
                placeholder="متنی که در بخش دعوت دوستان نمایش داده شود"
              />
            </div>
            
          </div>
        </div>
      </div>

      {/* تنظیمات قفل و پاپ‌آپ */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">تنظیمات قفل و پاپ‌آپ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">قیمت هر قفل (تومان):</label>
              <input
                type="number"
                value={features.lockPrice}
                onChange={(e) => setFeatures({...features, lockPrice: parseInt(e.target.value)})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
                min="1000"
                step="1000"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">مدت زمان هر قفل (ثانیه):</label>
              <input
                type="number"
                value={features.lockDurationSeconds}
                onChange={(e) => setFeatures({...features, lockDurationSeconds: parseInt(e.target.value)})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
                min="5"
                max="60"
                placeholder="10"
              />
              <p className="text-gray-400 text-xs mt-1">مدت زمانی که کاربر مقابل نمی‌تواند تصویر را رد کند</p>
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">تعداد قفل پیش‌فرض رایگان:</label>
              <input
                type="number"
                value={features.lockCount}
                onChange={(e) => setFeatures({...features, lockCount: parseInt(e.target.value)})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
                min="0"
                max="20"
                placeholder="3"
              />
              <p className="text-gray-400 text-xs mt-1">تعداد قفلی که کاربران جدید هنگام ثبت‌نام دریافت می‌کنند</p>
            </div>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={features.lockPopupEnabled}
                onChange={(e) => setFeatures({...features, lockPopupEnabled: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-white">فعال بودن پاپ‌آپ قفل</span>
            </label>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={features.lockPopupIcon}
                onChange={(e) => setFeatures({...features, lockPopupIcon: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-white">نمایش آیکون قفل در پاپ‌آپ</span>
            </label>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">متن پاپ‌آپ قفل:</label>
              <textarea
                value={features.lockPopupText}
                onChange={(e) => setFeatures({...features, lockPopupText: e.target.value})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
                rows={4}
                placeholder="پیامی که هنگام نیاز به قفل نمایش داده شود"
              />
              <p className="text-gray-400 text-xs mt-2">این پیام زمانی نمایش داده می‌شود که کاربر قفل ختم شده داشته باشد</p>
            </div>
          </div>
        </div>
      </div>

      {/* تنظیمات زمان مکالمه */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">تنظیمات زمان مکالمه</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">حداکثر زمان مکالمه عمومی (دقیقه):</label>
              <input
                type="number"
                value={features.callTimeLimit}
                onChange={(e) => setFeatures({...features, callTimeLimit: parseInt(e.target.value)})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
                min="0"
                max="120"
                placeholder="0 برای نامحدود"
              />
              <p className="text-gray-400 text-xs mt-2">صفر یعنی بدون محدودیت زمانی</p>
            </div>
            
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h4 className="text-white font-semibold mb-2">توضیحات محدودیت زمان:</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• تمام کاربران: طبق حداکثر عمومی</li>
                <li>• پس از پایان زمان، اتصال خاتمه یابد</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* تنظیمات تصویر و پرداخت */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">تنظیمات تصویر</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">کیفیت تصویر پیش‌فرض:</label>
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
          <h3 className="text-lg font-bold text-white mb-4">تنظیمات پرداخت</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">لینک درگاه پرداخت:</label>
              <input
                type="url"
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
                placeholder="https://payment.example.com"
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2">آپلود لوگو:</label>
                <div 
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  className="bg-gray-700 p-6 rounded-lg border-2 border-dashed border-gray-600 text-center cursor-pointer hover:bg-gray-600 transition-colors"
                >
                  {logo ? (
                    <div>
                      <Check className="w-6 h-6 text-green-400 mx-auto mb-2" />
                      <p className="text-green-400 text-xs">لوگو آپلود شد</p>
                      <p className="text-gray-400 text-xs mt-1 truncate">{logo}</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-xs">کلیک کنید</p>
                    </>
                  )}
                </div>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setLogo(file.name);
                      // در اینجا می‌توانید فایل را به سرور ارسال کنید
                      console.log('Logo uploaded:', file);
                    }
                  }}
                  className="hidden"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">آپلود واترمارک:</label>
                <div 
                  onClick={() => document.getElementById('watermark-upload')?.click()}
                  className="bg-gray-700 p-6 rounded-lg border-2 border-dashed border-gray-600 text-center cursor-pointer hover:bg-gray-600 transition-colors"
                >
                  {watermark ? (
                    <div>
                      <Check className="w-6 h-6 text-green-400 mx-auto mb-2" />
                      <p className="text-green-400 text-xs">واترمارک آپلود شد</p>
                      <p className="text-gray-400 text-xs mt-1 truncate">{watermark}</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-xs">کلیک کنید</p>
                    </>
                  )}
                </div>
                <input
                  id="watermark-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setWatermark(file.name);
                      // در اینجا می‌توانید فایل را به سرور ارسال کنید
                      console.log('Watermark uploaded:', file);
                    }
                  }}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button className="bg-green-600 text-white px-8 py-3 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors">
          <Save className="w-5 h-5" />
          ذخیره تنظیمات
        </button>
      </div>
    </div>
  );

  // Helper functions for users
  const filteredUsers = users.filter(user => {
    // فیلتر جستجو
    const matchesSearch = userFilters.searchQuery === '' || 
      user.phone.includes(userFilters.searchQuery);
    
    // فیلتر وضعیت
    const matchesStatus = userFilters.statusFilter === 'all' || 
      user.status === userFilters.statusFilter;
    
    // فیلتر اشتراک
    const matchesSubscription = userFilters.subscriptionFilter === 'all' || 
      (userFilters.subscriptionFilter === 'free' && user.subscription === 'رایگان') ||
      (userFilters.subscriptionFilter === 'subscribed' && user.subscription !== 'رایگان');
    
    // فیلتر فعالیت
    const today = new Date();
    const lastActiveDate = new Date(user.lastActive.replace(/\//g, '-'));
    const daysDiff = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const matchesActivity = userFilters.activityFilter === 'all' ||
      (userFilters.activityFilter === 'active_week' && daysDiff <= 7) ||
      (userFilters.activityFilter === 'active_month' && daysDiff <= 30) ||
      (userFilters.activityFilter === 'inactive' && daysDiff > 30);
    
    return matchesSearch && matchesStatus && matchesSubscription && matchesActivity;
  });

  const userTotalPages = Math.ceil(filteredUsers.length / userFilters.itemsPerPage);
  const userStartIndex = (userFilters.currentPage - 1) * userFilters.itemsPerPage;
  const paginatedUsers = filteredUsers.slice(userStartIndex, userStartIndex + userFilters.itemsPerPage);

  // Users Management
  const renderUsers = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">مدیریت کاربران</h2>

      {/* فیلترها و جستجو */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">فیلتر و جستجو</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-gray-300 mb-2 text-sm">جستجو:</label>
            <input
              type="text"
              value={userFilters.searchQuery}
              onChange={(e) => setUserFilters({...userFilters, searchQuery: e.target.value, currentPage: 1})}
              placeholder="شماره تلفن..."
              className="w-full bg-gray-700 text-white p-2 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2 text-sm">وضعیت:</label>
            <select
              value={userFilters.statusFilter}
              onChange={(e) => setUserFilters({...userFilters, statusFilter: e.target.value, currentPage: 1})}
              className="w-full bg-gray-700 text-white p-2 rounded-lg"
            >
              <option value="all">همه</option>
              <option value="active">فعال</option>
              <option value="banned">مسدود شده</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2 text-sm">اشتراک:</label>
            <select
              value={userFilters.subscriptionFilter}
              onChange={(e) => setUserFilters({...userFilters, subscriptionFilter: e.target.value, currentPage: 1})}
              className="w-full bg-gray-700 text-white p-2 rounded-lg"
            >
              <option value="all">همه</option>
              <option value="free">رایگان</option>
              <option value="subscribed">دارای اشتراک</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2 text-sm">فعالیت:</label>
            <select
              value={userFilters.activityFilter}
              onChange={(e) => setUserFilters({...userFilters, activityFilter: e.target.value, currentPage: 1})}
              className="w-full bg-gray-700 text-white p-2 rounded-lg"
            >
              <option value="all">همه</option>
              <option value="active_week">فعال هفته اخیر</option>
              <option value="active_month">فعال ماه اخیر</option>
              <option value="inactive">غیرفعال</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2 text-sm">تعداد نمایش:</label>
            <select
              value={userFilters.itemsPerPage}
              onChange={(e) => setUserFilters({...userFilters, itemsPerPage: parseInt(e.target.value), currentPage: 1})}
              className="w-full bg-gray-700 text-white p-2 rounded-lg"
            >
              <option value={10}>10 مورد</option>
              <option value={20}>20 مورد</option>
              <option value={50}>50 مورد</option>
            </select>
          </div>
        </div>
      </div>

      {/* لیست کاربران */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">لیست کاربران ({filteredUsers.length} مورد)</h3>
          <p className="text-gray-400">صفحه {userFilters.currentPage} از {userTotalPages}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-right text-gray-300 p-3">شماره تلفن</th>
                <th className="text-right text-gray-300 p-3">وضعیت</th>
                <th className="text-right text-gray-300 p-3">اشتراک</th>
                <th className="text-right text-gray-300 p-3">تاریخ عضویت</th>
                <th className="text-right text-gray-300 p-3">آخرین فعالیت</th>
                <th className="text-right text-gray-300 p-3">تخلفات</th>
                <th className="text-right text-gray-300 p-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length > 0 ? paginatedUsers.map(user => (
                <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                  <td className="text-white p-3">{user.phone}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {user.status === 'active' ? 'فعال' : 'مسدود'}
                    </span>
                  </td>
                  <td className="text-gray-300 p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.subscription === 'رایگان' ? 'bg-gray-500' : 'bg-blue-500'
                    } text-white`}>
                      {user.subscription}
                    </span>
                  </td>
                  <td className="text-gray-300 p-3">{user.joinDate}</td>
                  <td className="text-gray-300 p-3">{user.lastActive}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.violations === 0 ? 'bg-green-600' : 
                      user.violations <= 2 ? 'bg-yellow-600' : 'bg-red-600'
                    } text-white`}>
                      {user.violations} تخلف
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setUsers(users.map(u => 
                          u.id === user.id ? {...u, status: u.status === 'active' ? 'banned' : 'active'} : u
                        ))}
                        className={`p-1 rounded ${user.status === 'active' ? 'text-red-400 hover:bg-red-900' : 'text-green-400 hover:bg-green-900'} transition-colors`}
                        title={user.status === 'active' ? 'مسدود کردن' : 'رفع مسدودی'}
                      >
                        {user.status === 'active' ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => setSelectedUser(user)}
                        className="text-blue-400 hover:bg-blue-900 p-1 rounded transition-colors"
                        title="جزئیات"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>هیچ کاربری بر اساس فیلترهای انتخابی یافت نشد</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* صفحه‌بندی */}
        {userTotalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-600">
            <button
              onClick={() => setUserFilters({...userFilters, currentPage: Math.max(1, userFilters.currentPage - 1)})}
              disabled={userFilters.currentPage === 1}
              className={`px-3 py-2 rounded-lg ${
                userFilters.currentPage === 1 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              قبلی
            </button>
            
            <div className="flex gap-1">
              {[...Array(Math.min(5, userTotalPages))].map((_, i) => {
                let pageNumber;
                if (userTotalPages <= 5) {
                  pageNumber = i + 1;
                } else if (userFilters.currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (userFilters.currentPage >= userTotalPages - 2) {
                  pageNumber = userTotalPages - 4 + i;
                } else {
                  pageNumber = userFilters.currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setUserFilters({...userFilters, currentPage: pageNumber})}
                    className={`px-3 py-2 rounded-lg ${
                      userFilters.currentPage === pageNumber
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setUserFilters({...userFilters, currentPage: Math.min(userTotalPages, userFilters.currentPage + 1)})}
              disabled={userFilters.currentPage === userTotalPages}
              className={`px-3 py-2 rounded-lg ${
                userFilters.currentPage === userTotalPages
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              بعدی
            </button>
          </div>
        )}
      </div>

      {/* مودال جزئیات کاربر */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-4 rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">جزئیات کاربر</h3>
              <button onClick={() => setSelectedUser(null)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">شماره تلفن</p>
                  <p className="text-white text-lg font-semibold">{selectedUser.phone}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">وضعیت حساب</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm mt-1 ${
                    selectedUser.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {selectedUser.status === 'active' ? 'فعال' : 'مسدود'}
                  </span>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">نوع اشتراک</p>
                  <p className="text-white text-lg font-semibold">{selectedUser.subscription}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">تاریخ عضویت</p>
                  <p className="text-white text-lg font-semibold">{selectedUser.joinDate}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">آخرین فعالیت</p>
                  <p className="text-white text-lg font-semibold">{selectedUser.lastActive}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">تعداد تخلفات</p>
                  <p className="text-white text-lg font-semibold">{selectedUser.violations} تخلف</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-white font-semibold mb-3">آمار فعالیت</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">تعداد چت‌ها:</span>
                      <span className="text-white">{selectedUser.totalChats}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">گزارش‌های داده شده:</span>
                      <span className="text-white">{selectedUser.reportsMade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">گزارش‌های دریافتی:</span>
                      <span className="text-white">{selectedUser.reportsReceived}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-white font-semibold mb-3">آمار دعوت</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">کاربران دعوت شده:</span>
                      <span className="text-white">{selectedUser.invitedUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">جایزه دریافتی:</span>
                      <span className="text-white">{Math.floor(selectedUser.invitedUsers / 5)} ماه</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 justify-end mt-6">
                {selectedUser.status === 'active' ? (
                  <button 
                    onClick={() => {
                      setUsers(users.map(u => u.id === selectedUser!.id ? {...u, status: 'banned'} : u));
                      setSelectedUser({...selectedUser!, status: 'banned'});
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700"
                  >
                    <Ban className="w-4 h-4" />
                    مسدود کردن
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setUsers(users.map(u => u.id === selectedUser!.id ? {...u, status: 'active'} : u));
                      setSelectedUser({...selectedUser!, status: 'active'});
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                    رفع مسدودی
                  </button>
                )}
                <button
                  onClick={() => setSelectedUser(null)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper functions for reports
  const filteredReports = reports.filter(report => {
    const matchesViolationType = reportFilters.violationType === 'all' || report.violationType === reportFilters.violationType;
    const matchesReasonType = reportFilters.reasonType === 'all' || report.reason === reportFilters.reasonType;
    return matchesViolationType && matchesReasonType;
  });

  const totalPages = Math.ceil(filteredReports.length / reportFilters.itemsPerPage);
  const startIndex = (reportFilters.currentPage - 1) * reportFilters.itemsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, startIndex + reportFilters.itemsPerPage);

  const handleManualBan = () => {
    if (manualBanSettings.phoneNumber.trim()) {
      alert(`کاربر ${manualBanSettings.phoneNumber} به طور دستی مسدود شد`);
      setManualBanSettings({...manualBanSettings, phoneNumber: ''});
    }
  };

  // Reports Management
  const renderReports = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">مدیریت گزارشات</h2>

      {/* تنظیمات مسدودی دستی */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">تنظیمات مسدودی دستی</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="شماره تلفن کاربر"
                value={manualBanSettings.phoneNumber}
                onChange={(e) => setManualBanSettings({...manualBanSettings, phoneNumber: e.target.value})}
                className="flex-1 bg-gray-700 text-white p-3 rounded-lg"
              />
              <button 
                onClick={handleManualBan}
                className="bg-red-600 text-white px-4 py-3 rounded-lg flex items-center gap-2"
              >
                <Ban className="w-4 h-4" />
                مسدودی
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">حداکثر گزارش در روز:</label>
              <input
                type="number"
                value={manualBanSettings.maxReportsPerDay}
                onChange={(e) => setManualBanSettings({...manualBanSettings, maxReportsPerDay: parseInt(e.target.value)})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
                min="1"
                max="100"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2">مسدودی اول (روز):</label>
                <input
                  type="number"
                  value={manualBanSettings.firstBanDuration}
                  onChange={(e) => setManualBanSettings({...manualBanSettings, firstBanDuration: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 text-white p-3 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">مسدودی دوم (روز):</label>
                <input
                  type="number"
                  value={manualBanSettings.secondBanDuration}
                  onChange={(e) => setManualBanSettings({...manualBanSettings, secondBanDuration: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 text-white p-3 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* فیلترها و جستجو */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">فیلتر گزارشات</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-300 mb-2">مدت تخلف:</label>
            <select
              value={reportFilters.violationType}
              onChange={(e) => setReportFilters({...reportFilters, violationType: e.target.value, currentPage: 1})}
              className="w-full bg-gray-700 text-white p-3 rounded-lg"
            >
              <option value="all">همه موارد</option>
              <option value="temporary">زمان‌دار</option>
              <option value="permanent">دائم</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2">نوع تخلف:</label>
            <select
              value={reportFilters.reasonType}
              onChange={(e) => setReportFilters({...reportFilters, reasonType: e.target.value, currentPage: 1})}
              className="w-full bg-gray-700 text-white p-3 rounded-lg"
            >
              <option value="all">همه عناوین</option>
              <option value="محتوای نامناسب">محتوای نامناسب</option>
              <option value="زبان نامناسب">زبان نامناسب</option>
              <option value="رفتار غیراخلاقی">رفتار غیراخلاقی</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2">تعداد نمایش:</label>
            <select
              value={reportFilters.itemsPerPage}
              onChange={(e) => setReportFilters({...reportFilters, itemsPerPage: parseInt(e.target.value), currentPage: 1})}
              className="w-full bg-gray-700 text-white p-3 rounded-lg"
            >
              <option value={10}>10 مورد</option>
              <option value={20}>20 مورد</option>
              <option value={50}>50 مورد</option>
            </select>
          </div>
        </div>
      </div>

      {/* لیست گزارشات */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">لیست گزارشات ({filteredReports.length} مورد)</h3>
          <p className="text-gray-400">صفحه {reportFilters.currentPage} از {totalPages}</p>
        </div>
        
        <div className="space-y-3">
          {paginatedReports.length > 0 ? paginatedReports.map(report => (
            <div key={report.id} className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-white font-semibold">گزارش‌دهنده: {report.reporter}</p>
                      <p className="text-gray-300">گزارش‌شده: {report.reported}</p>
                    </div>
                    <div>
                      <p className="text-gray-300">دلیل: {report.reason}</p>
                      <p className="text-gray-400 text-sm">تاریخ: {report.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-3">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      report.violationType === 'temporary' ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
                    }`}>
                      {report.violationType === 'temporary' ? 'زمان‌دار' : 'دائم'}
                    </span>
                    
                    <span className="px-2 py-1 bg-gray-600 text-white rounded text-xs">
                      مجازات: {report.punishment === '24h' ? '24 ساعته' : 
                               report.punishment === '48h' ? '48 ساعته' : 'دائم'}
                    </span>
                    
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      report.status === 'pending' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'
                    }`}>
                      {report.status === 'pending' ? 'در انتظار' : 'حل شده'}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => setSelectedReport(report)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1 hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    جزئیات
                  </button>
                  {report.violationType === 'permanent' && (
                    <button className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors">
                      رفع مسدودی
                    </button>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center text-gray-400 py-8">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>هیچ گزارشی بر اساس فیلترهای انتخابی یافت نشد</p>
            </div>
          )}
        </div>
        
        {/* صفحه‌بندی */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-600">
            <button
              onClick={() => setReportFilters({...reportFilters, currentPage: Math.max(1, reportFilters.currentPage - 1)})}
              disabled={reportFilters.currentPage === 1}
              className={`px-3 py-2 rounded-lg ${
                reportFilters.currentPage === 1 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              قبلی
            </button>
            
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setReportFilters({...reportFilters, currentPage: i + 1})}
                  className={`px-3 py-2 rounded-lg ${
                    reportFilters.currentPage === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setReportFilters({...reportFilters, currentPage: Math.min(totalPages, reportFilters.currentPage + 1)})}
              disabled={reportFilters.currentPage === totalPages}
              className={`px-3 py-2 rounded-lg ${
                reportFilters.currentPage === totalPages
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              بعدی
            </button>
          </div>
        )}
      </div>

      {/* مودال جزئیات گزارش */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">جزئیات گزارش</h3>
              <button 
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* اطلاعات اصلی گزارش */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-white font-semibold mb-3">اطلاعات گزارش</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">شماره گزارش:</p>
                    <p className="text-white">#{selectedReport.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">تاریخ گزارش:</p>
                    <p className="text-white">{selectedReport.date}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">نوع تخلف:</p>
                    <p className="text-white">{selectedReport.reason}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">وضعیت:</p>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      selectedReport.status === 'pending' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'
                    }`}>
                      {selectedReport.status === 'pending' ? 'در انتظار بررسی' : 'بررسی شده'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* اطلاعات گزارش‌دهنده */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-white font-semibold mb-3">گزارش‌دهنده</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">شماره تلفن:</p>
                    <p className="text-white">{selectedReport.reporter}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">تعداد گزارش‌های ارسالی:</p>
                    <p className="text-white">12 گزارش</p>
                  </div>
                </div>
              </div>
              
              {/* اطلاعات گزارش‌شده */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-white font-semibold mb-3">کاربر گزارش‌شده</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">شماره تلفن:</p>
                    <p className="text-white">{selectedReport.reported}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">تعداد گزارش‌های دریافتی:</p>
                    <p className="text-white">3 گزارش</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">سابقه تخلف:</p>
                    <p className="text-white">2 مورد</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">وضعیت کنونی:</p>
                    <span className="px-2 py-1 bg-red-500 text-white rounded text-xs">مسدود شده</span>
                  </div>
                </div>
              </div>
              
              {/* مجازات اعمال شده */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-white font-semibold mb-3">مجازات اعمال شده</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">نوع مجازات:</p>
                    <p className="text-white">
                      {selectedReport.punishment === '24h' ? 'محدودیت 24 ساعته' :
                       selectedReport.punishment === '48h' ? 'محدودیت 48 ساعته' : 'مسدودی دائم'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">تاریخ اعمال:</p>
                    <p className="text-white">{selectedReport.date}</p>
                  </div>
                  {selectedReport.punishment !== 'permanent' && (
                    <div>
                      <p className="text-gray-400 text-sm">تاریخ پایان:</p>
                      <p className="text-white">1402/08/22</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-400 text-sm">پیام ارسالی به کاربر:</p>
                    <p className="text-white text-sm">شما به دلیل {selectedReport.reason} مسدود شدید</p>
                  </div>
                </div>
              </div>
              
              {/* دکمه‌های عملیات */}
              <div className="flex justify-end gap-3">
                {selectedReport.violationType === 'permanent' && (
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
                    <Check className="w-4 h-4" />
                    رفع مسدودی
                  </button>
                )}
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700">
                  <Ban className="w-4 h-4" />
                  مسدودی دائم
                </button>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Branding (App Icon) Management
  const [brandingUploading, setBrandingUploading] = useState(false);
  const [brandingError, setBrandingError] = useState('');
  const [brandingPreviewUrl, setBrandingPreviewUrl] = useState<string>('/api/branding/icon');

  useEffect(() => {
    // Bust cache when entering branding section
    if (activeSection === 'branding') {
      setBrandingPreviewUrl(`/api/branding/icon?ts=${Date.now()}`);
    }
  }, [activeSection]);

  const renderBranding = () => {

    const handleFileSelected = async (file: File) => {
      setBrandingError('');
      if (!file) return;
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        setBrandingError('فرمت تصویر باید PNG یا JPEG باشد');
        return;
      }
      const form = new FormData();
      form.append('icon', file);
      try {
        setBrandingUploading(true);
        const res = await fetch('/api/branding/icon', { method: 'POST', body: form });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data && (data.message || data.error)) || 'Upload failed');
        }
        setBrandingPreviewUrl(`/api/branding/icon?ts=${Date.now()}`);
      } catch (e: any) {
        setBrandingError(e?.message || 'خطا در آپلود آیکون');
      } finally {
        setBrandingUploading(false);
      }
    };

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">مدیریت آیکون برنامه</h2>
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-white font-semibold mb-3">آیکون فعلی</h3>
              <div className="bg-gray-700 rounded-lg p-4 flex items-center justify-center" style={{minHeight: 180}}>
                <img src={brandingPreviewUrl} alt="App Icon" className="w-32 h-32 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <p className="text-gray-400 text-xs mt-2">از آیکون 1024x1024 با پس‌زمینه شفاف استفاده کنید</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">آپلود آیکون جدید</h3>
              <label htmlFor="icon-upload" className="block bg-gray-700 hover:bg-gray-600 cursor-pointer p-6 rounded-lg text-center border-2 border-dashed border-gray-600">
                <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <div className="text-gray-200">انتخاب فایل تصویر</div>
                <div className="text-gray-400 text-xs mt-1">PNG یا JPEG</div>
              </label>
              <input id="icon-upload" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelected(f); }} />
              {brandingUploading && <div className="text-blue-400 text-sm mt-3">در حال آپلود...</div>}
              {brandingError && <div className="text-red-400 text-sm mt-3">{brandingError}</div>}
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mt-6 text-blue-200 text-sm">
            بعد از آپلود آیکون، هنگام بیلد در Android Studio آیکون‌ها به صورت خودکار ساخته و جایگزین می‌شوند.
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <button 
            onClick={() => {
              // Save branding settings
              alert('تنظیمات آیکون ذخیره شد');
            }}
            className="bg-green-600 text-white px-8 py-3 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
          >
            <Save className="w-5 h-5" />
            ذخیره تنظیمات
          </button>
        </div>
      </div>
    );
  };

  // Server Management
  const renderServer = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">مدیریت سرور</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-4 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-2">استفاده CPU</h3>
          <div className="text-3xl font-bold text-blue-400">45%</div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{width: '45%'}}></div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-2">استفاده RAM</h3>
          <div className="text-3xl font-bold text-green-400">68%</div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div className="bg-green-500 h-2 rounded-full" style={{width: '68%'}}></div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-2">فضای دیسک</h3>
          <div className="text-3xl font-bold text-yellow-400">32%</div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div className="bg-yellow-500 h-2 rounded-full" style={{width: '32%'}}></div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-2">ترافیک شبکه</h3>
          <div className="text-3xl font-bold text-purple-400">156MB/s</div>
          <div className="text-gray-400 text-sm mt-1">آپلود: 45MB/s</div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">وضعیت سرویس‌ها</h3>
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
    { key: 'branding', label: 'آیکون برنامه', icon: Image },
    { key: 'server', label: 'مدیریت سرور', icon: Zap }
  ];

  // دریافت اطلاعات ادمین
  const adminInfo = getAdminInfo();

  // Handle logout
  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  // Close menu when clicking outside
  const handleOverlayClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900" dir="rtl">
      {/* Header with hamburger menu */}
      <header className="bg-gray-800/90 backdrop-blur-lg border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white hover:text-blue-400 transition-colors p-2"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-400" />
            پنل مدیریت
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          {adminInfo && (
            <div className="text-gray-300 text-sm hidden sm:block">
              ادمین: {adminInfo.phone}
            </div>
          )}
          <div className="text-gray-400 text-xs hidden md:block">
            چت تصویری تصادفی
          </div>
          <button
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 transition-colors p-1"
            title="خروج از پنل"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar / Mobile menu */}
      <nav className={`fixed top-0 right-0 h-full w-64 bg-gray-800/95 backdrop-blur-lg border-l border-gray-700 transform transition-transform duration-300 z-50 ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">منو</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-1">
          {sidebarItems.map(item => (
            <button
              key={item.key}
              onClick={() => {
                setActiveSection(item.key);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-right text-sm ${
                activeSection === item.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
          
          {/* Logout button */}
          <div className="border-t border-gray-700 mt-4 pt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-right text-sm text-red-300 hover:bg-red-900/20 hover:text-red-200"
            >
              <LogOut className="w-4 h-4" />
              خروج از پنل
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-4">
        <div className="max-w-full">
          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'subscriptions' && renderSubscriptions()}
          {activeSection === 'messages' && renderMessages()}
          {activeSection === 'rules' && renderRules()}
          {activeSection === 'features' && renderFeatures()}
          {activeSection === 'users' && renderUsers()}
          {activeSection === 'reports' && renderReports()}
          {activeSection === 'branding' && renderBranding()}
          {activeSection === 'server' && renderServer()}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
