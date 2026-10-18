import React, { useState } from 'react';
import { UserProfile } from '../types';
import { toBengaliNumber, formatTaka } from '../data/defaultTasks';
import { claimDailyReward } from '../services/firebaseService';
import confetti from 'canvas-confetti';
import { X, Gift, Sparkles, CheckCircle2, Coins } from 'lucide-react';

interface DailyBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

export const DailyBonusModal: React.FC<DailyBonusModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const alreadyClaimed = profile.lastBonusDate === todayStr;

  const handleClaim = async () => {
    if (alreadyClaimed || loading) return;
    setLoading(true);
    try {
      const bonusCoins = 25;
      const bonusTaka = 5;
      await claimDailyReward(profile.userId, bonusCoins, bonusTaka, profile);
      setOpened(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#10b981', '#6366f1'],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xs rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/40 p-5 shadow-2xl text-center space-y-4">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 mx-auto shadow-lg shadow-amber-500/20">
          <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-amber-400">
            <Gift className={`w-8 h-8 ${opened ? 'text-emerald-400' : 'animate-bounce'}`} />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="font-bold text-base text-white">
            {alreadyClaimed || opened ? 'আজকের বোনাস গ্রহণ সম্পন্ন!' : 'দৈনিক ফ্রি লাকি উপহার'}
          </h3>
          <p className="text-xs text-slate-400">
            প্রতিদিন মিনি অ্যাপ ওপেন করে ফ্রি কয়েন ও টাকা ক্লেইম করুন।
          </p>
        </div>

        {alreadyClaimed || opened ? (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
            <p className="font-bold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>+২৫ কয়েন (৳৫.০০) যোগ হয়েছে!</span>
            </p>
            <p className="text-[10px] text-slate-400">আগামীকাল আবার ক্লেইম করতে পারবেন।</p>
          </div>
        ) : (
          <button
            onClick={handleClaim}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'ক্লেইম হচ্ছে...' : 'এখনই ক্লেইম করুন'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
