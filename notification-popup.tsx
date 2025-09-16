import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bell, X, Mail, MailOpen, Trash2, Settings, Check, AlertTriangle, Gift, Users, Shield, Star, Clock, ChevronRight } from 'lucide-react';

interface NotificationPopupProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  autoHideOnView?: boolean;
  embedded?: boolean; // when true, do not render trigger or page wrapper, only the modal overlay
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ open, onOpenChange, autoHideOnView = false, embedded = false }) => {
  const isControlled = typeof open === 'boolean';
  const [internalOpen, setInternalOpen] = useState(false);
  const showPopup = isControlled ? (open as boolean) : internalOpen;
  const setShowPopup = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    if (!isControlled) setInternalOpen(v);
  };

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'message',
      title: 'پیامی برای شما',
      message: 'از طرف مدیر سیستم پیام دریافت کرده اید. لطفاً به بخش پیام ها مراجعه کنید.',
      time: '5 دقیقه پیش',
      read: false,
      sender: 'مدیر سیستم',
      phone: '1405/08/02',
      icon: '💌',
      priority: 'high'
    },
    {
      id: 2,
      type: 'subscription',
      title: 'اشتراک تمدید شد',
      message: 'اشتراک یک ماهه شما با موفقیت تمدید شد. از ویژگی های پیشرفته استفاده کنید.',
      time: '1 ساعت پیش',
      read: false,
      sender: 'سیستم پرداخت',
      phone: '1405/08/02',
      icon: '🎁',
      priority: 'medium'
    },
    {
      id: 3,
      type: 'warning',
      title: 'هشدار امنیتی',
      message: 'تلاش برای ورود غیرمجاز به حساب شما شناسایی شد. در صورت عدم اطلاع لطفاً رمز عبور را تغییر دهید.',
      time: '3 ساعت پیش',
      read: true,
      sender: 'تیم امنیت',
      phone: '1405/08/01',
      icon: '⚠️',
      priority: 'high'
    },
    {
      id: 4,
      type: 'friend',
      title: 'دوست جدید',
      message: 'علی احمدی با استفاده از کد دعوت شما عضو شد. 1 ماه اشتراک رایگان دریافت کردید.',
      time: '6 ساعت پیش',
      read: true,
      sender: 'سیستم دعوت',
      phone: '1405/08/01',
      icon: '👥',
      priority: 'medium'
    },
    {
      id: 5,
      type: 'system',
      title: 'به‌روزرسانی سیستم',
      message: 'نسخه جدید اپلیکیشن منتشر شد. ویژگی های جدید و بهبود عملکرد در دسترس است.',
      time: '1 روز پیش',
      read: true,
      sender: 'تیم توسعه',
      phone: '1405/07/30',
      icon: '🚀',
      priority: 'low'
    }
  ]);

  const [filter, setFilter] = useState('all'); // all, unread, read
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const autoHideTriggered = useRef(false);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'message': return 'from-blue-500 to-blue-600';
      case 'subscription': return 'from-green-500 to-green-600';
      case 'warning': return 'from-red-500 to-red-600';
      case 'friend': return 'from-purple-500 to-purple-600';
      case 'system': return 'from-gray-500 to-gray-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-l-red-500';
      case 'medium': return 'border-l-4 border-l-yellow-500';
      case 'low': return 'border-l-4 border-l-green-500';
      default: return 'border-l-4 border-l-gray-500';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const deleteSelected = () => {
    setNotifications(notifications.filter(n => !selectedNotifications.includes(n.id)));
    setSelectedNotifications([]);
  };

  const toggleSelection = (id: number) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(notifId => notifId !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedNotifications(filteredNotifications.map(n => n.id));
  };

  // Auto-hide behavior when embedded and requested - DISABLED for manual close
  useEffect(() => {
    if (embedded && autoHideOnView && showPopup && !autoHideTriggered.current) {
      autoHideTriggered.current = true;
      // DON'T auto-hide anymore - user must close manually
      // Just mark notification as shown
    }
  }, [embedded, autoHideOnView, showPopup]);

  const modal = (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl w-full max-w-md border border-gray-600 max-h-[80vh] flex flex-col">
        {/* Header - Smaller - Fixed */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 p-4 flex-shrink-0">
          <button
            onClick={() => {
              markAllAsRead();
              setShowPopup(false);
            }}
            className="absolute top-3 left-3 text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30 rounded-full p-1"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-white/20 rounded-full flex items-center justify-center">
              <div className="text-2xl">📨</div>
            </div>
            <h2 className="text-lg font-bold text-white mb-1">پیام‌های جدید</h2>
            <p className="text-white/90 text-xs">
              لطفاً همه پیام‌ها را مطالعه کنید
            </p>
          </div>

          {/* Stats - Smaller */}
          <div className="mt-3 flex justify-center gap-3">
            <div className="bg-white/20 rounded-lg px-3 py-1">
              <div className="text-white font-bold text-sm">{notifications.length}</div>
              <div className="text-white/80 text-xs">کل</div>
            </div>
            <div className="bg-white/20 rounded-lg px-3 py-1">
              <div className="text-yellow-300 font-bold text-sm">{unreadCount}</div>
              <div className="text-white/80 text-xs">جدید</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs - Smaller - Fixed */}
        <div className="flex bg-gray-700/50 flex-shrink-0">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 text-center text-sm font-medium transition-colors focus:outline-none ${
              filter === 'all' 
                ? 'text-blue-400 bg-blue-500/20 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            همه ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-2 text-center text-sm font-medium transition-colors focus:outline-none ${
              filter === 'unread' 
                ? 'text-yellow-400 bg-yellow-500/20 border-b-2 border-yellow-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            جدید ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`flex-1 py-2 text-center text-sm font-medium transition-colors focus:outline-none ${
              filter === 'read' 
                ? 'text-green-400 bg-green-500/20 border-b-2 border-green-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            خوانده ({notifications.length - unreadCount})
          </button>
        </div>

        {/* Action Bar - Smaller - Fixed */}
        <div className="bg-gray-800/50 p-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="text-blue-400 text-xs hover:text-blue-300 focus:outline-none"
            >
              انتخاب همه
            </button>
            {selectedNotifications.length > 0 && (
              <>
                <span className="text-gray-500">|</span>
                <button
                  onClick={deleteSelected}
                  className="text-red-400 text-xs hover:text-red-300 flex items-center gap-1 focus:outline-none"
                >
                  <Trash2 className="w-3 h-3" />
                  حذف
                </button>
              </>
            )}
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-green-400 text-xs hover:text-green-300 flex items-center gap-1 focus:outline-none"
            >
              <Check className="w-3 h-3" />
              خواندن همه
            </button>
          )}
        </div>

        {/* Notifications List - Scrollable */}
        <div className="overflow-y-auto flex-1">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">اعلانی موجود نیست</p>
              <p className="text-xs">همه پیام‌ها خوانده شده</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`bg-gray-700/50 rounded-lg p-3 transition-all hover:bg-gray-600/50 ${
                    !notification.read ? 'bg-blue-900/20' : ''
                  } ${getPriorityBorder(notification.priority)}`}
                >
                  {/* Notification Header - Smaller */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => toggleSelection(notification.id)}
                        className="w-3 h-3 rounded"
                      />
                      
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getTypeColor(notification.type)} flex items-center justify-center text-sm`}>
                        {notification.icon}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold text-sm ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs">{notification.sender}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 text-xs">{notification.time}</span>
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-gray-500 hover:text-red-400 p-0.5 focus:outline-none"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Message Content - Smaller */}
                  <div className="mb-2">
                    <p className={`text-xs leading-relaxed ${!notification.read ? 'text-gray-200' : 'text-gray-400'}`}>
                      {notification.message}
                    </p>
                  </div>

                  {/* Notification Footer - Smaller */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-600 rounded px-1.5 py-0.5 text-xs text-gray-300">
                        <Mail className="w-2.5 h-2.5 inline ml-1" />
                        {notification.phone}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-blue-400 text-xs hover:text-blue-300 flex items-center gap-1 focus:outline-none"
                        >
                          <MailOpen className="w-2.5 h-2.5" />
                          خواندم
                        </button>
                      )}
                      <button className="text-gray-400 hover:text-white focus:outline-none">
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Smaller - Fixed */}
        <div className="bg-gray-800/50 p-2 flex items-center justify-between flex-shrink-0">
          <button className="text-gray-400 hover:text-white flex items-center gap-1 text-xs focus:outline-none">
            <Settings className="w-3 h-3" />
            تنظیمات
          </button>
          
          <div className="text-gray-500 text-xs">
            {unreadCount > 0 ? (
              <span className="text-yellow-400">⚠️ لطفاً همه را بخوانید</span>
            ) : (
              <span className="text-green-400">✓ همه خوانده شد</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );

  if (embedded) {
    return <>{showPopup && modal}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4 flex items-center justify-center">
      {/* Trigger Button */}
      <button
        onClick={() => setShowPopup(true)}
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 flex items-center gap-3 relative"
      >
        <Bell className="w-6 h-6" />
        اعلان‌ها
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
            {unreadCount}
          </div>
        )}
      </button>
      {showPopup && modal}
    </div>
  );
};

export default NotificationPopup;