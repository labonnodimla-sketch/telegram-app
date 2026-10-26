import React, { useState, useEffect } from 'react';
import { UserProfile, WithdrawalRequest, PaymentMethod } from '../types';
import { formatTaka, toBengaliNumber } from '../data/defaultTasks';
import { subscribeToRealReferrals } from '../services/firebaseService';
import { 
  Wallet, 
  ArrowUpRight, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ShieldCheck,
  CreditCard,
  Users,
  Lock,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface WithdrawTabProps {
  profile: UserProfile;
  withdrawals: WithdrawalRequest[];
  onSubmitWithdrawal: (method: PaymentMethod, account: string, amount: number) => Promise<void>;
  onNavigateTab?: (tab: 'home' | 'tasks' | 'withdraw' | 'refer' | 'profile') => void;
}

export const WithdrawTab: React.FC<WithdrawTabProps> = ({
  profile,
  withdrawals,
  onSubmitWithdrawal,
  onNavigateTab,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('bkash');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState<number>(200);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [liveReferralCount, setLiveReferralCount] = useState<number>(profile.referralCount || 0);

  // Subscribe to real referrals in Firestore to ensure real-time accuracy
  useEffect(() => {
    if (!profile.referralCode) return;
    const unsub = subscribeToRealReferrals(profile.referralCode, (records) => {
      setLiveReferralCount(Math.max(records.length, profile.referralCount || 0));
    });
    return () => unsub();
  }, [profile.referralCode, profile.referralCount]);

  // Two mandatory withdrawal conditions
  const REQUIRED_REFERRALS = 10;
  const MIN_WITHDRAW_AMOUNT = 200;

  const currentReferrals = Math.max(profile.referralCount || 0, liveReferralCount);
  const hasMetReferralCondition = currentReferrals >= REQUIRED_REFERRALS;
  const hasMetBalanceCondition = profile.balance >= MIN_WITHDRAW_AMOUNT;
  const isEligibleToWithdraw = hasMetReferralCondition && hasMetBalanceCondition;

  const quickAmounts = [200, 300, 500, 1000, 1500, 2000];

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // 1. Condition check: 10 referrals
    if (!hasMetReferralCondition) {
      const needed = REQUIRED_REFERRALS - currentReferrals;
      setMessage({ 
        text: `উইথড্র করার জন্য কমপক্ষে ১০টি রেফার সম্পন্ন করতে হবে! আপনার বর্তমান রেফার: ${toBengaliNumber(currentReferrals)}টি (আরও ${toBengaliNumber(needed)}টি রেফার প্রয়োজন)।`, 
        type: 'error' 
      });
      return;
    }

    // 2. Condition check: Minimum 200 BDT balance
    if (!hasMetBalanceCondition) {
      setMessage({ 
        text: `উইথড্র করার জন্য একাউন্টে সর্বনিম্ন ৳২০০.০০ ব্যালেন্স থাকতে হবে! আপনার বর্তমান ব্যালেন্স: ${formatTaka(profile.balance)}।`, 
        type: 'error' 
      });
      return;
    }

    const cleanNumber = accountNumber.trim();
    if (!cleanNumber || cleanNumber.length < 11) {
      setMessage({ text: 'সঠিক বিকাশ বা নগদ মোবাইল নম্বর লিখুন (১১ ডিজিট)', type: 'error' });
      return;
    }

    if (amount < MIN_WITHDRAW_AMOUNT) {
      setMessage({ text: `সর্বনিম্ন উইথড্র পরিমাণ ৳${toBengaliNumber(MIN_WITHDRAW_AMOUNT)}.০০ টাকা`, type: 'error' });
      return;
    }

    if (amount > profile.balance) {
      setMessage({ text: 'আপনার একাউন্টে পর্যাপ্ত ব্যালেন্স নেই', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitWithdrawal(selectedMethod, cleanNumber, amount);
      setMessage({
        text: `৳${toBengaliNumber(amount)} উইথড্র রিকোয়েস্ট সফলভাবে জমা হয়েছে! ২৪ ঘণ্টার মধ্যে আপনার ${selectedMethod === 'bkash' ? 'বিকাশ' : 'নগদ'} নম্বরে পেমেন্ট পাবেন।`,
        type: 'success',
      });
      setAccountNumber('');
    } catch (err: any) {
      setMessage({ text: err.message || 'উইথড্র রিকোয়েস্টে সমস্যা হয়েছে', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: WithdrawalRequest['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" />
            <span>অনুমোদিত</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/60 border border-rose-500/40 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3" />
            <span>বাতিল</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3 animate-spin" />
            <span>প্রসেসিং</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Balance Summary Header */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-slate-900/90 border border-amber-500/30 p-3 shadow-md">
          <p className="text-[11px] text-slate-400 font-medium">উত্তোলনযোগ্য ব্যালেন্স</p>
          <p className="text-xl font-black text-amber-400 font-mono mt-0.5">
            {formatTaka(profile.balance)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            কয়েন: {toBengaliNumber(profile.coins)}
          </p>
        </div>
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 shadow-md">
          <p className="text-[11px] text-slate-400 font-medium">মোট উইথড্র করা হয়েছে</p>
          <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
            {formatTaka(profile.totalWithdrawn ?? 0)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            সরাসরি বিকাশ / নগদ
          </p>
        </div>
      </div>

      {/* MANDATORY CONDITIONS CARD */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs text-indigo-300 flex items-center gap-1.5 uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>উইথড্র করার ২টি আবশ্যকীয় শর্ত</span>
          </h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isEligibleToWithdraw 
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
              : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
          }`}>
            {isEligibleToWithdraw ? 'শর্ত পূরণ হয়েছে ✓' : 'শর্ত পূরণ বাকি'}
          </span>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          টাকা তোলার জন্য নিম্নের <strong className="text-slate-200">১০টি রেফার</strong> ও <strong className="text-slate-200">সর্বনিম্ন ৳২০০ ব্যালেন্স</strong> পূরণ থাকতে হবে:
        </p>

        <div className="space-y-2.5 pt-1">
          {/* Condition 1: 10 Referrals */}
          <div className={`p-3 rounded-xl border transition-all ${
            hasMetReferralCondition
              ? 'bg-emerald-950/30 border-emerald-500/40'
              : 'bg-slate-950/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  hasMetReferralCondition ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-200">১. ১০টি সফল রেফারেল</span>
                    {hasMetReferralCondition ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3 inline" /> সম্পন্ন
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.2 rounded">
                        আরও {toBengaliNumber(REQUIRED_REFERRALS - currentReferrals)}টি দরকার
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    বর্তমান রেফার: {toBengaliNumber(currentReferrals)} / {toBengaliNumber(REQUIRED_REFERRALS)} টি
                  </p>
                </div>
              </div>

              {!hasMetReferralCondition && onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('refer')}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>রেফার করুন</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Progress Bar for Referrals */}
            <div className="mt-2 w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  hasMetReferralCondition ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                }`}
                style={{ width: `${Math.min(100, (currentReferrals / REQUIRED_REFERRALS) * 100)}%` }}
              />
            </div>
          </div>

          {/* Condition 2: 200 BDT Minimum Balance */}
          <div className={`p-3 rounded-xl border transition-all ${
            hasMetBalanceCondition
              ? 'bg-emerald-950/30 border-emerald-500/40'
              : 'bg-slate-950/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  hasMetBalanceCondition ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-200">২. সর্বনিম্ন ব্যালেন্স ৳২০০.০০</span>
                    {hasMetBalanceCondition ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3 inline" /> সম্পন্ন
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.2 rounded">
                        আরও {formatTaka(Math.max(0, MIN_WITHDRAW_AMOUNT - profile.balance))} দরকার
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    বর্তমান ব্যালেন্স: {formatTaka(profile.balance)} / ৳২০০.০০
                  </p>
                </div>
              </div>

              {!hasMetBalanceCondition && onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('tasks')}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>টাস্ক করুন</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Progress Bar for Balance */}
            <div className="mt-2 w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  hasMetBalanceCondition ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                }`}
                style={{ width: `${Math.min(100, (profile.balance / MIN_WITHDRAW_AMOUNT) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Form */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-amber-400" />
            <span>টাকা তুলুন (উইথড্র রিকোয়েস্ট)</span>
          </h3>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            ১০০% নিরাপদ
          </span>
        </div>

        {message && (
          <div
            className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleWithdraw} className="space-y-3.5">
          {/* Method selector - Only bKash and Nagad */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              পেমেন্ট মাধ্যম বেছে নিন:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'bkash', name: 'বিকাশ (bKash)', color: 'from-pink-600 to-rose-700' },
                { id: 'nagad', name: 'নগদ (Nagad)', color: 'from-orange-600 to-red-600' },
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id as PaymentMethod)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                    selectedMethod === m.id
                      ? 'bg-gradient-to-r text-white border-amber-400 shadow-md scale-102 ' + m.color
                      : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Account Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex justify-between">
              <span>{selectedMethod === 'bkash' ? 'বিকাশ' : 'নগদ'} মোবাইল নম্বর:</span>
              <span className="text-slate-500 text-[10px]">ব্যক্তিগত (Personal)</span>
            </label>
            <input
              type="tel"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="01XXXXXXXXX"
              maxLength={11}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          {/* Amount selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <span>উইথড্র পরিমাণ (৳):</span>
                <span className="text-[10px] text-amber-400 font-semibold">(সর্বনিম্ন ৳২০০)</span>
              </span>
              <span className="text-amber-400 font-semibold font-mono">
                {formatTaka(amount)}
              </span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {quickAmounts.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setAmount(amt)}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium font-mono border transition-colors cursor-pointer ${
                    amount === amt
                      ? 'bg-amber-400 text-slate-950 font-bold border-amber-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  ৳{toBengaliNumber(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting || !isEligibleToWithdraw}
            className={`w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isEligibleToWithdraw
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-98'
                : 'bg-slate-800/90 text-slate-500 border border-slate-700/80 cursor-not-allowed opacity-75'
            }`}
          >
            {isSubmitting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>প্রসেসিং হচ্ছে...</span>
              </>
            ) : !hasMetReferralCondition && !hasMetBalanceCondition ? (
              <>
                <Lock className="w-4 h-4 text-slate-500" />
                <span>১০টি রেফার ও ৳২০০ ব্যালেন্স আবশ্যক</span>
              </>
            ) : !hasMetReferralCondition ? (
              <>
                <Lock className="w-4 h-4 text-slate-500" />
                <span>১০টি রেফার পূর্ণ করুন (আরও {toBengaliNumber(REQUIRED_REFERRALS - currentReferrals)}টি দরকার)</span>
              </>
            ) : !hasMetBalanceCondition ? (
              <>
                <Lock className="w-4 h-4 text-slate-500" />
                <span>সর্বনিম্ন ৳২০০ ব্যালেন্স প্রয়োজন</span>
              </>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4 text-slate-950" />
                <span>উইথড্র রিকোয়েস্ট পাঠান</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Withdrawal History */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-400" />
            <span>সর্বশেষ উইথড্র হিস্ট্রি</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            {toBengaliNumber(withdrawals.length)} টি রেকর্ড
          </span>
        </div>

        {withdrawals.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            এখনও কোনো উইথড্র রিকোয়েস্ট করা হয়নি।
          </div>
        ) : (
          <div className="space-y-2">
            {withdrawals.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase text-slate-200">
                      {w.method === 'bkash' ? 'বিকাশ' : 'নগদ'}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {w.accountNumber}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {new Date(w.createdAt).toLocaleDateString('bn-BD', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <p className="font-bold font-mono text-amber-400 text-sm">
                    {formatTaka(w.amount)}
                  </p>
                  <div>{getStatusBadge(w.status)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

