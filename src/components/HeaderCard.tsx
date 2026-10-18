import React from 'react';
import { UserProfile } from '../types';
import { formatTaka, toBengaliNumber } from '../data/defaultTasks';
import { Trophy, Coins, Sparkles } from 'lucide-react';

interface HeaderCardProps {
  profile: UserProfile;
  onOpenDailyBonus?: () => void;
}

export const HeaderCard: React.FC<HeaderCardProps> = ({ profile, onOpenDailyBonus }) => {
  // Level progress: calculate percentage to next level
  const currentLevel = profile.level || 1;
  const coinsForCurrentLevel = (currentLevel - 1) * 600;
  const coinsForNextLevel = currentLevel * 600;
  const progressPercent = Math.min(
    100,
    Math.max(10, Math.round(((profile.coins - coinsForCurrentLevel) / (coinsForNextLevel - coinsForCurrentLevel)) * 100))
  );

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-900/60 p-3.5 border border-amber-500/40 shadow-lg shadow-amber-950/30">
      {/* Subtle gold glow accent */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center gap-3.5 relative z-10">
        {/* User Avatar with Gold Border */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-full p-[2.5px] bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-700 shadow-md">
            <img
              src={profile.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={profile.displayName}
              className="w-full h-full rounded-full object-cover bg-slate-800"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full border border-slate-900 flex items-center shadow-xs">
            ★ {toBengaliNumber(profile.level)}
          </div>
        </div>

        {/* User Info & Balance */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h2 className="text-white font-bold text-base tracking-wide truncate">
              {profile.displayName || 'Anisur Rahman'}
            </h2>
            {onOpenDailyBonus && (
              <button
                onClick={onOpenDailyBonus}
                className="shrink-0 flex items-center gap-1 text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full transition-colors active:scale-95"
              >
                <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>বোনাস</span>
              </button>
            )}
          </div>

          {/* Golden Balance & Coins */}
          <div className="flex items-baseline gap-3 mt-0.5">
            <span className="text-amber-400 font-extrabold text-lg md:text-xl tracking-tight drop-shadow-sm font-mono">
              {formatTaka(profile.balance)}
            </span>
            <div className="flex items-center gap-1 text-slate-300 text-xs">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              <span>কয়েন: <span className="font-semibold text-yellow-300">{toBengaliNumber(profile.coins)}</span></span>
            </div>
          </div>

          {/* Level Bar */}
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-amber-300/90 whitespace-nowrap">
              Level {toBengaliNumber(profile.level)}
            </span>
            <div className="flex-1 h-2 bg-slate-950/80 rounded-full overflow-hidden border border-amber-500/25 p-[1px]">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
