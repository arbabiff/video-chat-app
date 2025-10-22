import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';

interface FriendsInvitationPopupProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  autoHideOnView?: boolean;
  embedded?: boolean;
}

const FriendsInvitationPopup: React.FC<FriendsInvitationPopupProps> = ({ open, onOpenChange, embedded = false }) => {
  const isControlled = typeof open === 'boolean';
  const [internalOpen, setInternalOpen] = useState(false);
  const showPopup = isControlled ? (open as boolean) : internalOpen;
  const setShowPopup = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    if (!isControlled) setInternalOpen(v);
  };

  const inviteCode = 'INV12345';

  const copyInviteLink = () => {
    const link = `https://videochat.app/invite/${inviteCode}`;
    navigator.clipboard.writeText(link);
    alert('لینک دعوت کپی شد!');
  };

  const modal = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-lg grid place-items-center z-50 p-4" onClick={() => setShowPopup(false)}>
      <div className="bg-gradient-to-br from-gray-800 to-gray-900/90 rounded-2xl w-full max-w-sm border border-gray-600/70 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="w-14 h-14 mx-auto mb-3 bg-pink-500/30 rounded-full flex items-center justify-center">
              <UserPlus className="w-7 h-7 text-pink-300" />
            </div>
            <h2 className="text-white text-lg font-bold mb-1">معرفی به دوستان</h2>
            <p className="text-gray-300 text-sm">دوستان خود را دعوت کنید و اشتراک رایگان بگیرید!</p>
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
            onClick={copyInviteLink}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-bold mb-4 hover:from-pink-600 hover:to-rose-600 transition-colors"
          >
            ارسال لینک دعوت
          </button>

          <div className="bg-black/30 rounded-xl p-4 text-right border border-white/10">
            <div className="text-white font-semibold mb-2 text-sm">دوستان دعوت شده</div>
            <p className="text-gray-400 text-xs">هنوز کسی را دعوت نکرده‌اید</p>
          </div>
        </div>

        <div className="p-4 pt-0">
          <button
            onClick={() => setShowPopup(false)}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2.5 rounded-xl font-medium"
          >
            بازگشت
          </button>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return <>{showPopup && modal}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4 flex items-center justify-center">
      <button
        onClick={() => setShowPopup(true)}
        className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-pink-600 hover:to-rose-600 transition-all"
      >
        معرفی به دوستان
      </button>
      {showPopup && modal}
    </div>
  );
};

export default FriendsInvitationPopup;
