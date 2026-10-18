import React, { useState } from 'react';
import { UserProfile } from '../types';
import { formatTaka, toBengaliNumber } from '../data/defaultTasks';
import { 
  Users, 
  Copy, 
  Check, 
  Share2, 
  Gift, 
  Sparkles, 
  TrendingUp, 
  Award 
} from 'lucide-react';

interface ReferTabProps {
  profile: UserProfile;
}

export const ReferTab: React.FC<ReferTabProps> = ({ profile }) => {
  const [copied, setCopied] = useState(false);

  const referralLink = `https://t.me/AdEarnMiniApp_bot?start=${profile.referralCode || 'EARN778'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleReferrals = [
    { name: 'Tanvir Ahmed', username: '@tanvir_pro', date: '১২ ঘণ্টা আগে', reward: 20 },
    { name: 'Sabbir Hossain', username: '@sabbir99', date: '১ দিন আগে', reward: 20 },
    { name: 'Rakibul Islam', username: '@rakib_bd', date: '২ দিন আগে', reward: 20 },
    { name: 'Mehedi Hasan', username: '@mehedi_live', date: '৩ দিন আগে', reward: 20 },
  ];

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
            <span>রেফার করুন ও আনলিমিটেড আয় করুন</span>
          </div>

          <h2 className="text-xl font-bold text-white">
            প্রতি রেফারে পান <span className="text-amber-400">৳২০.০০</span> + ১০% কমিশন
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed max-w-xs">
            আপনার বন্ধুদের টেলিগ্রামে আমন্ত্রণ জানান। আপনার লিংকে জয়েন করলেই আপনি পাবেন নগদ কয়েন এবং তাদের আয়ের ১০% আজীবন কমিশন!
          </p>
        </div>
      </div>

      {/* Share / Copy Box */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-semibold">আপনার রেফারেল লিংক:</span>
          <span className="font-mono text-amber-400 font-bold">
            কোড: {profile.referralCode || 'EARN778'}
          </span>
        </div>

        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
          <input
            type="text"
            readOnly
            value={referralLink}
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

        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('AdEarn Mini App-এ বিজ্ঞাপন ও ভিডিও দেখে প্রতিদিন আয় করুন! ইনস্ট্যান্ট বিকাশ ও নগদ পেমেন্ট!')}`}
          target="_blank"
          rel="noreferrer"
          className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md shadow-sky-950/30"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>টেলিগ্রামে বন্ধুদের সাথে শেয়ার করুন</span>
        </a>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400">মোট রেফারেল</p>
            <p className="text-base font-bold text-white font-mono">
              {toBengaliNumber(profile.referralCount || 14)} জন
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
              {formatTaka((profile.referralCount || 14) * 20)}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Referral Activity */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>আমন্ত্রিত সদস্যদের তালিকা</span>
          </h3>
          <span className="text-[11px] text-slate-500">সাম্প্রতিক</span>
        </div>

        <div className="space-y-2">
          {sampleReferrals.map((ref, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-bold text-slate-300">
                  {ref.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-slate-200">{ref.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{ref.username} • {ref.date}</p>
                </div>
              </div>
              <span className="font-bold font-mono text-emerald-400">
                +{formatTaka(ref.reward)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
