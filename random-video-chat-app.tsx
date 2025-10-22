import React, { useState, useRef, useEffect } from 'react';
import { Camera, Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Users, User, UserX, Settings, Gift, Shield, MessageCircle, Heart, Flag, Lock, RotateCcw, RefreshCcw, Menu, X, Play, Square, Send, Home, UserPlus, Bell, Mail, Info, Edit3, Save, Smile } from 'lucide-react';
import NotificationPopup from './notification-popup';
import FriendsInvitationPopup from './friends-invitation-popup-simple';
import GiftSubscriptionFlow from './src/components/GiftSubscriptionFlow';
import { useAuth } from '@/hooks/useAuth';
import { publicApi, PublicSubscription, PublicRule, PublicAppSettings } from './src/services/publicApi';
import { uploadSnapshot, submitReport } from './src/services/reportApi';
import { blockUser as apiBlockUser } from './src/services/userApi';
import * as authApi from './src/services/authApi';

type ChatMessage = { text: string; sender: 'me' | 'other'; time: string };
type Report = { reason: string; time: Date; userId: string };

const SEARCH_SCAN_MS = 2200; // زمان اسکن رادار قبل از یافتن کاربر (میلی‌ثانیه)
const FOUND_HOLD_MS = 1200;  // مکث پس از یافتن کاربر
const FADE_MS = 400;         // خروج نرم

const RandomVideoChatApp = () => {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  // Verification resend timer
  const [resendTimer, setResendTimer] = useState(60);
  const [resending, setResending] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isOtherMuted, setIsOtherMuted] = useState(false);
  const [isOtherLocked, setIsOtherLocked] = useState(false);
  const [otherLockTimer, setOtherLockTimer] = useState(0);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [subscriptionDays, setSubscriptionDays] = useState(0);
  const [lockCount, setLockCount] = useState(5); // تعداد قفل پیش‌فرض رایگان
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);
  const [showLockPurchasePopup, setShowLockPurchasePopup] = useState(false);
  const [showLockPurchaseScreen, setShowLockPurchaseScreen] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [lastThreeUsers, setLastThreeUsers] = useState<{id: string, name: string, avatar: string, time: Date}[]>([]);
  const [lastSnapshots, setLastSnapshots] = useState<{id: string, userId?: string, url: string, time: Date}[]>([]);
  const [userBanDuration, setUserBanDuration] = useState<{userId: string, banUntil: Date}[]>([]);
  const [showWatermark, setShowWatermark] = useState(true);
  const [currentChatUser, setCurrentChatUser] = useState<{id: string, name: string, avatar: string} | null>(null);
  const [previousScreen, setPreviousScreen] = useState<string>('login');
  
  // UI helpers
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');

  // Lightweight toast system for non-blocking notifications (e.g., lock actions)
  const [toasts, setToasts] = useState<{ id: number; text: string; type?: 'info' | 'success' | 'error' }[]>([]);
  const showToast = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts(prev => [...prev, { id, text, type }]);
    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };
  
  // وضعیت مسدودی کاربر
  const [userBanStatus, setUserBanStatus] = useState<{isBanned: boolean, banUntil: Date | null, reason: string}>({ isBanned: false, banUntil: null, reason: '' });
  const [showBanPopup, setShowBanPopup] = useState(false);
  
  // Report screen selection (must be top-level for hooks rule)
  const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);
  const [showReportSelect, setShowReportSelect] = useState(false);
  
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: 1,
      title: 'خوش آمدید!',
      message: 'به اپلیکیشن چت تصویری تصادفی خوش آمدید. لطفا قوانین را رعایت کنید.',
      type: 'info',
      read: false,
      date: new Date(),
      hasButton: false
    },
    {
      id: 2,
      title: 'پیشنهاد ویژه! 🔥',
      message: 'جهت استفاده از قابلیت‌های پیشرفته و دریافت قفل اضافی نسبت به خرید اشتراک اقدام نمایید. [BUY_SUBSCRIPTION]',
      type: 'offer',
      read: false,
      date: new Date(),
      hasButton: false
    },
    {
      id: 3,
      title: 'قفل کم آوردید! ⚠️',
      message: 'قفل‌های شما رو به اتمام است. برای ادامه تجربه بهتر و قفل کردن کاربران جذاب، قفل بیشتر بخرید. [BUY_LOCKS]',
      type: 'info',
      read: false,
      date: new Date(),
      hasButton: false
    }
  ]);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Control embedded popups to show only on chat page and auto-hide after viewing
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [popupsShownOnce, setPopupsShownOnce] = useState(false);
  const [searchPhase, setSearchPhase] = useState<'idle' | 'scanning' | 'found'>('idle');
  const [fadeOutSearch, setFadeOutSearch] = useState(false);
  const [remoteVideoAvailable, setRemoteVideoAvailable] = useState(false);
  const [userFoundButNoVideo, setUserFoundButNoVideo] = useState(false);
  const timersRef = useRef<number[]>([]);

  // چرخش کوتاه‌مدت رادار هنگام جستجو
  const [rotateRadar, setRotateRadar] = useState(false);
  useEffect(() => {
    let t: number | null = null;
    if (isSearching) {
      setRotateRadar(true);
      t = window.setTimeout(() => setRotateRadar(false), 7000); // حدود 7 ثانیه بچرخد
    } else {
      setRotateRadar(false);
    }
    return () => { if (t !== null) window.clearTimeout(t); };
  }, [isSearching]);
  
  // اشتراک هدیه
  const [showGiftFlow, setShowGiftFlow] = useState(false);
  
  // مدیریت قوانین
  const [rules, setRules] = useState({
    general: [
      { id: 1, text: 'احترام به سایر کاربران الزامی است', active: true },
      { id: 2, text: 'استفاده از زبان نامناسب ممنوع', active: true },
      { id: 3, text: 'ارسال محتوای غیراخلاقی مجاز نیست', active: true },
      { id: 4, text: 'هرگونه تبلیغات تجاری ممنوع', active: true },
      { id: 5, text: 'ضبط یا اسکرین‌شات بدون اجازه ممنوع', active: true }
    ],
    violations: [
      { id: 1, name: 'محتوای نامناسب', severity: 'high', description: 'نمایش یا ارسال محتوای غیراخلاقی' },
      { id: 2, name: 'زبان نامناسب', severity: 'medium', description: 'استفاده از کلمات رکیک و توهین‌آمیز' },
      { id: 3, name: 'رفتار غیراخلاقی', severity: 'high', description: 'رفتارهای نامناسب و مزاحمت' },
      { id: 4, name: 'هرزنگاری', severity: 'medium', description: 'ارسال پیام‌های مزاحم و غیرضروری' },
      { id: 5, name: 'تبلیغات', severity: 'low', description: 'تبلیغ محصولات یا خدمات تجاری' }
    ],
    punishments: {
      low: { name: 'هشدار', duration: 0, description: 'ارسال هشدار به کاربر' },
      medium: { name: 'محدودیت موقت', duration: 24, description: 'محدودیت دسترسی به مدت ۲۴ ساعت' },
      high: { name: 'محدودیت طولانی', duration: 168, description: 'محدودیت دسترسی به مدت ۷ روز' },
      permanent: { name: 'مسدود دائم', duration: -1, description: 'مسدود کردن دائمی حساب کاربری' }
    },
    autoActions: {
      reportThreshold: 3, // تعداد گزارش برای عمل خودکار
      repeatViolationMultiplier: 2 // ضریب افزایش مجازات برای تکرار
    }
  });
  const [subscriptions, setSubscriptions] = useState<PublicSubscription[]>([]);
  const [publicRules, setPublicRules] = useState<PublicRule[]>([]);
  const [appSettings, setAppSettings] = useState<PublicAppSettings | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState<boolean>(() => {
    try { return localStorage.getItem('rulesAccepted') === 'true'; } catch { return false; }
  });
  const [pendingLoginAfterRules, setPendingLoginAfterRules] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await publicApi.subscriptions.getAll();
        const items = (res.data || []).filter((s: PublicSubscription) => s.active && (s.displayInApp ?? true));
        setSubscriptions(items);
      } catch (e) {
        console.warn('Failed to load subscriptions from API, falling back to defaults', e);
        setSubscriptions([
          { id: 1, name: 'یک ماهه', price: 150000, duration: 30, description: 'اشتراک یک ماهه', features: ['تصویر HD', 'قفل ۱۰ ثانیه', 'بدون محدودیت'], active: true, giftLocks: 5, videoQuality: 'HD', unlimitedTime: true, giftEnabled: true },
          { id: 2, name: 'شش ماهه', price: 630000, duration: 180, description: 'اشتراک شش ماهه', features: ['تمام مزایا', '۳۰٪ تخفیف', 'پشتیبانی ویژه'], active: true, giftLocks: 15, videoQuality: 'FHD', unlimitedTime: true, giftEnabled: true },
          { id: 3, name: 'سالانه', price: 900000, duration: 365, description: 'اشتراک سالانه', features: ['تمام مزایا', '۵۰٪ تخفیف', 'قفل نامحدود'], active: true, giftLocks: 50, videoQuality: 'UHD', unlimitedTime: true, giftEnabled: true }
        ] as unknown as PublicSubscription[]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await publicApi.rules.getAll();
        const items = (res.rules || []).filter((r: PublicRule) => r.isActive !== false);
        setPublicRules(items);
      } catch (e) {
        console.warn('Failed to load rules from API', e);
      }
    })();
  }, []);

  // Load app settings (branding texts, legal flags)
  useEffect(() => {
    (async () => {
      try {
        const res = await publicApi.settings.getPublic();
        setAppSettings(res.settings);
      } catch (e) {
        console.warn('Failed to load app settings', e);
      }
    })();
  }, []);
  // تنظیمات سیستم قفل و اشتراک
  const [lockSettings] = useState({
    lockDurationSeconds: 10, // مدت زمان هر قفل بر حسب ثانیه
    lockPricePerUnit: 5000, // قیمت هر قفل (تومان)
    defaultFreeLocks: 5, // تعداد قفل رایگان پیش‌فرض
    giftLockPerInvite: 1, // تعداد قفل برای هر دعوت (بدون اشتراک)
    invitesRequiredForLock: 3, // تعداد دعوت لازم برای دریافت قفل
    subscriptionEnabled: true // فعال بودن اشتراک‌ها
  });
  
  const [giftSettings] = useState({
    giftWorkflowEnabled: true,
    buyerRequestMessage: 'آیا می‌خواهید اشتراک هدیه بخرید؟ با خرید اشتراک هدیه شما از مزایای ویژه و قفل زمان‌دار با هدیه‌گیرنده بهره‌مند می‌شوید.',
    receiverAcceptMessage: 'شما اشتراک هدیه دریافت کردید. توجه: هر زمان آنلاین باشید ابتدا با خریدار گفتگو می‌کنید. در هر ماه فقط یک نفر می‌تواند برایتان بخرد. آیا شرایط را می‌پذیرید؟',
    monthlyGiftLimit: 1,
    giftLockTimeSeconds: 30
  });

  // Navigation function to track previous screen
  const navigateToScreen = (newScreen: string) => {
    setPreviousScreen(currentScreen);
    setCurrentScreen(newScreen);
  };

  // Go back function
  const goBack = () => {
    // If coming from call screen or current screen is accessible from call, go back to call
    if (previousScreen === 'call' || (currentScreen === 'messages' || currentScreen === 'subscription' || currentScreen === 'friends' || currentScreen === 'profile' || currentScreen === 'rules' || currentScreen === 'edit-notifications' || currentScreen === 'edit-rules')) {
      setCurrentScreen('call');
    } else {
      setCurrentScreen(previousScreen);
    }
  };
  
  // پیاده‌سازی دکمه‌های قابل تعبیه در پیام
  const renderMessageWithButtons = (message: string) => {
    // کدهای خاص برای دکمه‌ها
    const buttonCodes = {
      '[BUY_SUBSCRIPTION]': {
        text: '💳 خرید اشتراک',
        action: () => navigateToScreen('subscription'),
        color: 'from-blue-500 to-purple-600'
      },
      '[BUY_LOCKS]': {
        text: '🔒 خرید قفل',
        action: () => {
          setShowLockPurchasePopup(true);
        },
        color: 'from-green-500 to-teal-600'
      }
    };
    
    let processedMessage = message;
    const buttons: any[] = [];
    
    Object.entries(buttonCodes).forEach(([code, config]) => {
      if (processedMessage.includes(code)) {
        processedMessage = processedMessage.replace(code, '');
        buttons.push(config);
      }
    });
    
    return { message: processedMessage.trim(), buttons };
  };

  // حذف نمایش لینک‌های لوکال داخل متن پیام‌ها
  const sanitizeMessageText = (text: string) => {
    try {
      return text
        // localhost and dev
        .replace(/https?:\/\/(localhost|127\.0\.0\.1|local)(:\\d+)?\S*/gi, '')
        .replace(/\blocal:3001\b/gi, '')
        // private LAN IPs
        .replace(/https?:\/\/((10|192\.168|172\.(1[6-9]|2[0-9]|3[0-1]))(?:\.\d{1,3}){2})(:\\d+)?\S*/gi, '')
        // file scheme
        .replace(/file:\/\/\S*/gi, '')
        // Windows absolute paths (C:\..., D:\...)
        .replace(/\b[A-Za-z]:[\\\/][^\s]+/g, '')
        // Unix-like absolute paths (/Users/... , /home/...)
        .replace(/\/(Users|home|var|etc|opt|tmp|srv|media|mnt|Volumes|root)\/[\S]+/g, '')
        .trim();
    } catch {
      return text;
    }
  };

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

  // Timer for other user lock
  useEffect(() => {
    if (otherLockTimer > 0) {
      const timer = setTimeout(() => {
        setOtherLockTimer(otherLockTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isOtherLocked) {
      setIsOtherLocked(false);
    }
  }, [otherLockTimer, isOtherLocked]);
  
  // Auto-scroll chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleLogin = () => {
    if (!/^0\d{10}$/.test(phoneNumber)) return;
    if (appSettings?.legal?.requireRulesAcceptance && !acceptedRules) {
      setPendingLoginAfterRules(true);
      setShowRulesModal(true);
    } else {
      // Move to verify screen to enter 4-digit code
      setCurrentScreen('verify');
    }
  };

  const handleAcceptRules = async () => {
    try { localStorage.setItem('rulesAccepted', 'true'); } catch {}
    setAcceptedRules(true);
    setShowRulesModal(false);
    if (pendingLoginAfterRules) {
      setPendingLoginAfterRules(false);
      // After accepting rules, continue phone verification flow
      setCurrentScreen('verify');
    }
  };

  const { login } = useAuth();

  const attemptLogin = async () => {
    if (!loginId || !password) return;
    try {
      await login(loginId, password);
      setPhoneNumber(loginId);
      await checkBanStatus();
      setCurrentScreen('call');
      setIsSearching(false);
      setSearchPhase('idle');
      setFadeOutSearch(false);
      setIsCallActive(false);
    } catch (e) {
      alert('ورود ناموفق بود. لطفاً نام کاربری/رمز عبور را بررسی کنید.');
    }
  };
  
  const handleVerify = () => {
    if (verificationCode.length === 4) {
      // Perform demo login to set a JWT-like token for role=user
      try {
        login(phoneNumber, verificationCode);
      } catch {}
      
      // چک کردن وضعیت مسدودی
      checkBanStatus();
      
      // مستقیم به صفحه چت برو بدون رادار
      setCurrentScreen('call');
      setIsSearching(false);
      setSearchPhase('idle');
      setFadeOutSearch(false);
      setIsCallActive(false);
      
      // صفحه چت در حالت انتظار باز می‌شود
    }
  };

  // Reset resend timer when entering verify screen
  useEffect(() => {
    if (currentScreen === 'verify') {
      setResendTimer(60);
      setResending(false);
    }
  }, [currentScreen]);

  // Countdown for resend
  useEffect(() => {
    if (currentScreen === 'verify' && resendTimer > 0) {
      const t = window.setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [currentScreen, resendTimer]);

  const handleResendCode = () => {
    if (resending || resendTimer > 0) return;
    setResending(true);
    // Simulate sending verification code
    setTimeout(() => {
      setResending(false);
      setResendTimer(60);
      alert('کد تایید مجدداً ارسال شد');
    }, 800);
  };

  // پاک‌سازی تایمرها هنگام خروج از کامپوننت یا تغییر صفحه
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t as any));
      timersRef.current = [];
    };
  }, []);

  // Capture a snapshot from remote video (or placeholder) and upload to backend
  const captureRemoteSnapshot = async (): Promise<string | null> => {
    try {
      const width = 320, height = 180;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const video = remoteVideoRef.current;
      if (video && video.videoWidth && video.videoHeight) {
        // draw current video frame
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        // cover fit
        const scale = Math.max(width / vw, height / vh);
        const sw = vw * scale;
        const sh = vh * scale;
        const sx = (width - sw) / 2;
        const sy = (height - sh) / 2;
        ctx.drawImage(video, sx, sy, sw, sh);
      } else {
        // fallback: gradient background with app label
        const grd = ctx.createLinearGradient(0, 0, width, height);
        grd.addColorStop(0, '#1f2937');
        grd.addColorStop(1, '#111827');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('Snapshot', 10, 24);
      }

      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(b => resolve(b), 'image/jpeg', 0.85));
      if (!blob) return null;
      const up = await uploadSnapshot(blob);
      return up?.url || null;
    } catch {
      return null;
    }
  };

  const openReportWithSnapshot = async () => {
    const url = await captureRemoteSnapshot();
    if (url) {
      setLastSnapshots(prev => [{ id: `snap_${Date.now()}`, userId: currentChatUser?.id, url, time: new Date() }, ...prev].slice(0, 8));
    }
    // ابتدا از کاربر می‌خواهیم فرد متخلف را از بین تصاویر اخیر انتخاب کند
    setShowReportSelect(true);
  };

  const startSearchProcess = () => {
    // پاک‌سازی تایمرهای قبلی
    timersRef.current.forEach((t) => clearTimeout(t as any));
    timersRef.current = [];

    // شبیه‌سازی احتمال یافتن کاربر (70% احتمال یافتن)
    const userFound = Math.random() < 0.7;

    // مرحله یافتن کاربر
    const tFound = window.setTimeout(() => {
      if (userFound) {
        setSearchPhase('found');
      }
    }, SEARCH_SCAN_MS);

    // شروع خروج نرم پس از مکث
    const tFade = window.setTimeout(() => {
      setFadeOutSearch(true);
    }, SEARCH_SCAN_MS + FOUND_HOLD_MS);

    // پس از خروج نرم رادار
    const tCall = window.setTimeout(() => {
      setIsSearching(false);
      setSearchPhase('idle');
      setFadeOutSearch(false);
      
      if (userFound) {
        // فقط در صورت یافتن کاربر تماس را فعال کن
        setIsCallActive(true);
        
        // شبیه‌سازی دسترسی ویدیو (80% احتمال داشتن ویدیو)
        const hasVideo = Math.random() < 0.8;
        setRemoteVideoAvailable(hasVideo);
        setUserFoundButNoVideo(!hasVideo);
        
        // اضافه کردن کاربر جدید به سابقه ۳ کاربر اخیر
        const newUser = {
          id: `user_${Math.random().toString(36).substr(2, 9)}`,
          name: `کاربر ${Math.floor(Math.random() * 1000)}`,
          avatar: `https://i.pravatar.cc/150?u=${Math.random()}`,
          time: new Date()
        };
        
        setCurrentChatUser(newUser);
        setLastThreeUsers(prev => {
          const updated = [newUser, ...prev.slice(0, 2)];
          return updated;
        });
      } else {
        // در صورت عدم یافتن کاربر، نمایش صفحه انتظار
        setIsCallActive(false);
        setCurrentChatUser(null);
        setRemoteVideoAvailable(false);
        setUserFoundButNoVideo(false);
      }
    }, SEARCH_SCAN_MS + FOUND_HOLD_MS + FADE_MS);

    timersRef.current.push(tFound, tFade, tCall);
  };

  // Request camera/microphone when needed and attach to local preview video
  const ensureLocalStream = async () => {
    try {
      if (localStreamRef.current) {
        // Already have stream - make sure tracks respect current toggles
        localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = isMicOn));
        localStreamRef.current.getVideoTracks().forEach(t => (t.enabled = isCameraOn));
        if (videoRef.current) {
          if (videoRef.current.srcObject !== localStreamRef.current) {
            videoRef.current.srcObject = localStreamRef.current as any;
          }
        }
        setPermissionError(null);
        return localStreamRef.current;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      // Apply current toggles
      stream.getAudioTracks().forEach(t => (t.enabled = isMicOn));
      stream.getVideoTracks().forEach(t => (t.enabled = isCameraOn));
      if (videoRef.current) {
        videoRef.current.srcObject = stream as any;
      }
      setPermissionError(null);
      return stream;
    } catch (err: any) {
      let msg = 'دسترسی به دوربین/میکروفون رد شد یا در دسترس نیست';
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        msg += ' - برای دسترسی باید سایت روی HTTPS یا localhost اجرا شود';
      }
      setPermissionError(msg);
      return null;
    }
  };

  const cleanupLocalStream = () => {
    const s = localStreamRef.current;
    if (s) {
      s.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    const s = localStreamRef.current;
    if (s) s.getAudioTracks().forEach(t => (t.enabled = isMicOn));
  }, [isMicOn]);

  useEffect(() => {
    const s = localStreamRef.current;
    if (s) s.getVideoTracks().forEach(t => (t.enabled = isCameraOn));
  }, [isCameraOn]);

  const startVideoCall = async () => {
    // Request permissions and prepare local preview first
    await ensureLocalStream();

    // شروع جستجو در همین صفحه چت
    setIsSearching(true);
    setSearchPhase('scanning');
    setFadeOutSearch(false);
    setIsCallActive(false); // ابتدا تماس غیرفعال است

    // شروع مراحل جستجو
    startSearchProcess();
  };

  const endCall = async () => {
    // Capture snapshot of the last state before leaving
    const url = await captureRemoteSnapshot();
    if (url) {
      setLastSnapshots(prev => [{ id: `snap_${Date.now()}`, userId: currentChatUser?.id, url, time: new Date() }, ...prev].slice(0, 8));
    }
    setIsCallActive(false);
    setChatMessages([]);
    cleanupLocalStream();
    setCurrentScreen('call');
  };

  // تابع جدید برای متوقف کردن فقط ویدیو بدون ترک صفحه چت
  const stopVideoCall = async () => {
    const url = await captureRemoteSnapshot();
    if (url) {
      setLastSnapshots(prev => [{ id: `snap_${Date.now()}`, userId: currentChatUser?.id, url, time: new Date() }, ...prev].slice(0, 8));
    }
    setIsCallActive(false);
    setIsSearching(false);
    setSearchPhase('idle');
    setFadeOutSearch(false);
    setRemoteVideoAvailable(false);
    setUserFoundButNoVideo(false);
    // پاک‌سازی تایمرهای در حال اجرا
    timersRef.current.forEach((t) => clearTimeout(t as any));
    timersRef.current = [];
    // چت را حفظ می‌کنیم و در همان صفحه می‌مانیم
    cleanupLocalStream();
  };

  const nextUser = async () => {
    // قبل از رفتن به کاربر بعدی یک اسنپ‌شات ذخیره می‌کنیم
    const url = await captureRemoteSnapshot();
    if (url) {
      setLastSnapshots(prev => [{ id: `snap_${Date.now()}`, userId: currentChatUser?.id, url, time: new Date() }, ...prev].slice(0, 8));
    }
    // تمیز کردن چت و شروع جستجو برای کاربر بعدی
    setChatMessages([]);
    setIsCallActive(false);
    setIsSearching(true);
    setSearchPhase('scanning');
    setFadeOutSearch(false);
    
    // شروع مراحل جستجو در همین صفحه
    startSearchProcess();
  };

  // Switch camera facing mode (UI only)
  const switchCamera = () => {
    setCameraFacing(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const sendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages([...chatMessages, {
        text: newMessage,
        sender: 'me',
        time: new Date().toLocaleTimeString()
      }]);
      setNewMessage('');
      
      // Auto-scroll to bottom after sending message
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 10);
      
      // Simulate response
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          text: 'سلام! چطوری؟',
          sender: 'other',
          time: new Date().toLocaleTimeString()
        }]);
        
        // Auto-scroll to bottom after receiving response
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 10);
      }, 1000);
    }
  };

  const useLock = () => {
    if (lockCount > 0 && !isOtherLocked) {
      setLockCount(lockCount - 1);
      setIsOtherLocked(true);
      setOtherLockTimer(lockSettings.lockDurationSeconds);
      // پیام غیرمزاحم به‌صورت Toast مطابق نیازمندی‌ها
      showToast(`✋ کاربر مقابل برای ${lockSettings.lockDurationSeconds} ثانیه قفل شد. او نمی‌تواند شما را رد کند`, 'success');
    } else if (lockCount === 0) {
      // نمایش پنجره خرید قفل مطابق نیازمندی‌ها
      setShowLockPurchasePopup(true);
    } else if (isOtherLocked) {
      showToast(`⏱️ کاربر در حال حاضر قفل است. ${otherLockTimer} ثانیه باقیمانده`, 'info');
    }
  };

  const reportUser = (reason: string) => {
    setReports([...reports, {
      reason,
      time: new Date(),
      userId: 'current_user'
    }]);
    goBack();
  };

  const blockUser = (userId?: string, banDuration?: number) => {
    const targetUserId = userId || currentChatUser?.id || 'current_user';
    setBlockedUsers([...blockedUsers, targetUserId]);
    
    if (banDuration) {
      const banUntil = new Date();
      banUntil.setHours(banUntil.getHours() + banDuration);
      setUserBanDuration([...userBanDuration, { userId: targetUserId, banUntil }]);
      alert(`🚫 کاربر به مدت ${banDuration} ساعت محدود شد`);
    } else {
      alert(`🚫 کاربر به طور دائم مسدود شد`);
    }
    
    endCall();
  };


  const inviteFriend = () => {
    // Simulate friend invitation
    setFriends([...friends, `friend_${Date.now()}`]);
    alert('لینک دعوت کپی شد!');
    
    // چک کردن اشتراک رایگان برای دعوت 5 نفر
    if (friends.length + 1 >= 5 && subscriptionDays === 0) {
      setSubscriptionDays(30);
      setNotifications(prev => [
        {
          id: Date.now(),
          title: '🎉 تبریک! اشتراک رایگان دریافت کردید',
          message: 'با دعوت 5 دوست، یک ماه اشتراک رایگان دریافت کردید. اکنون از تمام امکانات ویژه استفاده کنید!',
          type: 'reward',
          read: false,
          date: new Date(),
          hasButton: false
        },
        ...prev
      ]);
      alert('🎉 تبریک!\nشما با دعوت 5 دوست، یک ماه اشتراک رایگان دریافت کردید!');
    }
  };
  
  // چک کردن وضعیت مسدودی کاربر
  const checkBanStatus = async () => {
    // استعلام وضعیت کاربر از بک‌اند
    const me = await authApi.getMe();
    if (me?.user) {
      if (me.user.status === 'banned') {
        const until = me.user.banExpiresAt ? new Date(me.user.banExpiresAt) : null;
        setUserBanStatus({
          isBanned: true,
          banUntil: until,
          reason: 'تخلف از قوانین استفاده'
        });
        setShowBanPopup(true);
      } else {
        setUserBanStatus({ isBanned: false, banUntil: null, reason: '' });
        setShowBanPopup(false);
      }
    }
  };
  
  // چک کردن مسدودی در هر رندر
  useEffect(() => {
    if (currentScreen === 'call') {
      // هر ۳۰ ثانیه وضعیت مسدودی را چک کن
      let iv: any = null;
      (async () => { await checkBanStatus(); })();
      iv = setInterval(checkBanStatus, 30000);
      return () => { if (iv) clearInterval(iv); };
    }
    if (currentScreen === 'call' && userBanStatus.isBanned && userBanStatus.banUntil) {
      const now = new Date();
      if (userBanStatus.banUntil > now) {
        setShowBanPopup(true);
      } else {
        setUserBanStatus({ isBanned: false, banUntil: null, reason: '' });
        setShowBanPopup(false);
      }
    }
  }, [currentScreen, userBanStatus]);

  // Login Screen
  if (currentScreen === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-black/80 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md border border-white/10">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-transparent overflow-hidden">
                {!logoError ? (
                  <img
                    src={appSettings?.branding?.logoUrl || '/api/branding/icon'}
                    alt={appSettings?.branding?.siteName || 'Logo'}
                    className="w-full h-full object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center">
                    <Camera className="w-10 h-10 text-white" />
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">{appSettings?.branding?.loginTitle ?? 'چت تصویری تصادفی'}</h1>
              <p className="text-gray-300 text-sm">{appSettings?.branding?.loginSubtitle ?? 'با افراد جدید آشنا شوید'}</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-3">
                <input
                  type="tel"
                  placeholder="شماره تلفن (مثلاً 09123456789)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  dir="ltr"
                />
              </div>
              
              <button
                onClick={handleLogin}
                disabled={!/^0\d{10}$/.test(phoneNumber)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                ارسال کد تایید
              </button>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-gray-400 text-xs">
                {appSettings?.branding?.loginDisclaimer ?? 'با ورود، قوانین استفاده را می‌پذیرید'}
              </p>
            </div>
          </div>
        </div>
      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowRulesModal(false)} aria-label="بستن" className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 focus:outline-none">
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-gray-800 text-lg font-bold mb-4 text-center">قوانین استفاده</h2>
            {appSettings?.legal?.rulesText ? (
              <div className="text-right text-gray-800 whitespace-pre-wrap leading-relaxed">
                {appSettings.legal.rulesText}
              </div>
            ) : (
              <div className="space-y-3 text-right">
                {publicRules.length > 0 ? publicRules.map((r) => (
                  <div key={r.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="text-gray-900 font-medium">{r.title}</div>
                    {r.description && <div className="text-gray-600 text-sm mt-1">{r.description}</div>}
                  </div>
                )) : (
                  <div className="text-gray-500 text-sm">قوانین در حال حاضر در دسترس نیستند.</div>
                )}
              </div>
            )}
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setShowRulesModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg"
              >
                انصراف
              </button>
              <button
                onClick={handleAcceptRules}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
              >
                پذیرش قوانین
              </button>
            </div>
          </div>
        </div>
      )}
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
                onClick={handleResendCode}
                disabled={resendTimer > 0 || resending}
                className="w-full bg-gray-700 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
              >
                {resending ? 'در حال ارسال…' : (resendTimer > 0 ? `ارسال مجدد کد (${resendTimer})` : 'ارسال مجدد کد')}
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


  // Video Call Screen
  if (currentScreen === 'call') {
    return (
      <div className="min-h-screen bg-gray-50 relative overflow-hidden">
        {/* Main Container */}
        <div className="h-screen flex flex-col">
          
          {/* Top Header Bar */}
          <div className="bg-white shadow-sm px-4 py-2 flex items-center justify-between">
            <button 
              onClick={() => setShowMenu(true)}
              className="p-2"
              title="منو اصلی"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigateToScreen('messages')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
                title="پیام‌ها و اعلانات"
              >
                <Bell className="w-5 h-5 text-gray-700" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => navigateToScreen('subscription')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="خرید اشتراک"
              >
                <Gift className="w-5 h-5 text-gray-700" />
              </button>
              <button 
                onClick={() => navigateToScreen('friends')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="دعوت دوستان"
              >
                <UserPlus className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
          
          {/* Main Video Area */}
          <div className="flex-1 relative bg-black">
            {/* Remote User Video (Full Screen) */}
            <div className="w-full h-full relative">
              {isSearching ? (
                // نمایش رادار در تصویر اصلی هنگام جستجو
                <div className="w-full h-full bg-black flex flex-col items-center justify-center">
                  <div className="relative">
                    {/* رادار دایره‌ای کوچک وسط صفحه */}
                    <div className={`relative w-64 h-64 transition-opacity duration-400 ${fadeOutSearch ? 'opacity-0' : 'opacity-100'}`}>
                      {/* پس‌زمینه رادار */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-950/50 via-blue-900/30 to-transparent animate-spin" style={{ transformOrigin: 'center', animationDuration: '10s' }}>
                        {/* دایره‌های رادار */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200" style={rotateRadar ? { animation: 'spin 8s linear 1' } : undefined}>
                          <circle cx="100" cy="100" r="30" fill="none" stroke="rgba(59,130,246,0.2)" strokeWidth="1"/>
                          <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="1"/>
                          <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="1"/>
                          
                          {/* خطوط شبکه */}
                          <line x1="100" y1="10" x2="100" y2="190" stroke="rgba(59,130,246,0.1)" strokeWidth="1"/>
                          <line x1="10" y1="100" x2="190" y2="100" stroke="rgba(59,130,246,0.1)" strokeWidth="1"/>
                          <line x1="30" y1="30" x2="170" y2="170" stroke="rgba(59,130,246,0.05)" strokeWidth="1"/>
                          <line x1="170" y1="30" x2="30" y2="170" stroke="rgba(59,130,246,0.05)" strokeWidth="1"/>
                        </svg>
                        
                        {/* خط اسکن رادار */}
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                          <div className="absolute inset-0" style={{
                            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(59,130,246,0.4) 10deg, transparent 60deg, transparent 360deg)',
                            animation: 'spin 3s linear infinite',
                            transformOrigin: 'center'
                          }} />
                        </div>
                        
                        {/* نقاط کاربران - همه قرمز، فقط کاربر یافت‌شده سبز */}
                        {(searchPhase === 'scanning' || searchPhase === 'found') && (
                          <>
                            {/* نقطه بالا چپ */}
                            <div className="absolute top-[25%] left-[30%]">
                              <div className="relative">
                                <div className="w-2 h-2 bg-red-500 rounded-full">
                                  <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse" />
                                </div>
                              </div>
                            </div>
                            
                            {/* نقطه پایین راست */}
                            <div className="absolute top-[45%] right-[25%]">
                              <div className="relative">
                                <div className="w-2 h-2 bg-red-500 rounded-full">
                                  <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse" />
                                </div>
                              </div>
                            </div>
                            
                            {/* نقطه پایین چپ */}
                            <div className="absolute bottom-[35%] left-[45%]">
                              <div className="relative">
                                <div className="w-2 h-2 bg-red-500 rounded-full">
                                  <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse" />
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {/* کاربر یافت شده - فقط نقطه سبز بدون متن */}
                        {searchPhase === 'found' && (
                          <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2 -translate-y-1/2">
                            <div className="relative">
                              <div className="w-3 h-3 bg-green-500 rounded-full">
                                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* دکمه پیدا شده */}
                    {searchPhase === 'found' && (
                      <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                        <button className="bg-green-500 text-white px-6 py-2 rounded-lg text-sm font-medium">
                          کاربر پیدا شد!
                        </button>
                      </div>
                    )}
                  </div>
                  {/* متن حالت جستجو */}
                  {searchPhase !== 'found' && (
                    <p className="mt-6 text-gray-300 text-sm text-center">در حال جستجوی گفتگو</p>
                  )}
                </div>
            ) : isCallActive ? (
                remoteVideoAvailable ? (
                  // ویدیو کاربر مقابل - تمام صفحه
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    {/* Simulated remote video */}
                    <div className="relative w-full h-full">
                      {/* در اینجا ویدیو واقعی کاربر نمایش داده می‌شود */}
                      <div className="w-full h-full bg-cover bg-center relative" 
                           style={{backgroundImage: 'url(https://via.placeholder.com/800x600/4A5568/ffffff?text=Remote+User)'}}>
                        {/* Watermark */}
                        {showWatermark && (
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/20 text-4xl font-bold pointer-events-none select-none rotate-45">
                            Video Chat App
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // کاربر پیدا شده اما ویدیو در دسترس نیست - پس‌زمینه مشکی با آیکون دوربین وسط
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    <Camera className="w-16 h-16 text-white" />
                  </div>
              )) : (
                // حالت انتظار - نمایش رادار با کاربران آنلاین و متن راهنما
                <div className="w-full h-full bg-black flex flex-col items-center justify-center">
                    <div className="relative w-64 h-64 mx-auto">
                      {/* پس‌زمینه رادار */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-950/50 via-blue-900/30 to-transparent">
                        {/* دایره‌های رادار */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
                          <circle cx="100" cy="100" r="30" fill="none" stroke="rgba(59,130,246,0.2)" strokeWidth="1"/>
                          <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="1"/>
                          <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="1"/>
                          {/* خطوط شبکه */}
                          <line x1="100" y1="10" x2="100" y2="190" stroke="rgba(59,130,246,0.1)" strokeWidth="1"/>
                          <line x1="10" y1="100" x2="190" y2="100" stroke="rgba(59,130,246,0.1)" strokeWidth="1"/>
                          <line x1="30" y1="30" x2="170" y2="170" stroke="rgba(59,130,246,0.05)" strokeWidth="1"/>
                          <line x1="170" y1="30" x2="30" y2="170" stroke="rgba(59,130,246,0.05)" strokeWidth="1"/>
                        </svg>
                        {/* نقاط کاربران آنلاین (قرمز) */}
                        <div className="absolute top-[25%] left-[30%]">
                          <div className="w-2 h-2 bg-red-500 rounded-full">
                            <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse" />
                          </div>
                        </div>
                        <div className="absolute top-[45%] right-[25%]">
                          <div className="w-2 h-2 bg-red-500 rounded-full">
                            <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse" />
                          </div>
                        </div>
                        <div className="absolute bottom-[35%] left-[45%]">
                          <div className="w-2 h-2 bg-red-500 rounded-full">
                            <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 text-center">
                      <p className="text-white text-lg font-semibold">شروع گفتگو</p>
                      <p className="text-gray-400 text-sm mt-2">برای جستجوی کاربر جدید دکمه آبی را بزنید</p>
                    </div>
                  </div>
              )}
            </div>
            

            {/* Side Control Buttons - در سمت راست وسط تصویر - همیشه نمایش داده می‌شوند */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 space-y-1.5">
              {/* Microphone Toggle - فقط میکروفون خود */}
              <button 
                onClick={() => setIsMicOn(!isMicOn)}
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all focus:outline-none ${
                  isMicOn ? 'bg-gray-700/80 hover:bg-gray-600/80' : 'bg-red-500/80 hover:bg-red-600/80'
                }`}
                title={isMicOn ? 'خاموش کردن میکروفون' : 'روشن کردن میکروفون'}
              >
                {isMicOn ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-white" />}
              </button>

              {/* Mute Other User - بستن صدای کاربر مقابل */}
              <button 
                onClick={() => setIsOtherMuted(!isOtherMuted)}
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all focus:outline-none ${
                  isOtherMuted ? 'bg-orange-500/80 hover:bg-orange-600/80' : 'bg-gray-700/80 hover:bg-gray-600/80'
                }`}
                title={isOtherMuted ? 'باز کردن صدای کاربر' : 'بستن صدای کاربر'}
              >
                {isOtherMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
              </button>

              {/* Lock User - قفل کردن موقت */}
              <button 
                onClick={useLock}
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all relative focus:outline-none ${
                  isOtherLocked ? 'bg-green-500/80 hover:bg-green-600/80' : 'bg-purple-600/80 hover:bg-purple-700/80'
                }`}
                title={isOtherLocked ? `کاربر قفل است (${otherLockTimer} ثانیه باقیمانده)` : `قفل کردن کاربر (${lockCount} قفل باقیمانده)`}
              >
                <Lock className="w-4 h-4 text-white" />
                {isOtherLocked && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white w-3 h-3 rounded-full flex items-center justify-center font-bold" style={{fontSize: '8px'}}>
                    {otherLockTimer}
                  </span>
                )}
              </button>
              
              {/* Gift Button - ارسال هدیه */}
              <button 
                onClick={() => {
                  if (isCallActive && currentChatUser && giftSettings.giftWorkflowEnabled) {
                    setShowGiftFlow(true);
                  } else {
                    alert('🎁 اشتراک هدیه\n\nبرای خرید اشتراک هدیه ابتدا باید با کاربری در حال چت باشید.');
                  }
                }}
                className="w-8 h-8 bg-gradient-to-br from-yellow-400/80 to-orange-500/80 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform focus:outline-none"
                title="خرید اشتراک هدیه"
              >
                <Gift className="w-4 h-4 text-white" />
              </button>
              
              {/* Report Button - گزارش کاربر */}
              <button 
                onClick={openReportWithSnapshot}
                className="w-8 h-8 bg-red-500/80 rounded-full flex items-center justify-center shadow-md hover:bg-red-600/80 transition-colors focus:outline-none"
                title="گزارش کاربر"
              >
                <Flag className="w-4 h-4 text-white" />
              </button>

              {/* Block Button - بلاک کردن کاربر مقابل (عدم نمایش مجدد) */}
              <button 
onClick={async () => {
                  if (!currentChatUser?.id) { showToast('کاربر مقابل مشخص نیست', 'error'); return; }
                  if (!confirm('آیا می‌خواهید این کاربر بلاک شود؟')) return;
                  const ok = await apiBlockUser(currentChatUser.id);
                  if (ok) {
                    showToast('کاربر بلاک شد و دیگر با او گفتگو نخواهید کرد', 'success');
                    nextUser();
                  } else {
                    showToast('بلاک کاربر با خطا مواجه شد', 'error');
                  }
                }}
                className="w-8 h-8 bg-gray-700/80 rounded-full flex items-center justify-center shadow-md hover:bg-gray-600/80 transition-colors focus:outline-none"
                title="بلاک کاربر"
              >
                <UserX className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Chat & Controls Section - Bottom */}
          <div className="bg-white shadow-2xl">
            {/* Chat Messages */}
            <div ref={chatContainerRef} className="px-4 py-3 max-h-40 overflow-y-auto bg-gray-50">
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
              {/* Mobile: پیش‌نمایش بزرگ چپ، بالایش ورودی، پایین دکمه‌ها | Desktop: ترتیب کنترل‌ها-ورودی-پیش‌نمایش */}
              <div className="grid grid-cols-3 gap-3 md:flex md:items-center">
                {/* Preview - موبایل: ستون 3 با ارتفاع دو ردیف | دسکتاپ: راست کوچک */}
                <div className="relative col-span-1 col-start-3 row-start-1 row-span-2 w-full aspect-square bg-black rounded-lg overflow-hidden flex-shrink-0 md:static md:order-3 md:w-16 md:h-16 md:col-auto md:row-auto">
                  {localStreamRef.current ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {isCameraOn ? (
                        <Camera className="w-6 h-6 text-gray-400" />
                      ) : (
                        <div className="bg-red-500/20 w-full h-full flex items-center justify-center">
                          <Camera className="w-6 h-6 text-red-400" />
                        </div>
                      )}
                    </div>
                  )}
                  {/* Switch: پایین-چپ در موبایل، پایین-راست در دسکتاپ */}
                  <button
                    onClick={switchCamera}
                    className="absolute bottom-1 left-1 w-7 h-7 rounded-full bg-white/85 text-gray-700 flex items-center justify-center shadow hover:bg-white"
                    title="چرخش دوربین"
                    type="button"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Input - چپِ پیش‌نمایش در موبایل | وسط در دسکتاپ */}
                <div className="relative col-span-2 col-start-1 row-start-1 md:flex-1 md:order-2 md:col-auto md:row-auto">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="پیام خود را بنویسید..."
                    className="w-full bg-white border border-gray-200 rounded-xl pr-4 pl-12 py-4 md:py-2 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    dir="rtl"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-blue-600 hover:text-blue-700 disabled:text-gray-400 focus:outline-none"
                    title="ارسال پیام"
                    type="button"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Controls - زیر ورودی در سمت چپ پیش‌نمایش */}
                <button
                  onClick={startVideoCall}
                  className="md:hidden col-span-1 col-start-1 row-start-2 h-20 bg-blue-600 rounded-xl flex items-center justify-center shadow text-white"
                  title="شروع"
                >
                  <Play className="w-6 h-6" />
                </button>
                <button
                  onClick={stopVideoCall}
                  className="md:hidden col-span-1 col-start-2 row-start-2 h-20 bg-rose-300 rounded-xl flex items-center justify-center shadow text-white"
                  title="توقف"
                >
                  <Square className="w-6 h-6" />
                </button>

                {/* Desktop Controls Group - چپ */}
                <div className="hidden md:flex items-center gap-2 md:order-1">
                  <button
                    onClick={startVideoCall}
                    className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors focus:outline-none"
                    title="پلی / شروع"
                  >
                    <Play className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={stopVideoCall}
                    className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors focus:outline-none"
                    title="توقف"
                  >
                    <Square className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toasts - non-blocking notifications */}
        {toasts.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[92%] max-w-sm space-y-2">
            {toasts.map(t => (
              <div key={t.id} className={`rounded-xl px-4 py-2 text-white shadow-lg border 
                ${t.type === 'success' ? 'bg-green-600/90 border-green-400/50' : t.type === 'error' ? 'bg-red-600/90 border-red-400/50' : 'bg-gray-900/90 border-white/10'}` }>
                <div className="text-sm leading-relaxed">{t.text}</div>
              </div>
            ))}
          </div>
        )}

        {/* Side Menu - Enhanced functional menu */}
        {showMenu && (
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowMenu(false)}>
            <div className="bg-gray-900 w-80 h-full p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-white text-xl font-bold">منو اصلی</h2>
                <button 
                  onClick={() => setShowMenu(false)}
                  className="text-white p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-3">
                {/* پروفایل کاربر */}
                <div className="bg-gray-800 p-4 rounded-xl mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{loginId || phoneNumber}</p>
                      <p className="text-gray-400 text-sm">
                        {subscriptionDays > 0 ? `کاربر ویژه (${subscriptionDays} روز)` : 'کاربر عادی'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* منوی اصلی */}
                
                <button 
                  onClick={() => {
                    navigateToScreen('messages');
                    setShowMenu(false);
                  }}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-xl flex items-center gap-3 transition-colors"
                >
                  <Bell className="w-6 h-6" />
                  <div className="flex-1 text-right">
                    <span>پیام‌ها و اعلانات</span>
                    {notifications.filter(n => !n.read).length > 0 && (
                      <div className="text-red-400 text-xs">({notifications.filter(n => !n.read).length} جدید)</div>
                    )}
                  </div>
                </button>
                
                <button 
                  onClick={() => {
                    navigateToScreen('subscription');
                    setShowMenu(false);
                  }}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-xl flex items-center gap-3 transition-colors"
                >
                  <Gift className="w-6 h-6" />
                  <span>خرید اشتراک</span>
                </button>
                
                <button 
                  onClick={() => {
                    navigateToScreen('friends');
                    setShowMenu(false);
                  }}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-xl flex items-center gap-3 transition-colors"
                >
                  <UserPlus className="w-6 h-6" />
                  <span>دعوت دوستان</span>
                </button>
                
                <button 
                  onClick={() => {
                    navigateToScreen('profile');
                    setShowMenu(false);
                  }}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-xl flex items-center gap-3 transition-colors"
                >
                  <Settings className="w-6 h-6" />
                  <span>پروفایل و تنظیمات</span>
                </button>
                
                <button 
                  onClick={() => {
                    navigateToScreen('rules');
                    setShowMenu(false);
                  }}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-xl flex items-center gap-3 transition-colors"
                >
                  <Shield className="w-6 h-6" />
                  <span>قوانین استفاده</span>
                </button>
                
                {/* آمار کاربر */}
                <div className="bg-gray-800/50 p-4 rounded-xl mt-6">
                  <h3 className="text-white font-bold mb-3">آمار حساب:</h3>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-gray-700/50 p-3 rounded-lg">
                      <div className="text-blue-400 font-bold text-lg">{lockCount}</div>
                      <div className="text-gray-400 text-xs">قفل باقی</div>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded-lg">
                      <div className="text-green-400 font-bold text-lg">{friends.length}</div>
                      <div className="text-gray-400 text-xs">دوست دعوتی</div>
                    </div>
                  </div>
                </div>
                
                {/* خروج */}
                <button 
                  onClick={() => {
                    if (confirm('آیا می‌خواهید از حساب کاربری خود خارج شوید؟')) {
                      setCurrentScreen('login');
                      setPhoneNumber('');
                      setVerificationCode('');
                      setIsCallActive(false);
                      setChatMessages([]);
                      setLastThreeUsers([]);
                      setCurrentChatUser(null);
                      setShowMenu(false);
                    }
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white p-4 rounded-xl flex items-center gap-3 transition-colors mt-6"
                >
                  <Home className="w-6 h-6" />
                  <span>خروج از حساب</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* اشتراک هدیه */}
        <GiftSubscriptionFlow
          isVisible={showGiftFlow}
          onClose={() => setShowGiftFlow(false)}
          currentUser={{
            phone: phoneNumber,
            subscription: subscriptionDays > 0,
            subscriptionDays: subscriptionDays
          }}
          partnerUser={currentChatUser}
          subscriptions={subscriptions}
          settings={giftSettings}
          onGiftPurchased={(giftData) => {
            console.log('Gift purchased:', giftData);
            // اضافه کردن نوتیفیکیشن برای هدیه‌گیرنده
            setNotifications(prev => [
              {
                id: Date.now(),
                title: 'هدیه دریافت شد! 🎉',
                message: `تبریک! یک کاربر به شما اشتراک ${giftData.subscription.name} هدیه داد.`,
                type: 'gift',
                read: false,
                date: new Date(),
                hasButton: false
              },
              ...prev
            ]);
            // اضافه کردن قفل‌های هدیه
            setLockCount(prev => prev + giftData.subscription.giftLocks);
            setShowGiftFlow(false);
            alert('🎉 اشتراک هدیه با موفقیت خریداری شد!\nهدیه‌گیرنده نوتیفیکیشن دریافت کرد.');
          }}
        />

        {/* Lock Purchase Modal */}
        {showLockPurchasePopup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] grid place-items-center p-4" onClick={() => setShowLockPurchasePopup(false)}>
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowLockPurchasePopup(false)} aria-label="بستن" className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 focus:outline-none">
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-gray-900 text-lg font-bold mb-2 text-center">خرید قفل</h2>
              <p className="text-gray-600 text-sm text-center mb-4">برای قفل کردن کاربر و جلوگیری از رد کردن شما، نیاز به خرید قفل دارید.</p>
              <div className="space-y-2 mt-2">
                <button
                  onClick={() => {
                    setLockCount(lockCount + 5);
                    setShowLockPurchasePopup(false);
                    alert('✅ 5 قفل به حساب شما اضافه شد');
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl font-medium"
                >
                  خرید 5 قفل
                </button>
                <button
                  onClick={() => {
                    setShowLockPurchasePopup(false);
                    navigateToScreen('subscription');
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-medium"
                >
                  خرید اشتراک
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* پاپ‌آپ مسدودی کاربر */}
{showBanPopup && userBanStatus.isBanned && userBanStatus.banUntil && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] grid place-items-center p-4">
            <div className="bg-red-900/90 backdrop-blur-xl rounded-2xl p-6 border border-red-600/50 shadow-2xl max-w-md w-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <X className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-white text-xl font-bold mb-2">🚫 حساب مسدود شده</h2>
                <p className="text-red-200 text-sm mb-4">
                  دلیل: {userBanStatus.reason}
                </p>
                <div className="bg-black/30 p-4 rounded-xl mb-4">
                  <p className="text-white font-bold mb-2">زمان باقیمانده تا رفع مسدودی:</p>
                  <div className="text-yellow-400 text-lg font-bold">
                    {Math.ceil((userBanStatus.banUntil.getTime() - new Date().getTime()) / (1000 * 60 * 60))} ساعت
                  </div>
                </div>
                <p className="text-red-200 text-xs mb-4">
                  لطفاً تا پایان مدت مسدودی صبر کنید و از قوانین استفاده پیروی نمایید.
                </p>
                <button
                  onClick={() => {
                    setShowBanPopup(false);
                    setCurrentScreen('login');
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  تایید
                </button>
              </div>
            </div>
          </div>
        )}

        {/* انتخاب کاربر برای گزارش/بلاک - مطابق اسکرین‌شات */}
        {showReportSelect && (
          <div className="fixed inset-0 bg-black/50 z-[120] grid place-items-center p-4" onClick={() => setShowReportSelect(false)}>
            <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-gray-800 text-sm font-bold mb-3 text-center">Please select a user</h3>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(lastSnapshots.length > 0 ? lastSnapshots : lastThreeUsers).slice(0,3).map((item: any, idx: number) => {
                  const uid = item.userId || item.id;
                  const selected = selectedSuspectId === uid;
                  const imgSrc = item.url || item.avatar;
                  return (
                    <button key={uid || idx} onClick={() => setSelectedSuspectId(uid)}
                      className={`rounded-lg border overflow-hidden relative ${selected ? 'border-red-400' : 'border-gray-300'}`}>
                      {imgSrc ? (
                        <img src={imgSrc} alt={`u${idx}`} className="w-full h-20 object-cover" />
                      ) : (
                        <div className="w-full h-20 bg-gray-200" />
                      )}
                      {selected && (
                        <span className="absolute top-1 left-1 w-5 h-5 bg-red-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-2">
                <button
                  disabled={!selectedSuspectId}
                  onClick={() => {
                    if (!selectedSuspectId) return;
                    setShowReportSelect(false);
                    // ادامه‌ی فرآیند گزارش: انتخاب دلیل در صفحه بعدی
                    navigateToScreen('report');
                  }}
                  className={`w-full py-2 rounded-lg font-medium ${selectedSuspectId ? 'bg-rose-500 text-white' : 'bg-rose-300 text-white/70 cursor-not-allowed'}`}
                >
                  Report abuse
                </button>
                <button
                  disabled={!selectedSuspectId}
                  onClick={async () => {
                    if (!selectedSuspectId) return;
                    const ok = await apiBlockUser(selectedSuspectId);
                    if (ok) {
                      showToast('کاربر بلاک شد', 'success');
                      setShowReportSelect(false);
                    } else {
                      showToast('بلاک کاربر با خطا مواجه شد', 'error');
                    }
                  }}
                  className={`w-full py-2 rounded-lg font-medium ${selectedSuspectId ? 'bg-rose-500 text-white' : 'bg-rose-300 text-white/70 cursor-not-allowed'}`}
                >
                  Block user
                </button>
                <button onClick={() => setShowReportSelect(false)} className="w-full py-2 rounded-lg bg-gray-200 text-gray-800 font-medium">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Report Screen - با overlay شیشه‌ای
  if (currentScreen === 'report') {
    return (
      <>
        {/* صفحه چت در پس‌زمینه */}
        <div className="min-h-screen bg-gray-50 relative overflow-hidden opacity-40">
          <div className="h-screen flex flex-col">
            <div className="bg-white shadow-sm px-4 py-2 flex items-center justify-between">
              <button className="p-2">
                <Menu className="w-5 h-5 text-gray-700" />
              </button>
              <div className="flex items-center gap-4">
                <button className="p-2">
                  <Bell className="w-5 h-5 text-gray-700" />
                </button>
                <button className="p-2">
                  <Gift className="w-5 h-5 text-gray-700" />
                </button>
                <button className="p-2">
                  <UserPlus className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>
            <div className="flex-1 relative bg-white">
              <div className="w-full h-full relative">
                <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                  <div className="text-center text-white">
                    <p>ویدیو چت</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg"></div>
                  <input className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm" placeholder="پیام..." disabled />
                </div>
                <div className="flex items-center gap-2">
                  <button className="w-14 h-14 bg-blue-500 rounded-xl"></button>
                  <button className="w-14 h-14 bg-green-500 rounded-xl"></button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Overlay شیشه‌ای گزارش */}
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => goBack()}>
          <div className="relative bg-white/85 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={goBack} aria-label="بستن" className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 focus:outline-none">
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-gray-800 text-lg font-bold mb-2 text-center">گزارش تخلف</h2>
            <p className="text-gray-600 text-xs text-center mb-4">برای جلوگیری از اشتباه، تصویر پروفایل نمایش داده نمی‌شود. لطفاً کاربر مورد نظر را از بین گزینه‌های زیر انتخاب کنید.</p>
            
            {/* نمایش اسنپ‌شات‌های آخرین گفتگوها */}
            {(lastSnapshots.length > 0 || lastThreeUsers.length > 0) && (
              <div className="mb-4">
                <h3 className="text-gray-800 font-semibold mb-2 text-sm">انتخاب کاربر:</h3>
                <div className="grid grid-cols-3 gap-2">
                  {(lastSnapshots.length > 0 ? lastSnapshots : lastThreeUsers).slice(0, 6).map((item: any, idx: number) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedSuspectId(item.userId || item.id)}
                      className={`p-1.5 rounded-lg border text-center transition-colors ${selectedSuspectId === (item.userId || item.id) ? 'bg-blue-100 border-blue-400' : 'bg-gray-100/70 border-gray-300 hover:bg-gray-200/70'}`}
                    >
                      {item.url ? (
                        <img src={item.url} alt={`snap_${idx}`} className="w-full h-16 object-cover rounded-md mb-1" />
                      ) : (
                        <div className="w-full h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md flex items-center justify-center mb-1">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <p className="text-gray-700 text-xs">گزینه {idx + 1}</p>
                    </button>
                  ))}
                </div>
                <p className="text-gray-500 text-[11px] mt-2">اگر مطمئن نیستید، می‌توانید بدون انتخاب نیز گزارش را ارسال کنید تا پشتیبانی بررسی کند.</p>
              </div>
            )}
            
            <div className="space-y-2">
              <h3 className="text-gray-800 font-semibold text-sm">دلیل گزارش:</h3>
              {['محتوای نامناسب', 'زبان نامناسب', 'رفتار غیراخلاقی', 'هرزنگاری', 'سایر موارد'].map((reason) => (
                <button
                  key={reason}
                  onClick={async () => {
                    // نگاشت دلیل به کلیدهای بک‌اند
                    const map: Record<string, string> = {
                      'محتوای نامناسب': 'inappropriate_content',
                      'زبان نامناسب': 'inappropriate_language',
                      'رفتار غیراخلاقی': 'immoral_behavior',
                      'هرزنگاری': 'spam',
                      'سایر موارد': 'other'
                    };
                    const vKey = map[reason] || 'other';
                    const evidenceUrl = lastSnapshots[0]?.url;
                    // اگر شناسه واقعی کاربر نداریم، بدون reportedUserId ارسال می‌کنیم تا پشتیبانی تعیین کند
                    // تلاش برای ارسال فیلدهای کمکی فقط در صورت معتبر بودن (ObjectId)
                    const objectIdRegex = /^[a-f\d]{24}$/i;
                    const candidates = (lastThreeUsers || [])
                      .map(u => u.id)
                      .filter(id => objectIdRegex.test(id))
                      .slice(0, 6);
                    const suggestedId = selectedSuspectId && objectIdRegex.test(selectedSuspectId) ? selectedSuspectId : undefined;

                    const payload: any = {
                      violationType: vKey,
                      description: selectedSuspectId ? `Suspect: ${selectedSuspectId}` : undefined,
                      evidence: evidenceUrl ? [evidenceUrl] : [],
                    };
                    if (candidates.length) payload.candidateUserIds = candidates;
                    if (suggestedId) payload.suggestedReportedUserId = suggestedId;

                    const ok = await submitReport(payload);
                    if (ok) {
                      alert(`🚩 گزارش برای "${reason}" ثبت شد و در حال بررسی است`);
                      setSelectedSuspectId(null);
                      goBack();
                    } else {
                      alert('ارسال گزارش با خطا مواجه شد. لطفاً بعداً تلاش کنید.');
                    }
                  }}
                  className="w-full bg-gray-100/70 text-gray-800 p-3 rounded-lg text-right hover:bg-gray-200/70 transition-colors text-sm border border-gray-300"
                >
                  {reason}
                </button>
              ))}
            </div>
            
            <button
              onClick={goBack}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors"
            >
              بازگشت
            </button>
          </div>
        </div>
      </>
    );
  }

  // Subscription Screen - با overlay شیشه‌ای
  if (currentScreen === 'subscription') {
    // کامپوننت پس‌زمینه صفحه چت
    const ChatBackground = () => (
      <div className="min-h-screen bg-gray-50 relative overflow-hidden">
        <div className="h-screen flex flex-col">
          {/* Top Header Bar */}
          <div className="bg-white shadow-sm px-4 py-2 flex items-center justify-between">
            <button className="p-2">
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-4">
              <button className="p-2"><Bell className="w-5 h-5 text-gray-700" /></button>
              <button className="p-2"><Gift className="w-5 h-5 text-gray-700" /></button>
              <button className="p-2"><UserPlus className="w-5 h-5 text-gray-700" /></button>
            </div>
          </div>
          
          {/* Main Video Area */}
          <div className="flex-1 relative bg-black">
            <div className="w-full h-full relative">
              <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center">
                <div className="text-center">
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500/30 to-purple-600/30 rounded-full flex items-center justify-center mb-4 mx-auto relative">
                      <Camera className="w-14 h-14 text-blue-400 relative z-10" />
                    </div>
                  </div>
                  <p className="text-gray-300 text-lg font-medium">در انتظار اتصال</p>
<p className="text-gray-500 text-sm mt-2">برای جستجوی کاربر جدید دکمه آبی را بزنید</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat & Controls Section */}
          <div className="bg-white shadow-2xl">
            <div className="px-4 py-3 max-h-40 overflow-y-auto bg-gray-50">
              <div className="text-center text-gray-400 text-sm py-2">
                شروع چت با ارسال پیام
              </div>
            </div>
            <div className="bg-white border-t border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 text-white" />
                  </button>
                  <button className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <RotateCcw className="w-6 h-6 text-white" />
                  </button>
                </div>
                <div className="flex items-center gap-3 flex-1">
                  <input className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm" placeholder="پیام خود را بنویسید..." disabled />
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
    
    return (
      <>
        {/* صفحه چت در پس‌زمینه */}
        <ChatBackground />
        
        {/* Overlay پاپ‌آپ */}
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm p-4 grid place-items-center" onClick={goBack}>
          <div className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-black/70 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-white text-xl font-bold mb-6 text-center">خرید اشتراک</h2>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-4 rounded-xl">
                <h3 className="text-white font-bold mb-2">اشتراک یک ماهه</h3>
                <p className="text-white/90 text-sm mb-3">
                  • تصویر با کیفیت بالا
                  • قابلیت قفل ۲ دقیقه‌ای
                  • ادامه ارتباط بالای ۳ دقیقه
                  • ۱۰ قفل ماهانه
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
                  • ۶۰ قفل (۶ ماه)
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
                  • ۱۲۰ قفل (۱ سال)
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
              onClick={goBack}
              className="w-full mt-6 bg-gray-600 text-white py-3 rounded-xl"
            >
              بازگشت
            </button>
          </div>
        </div>
      </div>
      </>
    );
  }

  // Friends Screen - با overlay شیشه‌ای
if (currentScreen === 'friends') {
    // پس‌زمینه صفحه چت (برای محو شدن)
    const ChatBackground = () => (
      <div className="min-h-screen bg-gray-50 relative overflow-hidden">
        <div className="h-screen flex flex-col">
          {/* Top Header Bar */}
          <div className="bg-white shadow-sm px-4 py-2 flex items-center justify-between">
            <button className="p-2">
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-4">
              <button className="p-2"><Bell className="w-5 h-5 text-gray-700" /></button>
              <button className="p-2"><Gift className="w-5 h-5 text-gray-700" /></button>
              <button className="p-2"><UserPlus className="w-5 h-5 text-gray-700" /></button>
            </div>
          </div>
          
          {/* Main Video Area */}
          <div className="flex-1 relative bg-black">
            <div className="w-full h-full relative">
              <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center">
                <div className="text-center">
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500/30 to-purple-600/30 rounded-full flex items-center justify-center mb-4 mx-auto relative">
                      <Camera className="w-14 h-14 text-blue-400 relative z-10" />
                    </div>
                  </div>
                  <p className="text-gray-300 text-lg font-medium">در انتظار اتصال</p>
                  <p className="text-gray-500 text-sm mt-2">برای جستجوی کاربر جدید دکمه آبی را بزنید</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat & Controls Section */}
          <div className="bg-white shadow-2xl">
            <div className="px-4 py-3 max-h-40 overflow-y-auto bg-gray-50">
              <div className="text-center text-gray-400 text-sm py-2">
                شروع چت با ارسال پیام
              </div>
            </div>
            <div className="bg-white border-t border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Square className="w-6 h-6 text-white" />
                  </button>
                  <button className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 text-white" />
                  </button>
                </div>
                <div className="flex items-center gap-3 flex-1">
                  <input className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm" placeholder="پیام خود را بنویسید..." disabled />
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    // کپی لینک دعوت
    const copyInvite = () => {
      const code = 'INVITE' + (phoneNumber ? String(phoneNumber).slice(-4) : '1545');
      const link = `https://videochat.app/invite/${code}`;
      try { navigator.clipboard.writeText(link); } catch {}
      alert('لینک دعوت کپی شد!');
    };

    return (
      <>
        <ChatBackground />
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-lg p-4 flex items-center justify-center" onClick={goBack}>
          <div className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-black/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-3 bg-pink-500/30 rounded-full flex items-center justify-center">
                  <UserPlus className="w-7 h-7 text-pink-300" />
                </div>
                <h2 className="text-white text-lg font-bold mb-1">معرفی به دوستان</h2>
                <p className="text-gray-300 text-sm mb-4">دوستان خود را دعوت کنید و اشتراک رایگان بگیرید!</p>
              </div>

              <div className="bg-black/30 rounded-xl p-4 text-right mb-4 border border-white/10">
                <div className="text-white font-semibold mb-2 text-sm">مزایای دعوت:</div>
                <ul className="text-gray-300 text-sm list-disc pr-5 space-y-1">
                  <li>به ازای هر ۵ دعوت، ۱ ماه اشتراک رایگان</li>
                  <li>دوستان شما ۱۰٪ تخفیف دریافت می‌کنند</li>
                  <li>امتیاز ویژه برای کاربران فعال</li>
                </ul>
              </div>

              <button
                onClick={copyInvite}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-bold mb-4 hover:from-pink-600 hover:to-rose-600 transition-colors"
              >
                ارسال لینک دعوت
              </button>

              <div className="bg-black/30 rounded-xl p-4 text-right border border-white/10">
                <div className="text-white font-semibold mb-2 text-sm">دوستان دعوت شده</div>
                <p className="text-gray-400 text-xs">هنوز کسی را دعوت نکرده‌اید</p>
              </div>

              <button onClick={goBack} className="w-full mt-6 bg-gray-600 hover:bg-gray-700 text-white py-2.5 rounded-xl">بازگشت</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Rules Screen - با overlay شیشه‌ای
  if (currentScreen === 'rules') {
    // کامپوننت پس‌زمینه صفحه چت
    const ChatBackground = () => (
      <div className="min-h-screen bg-gray-50 relative overflow-hidden">
        <div className="h-screen flex flex-col">
          {/* Top Header Bar */}
          <div className="bg-white shadow-sm px-4 py-2 flex items-center justify-between">
            <button className="p-2">
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-4">
              <button className="p-2"><Bell className="w-5 h-5 text-gray-700" /></button>
              <button className="p-2"><Gift className="w-5 h-5 text-gray-700" /></button>
              <button className="p-2"><UserPlus className="w-5 h-5 text-gray-700" /></button>
            </div>
          </div>
          
          {/* Main Video Area */}
          <div className="flex-1 relative bg-black">
            <div className="w-full h-full relative">
              <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center">
                <div className="text-center">
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500/30 to-purple-600/30 rounded-full flex items-center justify-center mb-4 mx-auto relative">
                      <Camera className="w-14 h-14 text-blue-400 relative z-10" />
                    </div>
                  </div>
                  <p className="text-gray-300 text-lg font-medium">در انتظار اتصال</p>
                  <p className="text-gray-500 text-sm mt-2">برای جستجوی کاربر جدید دکمه سبز را بزنید</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat & Controls Section */}
          <div className="bg-white shadow-2xl">
            <div className="px-4 py-3 max-h-40 overflow-y-auto bg-gray-50">
              <div className="text-center text-gray-400 text-sm py-2">
                شروع چت با ارسال پیام
              </div>
            </div>
            <div className="bg-white border-t border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 text-white" />
                  </button>
                </div>
                <div className="flex items-center gap-3 flex-1">
                  <input className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm" placeholder="پیام خود را بنویسید..." disabled />
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
    
    return (
      <>
        {/* صفحه چت در پس‌زمینه */}
        <ChatBackground />
        
        {/* Overlay پاپ‌آپ */}
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm p-4 grid place-items-center" onClick={goBack}>
          <div className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-black/70 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-white text-xl font-bold mb-6 text-center">قوانین استفاده</h2>
            
            <div className="space-y-4 text-gray-300 text-sm">
              <div>
                <div className="mb-2">
                  <h3 className="text-white font-bold">قوانین عمومی:</h3>
                </div>
                <ul className="space-y-1">
                  {publicRules && publicRules.length > 0 ? (
                    publicRules.map(rule => (
                      <li key={rule.id}>• {rule.title}{rule.description ? `: ${rule.description}` : ''}</li>
                    ))
                  ) : (
                    rules.general.filter(rule => rule.active).map(rule => (
                      <li key={rule.id}>• {rule.text}</li>
                    ))
                  )}
                </ul>
              </div>
              
              <div>
                <h3 className="text-white font-bold mb-2">تخلفات و مجازات‌ها:</h3>
                <ul className="space-y-1">
                  {Object.entries(rules.punishments).map(([key, punishment]) => (
                    <li key={key}>
                      • {punishment.name}: {punishment.description}
                      {punishment.duration > 0 && ` (${punishment.duration} ساعت)`}
                      {punishment.duration === -1 && ` (دائمی)`}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-white font-bold mb-2">تنظیمات خودکار:</h3>
                <ul className="space-y-1">
                  <li>• حد آستانه گزارش برای اقدام خودکار: {rules.autoActions.reportThreshold} گزارش</li>
                  <li>• ضریب افزایش مجازات برای تکرار: {rules.autoActions.repeatViolationMultiplier}x</li>
                </ul>
              </div>
            </div>
            
            <button
              onClick={goBack}
              className="w-full mt-6 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl transition-colors"
            >
              بازگشت
            </button>
          </div>
        </div>
      </div>
      </>
    );
  }

  // Messages Screen - overlay سبک روی چت با رنگ‌های اصلی
  if (currentScreen === 'messages') {
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // کامپوننت پس‌زمینه صفحه چت
    const ChatBackground = () => (
      <div className="min-h-screen bg-gray-50 relative overflow-hidden">
        <div className="h-screen flex flex-col">
          {/* Top Header Bar */}
          <div className="bg-white shadow-sm px-4 py-2 flex items-center justify-between">
            <button className="p-2">
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-4">
              <button className="p-2"><Bell className="w-5 h-5 text-gray-700" /></button>
              <button className="p-2"><Gift className="w-5 h-5 text-gray-700" /></button>
              <button className="p-2"><UserPlus className="w-5 h-5 text-gray-700" /></button>
            </div>
          </div>
          
          {/* Main Video Area */}
          <div className="flex-1 relative bg-black">
            <div className="w-full h-full relative">
              <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center">
                <div className="text-center">
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500/30 to-purple-600/30 rounded-full flex items-center justify-center mb-4 mx-auto relative">
                      <Camera className="w-14 h-14 text-blue-400 relative z-10" />
                    </div>
                  </div>
                  <p className="text-gray-300 text-lg font-medium">در انتظار اتصال</p>
                  <p className="text-gray-500 text-sm mt-2">برای جستجوی کاربر جدید دکمه سبز را بزنید</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat & Controls Section */}
          <div className="bg-white shadow-2xl">
            <div className="px-4 py-3 max-h-40 overflow-y-auto bg-gray-50">
              <div className="text-center text-gray-400 text-sm py-2">
                شروع چت با ارسال پیام
              </div>
            </div>
            <div className="bg-white border-t border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 text-white" />
                  </button>
                </div>
                <div className="flex items-center gap-3 flex-1">
                  <input className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm" placeholder="پیام خود را بنویسید..." disabled />
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
    
    return (
      <>
        {/* صفحه چت در پس‌زمینه */}
        <ChatBackground />
        
        {/* Overlay پاپ‌آپ */}
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm p-4 grid place-items-center" onClick={goBack}>
          <div className="max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-black/70 backdrop-blur-lg rounded-2xl p-4 border border-white/30 shadow-2xl max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg font-bold">پیام‌های دریافتی</h2>
              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    setNotifications(notifications.map(n => ({...n, read: true})));
                    setCurrentScreen('call');
                  }}
                  className="text-blue-400 text-xs hover:text-blue-300"
                >
                  خواندن همه
                </button>
              )}
            </div>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
              {notifications.length > 0 ? (
                notifications.map((notif) => {
                  const { message: processedMessage, buttons } = renderMessageWithButtons(notif.message);
                  
                  return (
                    <div 
                      key={notif.id} 
                      className={`p-3 rounded-lg border transition-all ${
                        notif.read 
                          ? 'bg-gray-800/30 border-gray-700' 
                          : 'bg-blue-900/30 border-blue-600'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {notif.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
                          {notif.type === 'offer' && <Gift className="w-4 h-4 text-yellow-400" />}
                          {notif.type === 'reward' && <Heart className="w-4 h-4 text-pink-400" />}
                          {notif.type === 'lock' && <Lock className="w-4 h-4 text-purple-400" />}
                          <h3 className="text-white font-bold text-sm">{notif.title}</h3>
                        </div>
                        {!notif.read && (
                          <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">جدید</span>
                        )}
                      </div>
                      <p className="text-gray-300 text-xs mb-2">{sanitizeMessageText(processedMessage)}</p>
                      
                      {/* دکمه‌های تعبیه شده */}
                      {buttons.length > 0 && (
                        <div className="space-y-2 mb-2">
                          {buttons.map((button, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                button.action();
                                setNotifications(notifications.map(n => 
                                  n.id === notif.id ? {...n, read: true} : n
                                ));
                              }}
                              className={`w-full bg-gradient-to-r ${button.color} text-white py-2 rounded text-xs font-bold hover:opacity-90 transition-all text-center`}
                            >
                              {button.text}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {notif.hasButton && (
                        <button
                          onClick={() => {
                            notif.buttonAction();
                            setNotifications(notifications.map(n => 
                              n.id === notif.id ? {...n, read: true} : n
                            ));
                          }}
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-1.5 rounded text-xs font-bold hover:from-blue-600 hover:to-purple-700 transition-all"
                        >
                          {notif.buttonText}
                        </button>
                      )}
                      
                      <div className="text-gray-400 text-xs mt-1">
                        {notif.date.toLocaleDateString('fa-IR')}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <Bell className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">شما پیامی ندارید</p>
                </div>
              )}
            </div>
            
            <button
              onClick={goBack}
              className="w-full mt-4 bg-gray-600 text-white py-2 rounded-lg text-sm"
            >
              بازگشت
            </button>
          </div>
        </div>
      </div>
      </>
    );
  }

  // Profile Screen - با overlay شیشه‌ای
  if (currentScreen === 'profile') {
    // کامپوننت پس‌زمینه صفحه چت
    const ChatBackground = () => (
      <div className="min-h-screen bg-gray-50 relative overflow-hidden">
        <div className="h-screen flex flex-col">
          {/* Top Header Bar */}
          <div className="bg-white shadow-sm px-4 py-2 flex items-center justify-between">
            <button className="p-2">
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-4">
              <button className="p-2"><Bell className="w-5 h-5 text-gray-700" /></button>
              <button className="p-2"><Gift className="w-5 h-5 text-gray-700" /></button>
              <button className="p-2"><UserPlus className="w-5 h-5 text-gray-700" /></button>
            </div>
          </div>
          
          {/* Main Video Area */}
          <div className="flex-1 relative bg-black">
            <div className="w-full h-full relative">
              <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center">
                <div className="text-center">
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500/30 to-purple-600/30 rounded-full flex items-center justify-center mb-4 mx-auto relative">
                      <Camera className="w-14 h-14 text-blue-400 relative z-10" />
                    </div>
                  </div>
                  <p className="text-gray-300 text-lg font-medium">در انتظار اتصال</p>
                  <p className="text-gray-500 text-sm mt-2">برای جستجوی کاربر جدید دکمه سبز را بزنید</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat & Controls Section */}
          <div className="bg-white shadow-2xl">
            <div className="px-4 py-3 max-h-40 overflow-y-auto bg-gray-50">
              <div className="text-center text-gray-400 text-sm py-2">
                شروع چت با ارسال پیام
              </div>
            </div>
            <div className="bg-white border-t border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 text-white" />
                  </button>
                </div>
                <div className="flex items-center gap-3 flex-1">
                  <input className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm" placeholder="پیام خود را بنویسید..." disabled />
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
    
    return (
      <>
        {/* صفحه چت در پس‌زمینه */}
        <ChatBackground />
        
        {/* Overlay پاپ‌آپ */}
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm p-4 flex items-center justify-center" onClick={goBack}>
          <div className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-black/70 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-white text-xl font-bold mb-6 text-center">پروفایل کاربری</h2>
            
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <p className="text-white font-medium">{phoneNumber}</p>
              {currentUser.subscription ? (
                <div>
                  <p className="text-yellow-400 font-bold">⭐ کاربر ویژه ⭐</p>
                  <p className="text-gray-300 text-sm">اشتراک فعال ({subscriptionDays} روز)</p>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">کاربر عادی</p>
              )}
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
                    // Reset other states
                    setIsCallActive(false);
                    setChatMessages([]);
                    setLastThreeUsers([]);
                    setCurrentChatUser(null);
                  }
                }}
                className="w-full bg-red-600 text-white p-3 rounded-xl text-right"
              >
                خروج از حساب
              </button>
            </div>
            
            <button
              onClick={goBack}
              className="w-full mt-6 bg-gray-600 text-white py-3 rounded-xl"
            >
              بازگشت
            </button>
          </div>
        </div>
      </div>
      </>
    );
  }

  // Edit Notifications Screen
  if (currentScreen === 'edit-notifications') {
    const [editingNotif, setEditingNotif] = useState<any>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editMessage, setEditMessage] = useState('');
    
    const startEditing = (notif: any) => {
      setEditingNotif(notif);
      setEditTitle(notif.title);
      setEditMessage(notif.message);
    };
    
    const saveEdit = () => {
      if (editingNotif) {
        setNotifications(notifications.map(n => 
          n.id === editingNotif.id 
            ? { ...n, title: editTitle, message: editMessage }
            : n
        ));
        setEditingNotif(null);
        alert('✅ پیام با موفقیت به‌روزرسانی شد!');
      }
    };
    
    const addNewNotification = () => {
      const newNotif = {
        id: Date.now(),
        title: 'پیام جدید',
        message: 'متن پیام جدید [BUY_SUBSCRIPTION]',
        type: 'info',
        read: false,
        date: new Date(),
        hasButton: false
      };
      setNotifications([newNotif, ...notifications]);
      startEditing(newNotif);
    };
    
    return (
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm p-4 flex items-center justify-center" onClick={goBack}>
        <div className="max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
          <div className="bg-black/70 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-xl font-bold">ویرایش پیام‌ها</h2>
              <button
                onClick={addNewNotification}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
              >
                + پیام جدید
              </button>
            </div>
            
            {editingNotif ? (
              <div className="mb-4 p-4 bg-gray-800/50 rounded-xl">
                <h3 className="text-white font-bold mb-3">ویرایش پیام:</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-300 text-sm block mb-1">عنوان:</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-gray-700 text-white p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm block mb-1">متن پیام:</label>
                    <textarea
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      className="w-full bg-gray-700 text-white p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                      dir="rtl"
                      placeholder="برای اضافه دکمه خرید اشتراک: [BUY_SUBSCRIPTION]\nبرای اضافه دکمه خرید قفل: [BUY_LOCKS]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
                    >
                      <Save className="w-4 h-4" />
                      ذخیره
                    </button>
                    <button
                      onClick={() => setEditingNotif(null)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg text-sm transition-colors"
                    >
                      لغو
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 text-sm mb-4">
                برای ویرایش پیام روی آیکون مداد کلیک کنید
              </div>
            )}
            
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {notifications.map((notif) => (
                <div key={notif.id} className="bg-gray-800/30 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold text-sm">{notif.title}</h4>
                      <p className="text-gray-300 text-xs mt-1">{notif.message.substring(0, 50)}...</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditing(notif)}
                        className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        title="ویرایش"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('آیا مطمئن هستید؟')) {
                            setNotifications(notifications.filter(n => n.id !== notif.id));
                          }
                        }}
                        className="p-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                        title="حذف"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-gray-400 text-xs">
              <p>کدهای دکمه:</p>
              <p>[BUY_SUBSCRIPTION] - دکمه خرید اشتراک</p>
              <p>[BUY_LOCKS] - دکمه خرید قفل</p>
            </div>
            
            <button
              onClick={goBack}
              className="w-full mt-4 bg-gray-600 text-white py-2 rounded-lg text-sm"
            >
              بازگشت
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Edit Rules Screen - صفحه مدیریت قوانین
  if (currentScreen === 'edit-rules') {
    const [activeTab, setActiveTab] = useState<'general' | 'violations' | 'punishments' | 'settings'>('general');
    const [editingRule, setEditingRule] = useState<any>(null);
    const [editingViolation, setEditingViolation] = useState<any>(null);
    const [editingPunishment, setEditingPunishment] = useState<any>(null);
    const [newRuleText, setNewRuleText] = useState('');
    const [newViolationName, setNewViolationName] = useState('');
    const [newViolationDesc, setNewViolationDesc] = useState('');
    const [newViolationSeverity, setNewViolationSeverity] = useState<'low' | 'medium' | 'high'>('medium');
    
    const addNewRule = () => {
      if (newRuleText.trim()) {
        const newRule = {
          id: Math.max(...rules.general.map(r => r.id)) + 1,
          text: newRuleText.trim(),
          active: true
        };
        setRules(prev => ({
          ...prev,
          general: [...prev.general, newRule]
        }));
        setNewRuleText('');
        alert('✅ قانون جدید با موفقیت اضافه شد!');
      }
    };
    
    const toggleRuleActive = (id: number) => {
      setRules(prev => ({
        ...prev,
        general: prev.general.map(rule => 
          rule.id === id ? {...rule, active: !rule.active} : rule
        )
      }));
    };
    
    const updateRule = (id: number, newText: string) => {
      setRules(prev => ({
        ...prev,
        general: prev.general.map(rule => 
          rule.id === id ? {...rule, text: newText} : rule
        )
      }));
    };
    
    const deleteRule = (id: number) => {
      if (confirm('آیا از حذف این قانون مطمئن هستید؟')) {
        setRules(prev => ({
          ...prev,
          general: prev.general.filter(rule => rule.id !== id)
        }));
        alert('✅ قانون با موفقیت حذف شد!');
      }
    };
    
    const updatePunishment = (key: string, field: string, value: any) => {
      setRules(prev => ({
        ...prev,
        punishments: {
          ...prev.punishments,
          [key]: {
            ...prev.punishments[key as keyof typeof prev.punishments],
            [field]: value
          }
        }
      }));
    };
    
    return (
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm p-4 flex items-center justify-center" onClick={goBack}>
        <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
          <div className="bg-black/80 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-2xl font-bold">🛡️ مدیریت قوانین و مجازات‌ها</h2>
              <button
                onClick={goBack}
                className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-700 p-1 rounded-lg mb-6">
              <button
                onClick={() => setActiveTab('general')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'general' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'
                }`}
              >
                قوانین عمومی
              </button>
              <button
                onClick={() => setActiveTab('violations')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'violations' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'
                }`}
              >
                انواع تخلفات
              </button>
              <button
                onClick={() => setActiveTab('punishments')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'punishments' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'
                }`}
              >
                مجازات‌ها
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'
                }`}
              >
                تنظیمات خودکار
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto">
              {/* General Rules Tab */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <h3 className="text-white font-bold mb-3">افزودن قانون جدید:</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newRuleText}
                        onChange={(e) => setNewRuleText(e.target.value)}
                        placeholder="متن قانون جدید را وارد کنید..."
                        className="flex-1 bg-gray-700 text-white p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        dir="rtl"
                      />
                      <button
                        onClick={addNewRule}
                        disabled={!newRuleText.trim()}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg text-sm font-bold transition-colors"
                      >
                        افزودن
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {rules.general.map((rule) => (
                      <div key={rule.id} className="bg-gray-800/30 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleRuleActive(rule.id)}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              rule.active ? 'bg-green-500' : 'bg-gray-600'
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                              rule.active ? 'translate-x-7' : 'translate-x-1'
                            }`} />
                          </button>
                          
                          {editingRule === rule.id ? (
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                defaultValue={rule.text}
                                onBlur={(e) => {
                                  updateRule(rule.id, e.target.value);
                                  setEditingRule(null);
                                }}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    updateRule(rule.id, (e.target as HTMLInputElement).value);
                                    setEditingRule(null);
                                  }
                                }}
                                className="flex-1 bg-gray-700 text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                dir="rtl"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <span 
                              className={`flex-1 text-sm ${
                                rule.active ? 'text-white' : 'text-gray-400 line-through'
                              }`}
                            >
                              {rule.text}
                            </span>
                          )}
                          
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingRule(editingRule === rule.id ? null : rule.id)}
                              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                              title="ویرایش"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteRule(rule.id)}
                              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                              title="حذف"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Violations Tab */}
              {activeTab === 'violations' && (
                <div className="space-y-4">
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <h3 className="text-white font-bold mb-3">مدیریت انواع تخلفات:</h3>
                    {rules.violations.map((violation) => (
                      <div key={violation.id} className="bg-gray-700/50 p-3 rounded-lg mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-semibold">{violation.name}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            violation.severity === 'low' ? 'bg-yellow-600 text-white' :
                            violation.severity === 'medium' ? 'bg-orange-600 text-white' :
                            'bg-red-600 text-white'
                          }`}>
                            {violation.severity === 'low' ? 'پایین' :
                             violation.severity === 'medium' ? 'متوسط' : 'بالا'}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{violation.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Punishments Tab */}
              {activeTab === 'punishments' && (
                <div className="space-y-4">
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <h3 className="text-white font-bold mb-4">تنظیم مجازات‌ها:</h3>
                    {Object.entries(rules.punishments).map(([key, punishment]) => (
                      <div key={key} className="bg-gray-700/50 p-4 rounded-lg mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-gray-300 text-sm block mb-2">نام مجازات:</label>
                            <input
                              type="text"
                              value={punishment.name}
                              onChange={(e) => updatePunishment(key, 'name', e.target.value)}
                              className="w-full bg-gray-600 text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              dir="rtl"
                            />
                          </div>
                          <div>
                            <label className="text-gray-300 text-sm block mb-2">مدت (ساعت):</label>
                            <input
                              type="number"
                              value={punishment.duration}
                              onChange={(e) => updatePunishment(key, 'duration', parseInt(e.target.value) || 0)}
                              className="w-full bg-gray-600 text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0 برای هشدار، -1 برای دائمی"
                            />
                          </div>
                          <div>
                            <label className="text-gray-300 text-sm block mb-2">توضیحات:</label>
                            <input
                              type="text"
                              value={punishment.description}
                              onChange={(e) => updatePunishment(key, 'description', e.target.value)}
                              className="w-full bg-gray-600 text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              dir="rtl"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Auto Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <h3 className="text-white font-bold mb-4">تنظیمات خودکار سیستم:</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-700/50 p-4 rounded-lg">
                        <label className="text-white font-semibold block mb-2">حد آستانه گزارش برای عمل خودکار:</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="number"
                            value={rules.autoActions.reportThreshold}
                            onChange={(e) => setRules(prev => ({
                              ...prev,
                              autoActions: {
                                ...prev.autoActions,
                                reportThreshold: parseInt(e.target.value) || 1
                              }
                            }))}
                            min="1"
                            max="10"
                            className="w-20 bg-gray-600 text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-gray-300 text-sm">گزارش (پس از این تعداد گزارش، عمل خودکار انجام می‌شود)</span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-700/50 p-4 rounded-lg">
                        <label className="text-white font-semibold block mb-2">ضریب افزایش مجازات برای تکرار:</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="number"
                            value={rules.autoActions.repeatViolationMultiplier}
                            onChange={(e) => setRules(prev => ({
                              ...prev,
                              autoActions: {
                                ...prev.autoActions,
                                repeatViolationMultiplier: parseInt(e.target.value) || 1
                              }
                            }))}
                            min="1"
                            max="5"
                            step="0.5"
                            className="w-20 bg-gray-600 text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-gray-300 text-sm">برابر (مجازات در تکرار تخلف چندین برابر می‌شود)</span>
                        </div>
                      </div>
                      
                      <div className="bg-blue-900/30 border border-blue-600 p-4 rounded-lg">
                        <h4 className="text-blue-400 font-bold mb-2">💡 راهنما:</h4>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• حد آستانه گزارش: تعداد گزارشی که پس از آن، سیستم خودکار عمل می‌کند</li>
                          <li>• ضریب تکرار: اگر کاربری دوباره تخلف کند، مجازات چند برابر می‌شود</li>
                          <li>• تنظیمات فعلی با قوانین موجود هماهنگ باشد</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  alert('✅ تغییرات در قوانین ذخیره شد!\n\nقوانین جدید از این لحظه اعمال می‌شود.');
                  goBack();
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                ذخیره تغییرات
              </button>
              <button
                onClick={goBack}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl font-bold transition-colors"
              >
                بازگشت
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Lock Purchase Popup - پاپ آپ خرید قفل
  if (showLockPurchasePopup && !showLockPurchaseScreen) {
    return (
      <>
        {/* صفحه چت در پس‌زمینه */}
        <div className="min-h-screen bg-gray-50 relative overflow-hidden opacity-40">
          <div className="h-screen flex flex-col">
            <div className="bg-white shadow-sm px-4 py-2 flex items-center justify-between">
              <button className="p-2">
                <Menu className="w-5 h-5 text-gray-700" />
              </button>
              <div className="flex items-center gap-4">
                <button className="p-2">
                  <Bell className="w-5 h-5 text-gray-700" />
                </button>
                <button className="p-2">
                  <Gift className="w-5 h-5 text-gray-700" />
                </button>
                <button className="p-2">
                  <UserPlus className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>
            <div className="flex-1 relative bg-white">
              <div className="w-full h-full relative">
                <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                  <div className="text-center text-white">
                    <p>ویدیو چت</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg"></div>
                  <input className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm" placeholder="پیام..." disabled />
                </div>
                <div className="flex items-center gap-2">
                  <button className="w-14 h-14 bg-blue-500 rounded-xl"></button>
                  <button className="w-14 h-14 bg-green-500 rounded-xl"></button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Lock Purchase Popup */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/50 shadow-2xl max-w-sm w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-white text-xl font-bold mb-2">🔒 قفل تمام شد!</h2>
              <p className="text-purple-200 text-sm leading-relaxed">
                با قفل کردن کاربران مقابل، آنها نمی‌توانند شما را رد کنند و مجبور هستند با شما چت کنند.
              </p>
            </div>
            
            <div className="bg-black/30 p-4 rounded-xl mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-purple-200 text-sm">قفل‌های باقی‌مانده:</span>
                <span className="text-red-400 font-bold">{lockCount} قفل</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-purple-200 text-sm">قیمت هر قفل:</span>
                <span className="text-green-400 font-bold">{lockSettings.lockPricePerUnit.toLocaleString()} تومان</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-200 text-sm">مدت زمان قفل:</span>
                <span className="text-yellow-400 font-bold">{lockSettings.lockDurationSeconds} ثانیه</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowLockPurchasePopup(false);
                  setShowLockPurchaseScreen(true);
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                💳 خرید قفل
              </button>
              
              <button
                onClick={() => navigateToScreen('friends')}
                className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white py-2 rounded-xl font-medium hover:from-blue-600 hover:to-teal-600 transition-all text-sm"
              >
                👥 دعوت دوستان برای قفل رایگان
              </button>
              
              <button
                onClick={() => setShowLockPurchasePopup(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-xl transition-colors text-sm"
              >
                بستن
              </button>
            </div>
            
            <p className="text-purple-200/70 text-xs text-center mt-4">
              💡 با دعوت هر {lockSettings.invitesRequiredForLock} دوست، {lockSettings.giftLockPerInvite} قفل رایگان دریافت کنید
            </p>
          </div>
        </div>
      </>
    );
  }
  
  // Lock Purchase Screen - صفحه خرید قفل
  if (showLockPurchaseScreen) {
    const [purchaseQuantity, setPurchaseQuantity] = useState(5);
    const [selectedPackage, setSelectedPackage] = useState<'small' | 'medium' | 'large'>('small');
    
    const lockPackages = [
      {
        id: 'small',
        name: 'بسته کوچک',
        quantity: 5,
        price: lockSettings.lockPricePerUnit * 5,
        discount: 0,
        popular: false,
        color: 'from-blue-500 to-blue-600'
      },
      {
        id: 'medium',
        name: 'بسته متوسط',
        quantity: 15,
        price: lockSettings.lockPricePerUnit * 15 * 0.85, // 15% تخفیف
        discount: 15,
        popular: true,
        color: 'from-purple-500 to-purple-600'
      },
      {
        id: 'large',
        name: 'بسته بزرگ',
        quantity: 30,
        price: lockSettings.lockPricePerUnit * 30 * 0.7, // 30% تخفیف
        discount: 30,
        popular: false,
        color: 'from-green-500 to-green-600'
      }
    ];
    
    const selectedLockPackage = lockPackages.find(pkg => pkg.id === selectedPackage);
    
    const handlePurchaseLocks = () => {
      if (selectedLockPackage) {
        // شبیه‌سازی خرید قفل
        setLockCount(prev => prev + selectedLockPackage.quantity);
        setShowLockPurchaseScreen(false);
        setShowLockPurchasePopup(false);
        
        // اضافه کردن نوتیفیکیشن خرید
        setNotifications(prev => [
          {
            id: Date.now(),
            title: '✅ خرید موفق!',
            message: `${selectedLockPackage.quantity} قفل با موفقیت به حساب شما اضافه شد. اکنون ${lockCount + selectedLockPackage.quantity} قفل دارید.`,
            type: 'reward',
            read: false,
            date: new Date(),
            hasButton: false
          },
          ...prev
        ]);
        
        alert(`🎉 خرید موفق!\n${selectedLockPackage.quantity} قفل به حساب شما اضافه شد\nمجموع قفل‌های شما: ${lockCount + selectedLockPackage.quantity}`);
      }
    };
    
    return (
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm p-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-gradient-to-br from-gray-900 to-purple-900 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-white text-2xl font-bold mb-2">خرید قفل</h2>
              <p className="text-gray-300 text-sm">
                قفل‌هایی برای کنترل بهتر چت‌های خود بخرید
              </p>
            </div>
            
            {/* Lock Packages */}
            <div className="space-y-3 mb-6">
              {lockPackages.map((pkg) => (
                <div 
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id as 'small' | 'medium' | 'large')}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPackage === pkg.id 
                      ? 'border-purple-400 bg-purple-500/20' 
                      : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                        محبوب ترین
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        selectedPackage === pkg.id 
                          ? 'bg-purple-400 border-purple-400' 
                          : 'border-gray-500'
                      }`} />
                      <div>
                        <h3 className="text-white font-bold">{pkg.name}</h3>
                        <p className="text-gray-300 text-sm">{pkg.quantity} قفل</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold text-lg">
                        {Math.round(pkg.price).toLocaleString()} تومان
                      </div>
                      {pkg.discount > 0 && (
                        <div className="text-gray-400 line-through text-sm">
                          {(lockSettings.lockPricePerUnit * pkg.quantity).toLocaleString()}
                        </div>
                      )}
                      {pkg.discount > 0 && (
                        <div className="text-green-400 text-xs font-bold">
                          {pkg.discount}٪ تخفیف
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 text-gray-400 text-xs">
                    هر قفل {lockSettings.lockDurationSeconds} ثانیه • قیمت هر قفل: {Math.round(pkg.price / pkg.quantity).toLocaleString()} تومان
                  </div>
                </div>
              ))}
            </div>
            
            {/* Purchase Summary */}
            {selectedLockPackage && (
              <div className="bg-black/30 p-4 rounded-xl mb-6">
                <h3 className="text-white font-bold mb-3">خلاصه خرید:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">بسته انتخابی:</span>
                    <span className="text-white font-bold">{selectedLockPackage.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">تعداد قفل:</span>
                    <span className="text-purple-400 font-bold">{selectedLockPackage.quantity} قفل</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">قفل‌های فعلی:</span>
                    <span className="text-blue-400 font-bold">{lockCount} قفل</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-600 pt-2">
                    <span className="text-gray-300">مجموع پس از خرید:</span>
                    <span className="text-green-400 font-bold">{lockCount + selectedLockPackage.quantity} قفل</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-600 pt-2">
                    <span className="text-white font-bold">مبلغ قابل پرداخت:</span>
                    <span className="text-yellow-400 font-bold text-lg">
                      {Math.round(selectedLockPackage.price).toLocaleString()} تومان
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handlePurchaseLocks}
                disabled={!selectedLockPackage}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" />
                پرداخت و خرید
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowLockPurchaseScreen(false);
                    setShowLockPurchasePopup(true);
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-xl transition-colors text-sm"
                >
                  بازگشت
                </button>
                <button
                  onClick={() => {
                    setShowLockPurchaseScreen(false);
                    setShowLockPurchasePopup(false);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl transition-colors text-sm"
                >
                  لغو
                </button>
              </div>
            </div>
            
            {/* Additional Info */}
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600/50 rounded-lg">
              <h4 className="text-blue-400 font-bold text-sm mb-2">💡 راهنما:</h4>
              <ul className="text-gray-300 text-xs space-y-1">
                <li>• با قفل کردن، کاربر مقابل نمی‌تواند شما را رد کند</li>
                <li>• هر قفل برای {lockSettings.lockDurationSeconds} ثانیه کار می‌کند</li>
                <li>• قفل‌ها پس از خرید بلافاصله فعال می‌شوند</li>
                <li>• می‌توانید با دعوت دوستان قفل رایگان دریافت کنید</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Subscription Screen
};

export default RandomVideoChatApp;
