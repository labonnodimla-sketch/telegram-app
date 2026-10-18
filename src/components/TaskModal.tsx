import React, { useState, useEffect } from 'react';
import { TaskItem, UserProfile } from '../types';
import { toBengaliNumber, formatTaka } from '../data/defaultTasks';
import { triggerMonetagRewardedAd, isMonetagAvailable } from '../services/monetagService';
import confetti from 'canvas-confetti';
import { 
  X, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  Sparkles, 
  Coins, 
  Clock, 
  Tv,
  ExternalLink 
} from 'lucide-react';

interface TaskModalProps {
  task: TaskItem;
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (task: TaskItem) => Promise<void>;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  profile,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [timeLeft, setTimeLeft] = useState(Math.min(task.durationSeconds, 15));
  const [isFinished, setIsFinished] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [surveyStep, setSurveyStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [monetagPlaying, setMonetagPlaying] = useState(false);

  const totalTime = Math.min(task.durationSeconds, 15);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(totalTime);
      setIsFinished(false);
      setIsClaiming(false);
      setSurveyStep(0);
      setSelectedAnswers([]);
      setMonetagPlaying(false);
      return;
    }

    // Auto-trigger Monetag ad for video ads if Monetag SDK is ready
    if (task.category === 'video' && isMonetagAvailable()) {
      handlePlayMonetagAd();
    }

    if (task.category === 'survey') return;

    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsFinished(true);
            triggerCelebration();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, timeLeft, task]);

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#10b981', '#3b82f6'],
      });
    } catch (e) {
      console.log('Confetti effect', e);
    }
  };

  const handlePlayMonetagAd = async () => {
    setMonetagPlaying(true);
    const success = await triggerMonetagRewardedAd();
    setMonetagPlaying(false);
    if (success) {
      setIsFinished(true);
      setTimeLeft(0);
      triggerCelebration();
    }
  };

  const handleClaim = async () => {
    if (isClaiming) return;
    setIsClaiming(true);
    try {
      await onComplete(task);
      triggerCelebration();
      onClose();
    } catch (err) {
      console.error('Failed to complete task:', err);
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isOpen) return null;

  const surveyQuestions = [
    {
      q: 'আপনি কোন ধরনের বিজ্ঞাপন দেখতে পছন্দ করেন?',
      options: ['প্রযুক্তি ও গ্যাজেটস', 'অনলাইন ইনকাম ও টিপস', 'ই-কমার্স ও কেনাকাটা', 'গেমিং ও এন্টারটেইনমেন্ট'],
    },
    {
      q: 'প্রতিদিন আপনি কত সময় টেলিগ্রাম অ্যাপ ব্যবহার করেন?',
      options: ['১ ঘণ্টার কম', '১-৩ ঘণ্টা', '৩-৫ ঘণ্টা', '৫ ঘণ্টার বেশি'],
    },
    {
      q: 'আপনি কীভাবে আপনার উপার্জিত টাকা তুলতে পছন্দ করেন?',
      options: ['বিকাশ (bKash)', 'নগদ (Nagad)'],
    },
  ];

  const handleAnswerSelect = (opt: string) => {
    const updated = [...selectedAnswers, opt];
    setSelectedAnswers(updated);
    if (surveyStep < surveyQuestions.length - 1) {
      setSurveyStep(surveyStep + 1);
    } else {
      setIsFinished(true);
      triggerCelebration();
    }
  };

  const progressPercent = Math.round(((totalTime - timeLeft) / totalTime) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <h3 className="font-bold text-sm text-slate-100 truncate">
              {task.bengaliTitle || task.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3.5">
          {task.category === 'survey' ? (
            /* Survey Interface */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>প্রশ্ন {toBengaliNumber(surveyStep + 1)} / {toBengaliNumber(surveyQuestions.length)}</span>
                <span className="text-amber-400 font-semibold">+{toBengaliNumber(task.rewardCoins)} কয়েন</span>
              </div>

              {!isFinished ? (
                <>
                  <p className="text-sm font-semibold text-slate-200">
                    {surveyQuestions[surveyStep].q}
                  </p>
                  <div className="space-y-2 mt-2">
                    {surveyQuestions[surveyStep].options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleAnswerSelect(opt)}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-amber-500/15 border border-slate-700 hover:border-amber-500/50 text-slate-200 text-xs transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span>{opt}</span>
                        <span className="text-[10px] text-slate-400">বাছাই করুন →</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            /* Video / Sponsored Ad Interface with Monetag Support */
            <div className="space-y-3">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center group">
                <img
                  src={task.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80'}
                  alt="Ad preview"
                  className="w-full h-full object-cover filter brightness-75"
                />

                {/* Simulated playback indicator */}
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-3 text-center">
                  {!isFinished ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto text-amber-300">
                        <Play className="w-6 h-6 fill-amber-300 animate-pulse" />
                      </div>
                      <p className="text-xs text-white font-medium">
                        {monetagPlaying ? 'Monetag বিজ্ঞাপন চলছে...' : 'বিজ্ঞাপন চলছে... অপেক্ষা করুন'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                      <p className="text-sm font-bold text-emerald-300">বিজ্ঞাপন সম্পূর্ণ হয়েছে!</p>
                    </div>
                  )}
                </div>

                {/* Controls overlay */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-white bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1 hover:text-amber-400 cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-300">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{toBengaliNumber(timeLeft)} সেকেন্ড বাকি</span>
                  </div>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1 hover:text-amber-400 cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Monetag Instant Play Button */}
              {!isFinished && (
                <button
                  onClick={handlePlayMonetagAd}
                  disabled={monetagPlaying}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 border border-blue-400/30 transition-transform active:scale-98 cursor-pointer shadow-md"
                >
                  <Tv className="w-4 h-4 text-amber-300" />
                  <span>{monetagPlaying ? 'বিজ্ঞাপন ওপেন হচ্ছে...' : 'Monetag রিওয়ার্ডেড বিজ্ঞাপন দেখুন'}</span>
                </button>
              )}

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>অগ্রগতি</span>
                  <span className="font-mono text-amber-400">{toBengaliNumber(progressPercent)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Reward Details Box */}
          <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">টাস্ক রিওয়ার্ড</p>
                <p className="text-xs font-bold text-amber-400">
                  +{toBengaliNumber(task.rewardCoins)} কয়েন ({formatTaka(task.rewardTaka)})
                </p>
              </div>
            </div>
            {task.actionUrl && (
              <a
                href={task.actionUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-950/50 px-2 py-1 rounded-md border border-sky-800/40"
              >
                <span>লিংক দেখুন</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Action button */}
          {isFinished ? (
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>{isClaiming ? 'রিওয়ার্ড যোগ হচ্ছে...' : 'রিওয়ার্ড গ্রহণ করুন'}</span>
            </button>
          ) : (
            <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1 py-1">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>রিওয়ার্ড পেতে সময় শেষ হওয়া পর্যন্ত অপেক্ষা করুন</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
