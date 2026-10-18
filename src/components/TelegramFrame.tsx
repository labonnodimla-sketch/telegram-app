import React from 'react';
import { 
  Smartphone, 
  Monitor, 
  Send, 
  Search, 
  Menu, 
  Phone, 
  MoreVertical, 
  ShieldCheck, 
  CheckCheck,
  Minimize2,
  Square,
  X
} from 'lucide-react';

interface TelegramFrameProps {
  children: React.ReactNode;
  isDesktopPreview: boolean;
  onTogglePreview: () => void;
  telegramUser?: string;
}

export const TelegramFrame: React.FC<TelegramFrameProps> = ({
  children,
  isDesktopPreview,
  onTogglePreview,
  telegramUser = 'Anisur Rahman',
}) => {
  // If not desktop preview mode, render clean direct responsive layout
  if (!isDesktopPreview) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start">
        {/* Top Control Bar for preview toggle */}
        <header className="w-full bg-slate-900/90 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-xs text-slate-400 z-30">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Telegram WebApp Mode (লাইভ)</span>
          </div>
          <button
            onClick={onTogglePreview}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer text-[11px]"
            title="টেলিগ্রাম ডেস্কটপ ভিউতে দেখুন"
          >
            <Monitor className="w-3.5 h-3.5 text-sky-400" />
            <span>টেলিগ্রাম ফ্রেম প্রিভিউ</span>
          </button>
        </header>

        {/* Content Container (Standard Mobile Max-Width) */}
        <main className="w-full max-w-md min-h-[calc(100vh-38px)] bg-slate-950 flex flex-col shadow-2xl relative">
          {children}
        </main>
      </div>
    );
  }

  // Telegram Desktop Shell matching user screenshot
  return (
    <div className="min-h-screen bg-[#17212b] text-slate-100 flex flex-col select-none overflow-x-hidden">
      {/* Telegram Desktop Window Title Bar */}
      <div className="h-9 bg-[#202b36] border-b border-[#131a22] flex items-center justify-between px-3 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center text-white">
            <Send className="w-3 h-3 ml-[-1px] mt-[-1px]" />
          </div>
          <span className="font-semibold text-slate-200">Telegram Desktop</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePreview}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-sky-600/30 text-sky-300 hover:bg-sky-600/50 border border-sky-500/40 text-[11px] cursor-pointer"
          >
            <Smartphone className="w-3 h-3" />
            <span>মোবাইল ভিউ</span>
          </button>

          <div className="flex items-center gap-2 text-slate-400">
            <span className="cursor-pointer hover:text-white"><Minimize2 className="w-3 h-3" /></span>
            <span className="cursor-pointer hover:text-white"><Square className="w-3 h-3" /></span>
            <span className="cursor-pointer hover:text-rose-400"><X className="w-3.5 h-3.5" /></span>
          </div>
        </div>
      </div>

      {/* Telegram Client Layout */}
      <div className="flex-1 flex overflow-hidden h-[calc(100vh-36px)]">
        {/* Left Sidebar (Chats) - Hidden on mobile, visible on desktop like screenshot */}
        <div className="hidden md:flex w-72 bg-[#0e1621] border-r border-[#17212b] flex-col">
          {/* Search bar */}
          <div className="p-2.5 flex items-center gap-2 border-b border-[#17212b]">
            <Menu className="w-5 h-5 text-slate-400 cursor-pointer" />
            <div className="flex-1 flex items-center gap-2 bg-[#242f3d] px-2.5 py-1.5 rounded-2xl text-xs text-slate-400">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Search</span>
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#17212b]/50">
            {/* Active AdEarn Bot Chat */}
            <div className="p-2.5 bg-[#2b5278] flex items-center gap-3 cursor-pointer">
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md">
                AE
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#2b5278]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-xs text-white truncate flex items-center gap-1">
                    AdEarn Bot
                    <CheckCheck className="w-3.5 h-3.5 text-sky-300 inline" />
                  </span>
                  <span className="text-[10px] text-sky-200">10:10 AM</span>
                </div>
                <p className="text-[11px] text-sky-100 truncate">Mini App is running...</p>
              </div>
            </div>

            {/* Other simulated chats */}
            {[
              { name: 'Anisur Rahman', msg: 'Today is awesome! Earning is high', time: '10:05 AM', initials: 'AR' },
              { name: 'Telegram News', msg: 'Welcome to Mini Apps 2.0', time: 'Yesterday', initials: 'TN' },
              { name: 'AdEarn Proof Channel', msg: '৳১০,৫০০ Payout Sent via bKash', time: 'Wed', initials: 'AP' },
            ].map((c, i) => (
              <div key={i} className="p-2.5 hover:bg-[#202b36] flex items-center gap-3 cursor-pointer opacity-75">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                  {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-xs text-slate-200 truncate">{c.name}</span>
                    <span className="text-[10px] text-slate-500">{c.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{c.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Active Telegram Area with Telegram Pattern Background & Centered Smartphone Mockup */}
        <div className="flex-1 bg-[#0e1621] relative flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          {/* Telegram chat background doodle pattern simulation */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Smartphone Mockup Frame */}
          <div className="relative w-full max-w-[390px] h-[810px] max-h-[92vh] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-[6px] border-slate-800 ring-1 ring-slate-700/50 flex flex-col overflow-hidden">
            {/* Dynamic Island / Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-black rounded-full z-40 flex items-center justify-end px-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#111] border border-slate-700" />
            </div>

            {/* Simulated Phone Status Bar */}
            <div className="pt-2 px-4 pb-1 flex items-center justify-between text-[11px] text-slate-400 font-mono z-30 select-none">
              <span>10:10</span>
              <div className="flex items-center gap-1.5 text-xs">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* Mini App Inner Frame */}
            <div className="flex-1 flex flex-col overflow-hidden rounded-[32px] bg-slate-950 border border-slate-850 relative">
              {children}
            </div>

            {/* iOS Home Indicator Bar */}
            <div className="w-32 h-1 bg-slate-600 rounded-full mx-auto mt-2 mb-0.5 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
};
