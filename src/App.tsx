/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  auth, 
  authenticateTelegramUser, 
  loginWithGoogle, 
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
  TelegramUserData
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
  LogIn,
  LogOut,
  Send,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'tasks' | 'withdraw' | 'refer' | 'profile'>('home');
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isDailyBonusOpen, setIsDailyBonusOpen] = useState(false);
  const [isDesktopPreview, setIsDesktopPreview] = useState(false);
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string>('all');
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isTelegramEnvironment, setIsTelegramEnvironment] = useState(false);

  // Initialize Telegram WebApp and Firebase connection test
  useEffect(() => {
    testConnection();
    seedInitialTasksIfEmpty();

    // Check if running inside Telegram WebApp
    const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
    if (tg && tg.initData) {
      setIsTelegramEnvironment(true);
      try {
        tg.ready();
        tg.expand();
      } catch (e) {
        console.log('Telegram WebApp initialization:', e);
      }
    }
  }, []);

  // Automatic Authentication Flow:
  // When opened in Telegram or Web, automatically initialize profile without blocking
  useEffect(() => {
    // Safety timeout: if auth takes more than 2 seconds, stop loading and show fallback profile
    const timer = setTimeout(() => {
      setIsAuthLoading(false);
      setUserProfile((prev) => {
        if (prev) return prev;
        // Fallback profile if network is slow or domain pending
        const tgUser = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp?.initDataUnsafe?.user : null;
        return {
          userId: tgUser ? `tg_${tgUser.id}` : 'user_guest',
          displayName: tgUser ? `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}` : 'AdEarn User',
          telegramUsername: tgUser?.username ? `@${tgUser.username}` : '@user',
          telegramId: tgUser?.id,
          photoUrl: tgUser?.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          balance: 150.00,
          coins: 750,
          level: 2,
          totalEarned: 150.00,
          totalWithdrawn: 0.00,
          todayEarned: 15.00,
          todayVideosWatched: 0,
          dailyVideoLimit: 15,
          referralCode: 'EARN882',
          referralCount: 0,
          createdAt: new Date().toISOString(),
        };
      });
    }, 2000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timer);
      setIsAuthLoading(true);
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        try {
          const profile = await ensureUserInFirestore(firebaseUser);
          setUserProfile(profile);
        } catch (e) {
          console.error('Error ensuring profile:', e);
        }
      } else {
        try {
          await authenticateTelegramUser();
        } catch (err) {
          console.warn('Auto Telegram auth attempt:', err);
        }
      }
      setIsAuthLoading(false);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // Listen to Firestore User Profile in real time
  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToUserProfile(currentUser.uid, (profile) => {
      if (profile) {
        setUserProfile(profile);
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
    if (!currentUser || !userProfile) return;
    await completeTaskInFirestore(currentUser.uid, task, userProfile);
    setCompletedTaskIds((prev) => [...prev, task.id]);
    
    // Telegram haptic feedback
    try {
      if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (e) {
      // ignore
    }
  };

  const handleWithdrawalSubmit = async (method: PaymentMethod, account: string, amount: number) => {
    if (!currentUser || !userProfile) return;
    const coinsDeducted = Math.round(amount * 5); // ৳১ = ৫ কয়েন
    await submitWithdrawalRequest(
      currentUser.uid,
      userProfile.displayName,
      method,
      account,
      amount,
      coinsDeducted,
      userProfile
    );
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskCategoryFilter === 'all') return true;
    return t.category === taskCategoryFilter;
  });

  const videoProgressPercent = userProfile
    ? Math.min(100, Math.round(((userProfile.todayVideosWatched || 0) / (userProfile.dailyVideoLimit || 15)) * 100))
    : 0;

  return (
    <TelegramFrame
      isDesktopPreview={isDesktopPreview}
      onTogglePreview={() => setIsDesktopPreview(!isDesktopPreview)}
      telegramUser={userProfile?.displayName || 'User'}
    >
      <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
        {/* Top Telegram Mini App Bar */}
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
            {userProfile?.telegramUsername && (
              <span className="text-[10px] font-mono text-sky-400 bg-sky-950/80 border border-sky-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Send className="w-2.5 h-2.5 text-sky-400" />
                <span>{userProfile.telegramUsername}</span>
              </span>
            )}
            {currentUser && !isTelegramEnvironment && (
              <button
                onClick={() => logoutUser()}
                className="text-slate-500 hover:text-slate-300 p-1"
                title="লগআউট"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Loading state while establishing Telegram profile */}
        {isAuthLoading || !userProfile ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-3">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>টেলিগ্রাম অ্যাকাউন্ট কানেক্ট হচ্ছে...</span>
            </p>
          </div>
        ) : (
          /* Main Authenticated Screen Content */
          <>
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
                  {/* Vibrant Banner: "আজকের কাজ" matching screenshot */}
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

                  {/* Section Header: "বিজ্ঞাপন দেখে আয়" matching screenshot */}
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

              {/* REFER TAB CONTENT */}
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
          </>
        )}

        {/* Task Viewing Modal */}
        {selectedTask && userProfile && (
          <TaskModal
            task={selectedTask}
            profile={userProfile}
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
            onComplete={handleCompleteTask}
          />
        )}

        {/* Daily Bonus Mystery Gift Modal */}
        {userProfile && (
          <DailyBonusModal
            isOpen={isDailyBonusOpen}
            onClose={() => setIsDailyBonusOpen(false)}
            profile={userProfile}
          />
        )}
      </div>
    </TelegramFrame>
  );
}
