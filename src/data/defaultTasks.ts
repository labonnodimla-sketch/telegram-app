import { TaskItem } from '../types';

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'video-ad-1',
    title: 'ভিডিও অ্যাড',
    bengaliTitle: 'ভিডিও অ্যাড',
    description: '৩০ সেকেন্ড বিজ্ঞাপন দেখে কয়েন অর্জন করুন',
    category: 'video',
    rewardCoins: 5,
    rewardTaka: 1,
    durationSeconds: 30,
    actionUrl: 'https://www.youtube.com',
    actionText: 'ভিউ বাটনে ক্লিক',
    iconType: 'video',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'sponsor-content-1',
    title: 'স্পন্সর কন্টেন্ট',
    bengaliTitle: 'স্পন্সর কন্টেন্ট',
    description: 'স্পন্সর পার্টনারের পোস্ট ভিজিট করুন এবং বোনাস পান',
    category: 'sponsor',
    rewardCoins: 10,
    rewardTaka: 2,
    durationSeconds: 60,
    actionUrl: 'https://telegram.org',
    actionText: 'ভিউ বাটনে ক্লিক',
    iconType: 'gift',
    thumbnailUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'short-survey-1',
    title: 'ছোট সার্ভে',
    bengaliTitle: 'ছোট সার্ভে',
    description: 'সহজ ৩টি প্রশ্নের উত্তর দিন এবং ৫০ কয়েন জিতে নিন',
    category: 'survey',
    rewardCoins: 50,
    rewardTaka: 10,
    durationSeconds: 120,
    actionUrl: '',
    actionText: 'শুরু করুন',
    iconType: 'clipboard',
    thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'tg-channel-1',
    title: 'টেলিগ্রাম চ্যানেলে জয়েন',
    bengaliTitle: 'টেলিগ্রাম চ্যানেলে জয়েন',
    description: 'আমাদের অফিসিয়াল পেমেন্ট প্রুফ ও আপডেট চ্যানেলে যোগ দিন',
    category: 'social',
    rewardCoins: 20,
    rewardTaka: 4,
    durationSeconds: 15,
    actionUrl: 'https://t.me/telegram',
    actionText: 'জয়েন করুন',
    iconType: 'send',
    thumbnailUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'video-ad-2',
    title: 'প্রিমিয়াম ভিডিও অ্যাড',
    bengaliTitle: 'প্রিমিয়াম ভিডিও অ্যাড',
    description: 'হাই-ভ্যালু ভিডিও ক্যাম্পেইন দেখুন এবং ডাবল রিওয়ার্ড নিন',
    category: 'video',
    rewardCoins: 15,
    rewardTaka: 3,
    durationSeconds: 45,
    actionUrl: 'https://www.youtube.com',
    actionText: 'ভিউ বাটনে ক্লিক',
    iconType: 'play',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'daily-bonus-task',
    title: 'দৈনিক লাকি বক্স',
    bengaliTitle: 'দৈনিক লাকি বক্স',
    description: 'প্রতি ২৪ ঘণ্টায় একবার ফ্রি উপহার বক্স ওপেন করুন',
    category: 'daily',
    rewardCoins: 25,
    rewardTaka: 5,
    durationSeconds: 5,
    actionUrl: '',
    actionText: 'দাবি করুন',
    iconType: 'sparkles',
    thumbnailUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  }
];

export const BENGALI_NUMERALS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

export function toBengaliNumber(val: number | string): string {
  const str = String(val);
  return str.split('').map(ch => BENGALI_NUMERALS[ch] || ch).join('');
}

export function formatTaka(amount: number): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `৳${toBengaliNumber(formatted)}`;
}
