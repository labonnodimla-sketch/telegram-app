/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  auth, 
  authenticateTelegramUser, 
  logoutUser, 
  testConnection 
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  UserProfile, 
  TaskItem, 
  WithdrawalRequest, 
  PaymentMethod 
} from './types';
import { 
  ensureUserInFirestore, 
  subscribeToUserProfile, 
  subscribeToTasks, 
  subscribeToUserWithdrawals,
  completeTaskInFirestore, 
  submitWithdrawalRequest, 
  seedInitialTasksIfEmpty,
  processReferralCode
} from './services/firebaseService';
import { HeaderCard } from './components/HeaderCard';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { WithdrawTab } from './components/WithdrawTab';
import { ReferTab } from './components/ReferTab';
import { ProfileTab } from './components/ProfileTab';
import { DailyBonusModal } from './components/DailyBonusModal';
import { TelegramFrame } from './components/TelegramFrame';
import { toBengaliNumber, INITIAL_TASKS } from './data/defaultTasks';
import { 
  Home, 
  ClipboardList, 
  Wallet, 
  Share2, 
  User as UserIcon, 
  PlayCircle,
  LogOut,
  Send
} from 'lucide-react';

// Use clean storage key so previous fake balances (৳1,500 / 7,500 coins) are reset to 0
const STORAGE_KEY = 'adearn_user_v3_clean';

function getInitialProfile(): UserProfile {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.balance !== undefined) return parsed;
      } catch (e) {
        // ignore
      }
    }
  }

  // Detect Telegram WebApp user immediately
  const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
  const tgUser = tg?.initDataUnsafe?.user;

  const realName = tgUser ? `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}` : 'User';
  const username = tgUser?.username ? `@${tgUser.username}` : '@user';
  const photo = tgUser?.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
  const referralCode = 'EARN' + Math.floor(1000 + Math.random() * 9000);

  // STARTING FROM ZERO (০ কয়েন ও ০ টাকা)
  return {
    userId: tgUser ? `tg_${tgUser.id}` : 'user_' + Date.now(),
    telegramId: tgUser?.id,
    displayName: realName,
    photoUrl: photo,
    telegramUsername: username,
    balance: 0.00,       // Starts from 0
    coins: 0,           // Starts from 0
    level: 1,           // Starts from 1
    totalEarned: 0.00,   // Starts from 0
    totalWithdrawn: 0.00,
    todayEarned: 0.00,
    todayVideosWatched: 0,
    dailyVideoLimit: 15,
    referralCode,
    referralCount: 0,
    createdAt: new Date().toISOString(),
  };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(getInitialProfile);
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'tasks' | 'withdraw' | 'refer' | 'profile'>('home');
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isDailyBonusOpen, setIsDailyBonusOpen] = useState(false);
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string>('all');
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);

  // Cache userProfile locally
  useEffect(() => {
    if (userProfile && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
      } catch (e) {
        // ignore
      }
    }
  }, [userProfile]);

  // Initialize Telegram WebApp & check for incoming referral link
  useEffect(() => {
    testConnection();
    seedInitialTasksIfEmpty();

    const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
    let incomingRefCode: string | null = null;

    if (tg) {
      try {
        tg.ready();
        tg.expand();
        if (tg.initDataUnsafe?.user) {
          const u = tg.initDataUnsafe.user;
          setUserProfile((prev) => ({
            ...prev,
            displayName: `${u.first_name}${u.last_name ? ' ' + u.last_name : ''}`,
            telegramUsername: u.username ? `@${u.username}` : prev.telegramUsername,
            photoUrl: u.photo_url || prev.photoUrl,
            telegramId: u.id,
          }));
        }

        // Detect start_param from Telegram referral link (e.g. t.me/adearnminibot?start=EARN882 or ?startapp=EARN882)
        if (tg.initDataUnsafe?.start_param) {
          incomingRefCode = tg.initDataUnsafe.start_param;
        }
      } catch (e) {
        console.log('Telegram WebApp init:', e);
      }
    }

    // Fallback: check browser URL query params for ?startapp= or ?ref= or ?start=
    if (!incomingRefCode && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      incomingRefCode = params.get('startapp') || params.get('ref') || params.get('start');
    }

    // Store pending referral code in session
    if (incomingRefCode && typeof window !== 'undefined') {
      const cleanCode = incomingRefCode.trim().toUpperCase();
      sessionStorage.setItem('pending_ref_code', cleanCode);
    }
  }, []);

  // Background non-blocking Firebase authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        try {
          const profile = await ensureUserInFirestore(firebaseUser);
          setUserProfile((prev) => ({
            ...prev,
            ...profile,
            displayName: prev.displayName || profile.displayName,
            photoUrl: prev.photoUrl || profile.photoUrl,
            telegramUsername: prev.telegramUsername || profile.telegramUsername,
          }));

          // Process pending referral code now that Firestore user is authenticated!
          if (typeof window !== 'undefined') {
            const pending = sessionStorage.getItem('pending_ref_code');
            if (pending && !profile.referredBy && profile.referralCode !== pending) {
              sessionStorage.removeItem('pending_ref_code');
              const res = await processReferralCode(profile, pending);
              if (res.success) {
                setUserProfile((prev) => ({ ...prev, referredBy: pending }));
              }
            }
          }
        } catch (e) {
          console.warn('Background profile sync note:', e);
        }
      } else {
        authenticateTelegramUser().catch((err) => {
          console.warn('Silent auth note:', err);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore User Profile in real time
  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToUserProfile(currentUser.uid, (profile) => {
      if (profile) {
        setUserProfile((prev) => ({ ...prev, ...profile }));
      }
    });
    return () => unsub();
  }, [currentUser]);

  // Listen to Tasks in real time
  useEffect(() => {
    const unsub = subscribeToTasks((loadedTasks) => {
      setTasks(loadedTasks);
    });
    return () => unsub();
  }, []);

  // Listen to user withdrawals in real time
  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToUserWithdrawals(currentUser.uid, (data) => {
      setWithdrawals(data);
    });
    return () => unsub();
  }, [currentUser]);

  const handleCompleteTask = async (task: TaskItem) => {
    const newCoins = userProfile.coins + task.rewardCoins;
    const newBalance = userProfile.balance + task.rewardTaka;
    const newTotalEarned = userProfile.totalEarned + task.rewardTaka;
    const newTodayEarned = userProfile.todayEarned + task.rewardTaka;
    const isVideo = task.category === 'video';
    const newVideosWatched = isVideo
      ? Math.min((userProfile.todayVideosWatched || 0) + 1, userProfile.dailyVideoLimit || 15)
      : userProfile.todayVideosWatched;
    const newLevel = Math.max(1, Math.floor(newCoins / 500) + 1);

    setUserProfile((prev) => ({
      ...prev,
      coins: newCoins,
      balance: newBalance,
      totalEarned: newTotalEarned,
      todayEarned: newTodayEarned,
      todayVideosWatched: newVideosWatched,
      level: newLevel,
    }));

    setCompletedTaskIds((prev) => [...prev, task.id]);

    try {
      if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (e) {
      // ignore
    }

    if (currentUser) {
      try {
        await completeTaskInFirestore(currentUser.uid, task, userProfile);
      } catch (e) {
        console.warn('Task completion offline cache:', e);
      }
    }
  };

  const handleWithdrawalSubmit = async (method: PaymentMethod, account: string, amount: number) => {
    const coinsDeducted = Math.round(amount * 5); // ৳১ = ৫ কয়েন

    const newRequest: WithdrawalRequest = {
      id: 'w_' + Date.now(),
      userId: userProfile.userId,
      userName: userProfile.displayName,
      method,
      accountNumber: account,
      amount,
      coinsDeducted,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setWithdrawals((prev) => [newRequest, ...prev]);
    setUserProfile((prev) => ({
      ...prev,
      balance: Math.max(0, prev.balance - amount),
      coins: Math.max(0, prev.coins - coinsDeducted),
      totalWithdrawn: prev.totalWithdrawn + amount,
    }));

    if (currentUser) {
      try {
        await submitWithdrawalRequest(
          currentUser.uid,
          userProfile.displayName,
          method,
          account,
          amount,
          coinsDeducted,
          userProfile
        );
      } catch (e) {
        console.warn('Withdrawal Firestore sync:', e);
      }
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskCategoryFilter === 'all') return true;
    return t.category === taskCategoryFilter;
  });

  const videoProgressPercent = Math.min(
    100,
    Math.round(((userProfile.todayVideosWatched || 0) / (userProfile.dailyVideoLimit || 15)) * 100)
  );

  return (
    <TelegramFrame>
      <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
        {/* Top Telegram Mini App Header (Clean - No preview switcher line) */}
        <div className="bg-slate-950/95 border-b border-slate-800/80 px-3.5 py-2.5 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center font-black text-slate-950 text-sm shadow-md">
              AE
            </div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-white text-base tracking-tight flex items-center gap-1.5">
                <span>AdEarn</span>
                <span className="w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center text-white text-[10px] font-bold">
                  ✓
                </span>
              </h1>
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded border border-slate-700/60">
                Mini App
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {userProfile.telegramUsername && (
              <span className="text-[10px] font-mono text-sky-400 bg-sky-950/80 border border-sky-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Send className="w-2.5 h-2.5 text-sky-400" />
                <span>{userProfile.telegramUsername}</span>
              </span>
            )}
            {currentUser && (
              <button
                onClick={() => logoutUser()}
                className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                title="লগআউট"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4 pb-20">
          {/* Top Golden Profile Header Card */}
          {activeTab !== 'profile' && (
            <HeaderCard
              profile={userProfile}
              onOpenDailyBonus={() => setIsDailyBonusOpen(true)}
            />
          )}

          {/* HOME TAB CONTENT */}
          {activeTab === 'home' && (
            <>
              {/* Vibrant Banner: "আজকের কাজ" */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-4 shadow-xl border border-sky-400/30">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

                <div className="flex items-center justify-between relative z-10">
                  <div className="space-y-1">
                    <span className="inline-block text-[10px] font-black tracking-widest text-yellow-300 uppercase bg-black/25 px-2 py-0.5 rounded-full border border-yellow-300/30">
                      ডেইলি টাস্ক
                    </span>
                    <h2 className="text-2xl font-black text-white tracking-wide drop-shadow-md">
                      আজকের কাজ
                    </h2>
                    <p className="text-xs text-sky-100 font-medium">
                      বিজ্ঞাপন দেখুন এবং বিকাশ ও নগদে ক্যাশআউট নিন
                    </p>
                  </div>

                  <div className="relative shrink-0 w-20 h-20 flex items-center justify-center">
                    <div className="w-16 h-12 bg-white rounded-xl shadow-2xl border-2 border-yellow-400 flex flex-col items-center justify-center transform rotate-6 p-1">
                      <span className="text-[10px] font-black text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                        ADs
                      </span>
                      <span className="text-[8px] font-bold text-slate-800 mt-0.5">
                        ভিডিও দেখুন
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 border border-yellow-100 shadow-lg flex items-center justify-center text-slate-950 font-black text-xs">
                      ৳
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Header: "বিজ্ঞাপন দেখে আয়" */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-white tracking-wide flex items-center gap-1.5">
                    <PlayCircle className="w-4 h-4 text-amber-400" />
                    <span>বিজ্ঞাপন দেখে আয়</span>
                  </h3>
                  <div className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <span>আজকের ভিডিও দেখা:</span>
                    <span className="text-amber-400 font-mono">
                      {toBengaliNumber(userProfile.todayVideosWatched || 0)}/{toBengaliNumber(userProfile.dailyVideoLimit || 15)}
                    </span>
                  </div>
                </div>

                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full transition-all duration-500"
                    style={{ width: `${videoProgressPercent}%` }}
                  />
                </div>
              </div>

              {/* Task Items List */}
              <div className="space-y-2.5">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onSelectTask={(t) => setSelectedTask(t)}
                    isCompleted={completedTaskIds.includes(task.id)}
                  />
                ))}
              </div>
            </>
          )}

          {/* TASKS TAB CONTENT */}
          {activeTab === 'tasks' && (
            <div className="space-y-3.5">
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'all', label: 'সব টাস্ক' },
                  { id: 'video', label: 'ভিডিও অ্যাড' },
                  { id: 'sponsor', label: 'স্পন্সর' },
                  { id: 'survey', label: 'সার্ভে' },
                  { id: 'social', label: 'সোশ্যাল' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setTaskCategoryFilter(cat.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      taskCategoryFilter === cat.id
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2.5">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onSelectTask={(t) => setSelectedTask(t)}
                    isCompleted={completedTaskIds.includes(task.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* WITHDRAW TAB CONTENT (bKash & Nagad only) */}
          {activeTab === 'withdraw' && (
            <WithdrawTab
              profile={userProfile}
              withdrawals={withdrawals}
              onSubmitWithdrawal={handleWithdrawalSubmit}
            />
          )}

          {/* REFER TAB CONTENT (100% Real Logic) */}
          {activeTab === 'refer' && (
            <ReferTab profile={userProfile} />
          )}

          {/* PROFILE TAB CONTENT */}
          {activeTab === 'profile' && (
            <>
              <HeaderCard
                profile={userProfile}
                onOpenDailyBonus={() => setIsDailyBonusOpen(true)}
              />
              <ProfileTab
                profile={userProfile}
                onOpenDailyBonus={() => setIsDailyBonusOpen(true)}
              />
            </>
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <nav aria-label="Main Navigation" className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-950/95 backdrop-blur-md border-t border-slate-800/90 py-2 px-3 z-30 flex items-center justify-around shadow-2xl">
          {[
            { id: 'home', label: 'হোম', icon: Home },
            { id: 'tasks', label: 'টাস্ক', icon: ClipboardList, badge: tasks.length },
            { id: 'withdraw', label: 'উইথড্র', icon: Wallet },
            { id: 'refer', label: 'রেফার', icon: Share2 },
            { id: 'profile', label: 'প্রোফাইল', icon: UserIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex flex-col items-center justify-center py-0.5 px-3 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-amber-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {tab.badge && tab.badge > 0 && !isActive && (
                    <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                      {toBengaliNumber(tab.badge)}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-0.5 tracking-tight">
                  {tab.label}
                </span>

                {isActive && (
                  <span className="w-4 h-0.5 rounded-full bg-amber-400 mt-0.5" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Task Viewing Modal with Monetag Rewarded Ads */}
        {selectedTask && (
          <TaskModal
            task={selectedTask}
            profile={userProfile}
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
            onComplete={handleCompleteTask}
          />
        )}

        {/* Daily Bonus Mystery Gift Modal */}
        <DailyBonusModal
          isOpen={isDailyBonusOpen}
          onClose={() => setIsDailyBonusOpen(false)}
          profile={userProfile}
        />
      </div>
    </TelegramFrame>
  );
}
