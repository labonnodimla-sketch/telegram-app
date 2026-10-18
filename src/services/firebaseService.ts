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
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, TaskItem, TaskCompletion, WithdrawalRequest, PaymentMethod } from '../types';
import { INITIAL_TASKS } from '../data/defaultTasks';
import { User } from 'firebase/auth';

const USERS_COL = 'users';
const TASKS_COL = 'tasks';
const COMPLETIONS_COL = 'completions';
const WITHDRAWALS_COL = 'withdrawals';

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

    // Detect Telegram WebApp user info if available from window or parameter
    let tgUser: TelegramUserData | undefined = customTelegramUser;
    if (!tgUser && typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user) {
      tgUser = (window as any).Telegram.WebApp.initDataUnsafe.user;
    }

    if (snap.exists()) {
      const existing = snap.data() as UserProfile;
      // If Telegram user info is now available, sync it
      if (tgUser) {
        const updatedName = tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : '');
        const updatedUsername = tgUser.username ? `@${tgUser.username}` : existing.telegramUsername;
        const updatedPhoto = tgUser.photo_url || existing.photoUrl;

        if (existing.displayName !== updatedName || existing.telegramUsername !== updatedUsername) {
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

    // Creating a brand new real user
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

    const referralCode = 'EARN' + Math.floor(1000 + Math.random() * 9000);
    const newProfile: UserProfile = {
      userId: firebaseUser.uid,
      telegramId,
      displayName: realName,
      photoUrl: realPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      telegramUsername: telegramUsername || '@user',
      balance: 150.00, // Starter bonus
      coins: 750,
      level: 2,
      totalEarned: 150.00,
      totalWithdrawn: 0.00,
      todayEarned: 15.00,
      todayVideosWatched: 0,
      dailyVideoLimit: 15,
      referralCode,
      referralCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userRef, newProfile);
    return newProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${USERS_COL}/${firebaseUser.uid}`);
    throw err;
  }
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

// Seed initial tasks if empty
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
    console.warn('Could not seed tasks or already seeded:', err);
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

  const newLevel = Math.max(currentProfile.level || 1, Math.floor(updatedCoins / 500) + 1);

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
