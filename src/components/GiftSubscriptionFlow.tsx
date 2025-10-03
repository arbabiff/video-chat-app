import React, { useState, useEffect } from 'react';
import { Gift, Check, X, Clock, Heart } from 'lucide-react';

interface GiftSubscriptionFlowProps {
  isVisible: boolean;
  onClose: () => void;
  currentUser: any;
  partnerUser: any;
  subscriptions: any[];
  settings: {
    giftWorkflowEnabled: boolean;
    buyerRequestMessage: string;
    receiverAcceptMessage: string;
    monthlyGiftLimit: number;
    giftLockTimeSeconds: number;
  };
  onGiftPurchased: (giftData: any) => void;
}

type FlowStep = 'request' | 'waiting' | 'partner_accept' | 'purchase' | 'completed';

const GiftSubscriptionFlow: React.FC<GiftSubscriptionFlowProps> = ({
  isVisible,
  onClose,
  currentUser,
  partnerUser,
  subscriptions,
  settings,
  onGiftPurchased
}) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('request');
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [countdown, setCountdown] = useState(30); // 30 ثانیه برای پذیرش

  // فیلتر اشتراک‌های قابل هدیه
  const giftableSubscriptions = subscriptions.filter(sub => sub.giftEnabled && sub.active);

  useEffect(() => {
    if (currentStep === 'partner_accept' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // زمان پذیرش تمام شد
      onClose();
    }
  }, [currentStep, countdown, onClose]);

  // مرحله 1: درخواست خرید هدیه
  const renderRequestStep = () => (
    <div className="p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Gift className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">خرید اشتراک هدیه</h2>
      </div>

      <div className="bg-blue-900/30 border border-blue-600 p-4 rounded-xl mb-6">
        <p className="text-gray-300 leading-relaxed">
          {settings.buyerRequestMessage}
        </p>
      </div>

      {/* انتخاب نوع اشتراک */}
      <div className="space-y-3 mb-6">
        <h3 className="text-white font-semibold">انتخاب نوع اشتراک:</h3>
        {giftableSubscriptions.map(sub => (
          <button
            key={sub.id}
            onClick={() => setSelectedSubscription(sub)}
            className={`w-full p-4 rounded-xl border-2 transition-all text-right ${
              selectedSubscription?.id === sub.id
                ? 'border-pink-500 bg-pink-900/20'
                : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-white font-bold">{sub.name}</h4>
                <p className="text-gray-300 text-sm">{sub.description}</p>
                <p className="text-gray-400 text-xs">
                  قفل هدیه: {sub.giftLocks} عدد | کیفیت: {sub.videoQuality}
                </p>
              </div>
              <div className="text-left">
                <p className="text-white font-bold">{sub.price.toLocaleString()} تومان</p>
                <p className="text-gray-400 text-sm">{sub.duration} روز</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            if (selectedSubscription) {
              setCurrentStep('waiting');
              // شبیه‌سازی ارسال درخواست به طرف مقابل
              setTimeout(() => {
                setCurrentStep('partner_accept');
              }, 2000);
            }
          }}
          disabled={!selectedSubscription}
          className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ارسال درخواست خرید
        </button>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-gray-600 text-white rounded-xl"
        >
          انصراف
        </button>
      </div>
    </div>
  );

  // مرحله 2: در انتظار پذیرش
  const renderWaitingStep = () => (
    <div className="p-6 text-center">
      <div className="w-16 h-16 bg-yellow-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
        <Clock className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-xl font-bold text-white mb-4">در انتظار پذیرش کاربر مقابل</h2>
      <p className="text-gray-300 mb-6">
        درخواست شما برای خرید اشتراک هدیه ارسال شد. لطفاً منتظر پذیرش کاربر مقابل باشید.
      </p>
      
      <div className="bg-gray-800/50 p-4 rounded-xl mb-6">
        <p className="text-white font-semibold">اشتراک انتخابی:</p>
        <p className="text-gray-300">{selectedSubscription?.name} - {selectedSubscription?.price.toLocaleString()} تومان</p>
      </div>

      <button
        onClick={onClose}
        className="bg-gray-600 text-white px-6 py-3 rounded-xl"
      >
        انصراف
      </button>
    </div>
  );

  // مرحله 3: پذیرش توسط طرف مقابل (شبیه‌سازی)
  const renderPartnerAcceptStep = () => (
    <div className="p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Gift className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">پذیرش شرایط هدیه</h2>
        <div className="bg-red-500/20 border border-red-500 px-3 py-1 rounded-full inline-block">
          <span className="text-red-400 text-sm font-bold">
            {countdown} ثانیه باقیمانده
          </span>
        </div>
      </div>

      <div className="bg-yellow-900/30 border border-yellow-600 p-4 rounded-xl mb-6">
        <p className="text-gray-300 leading-relaxed">
          {settings.receiverAcceptMessage}
        </p>
      </div>

      <div className="bg-gray-800/50 p-4 rounded-xl mb-6">
        <h4 className="text-white font-semibold mb-2">جزئیات هدیه:</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">نوع اشتراک:</span>
            <p className="text-white">{selectedSubscription?.name}</p>
          </div>
          <div>
            <span className="text-gray-400">مدت:</span>
            <p className="text-white">{selectedSubscription?.duration} روز</p>
          </div>
          <div>
            <span className="text-gray-400">قفل هدیه:</span>
            <p className="text-white">{selectedSubscription?.giftLocks} عدد</p>
          </div>
          <div>
            <span className="text-gray-400">کیفیت ویدیو:</span>
            <p className="text-white">{selectedSubscription?.videoQuality}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setCurrentStep('purchase');
          }}
          className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          پذیرش شرایط
        </button>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-red-600 text-white rounded-xl flex items-center justify-center gap-2"
        >
          <X className="w-5 h-5" />
          رد کردن
        </button>
      </div>
    </div>
  );

  // مرحله 4: پرداخت
  const renderPurchaseStep = () => (
    <div className="p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">خرید هدیه اشتراک</h2>
        <p className="text-green-400 font-semibold">
          کاربر با شرایط دریافت هدیه شما موافقت کرد!
        </p>
      </div>

      <div className="bg-green-900/30 border border-green-600 p-4 rounded-xl mb-6">
        <h4 className="text-white font-semibold mb-3">تایید نهایی خرید:</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">نوع اشتراک:</span>
            <span className="text-white">{selectedSubscription?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">مبلغ:</span>
            <span className="text-white font-bold">{selectedSubscription?.price.toLocaleString()} تومان</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">هدیه‌گیرنده:</span>
            <span className="text-white">{partnerUser?.name || 'کاربر مقابل'}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            // شبیه‌سازی خرید موفق
            onGiftPurchased({
              subscription: selectedSubscription,
              receiver: partnerUser,
              buyer: currentUser,
              purchaseDate: new Date()
            });
            setCurrentStep('completed');
          }}
          className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 rounded-xl font-bold"
        >
          خرید هدیه اشتراک
        </button>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-gray-600 text-white rounded-xl"
        >
          انصراف
        </button>
      </div>
    </div>
  );

  // مرحله 5: تکمیل خرید
  const renderCompletedStep = () => (
    <div className="p-6 text-center">
      <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
        <Check className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-xl font-bold text-white mb-4">خرید با موفقیت انجام شد!</h2>
      
      <div className="bg-green-900/30 border border-green-600 p-4 rounded-xl mb-6">
        <p className="text-green-300 mb-2">🎉 تبریک!</p>
        <p className="text-gray-300">
          اشتراک {selectedSubscription?.name} با موفقیت به کاربر مقابل هدیه داده شد.
        </p>
      </div>

      <div className="bg-gray-800/50 p-4 rounded-xl mb-6">
        <h4 className="text-white font-semibold mb-2">مزایای شما:</h4>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• قفل {settings.giftLockTimeSeconds} ثانیه‌ای با هدیه‌گیرنده</li>
          <li>• {selectedSubscription?.giftLocks} قفل اضافی رایگان</li>
          <li>• اولویت چت با هدیه‌گیرنده</li>
        </ul>
      </div>

      <button
        onClick={onClose}
        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold"
      >
        بستن
      </button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'request':
        return renderRequestStep();
      case 'waiting':
        return renderWaitingStep();
      case 'partner_accept':
        return renderPartnerAcceptStep();
      case 'purchase':
        return renderPurchaseStep();
      case 'completed':
        return renderCompletedStep();
      default:
        return renderRequestStep();
    }
  };

  if (!isVisible || !settings.giftWorkflowEnabled) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default GiftSubscriptionFlow;
