import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, Gift, Copy, Phone, Users, CheckCircle, Clock, Star } from 'lucide-react';

interface FriendsInvitationPopupProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  autoHideOnView?: boolean;
  embedded?: boolean;
}

const FriendsInvitationPopup: React.FC<FriendsInvitationPopupProps> = ({ open, onOpenChange, autoHideOnView = false, embedded = false }) => {
  const isControlled = typeof open === 'boolean';
  const [internalOpen, setInternalOpen] = useState(false);
  const showPopup = isControlled ? (open as boolean) : internalOpen;
  const setShowPopup = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    if (!isControlled) setInternalOpen(v);
  };
  const [inviteCode, setInviteCode] = useState('INV12345');
  const [invitedFriends, setInvitedFriends] = useState([
    { 
      id: 1, 
      phone: '09121234567', 
      name: 'علی احمدی',
      status: 'joined', 
      joinDate: '1402/08/15',
      rewardEarned: true 
    },
    { 
      id: 2, 
      phone: '09129876543', 
      name: 'سارا محمدی',
      status: 'pending', 
      inviteDate: '1402/08/20',
      rewardEarned: false 
    },
    { 
      id: 3, 
      phone: '09135554444', 
      name: 'محمد رضایی',
      status: 'joined', 
      joinDate: '1402/08/18',
      rewardEarned: true 
    }
  ]);
  const [totalRewards, setTotalRewards] = useState(2);
  const [currentTab, setCurrentTab] = useState('invite');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const autoHideTriggered = useRef(false);

  const handleInvite = () => {
    if (phoneNumber.trim()) {
      const newFriend = {
        id: Date.now(),
        phone: phoneNumber,
        name: 'کاربر جدید',
        status: 'pending',
        inviteDate: new Date().toLocaleDateString('fa-IR'),
        rewardEarned: false
      };
      
      setInvitedFriends([...invitedFriends, newFriend]);
      setPhoneNumber('');
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }
  };

  const copyInviteLink = () => {
    const link = `https://videochat.app/invite/${inviteCode}`;
    navigator.clipboard.writeText(link);
    alert('لینک دعوت کپی شد!');
  };


  // Auto-hide behavior when embedded and requested - DISABLED for manual close
  useEffect(() => {
    if (embedded && autoHideOnView && showPopup && !autoHideTriggered.current) {
      autoHideTriggered.current = true;
      // DON'T auto-hide anymore - user must close manually
    }
  }, [embedded, autoHideOnView, showPopup]);

  const modal = (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm grid place-items-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl w-full max-w-sm border border-gray-600 max-h-[85vh] flex flex-col">
        {/* Header - Smaller - Fixed */}
        <div className="relative bg-gradient-to-r from-yellow-500 to-orange-600 p-4 text-center flex-shrink-0">
          <button
            onClick={() => setShowPopup(false)}
            className="absolute top-3 left-3 text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30 rounded-full p-1"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-14 h-14 mx-auto mb-2 bg-white/20 rounded-full flex items-center justify-center">
            <div className="text-2xl">🤝</div>
          </div>
          
          <h2 className="text-lg font-bold text-white mb-1 text-center">
            دوستان خود را دعوت کنید و جایزه بگیرید
          </h2>
          <p className="text-white/90 text-xs text-center">
            
          </p>
          
          {/* Reward Counter - Smaller */}
          <div className="mt-3 bg-white/20 rounded-lg p-2">
            <div className="flex items-center justify-center gap-2 text-white">
              <Gift className="w-4 h-4" />
              <span className="font-bold text-sm">جوایز: {totalRewards} ماه</span>
            </div>
            <p className="text-white/80 text-xs mt-1">
              به ازای هر ۵ دعوت = ۱ ماه رایگان
            </p>
          </div>
        </div>

        {/* Tabs - Smaller - Fixed */}
        <div className="flex bg-gray-700/50 flex-shrink-0">
          <button
            onClick={() => setCurrentTab('invite')}
            className={`flex-1 py-2 text-center text-sm font-medium transition-colors focus:outline-none ${
              currentTab === 'invite' 
                ? 'text-blue-400 bg-blue-500/20 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            دعوت جدید
          </button>
          <button
            onClick={() => setCurrentTab('friends')}
            className={`flex-1 py-2 text-center text-sm font-medium transition-colors focus:outline-none ${
              currentTab === 'friends' 
                ? 'text-green-400 bg-green-500/20 border-b-2 border-green-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            لیست دوستان
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-4 overflow-y-auto flex-1">
          {currentTab === 'invite' ? (
            <div className="space-y-3">
              {/* Phone Input - Smaller */}
              <div>
                <label className="block text-gray-300 text-xs mb-1">شماره تلفن دوست:</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="09123456789"
                    className="flex-1 bg-gray-700 text-white p-2 text-sm rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    dir="ltr"
                  />
                  <button
                    onClick={handleInvite}
                    disabled={!phoneNumber.trim()}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Success Message - Smaller */}
              {showSuccess && (
                <div className="bg-green-500/20 border border-green-500 rounded-lg p-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">دعوت ارسال شد!</span>
                </div>
              )}

              {/* Copy Link Only */}
              <div className="space-y-2">
                <button
                  onClick={copyInviteLink}
                  className="w-full bg-gray-700 text-white p-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <Copy className="w-4 h-4" />
                  کپی لینک
                </button>
              </div>

              {/* Invite Code Display - Smaller */}
              <div className="bg-gray-700/50 rounded-lg p-3">
                <p className="text-gray-300 text-xs mb-1">کد دعوت شما:</p>
                <div className="bg-gray-800 rounded p-2 flex items-center justify-between">
                  <code className="text-blue-400 font-mono text-sm">{inviteCode}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteCode);
                      alert('کد کپی شد!');
                    }}
                    className="text-gray-400 hover:text-white focus:outline-none"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Friends List */}
              <div className="space-y-2">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  دوستان دعوت شده ({invitedFriends.length})
                </h3>
                
                {invitedFriends.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">هنوز کسی را دعوت نکرده‌اید</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {invitedFriends.map(friend => (
                      <div key={friend.id} className="bg-gray-700/50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {friend.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm">{friend.name}</p>
                              <p className="text-gray-400 text-xs">{friend.phone}</p>
                              <p className="text-gray-500 text-xs">
                                {friend.status === 'joined' 
                                  ? `عضو شد: ${friend.joinDate}`
                                  : `دعوت شد: ${friend.inviteDate}`
                                }
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {friend.rewardEarned && (
                              <div className="text-yellow-400" title="جایزه دریافت شد">
                                <Star className="w-4 h-4 fill-current" />
                              </div>
                            )}
                            <div className={`px-2 py-1 rounded-full text-xs ${
                              friend.status === 'joined'
                                ? 'bg-green-500/20 text-green-400 border border-green-500'
                                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500'
                            }`}>
                              {friend.status === 'joined' ? (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  عضو شد
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  در انتظار
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rewards Summary - Smaller */}
              <div className="bg-gradient-to-r from-green-600/20 to-teal-600/20 border border-green-500/30 rounded-lg p-3">
                <h4 className="text-green-400 font-semibold text-sm mb-2 flex items-center gap-1">
                  <Gift className="w-4 h-4" />
                  خلاصه جوایز
                </h4>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <div className="text-xl font-bold text-green-400">{totalRewards}</div>
                    <div className="text-gray-300 text-xs">ماه رایگان</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-blue-400">{invitedFriends.filter(f => f.status === 'joined').length}</div>
                    <div className="text-gray-300 text-xs">دوست عضو</div>
                  </div>
                </div>
                <p className="text-gray-400 text-xs mt-2 text-center">
                  هر ۵ دوست = ۱ ماه رایگان
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Smaller - Fixed */}
        <div className="bg-gray-800/50 p-2 text-center flex-shrink-0">
          <p className="text-gray-400 text-xs">
            دوستان شما ۱۰٪ تخفیف می‌گیرند!
          </p>
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
        className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-pink-600 hover:to-red-600 transition-all transform hover:scale-105 flex items-center gap-3"
      >
        <UserPlus className="w-6 h-6" />
        دعوت دوستان
      </button>
      {showPopup && modal}
    </div>
  );
};

export default FriendsInvitationPopup;