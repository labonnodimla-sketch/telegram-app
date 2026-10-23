import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  limit,
  Unsubscribe,
  increment,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, TaskItem, TaskCompletion, WithdrawalRequest, PaymentMethod, ReferralRecord } from '../types';
import { INITIAL_TASKS } from '../data/defaultTasks';
import { User } from 'firebase/auth';

const USERS_COL = 'users';
const TASKS_COL = 'tasks';
const COMPLETIONS_COL = 'completions';
const WITHDRAWALS_COL = 'withdrawals';
const REFERRALS_COL = 'referrals';
const CODES_COL = 'referral_codes';

export interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export async function ensureUserInFirestore(
  firebaseUser: User,
  customTelegramUser?: TelegramUserData
): Promise<UserProfile> {
  const userRef = doc(db, USERS_COL, firebaseUser.uid);
  try {
    const snap = await getDoc(userRef);

    let tgUser: TelegramUserData | undefined = customTelegramUser;
    if (!tgUser && typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user) {
      tgUser = (window as any).Telegram.WebApp.initDataUnsafe.user;
    }

    if (snap.exists()) {
      const existing = snap.data() as UserProfile;
      // Also register referral code index
      if (existing.referralCode) {
        setDoc(doc(db, CODES_COL, existing.referralCode), {
          userId: existing.userId,
          referralCode: existing.referralCode,
          displayName: existing.displayName,
        }, { merge: true }).catch(() => {});
      }

      if (tgUser) {
        const updatedName = tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : '');
        const updatedUsername = tgUser.username ? `@${tgUser.username}` : existing.telegramUsername;
        const updatedPhoto = tgUser.photo_url || existing.photoUrl;

        if (existing.displayName !== updatedName || existing.telegramUsername !== updatedUsername || !existing.telegramId) {
          await updateDoc(userRef, {
            displayName: updatedName,
            telegramUsername: updatedUsername,
            photoUrl: updatedPhoto,
            telegramId: tgUser.id,
            updatedAt: new Date().toISOString(),
          });
          return {
            ...existing,
            displayName: updatedName,
            telegramUsername: updatedUsername,
            photoUrl: updatedPhoto,
            telegramId: tgUser.id,
          };
        }
      }
      return existing;
    }

    // Creating a brand new user starting from ZERO (0)
    let realName = 'User';
    let telegramUsername = '';
    let realPhoto = '';
    let telegramId: number | string | undefined = undefined;

    if (tgUser) {
      realName = tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : '');
      telegramUsername = tgUser.username ? `@${tgUser.username}` : `@user_${tgUser.id}`;
      realPhoto = tgUser.photo_url || '';
      telegramId = tgUser.id;
    } else if (firebaseUser.displayName) {
      realName = firebaseUser.displayName;
      realPhoto = firebaseUser.photoURL || '';
      telegramUsername = '@' + realName.toLowerCase().replace(/\s+/g, '_');
    } else if (firebaseUser.email) {
      realName = firebaseUser.email.split('@')[0];
      telegramUsername = `@${realName}`;
    }

    const referralCode = tgUser 
      ? ('TG' + String(tgUser.id).slice(-4) + Math.floor(10 + Math.random() * 90))
      : ('EARN' + Math.floor(1000 + Math.random() * 9000));
    const newProfile: UserProfile = {
      userId: firebaseUser.uid,
      telegramId,
      displayName: realName,
      photoUrl: realPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      telegramUsername: telegramUsername || '@user',
      balance: 0.00,       // Starts from zero (0)
      coins: 0,           // Starts from zero (0)
      level: 1,           // Level 1
      totalEarned: 0.00,   // Starts from zero (0)
      totalWithdrawn: 0.00,
      todayEarned: 0.00,
      todayVideosWatched: 0,
      dailyVideoLimit: 15,
      referralCode,
      referralCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userRef, newProfile);

    // Save quick lookup for referral codes
    setDoc(doc(db, CODES_COL, referralCode), {
      userId: firebaseUser.uid,
      referralCode,
      displayName: realName,
    }).catch(() => {});

    return newProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${USERS_COL}/${firebaseUser.uid}`);
    throw err;
  }
}

// REAL REFERRAL LOGIC: Process code and credit both inviter and invited user
export async function processReferralCode(
  currentUserProfile: UserProfile,
  referrerCode: string
): Promise<{ success: boolean; message: string }> {
  const cleanCode = referrerCode.trim().toUpperCase();

  // If user already has a referrer or using own code
  if (currentUserProfile.referredBy) {
    return { success: false, message: 'আপনি ইতিমধ্যে একটি রেফারেল কোড ব্যবহার করেছেন' };
  }

  if (currentUserProfile.referralCode === cleanCode) {
    return { success: false, message: 'নিজের রেফারেল কোড নিজে ব্যবহার করা যাবে না' };
  }

  try {
    let inviterId: string | null = null;

    // 1. Check quick index
    const codeDocSnap = await getDoc(doc(db, CODES_COL, cleanCode));
    if (codeDocSnap.exists()) {
      inviterId = codeDocSnap.data().userId;
    } else {
      // Fallback query users collection
      const q = query(collection(db, USERS_COL), where('referralCode', '==', cleanCode), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        inviterId = snap.docs[0].id;
      }
    }

    const rewardTaka = 20.0;
    const rewardCoins = 100;

    // 2. If inviter found in Firestore, credit them immediately!
    if (inviterId && inviterId !== currentUserProfile.userId) {
      await updateDoc(doc(db, USERS_COL, inviterId), {
        referralCount: increment(1),
        balance: increment(rewardTaka),
        coins: increment(rewardCoins),
        totalEarned: increment(rewardTaka),
        updatedAt: new Date().toISOString(),
      }).catch((e) => console.warn('Could not update inviter doc:', e));
    }

    // 3. Save to real referrals collection
    const referralDocRef = doc(collection(db, REFERRALS_COL));
    const record: ReferralRecord = {
      referrerCode: cleanCode,
      referrerId: inviterId || 'ref_' + cleanCode,
      referredUserId: currentUserProfile.userId,
      referredName: currentUserProfile.displayName,
      referredUsername: currentUserProfile.telegramUsername || '@user',
      rewardAmount: rewardTaka,
      rewardCoins: rewardCoins,
      createdAt: new Date().toISOString(),
    };
    await setDoc(referralDocRef, record);

    // 4. Update the invited user's document in Firestore
    if (currentUserProfile.userId) {
      await updateDoc(doc(db, USERS_COL, currentUserProfile.userId), {
        referredBy: cleanCode,
        updatedAt: new Date().toISOString(),
      }).catch(() => {});
    }

    return { success: true, message: `রেফারেল সফল! আপনার বন্ধুকে ৳২০.০০ এবং ১০০ কয়েন যোগ করা হয়েছে।` };
  } catch (err: any) {
    console.warn('Error processing referral:', err);
    return { success: false, message: err.message || 'রেফারেল প্রসেস করতে ব্যর্থ হয়েছে' };
  }
}

// Subscribe to real referrals for the current user's referral code
export function subscribeToRealReferrals(
  referrerCode: string,
  callback: (referrals: ReferralRecord[]) => void
): Unsubscribe {
  const cleanCode = referrerCode.trim().toUpperCase();
  const q = query(
    collection(db, REFERRALS_COL),
    where('referrerCode', '==', cleanCode),
    limit(50)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list: ReferralRecord[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as ReferralRecord) });
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (err) => {
      console.warn('Error subscribing to referrals:', err);
      callback([]);
    }
  );
}

export function subscribeToUserProfile(userId: string, callback: (profile: UserProfile | null) => void): Unsubscribe {
  const userRef = doc(db, USERS_COL, userId);
  return onSnapshot(
    userRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as UserProfile);
      } else {
        callback(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `${USERS_COL}/${userId}`);
    }
  );
}

export async function seedInitialTasksIfEmpty(): Promise<void> {
  const tasksRef = collection(db, TASKS_COL);
  try {
    const snap = await getDocs(query(tasksRef, limit(1)));
    if (snap.empty) {
      for (const t of INITIAL_TASKS) {
        await setDoc(doc(db, TASKS_COL, t.id), {
          ...t,
          createdAt: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn('Could not seed tasks:', err);
  }
}

export function subscribeToTasks(callback: (tasks: TaskItem[]) => void): Unsubscribe {
  const tasksRef = collection(db, TASKS_COL);
  return onSnapshot(
    tasksRef,
    (snap) => {
      if (!snap.empty) {
        const list: TaskItem[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<TaskItem, 'id'>) });
        });
        callback(list);
      } else {
        callback(INITIAL_TASKS);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, TASKS_COL);
      callback(INITIAL_TASKS);
    }
  );
}

export async function completeTaskInFirestore(
  userId: string,
  task: TaskItem,
  currentProfile: UserProfile
): Promise<void> {
  const userRef = doc(db, USERS_COL, userId);
  const completionsRef = doc(collection(db, COMPLETIONS_COL));

  const updatedCoins = (currentProfile.coins || 0) + task.rewardCoins;
  const updatedBalance = (currentProfile.balance || 0) + task.rewardTaka;
  const updatedTotalEarned = (currentProfile.totalEarned || 0) + task.rewardTaka;
  const updatedTodayEarned = (currentProfile.todayEarned || 0) + task.rewardTaka;
  const isVideo = task.category === 'video';
  const updatedVideosWatched = isVideo
    ? Math.min((currentProfile.todayVideosWatched || 0) + 1, currentProfile.dailyVideoLimit || 15)
    : currentProfile.todayVideosWatched || 0;

  const newLevel = Math.max(1, Math.floor(updatedCoins / 500) + 1);

  try {
    const completionData: TaskCompletion = {
      userId,
      taskId: task.id,
      taskTitle: task.title,
      rewardCoins: task.rewardCoins,
      rewardTaka: task.rewardTaka,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };
    await setDoc(completionsRef, completionData);

    await updateDoc(userRef, {
      coins: updatedCoins,
      balance: updatedBalance,
      totalEarned: updatedTotalEarned,
      todayEarned: updatedTodayEarned,
      todayVideosWatched: updatedVideosWatched,
      level: newLevel,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${USERS_COL}/${userId}`);
    throw err;
  }
}

export async function claimDailyReward(
  userId: string,
  bonusCoins: number,
  bonusTaka: number,
  currentProfile: UserProfile
): Promise<void> {
  const userRef = doc(db, USERS_COL, userId);
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    await updateDoc(userRef, {
      coins: (currentProfile.coins || 0) + bonusCoins,
      balance: (currentProfile.balance || 0) + bonusTaka,
      todayEarned: (currentProfile.todayEarned || 0) + bonusTaka,
      totalEarned: (currentProfile.totalEarned || 0) + bonusTaka,
      lastBonusDate: todayStr,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${USERS_COL}/${userId}`);
    throw err;
  }
}

export async function submitWithdrawalRequest(
  userId: string,
  userName: string,
  method: PaymentMethod,
  accountNumber: string,
  amountTaka: number,
  coinsEquivalent: number,
  currentProfile: UserProfile
): Promise<void> {
  if (currentProfile.balance < amountTaka) {
    throw new Error('অপর্যাপ্ত ব্যালেন্স (Insufficient Balance)');
  }

  const withdrawalDoc = doc(collection(db, WITHDRAWALS_COL));
  const userRef = doc(db, USERS_COL, userId);

  try {
    const requestData: WithdrawalRequest = {
      id: withdrawalDoc.id,
      userId,
      userName,
      method,
      accountNumber,
      amount: amountTaka,
      coinsDeducted: coinsEquivalent,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await setDoc(withdrawalDoc, requestData);

    await updateDoc(userRef, {
      balance: Math.max(0, currentProfile.balance - amountTaka),
      coins: Math.max(0, currentProfile.coins - coinsEquivalent),
      totalWithdrawn: (currentProfile.totalWithdrawn || 0) + amountTaka,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, WITHDRAWALS_COL);
    throw err;
  }
}

export function subscribeToUserWithdrawals(
  userId: string,
  callback: (withdrawals: WithdrawalRequest[]) => void
): Unsubscribe {
  const q = query(
    collection(db, WITHDRAWALS_COL),
    where('userId', '==', userId),
    limit(25)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list: WithdrawalRequest[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as Omit<WithdrawalRequest, 'id'>) });
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, WITHDRAWALS_COL);
    }
  );
}
