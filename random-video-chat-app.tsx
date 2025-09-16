import React, { useState, useRef, useEffect } from 'react';
import { Camera, Mic, MicOff, Phone, PhoneOff, Users, Settings, Gift, Shield, MessageCircle, Heart, Flag, Lock, RotateCcw, Menu, X, Play, Pause, Send, Home, UserPlus } from 'lucide-react';
import NotificationPopup from './notification-popup';
import FriendsInvitationPopup from './friends-invitation-popup';
import SearchGlobe from '@components/SearchGlobe';
import { demoUsers } from '@/data/demoUsers';
import { useAuth } from '@/hooks/useAuth';

type ChatMessage = { text: string; sender: 'me' | 'other'; time: string };
type Report = { reason: string; time: Date; userId: string };

const SEARCH_SCAN_MS = 2200; // زمان اسکن رادار قبل از یافتن کاربر (میلی‌ثانیه)
const FOUND_HOLD_MS = 1200;  // مکث پس از یافتن کاربر
const FADE_MS = 400;         // خروج نرم

const RandomVideoChatApp = () => {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [subscriptionDays, setSubscriptionDays] = useState(0);
  const [lockCount, setLockCount] = useState(3);
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);
  const [reports, setReports] = useState<Report[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Control embedded popups to show only on chat page and auto-hide after viewing
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [popupsShownOnce, setPopupsShownOnce] = useState(false);
  const [searchPhase, setSearchPhase] = useState<'idle' | 'scanning' | 'found'>('idle');
  const [fadeOutSearch, setFadeOutSearch] = useState(false);
  const timersRef = useRef<number[]>([]);

  // Mock user data
  const currentUser = {
    phone: phoneNumber,
    subscription: subscriptionDays > 0,
    subscriptionDays: subscriptionDays,
    lockCount: lockCount,
    isVip: subscriptionDays > 0
  };

  useEffect(() => {
    if (lockCountdown > 0) {
      const timer = setTimeout(() => {
        setLockCountdown(lockCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isLocked) {
      setIsLocked(false);
    }
  }, [lockCountdown, isLocked]);

  const handleLogin = () => {
    if (phoneNumber.length >= 10) {
      setCurrentScreen('verify');
    }
  };

  const { login } = useAuth();

  const handleVerify = () => {
    if (verificationCode.length === 4) {
      // Perform demo login to set a JWT-like token for role=user
      try {
        login(phoneNumber, verificationCode);
      } catch {}
      setCurrentScreen('main');
    }
  };

  // پاک‌سازی تایمرها هنگام خروج از کامپوننت یا تغییر صفحه
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t as any));
      timersRef.current = [];
    };
  }, []);

  // When entering main screen first time, auto-open popups and then hide after view
  useEffect(() => {
    if (currentScreen === 'main' && !popupsShownOnce) {
      // Show both popups once; they will auto-hide
      setShowNotifPopup(true);
      setShowInvitePopup(true);
      setPopupsShownOnce(true);
    }
  }, [currentScreen, popupsShownOnce]);

  const startVideoCall = () => {
    // پاک‌سازی تایمرهای قبلی
    timersRef.current.forEach((t) => clearTimeout(t as any));
    timersRef.current = [];

    setIsSearching(true);
    setSearchPhase('scanning');
    setFadeOutSearch(false);

    // مرحله یافتن کاربر
    const tFound = window.setTimeout(() => {
      setSearchPhase('found');
    }, SEARCH_SCAN_MS);

    // شروع خروج نرم پس از مکث
    const tFade = window.setTimeout(() => {
      setFadeOutSearch(true);
    }, SEARCH_SCAN_MS + FOUND_HOLD_MS);

    // تغییر به تماس پس از خروج نرم
    const tCall = window.setTimeout(() => {
      setIsSearching(false);
      setIsCallActive(true);
      setCurrentScreen('call');
      setSearchPhase('idle');
      setFadeOutSearch(false);
    }, SEARCH_SCAN_MS + FOUND_HOLD_MS + FADE_MS);

    timersRef.current.push(tFound, tFade, tCall);
  };

  const endCall = () => {
    setIsCallActive(false);
    setChatMessages([]);
    setCurrentScreen('main');
  };

  const nextUser = () => {
    setIsCallActive(false);
    setChatMessages([]);
    startVideoCall();
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages([...chatMessages, {
        text: newMessage,
        sender: 'me',
        time: new Date().toLocaleTimeString()
      }]);
      setNewMessage('');
      
      // Simulate response
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          text: 'سلام! چطوری؟',
          sender: 'other',
          time: new Date().toLocaleTimeString()
        }]);
      }, 1000);
    }
  };

  const useLock = () => {
    if (lockCount > 0 && !isLocked) {
      setLockCount(lockCount - 1);
      setIsLocked(true);
      setLockCountdown(10);
    }
  };

  const reportUser = (reason: string) => {
    setReports([...reports, {
      reason,
      time: new Date(),
      userId: 'current_user'
    }]);
    setCurrentScreen('main');
  };

  const blockUser = () => {
    setBlockedUsers([...blockedUsers, 'current_user']);
    endCall();
  };

  const inviteFriend = () => {
    // Simulate friend invitation
    alert('لینک دعوت کپی شد!');
  };

  // Login Screen
  if (currentScreen === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-black/80 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md border border-white/10">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">چت تصویری تصادفی</h1>
              <p className="text-gray-300 text-sm">با افراد جدید آشنا شوید</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <input
                  type="tel"
                  placeholder="شماره تلفن"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  dir="ltr"
                />
              </div>
              
              <button
                onClick={handleLogin}
                disabled={phoneNumber.length < 10}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                ورود
              </button>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-gray-400 text-xs">
                با ورود، قوانین استفاده را می‌پذیرید
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Verification Screen
  if (currentScreen === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-black/80 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md border border-white/10">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">تأیید شماره</h1>
              <p className="text-gray-300 text-sm">
                کد ارسال شده به {phoneNumber} را وارد کنید
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="کد 4 رقمی"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.slice(0, 4))}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-center text-2xl tracking-widest"
                  dir="ltr"
                />
              </div>
              
              <button
                onClick={handleVerify}
                disabled={verificationCode.length !== 4}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                تأیید
              </button>
              
              <button
                onClick={() => setCurrentScreen('login')}
                className="w-full text-gray-400 py-2 text-sm hover:text-white transition-colors"
              >
                بازگشت
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Screen
  if (currentScreen === 'main') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-lg">
          <button 
            onClick={() => setShowMenu(true)}
            className="text-white p-2"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-white font-bold text-lg">چت تصویری</h1>
          <div className="w-6"></div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="bg-black/40 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md border border-white/10 text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-red-500 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Camera className="w-12 h-12 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">آماده چت؟</h2>
            <p className="text-gray-300 mb-8">
              با زدن دکمه شروع، با یک نفر تصادفی ارتباط برقرار کنید
            </p>

            {isSearching ? (
              <div className={`space-y-4 ${fadeOutSearch ? 'animate-fadeOutSoft' : ''}`}>
                <SearchGlobe users={demoUsers} durationMs={SEARCH_SCAN_MS} />
                {searchPhase === 'found' && (
                  <div className="mt-3 text-green-400 text-sm font-bold">کاربر پیدا شد!</div>
                )}
              </div>
            ) : (
              <button
                onClick={startVideoCall}
                className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-4 rounded-xl font-bold text-lg hover:from-pink-600 hover:to-red-600 transition-all transform hover:scale-105"
              >
                شروع چت
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="mt-8 flex gap-4 text-center">
            <div className="bg-black/40 backdrop-blur-lg rounded-xl p-4 border border-white/10">
              <div className="text-yellow-400 font-bold text-xl">{subscriptionDays}</div>
              <div className="text-gray-300 text-sm">روز اشتراک</div>
            </div>
            <div className="bg-black/40 backdrop-blur-lg rounded-xl p-4 border border-white/10">
              <div className="text-blue-400 font-bold text-xl">{lockCount}</div>
              <div className="text-gray-300 text-sm">قفل باقی‌مانده</div>
            </div>
          </div>
        </div>

        {/* Embedded Popups on Chat Page */}
        <NotificationPopup embedded open={showNotifPopup} onOpenChange={setShowNotifPopup} autoHideOnView />
        <FriendsInvitationPopup embedded open={showInvitePopup} onOpenChange={setShowInvitePopup} autoHideOnView />

        {/* Side Menu */}
        {showMenu && (
          <div className="fixed inset-0 bg-black/50 z-50">
            <div className="bg-gray-900 w-80 h-full p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-white text-xl font-bold">منو</h2>
                <button 
                  onClick={() => setShowMenu(false)}
                  className="text-white p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => {
                    setCurrentScreen('subscription');
                    setShowMenu(false);
                  }}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-4 rounded-xl flex items-center gap-3"
                >
                  <Gift className="w-6 h-6" />
                  <span>خرید اشتراک</span>
                </button>

                <button 
                  onClick={() => {
                    setCurrentScreen('friends');
                    setShowMenu(false);
                  }}
                  className="w-full bg-gray-800 text-white p-4 rounded-xl flex items-center gap-3"
                >
                  <UserPlus className="w-6 h-6" />
                  <span>معرفی به دوستان</span>
                </button>

                <button 
                  onClick={() => {
                    setCurrentScreen('rules');
                    setShowMenu(false);
                  }}
                  className="w-full bg-gray-800 text-white p-4 rounded-xl flex items-center gap-3"
                >
                  <Shield className="w-6 h-6" />
                  <span>قوانین</span>
                </button>

                <button 
                  onClick={() => {
                    setCurrentScreen('profile');
                    setShowMenu(false);
                  }}
                  className="w-full bg-gray-800 text-white p-4 rounded-xl flex items-center gap-3"
                >
                  <Settings className="w-6 h-6" />
                  <span>پروفایل</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Video Call Screen
  if (currentScreen === 'call') {
    return (
      <div className="min-h-screen bg-gray-100 relative overflow-hidden">
        {/* Main Container */}
        <div className="h-screen flex flex-col">
          
          {/* Video Area - Takes most of the screen */}
          <div className="flex-1 relative bg-gradient-to-br from-gray-800 to-gray-900">
            {/* Simulated Remote User Video Background */}
            <div className="w-full h-full flex items-center justify-center">
              {/* Show camera off state if camera is disabled */}
              {!isCameraOn ? (
                <div className="text-center">
                  <div className="w-32 h-32 bg-red-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Camera className="w-16 h-16 text-red-400" />
                  </div>
                  <p className="text-gray-400">دوربین خاموش است</p>
                </div>
              ) : (
                <div className="w-32 h-32 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center animate-pulse">
                  <Camera className="w-16 h-16 text-white" />
                </div>
              )}
              
              {/* Mic Status Indicator */}
              {!isMicOn && (
                <div className="absolute top-4 right-4 bg-red-500 px-3 py-1 rounded-full flex items-center gap-2">
                  <MicOff className="w-4 h-4 text-white" />
                  <span className="text-white text-sm">میکروفون خاموش</span>
                </div>
              )}
            </div>
            

            {/* Side Control Buttons */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 space-y-3">
              {/* Microphone Toggle */}
              <button 
                onClick={() => setIsMicOn(!isMicOn)}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
                }`}
                title={isMicOn ? 'خاموش کردن میکروفون' : 'روشن کردن میکروفون'}
              >
                {isMicOn ? <Mic className="w-6 h-6 text-white" /> : <MicOff className="w-6 h-6 text-white" />}
              </button>
              
              {/* Camera Toggle */}
              <button
                onClick={() => setIsCameraOn(!isCameraOn)}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  isCameraOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
                }`}
                title={isCameraOn ? 'خاموش کردن دوربین' : 'روشن کردن دوربین'}
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
              
              {/* Gift Button */}
              <button 
                onClick={() => {
                  alert('🎁 ارسال هدیه به کاربر!\nاین قابلیت به زودی فعال می‌شود.');
                }}
                className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                title="ارسال هدیه"
              >
                <Gift className="w-6 h-6 text-white" />
              </button>
              
              {/* Instagram Style */}
              <button 
                onClick={() => {
                  alert('📸 اشتراک‌گذاری در اینستاگرام');
                }}
                className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                title="اشتراک در اینستاگرام"
              >
                <Heart className="w-6 h-6 text-white" />
              </button>
              
              {/* Telegram Style */}
              <button 
                onClick={() => {
                  alert('💬 اشتراک‌گذاری در تلگرام');
                }}
                className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                title="اشتراک در تلگرام"
              >
                <MessageCircle className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Block/Report Button - Left Bottom */}
            <button 
              onClick={blockUser}
              className="absolute left-4 bottom-4 w-12 h-12 bg-red-500/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
            >
              <X className="w-7 h-7 text-white" style={{ transform: 'rotate(45deg)' }} />
            </button>
          </div>

          {/* Chat & Controls Section - Bottom */}
          <div className="bg-white shadow-2xl">
            {/* Chat Messages */}
            <div className="px-4 py-3 max-h-40 overflow-y-auto bg-gray-50">
              {chatMessages.length > 0 ? (
                <div className="space-y-2">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-3 py-1.5 rounded-2xl max-w-[70%] ${
                        msg.sender === 'me' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 text-sm py-2">
                  شروع چت با ارسال پیام
                </div>
              )}
            </div>

            {/* Bottom Control Bar */}
            <div className="bg-white border-t border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                
                {/* Left: Small Video Preview & Input */}
                <div className="flex items-center gap-3 flex-1">
                  {/* Self Video Preview */}
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <div className="w-full h-full flex items-center justify-center">
                      {isCameraOn ? (
                        <Camera className="w-6 h-6 text-gray-400" />
                      ) : (
                        <div className="bg-red-500/20 w-full h-full flex items-center justify-center">
                          <Camera className="w-6 h-6 text-red-400" />
                        </div>
                      )}
                    </div>
                    {/* Status Icons */}
                    <div className="absolute bottom-0.5 left-0.5 flex gap-1">
                      {isCameraOn && <span className="text-xs">📹</span>}
                      {!isMicOn && <span className="text-xs">🔇</span>}
                    </div>
                  </div>
                  
                  {/* Message Input */}
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="پیام خود را بنویسید..."
                    className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    dir="rtl"
                  />
                </div>

                {/* Right: Control Buttons */}
                <div className="flex items-center gap-2">
                  {/* End Call Button */}
                  <button
                    onClick={endCall}
                    className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <div className="w-6 h-6 bg-white rounded"></div>
                  </button>
                  
                  {/* Next User Button */}
                  <button
                    onClick={nextUser}
                    className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors"
                  >
                    <Play className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side Menu - Reuse existing */}
        {showMenu && (
          <div className="fixed inset-0 bg-black/50 z-50">
            <div className="bg-gray-900 w-80 h-full p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-white text-xl font-bold">منو</h2>
                <button 
                  onClick={() => setShowMenu(false)}
                  className="text-white p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <button 
                  onClick={() => {
                    setCurrentScreen('main');
                    setShowMenu(false);
                  }}
                  className="w-full bg-gray-800 text-white p-4 rounded-xl flex items-center gap-3"
                >
                  <Home className="w-6 h-6" />
                  <span>صفحه اصلی</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Report Screen
  if (currentScreen === 'report') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="bg-black/80 backdrop-blur-lg rounded-3xl p-6 border border-white/10">
            <h2 className="text-white text-xl font-bold mb-6 text-center">گزارش تخلف</h2>
            
            <div className="space-y-3">
              {['محتوای نامناسب', 'زبان نامناسب', 'رفتار غیراخلاقی', 'هرزنگاری', 'سایر موارد'].map((reason) => (
                <button
                  key={reason}
                  onClick={() => reportUser(reason)}
                  className="w-full bg-gray-800 text-white p-4 rounded-xl text-right hover:bg-gray-700 transition-colors"
                >
                  {reason}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentScreen('call')}
              className="w-full mt-6 bg-gray-600 text-white py-3 rounded-xl"
            >
              بازگشت
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Subscription Screen
  if (currentScreen === 'subscription') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="bg-black/80 backdrop-blur-lg rounded-3xl p-6 border border-white/10">
            <h2 className="text-white text-xl font-bold mb-6 text-center">خرید اشتراک</h2>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-4 rounded-xl">
                <h3 className="text-white font-bold mb-2">اشتراک یک ماهه</h3>
                <p className="text-white/90 text-sm mb-3">
                  • تصویر با کیفیت بالا
                  • قابلیت قفل ۱۰ ثانیه‌ای
                  • بدون محدودیت زمانی
                </p>
                <div className="text-white font-bold text-lg">۱۵۰,۰۰۰ تومان</div>
                <button 
                  onClick={() => alert('به درگاه پرداخت منتقل می‌شوید')}
                  className="w-full bg-white text-orange-600 py-2 rounded-lg mt-3 font-bold"
                >
                  خرید
                </button>
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-xl">
                <h3 className="text-white font-bold mb-2">اشتراک شش ماهه</h3>
                <p className="text-white/90 text-sm mb-3">
                  • تمام مزایای ماهانه
                  • ۳۰٪ تخفیف
                  • پشتیبانی اولویت‌دار
                </p>
                <div className="text-white font-bold text-lg">۶۳۰,۰۰۰ تومان</div>
                <button 
                  onClick={() => alert('به درگاه پرداخت منتقل می‌شوید')}
                  className="w-full bg-white text-purple-600 py-2 rounded-lg mt-3 font-bold"
                >
                  خرید
                </button>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-teal-600 p-4 rounded-xl">
                <h3 className="text-white font-bold mb-2">اشتراک سالانه</h3>
                <p className="text-white/90 text-sm mb-3">
                  • تمام مزایای ماهانه
                  • ۵۰٪ تخفیف
                  • قفل نامحدود
                </p>
                <div className="text-white font-bold text-lg">۹۰۰,۰۰۰ تومان</div>
                <button 
                  onClick={() => alert('به درگاه پرداخت منتقل می‌شوید')}
                  className="w-full bg-white text-green-600 py-2 rounded-lg mt-3 font-bold"
                >
                  خرید
                </button>
              </div>
            </div>
            
            <button
              onClick={() => setCurrentScreen('main')}
              className="w-full mt-6 bg-gray-600 text-white py-3 rounded-xl"
            >
              بازگشت
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Friends/Invitation Screen
  if (currentScreen === 'friends') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="bg-black/80 backdrop-blur-lg rounded-3xl p-6 border border-white/10">
            <h2 className="text-white text-xl font-bold mb-6 text-center">معرفی به دوستان</h2>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-300 text-sm">
                دوستان خود را دعوت کنید و اشتراک رایگان بگیرید!
              </p>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-xl mb-6">
              <h3 className="text-white font-bold mb-2">مزایای دعوت:</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• به ازای هر ۵ دعوت، ۱ ماه اشتراک رایگان</li>
                <li>• دوستان شما ۱۰٪ تخفیف دریافت می‌کنند</li>
                <li>• امتیاز ویژه برای کاربران فعال</li>
              </ul>
            </div>

            <button
              onClick={inviteFriend}
              className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-4 rounded-xl font-bold mb-4"
            >
              ارسال لینک دعوت
            </button>

            <div className="bg-gray-800/30 p-4 rounded-xl">
              <h4 className="text-white font-bold mb-2">دوستان دعوت شده</h4>
              <p className="text-gray-400 text-sm">هنوز کسی را دعوت نکرده‌اید</p>
            </div>
            
            <button
              onClick={() => setCurrentScreen('main')}
              className="w-full mt-6 bg-gray-600 text-white py-3 rounded-xl"
            >
              بازگشت
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Rules Screen
  if (currentScreen === 'rules') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="bg-black/80 backdrop-blur-lg rounded-3xl p-6 border border-white/10">
            <h2 className="text-white text-xl font-bold mb-6 text-center">قوانین استفاده</h2>
            
            <div className="space-y-4 text-gray-300 text-sm">
              <div>
                <h3 className="text-white font-bold mb-2">قوانین عمومی:</h3>
                <ul className="space-y-1">
                  <li>• احترام به سایر کاربران الزامی است</li>
                  <li>• استفاده از زبان نامناسب ممنوع</li>
                  <li>• ارسال محتوای غیراخلاقی مجاز نیست</li>
                  <li>• هرگونه تبلیغات تجاری ممنوع</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-white font-bold mb-2">مجازات‌ها:</h3>
                <ul className="space-y-1">
                  <li>• تخلف اول: هشدار</li>
                  <li>• تخلف دوم: محدودیت ۲۴ ساعته</li>
                  <li>• تخلف سوم: محدودیت دائم</li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-bold mb-2">حریم خصوصی:</h3>
                <ul className="space-y-1">
                  <li>• اطلاعات شما محرمانه نگهداری می‌شود</li>
                  <li>• امکان گزارش کاربران متخلف</li>
                  <li>• حق مسدود کردن سایر کاربران</li>
                </ul>
              </div>
            </div>
            
            <button
              onClick={() => setCurrentScreen('main')}
              className="w-full mt-6 bg-gray-600 text-white py-3 rounded-xl"
            >
              بازگشت
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Profile Screen
  if (currentScreen === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="bg-black/80 backdrop-blur-lg rounded-3xl p-6 border border-white/10">
            <h2 className="text-white text-xl font-bold mb-6 text-center">پروفایل کاربری</h2>
            
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {phoneNumber.slice(-2)}
                </span>
              </div>
              <p className="text-white font-medium">{phoneNumber}</p>
              <p className="text-gray-400 text-sm">
                {currentUser.subscription ? `اشتراک فعال (${subscriptionDays} روز)` : 'کاربر عادی'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-800/50 p-4 rounded-xl">
                <h3 className="text-white font-bold mb-2">آمار حساب:</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-blue-400 font-bold text-lg">{lockCount}</div>
                    <div className="text-gray-400 text-sm">قفل باقی‌مانده</div>
                  </div>
                  <div>
                    <div className="text-green-400 font-bold text-lg">{friends.length}</div>
                    <div className="text-gray-400 text-sm">دوست دعوت شده</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => alert('تغییر شماره در حال حاضر امکان‌پذیر نیست')}
                className="w-full bg-gray-700 text-white p-3 rounded-xl text-right"
              >
                تغییر شماره تلفن
              </button>

              <button
                onClick={() => {
                  if (confirm('آیا مطمئن هستید؟')) {
                    setCurrentScreen('login');
                    setPhoneNumber('');
                    setVerificationCode('');
                  }
                }}
                className="w-full bg-red-600 text-white p-3 rounded-xl text-right"
              >
                خروج از حساب
              </button>
            </div>
            
            <button
              onClick={() => setCurrentScreen('main')}
              className="w-full mt-6 bg-gray-600 text-white py-3 rounded-xl"
            >
              بازگشت
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default RandomVideoChatApp;