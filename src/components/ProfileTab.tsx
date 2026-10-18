import React from 'react';
import { UserProfile } from '../types';
import { formatTaka, toBengaliNumber } from '../data/defaultTasks';
import { 
  Coins, 
  TrendingUp, 
  ArrowDownLeft, 
  Gift, 
  ShieldCheck, 
  Sparkles
} from 'lucide-react';

interface ProfileTabProps {
  profile: UserProfile;
  onOpenDailyBonus: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  onOpenDailyBonus,
}) => {
  // SVG curved chart coordinates matching Screen 3 in screenshot
  const chartPoints = [
    { day: 'Sun', amount: 70 },
    { day: 'Mon', amount: 65 },
    { day: 'Tue', amount: 80 },
    { day: 'Wed', amount: 120 },
    { day: 'Thu', amount: 170 },
    { day: 'Fri', amount: 140 },
    { day: 'Sat', amount: 195 },
  ];

  return (
    <div className="space-y-4">
      {/* Earnings Overview Card - Matching Screenshot Screen 3 */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-amber-950/40 border border-slate-800 p-4 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">উপার্জন সারসংক্ষেপ</span>
          <span className="text-[10px] text-amber-400 font-mono">লাইভ ডেটা</span>
        </div>

        {/* 3 Metrics Row Matching Screenshot 3 */}
        <div className="space-y-2.5">
          {/* Total Earned */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                ৳
              </div>
              <span className="text-xs text-slate-300 font-medium">মোট আয়:</span>
            </div>
            <span className="font-mono font-black text-amber-400 text-base">
              {formatTaka(profile.totalEarned || 12000)}
            </span>
          </div>

          {/* Total Withdrawn */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-300 font-medium">উইথড্র:</span>
            </div>
            <span className="font-mono font-black text-emerald-400 text-base">
              {formatTaka(profile.totalWithdrawn || 10500)}
            </span>
          </div>

          {/* Today's Earning */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-300 font-medium">আজকের আয়:</span>
            </div>
            <span className="font-mono font-black text-yellow-300 text-base">
              {formatTaka(profile.todayEarned || 75)}
            </span>
          </div>
        </div>
      </div>

      {/* Earnings Graph - Matching Screen 3 in Screenshot */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>সর্বশেষ আয় (সাপ্তাহিক গ্রাফ)</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">গত ৭ দিন</span>
        </div>

        {/* Custom SVG Curve Chart */}
        <div className="relative pt-2 pb-1">
          {/* Y Axis Guides */}
          <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[9px] text-slate-500 font-mono pointer-events-none">
            <span>৳২০০</span>
            <span>৳১৫০</span>
            <span>৳১০০</span>
            <span>৳৫০</span>
          </div>

          {/* SVG Canvas */}
          <div className="ml-8 h-36">
            <svg viewBox="0 0 300 130" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="earnGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fde047" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="10" x2="300" y2="10" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="45" x2="300" y2="45" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="300" y2="80" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="115" x2="300" y2="115" stroke="#1e293b" />

              {/* Smooth Area */}
              <path
                d="M 10 95 C 40 100, 70 85, 100 80 C 130 75, 160 50, 190 35 C 220 20, 250 55, 290 15 L 290 120 L 10 120 Z"
                fill="url(#earnGradient)"
              />

              {/* Smooth Line */}
              <path
                d="M 10 95 C 40 100, 70 85, 100 80 C 130 75, 160 50, 190 35 C 220 20, 250 55, 290 15"
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Highlight Dot */}
              <circle cx="290" cy="15" r="4.5" fill="#fde047" stroke="#0f172a" strokeWidth="2" />
            </svg>
          </div>

          {/* X Axis Labels */}
          <div className="ml-8 flex justify-between text-[10px] text-slate-400 font-mono mt-1 px-1">
            {chartPoints.map((p) => (
              <span key={p.day}>{p.day}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Bonus Quick Card */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/30 p-3.5 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Gift className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100">দৈনিক লাকি রিওয়ার্ড বক্স</h4>
            <p className="text-[11px] text-slate-400">প্রতিদিন ২৫ কয়েন ফ্রি ক্লেইম করুন</p>
          </div>
        </div>
        <button
          onClick={onOpenDailyBonus}
          className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-xs transition-transform active:scale-95 cursor-pointer"
        >
          দাবি করুন
        </button>
      </div>

      {/* User Information */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-lg space-y-3">
        <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">
          অ্যাকাউন্ট তথ্য
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">নাম</span>
            <span className="font-semibold text-slate-200">{profile.displayName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">টেলিগ্রাম ইউজারনেম</span>
            <span className="font-mono text-slate-200">{profile.telegramUsername || '@user'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">ইউজার আইডি (UID)</span>
            <span className="font-mono text-slate-400 truncate max-w-[160px]">
              {profile.userId}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">অ্যাকাউন্ট স্ট্যাটাস</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              ভেরিফায়েড
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">যোগদানের তারিখ</span>
            <span className="text-slate-300">
              {new Date(profile.createdAt).toLocaleDateString('bn-BD', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
