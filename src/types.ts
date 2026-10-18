export interface UserProfile {
  userId: string;
  telegramId?: number | string;
  displayName: string;
  photoUrl?: string;
  telegramUsername?: string;
  balance: number; // in BDT (৳) - starts from 0
  coins: number;    // starts from 0
  level: number;    // starts from 1
  totalEarned: number; // starts from 0
  totalWithdrawn: number;
  todayEarned: number;
  todayVideosWatched: number;
  dailyVideoLimit: number;
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  lastBonusDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReferralRecord {
  id?: string;
  referrerCode: string;
  referrerId?: string;
  referredUserId: string;
  referredName: string;
  referredUsername: string;
  rewardAmount: number;
  rewardCoins: number;
  createdAt: string;
}

export type TaskCategory = 'video' | 'sponsor' | 'survey' | 'social' | 'daily';

export interface TaskItem {
  id: string;
  title: string;
  bengaliTitle: string;
  description: string;
  category: TaskCategory;
  rewardCoins: number;
  rewardTaka: number;
  durationSeconds: number;
  actionUrl?: string;
  actionText: string;
  iconType: string;
  thumbnailUrl?: string;
  isActive: boolean;
  totalCompletions?: number;
}

export interface TaskCompletion {
  id?: string;
  userId: string;
  taskId: string;
  taskTitle: string;
  rewardCoins: number;
  rewardTaka: number;
  status: 'completed';
  completedAt: string;
}

export type PaymentMethod = 'bkash' | 'nagad';

export interface WithdrawalRequest {
  id?: string;
  userId: string;
  userName: string;
  method: PaymentMethod;
  accountNumber: string;
  amount: number; // in ৳
  coinsDeducted: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
}

export interface DailyEarningData {
  day: string;
  amount: number;
}
