import React from 'react';
import { TaskItem } from '../types';
import { toBengaliNumber } from '../data/defaultTasks';
import { Play, Gift, ClipboardList, Send, Sparkles, CheckCircle2 } from 'lucide-react';

interface TaskCardProps {
  task: TaskItem;
  onSelectTask: (task: TaskItem) => void;
  isCompleted?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onSelectTask, isCompleted }) => {
  const getCategoryIcon = () => {
    switch (task.category) {
      case 'video':
        return <Play className="w-4 h-4 text-white fill-white ml-0.5" />;
      case 'sponsor':
        return <Gift className="w-4 h-4 text-amber-300" />;
      case 'survey':
        return <ClipboardList className="w-4 h-4 text-emerald-300" />;
      case 'social':
        return <Send className="w-4 h-4 text-sky-300" />;
      default:
        return <Sparkles className="w-4 h-4 text-yellow-300" />;
    }
  };

  const getDurationText = (sec: number) => {
    if (sec < 60) return `${toBengaliNumber(sec)} সেকেন্ড`;
    const min = Math.round(sec / 60);
    return `${toBengaliNumber(min)} মিনিট`;
  };

  return (
    <div className={`group relative rounded-xl border p-2.5 transition-all duration-200 ${
      isCompleted
        ? 'bg-slate-900/40 border-slate-800 opacity-70'
        : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800/90 hover:border-amber-500/30 shadow-md shadow-slate-950/40'
    }`}>
      <div className="flex items-center gap-3">
        {/* Left Thumbnail with Action Badge */}
        <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-800 border border-slate-700/60 shadow-inner flex items-center justify-center">
          {task.thumbnailUrl ? (
            <img
              src={task.thumbnailUrl}
              alt={task.title}
              className="w-full h-full object-cover brightness-90 group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
              {getCategoryIcon()}
            </div>
          )}

          {/* Icon overlay button badge */}
          <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-red-600/90 border border-white/40 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
              {getCategoryIcon()}
            </div>
          </div>
        </div>

        {/* Center Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-white font-bold text-sm tracking-wide truncate">
              {task.bengaliTitle || task.title}
            </h3>
            {isCompleted && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs">
            <div className="flex items-center gap-1 text-amber-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{toBengaliNumber(task.rewardCoins)} কয়েন</span>
            </div>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">
              {getDurationText(task.durationSeconds)}
            </span>
          </div>

          {task.description && (
            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
              {task.description}
            </p>
          )}
        </div>

        {/* Right CTA Button matching screenshot */}
        <div className="shrink-0">
          {isCompleted ? (
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg inline-block">
              সম্পন্ন ✓
            </span>
          ) : (
            <button
              onClick={() => onSelectTask(task)}
              className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm shadow-amber-950/30 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              {task.actionText || 'ভিউ বাটনে ক্লিক'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
