import React, { useState, useEffect } from 'react';
import { UserProfile, ReferralRecord } from '../types';
import { formatTaka, toBengaliNumber } from '../data/defaultTasks';
import { subscribeToRealReferrals } from '../services/firebaseService';
import { 
  Users, 
  Copy, 
  Check, 
  Share2, 
  Gift, 
  Sparkles, 
  TrendingUp, 
  Award,
  UserCheck,
  Send
} from 'lucide-react';

interface ReferTabProps {
  profile: UserProfile;
}

export const ReferTab: React.FC<ReferTabProps> = ({ profile }) => {
  const [copied, setCopied] = useState(false);
  const [realReferrals, setRealReferrals] = useState<ReferralRecord[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(true);

  // Subscribe to REAL referrals from Firestore
  useEffect(() => {
    if (!profile.referralCode) return;
    setLoadingReferrals(true);
    const unsub = subscribeToRealReferrals(profile.referralCode, (records) => {
      setRealReferrals(records);
      setLoadingReferrals(false);
    });
    return () => unsub();
  }, [profile.referralCode]);

  // Real Bot Username provided by user: @adearnminibot
  const botUsername = 'adearnminibot';
  
  // Telegram Bot Referral Link (Universal format supported by all Telegram clients)
  const telegramReferralLink = `https://t.me/${botUsername}?start=${profile.referralCode || 'EARN1000'}`;
  
  // Direct Mini App deep link
  const miniAppDirectLink = `https://t.me/${botUsername}/app?startapp=${profile.referralCode || 'EARN1000'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(telegramReferralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = `AdEarn Mini App-এ বিজ্ঞাপন ও ভিডিও দেখে প্রতিদিন বিকাশ ও নগদে টাকা ইনকাম করুন! আমার রেফারেল লিংকে জয়েন করলেই পাবেন ফ্রি বোনাস: ${telegramReferralLink}`;

  return (
    <div className="space-y-4">
      {/* Referral Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-amber-950/60 p-4 border border-indigo-500/30 shadow-xl">
        <div className="absolute top-0 right-0 p-4 opacity-15">
          <Gift className="w-28 h-28 text-indigo-400" />
        </div>

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>রেফারেল প্রোগ্রাম (@{botUsername})</span>
          </div>

          <h2 className="text-xl font-bold text-white">
            প্রতি রেফারে পান <span className="text-amber-400">৳২০.০০</span> + ১০০ কয়েন
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed max-w-xs">
            আপনার ইউনিক রেফারেল লিংক বন্ধুদের পাঠান। তারা টেলিগ্রামে এই লিংকে বট চালু করলেই সাথে সাথে আপনার অ্যাকাউন্টে টাকা ও কয়েন যোগ হবে!
          </p>
        </div>
      </div>

      {/* Share / Copy Box */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-semibold">আপনার রেফারেল লিংক:</span>
          <span className="font-mono text-amber-400 font-bold">
            কোড: {profile.referralCode || 'EARN1000'}
          </span>
        </div>

        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
          <input
            type="text"
            readOnly
            value={telegramReferralLink}
            className="flex-1 bg-transparent px-2 text-xs text-slate-300 font-mono focus:outline-none truncate"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'কপি হয়েছে!' : 'কপি'}</span>
          </button>
        </div>

        {/* Telegram Direct Share CTA */}
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(telegramReferralLink)}&text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noreferrer"
          className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md shadow-sky-950/30 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>টেলিগ্রামে বন্ধুদের সাথে শেয়ার করুন</span>
        </a>
      </div>

      {/* Real Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400">মোট রেফারেল</p>
            <p className="text-base font-bold text-white font-mono">
              {toBengaliNumber(profile.referralCount || realReferrals.length || 0)} জন
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400">রেফারেল আয়</p>
            <p className="text-base font-bold text-amber-400 font-mono">
              {formatTaka((profile.referralCount || realReferrals.length || 0) * 20)}
            </p>
          </div>
        </div>
      </div>

      {/* REAL Invited Members List */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>আমন্ত্রিত সদস্যদের তালিকা (রিয়েল ডেটা)</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">
            {toBengaliNumber(realReferrals.length)} জন
          </span>
        </div>

        {loadingReferrals ? (
          <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span>তালিকা লোড হচ্ছে...</span>
          </div>
        ) : realReferrals.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 space-y-2">
            <UserCheck className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-medium text-slate-400">এখনও কোনো সদস্য জয়েন করেনি।</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              আপনার বন্ধুদের আমন্ত্রণ জানাতে উপরের "টেলিগ্রামে বন্ধুদের সাথে শেয়ার করুন" বাটনে ক্লিক করুন।
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {realReferrals.map((ref) => (
              <div
                key={ref.id || ref.referredUserId}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-bold text-slate-300">
                    {ref.referredName ? ref.referredName[0] : 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">{ref.referredName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {ref.referredUsername || '@user'} • {new Date(ref.createdAt).toLocaleDateString('bn-BD', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <span className="font-bold font-mono text-emerald-400">
                  +{formatTaka(ref.rewardAmount || 20)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
