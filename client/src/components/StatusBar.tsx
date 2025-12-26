import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';

interface StatusBarProps {
  className?: string;
}

export function StatusBar({ className }: StatusBarProps) {
  const { state, isLoading } = useApp();
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [, setTick] = useState(0);

  // Update sync time when loading completes
  useEffect(() => {
    if (!isLoading) {
      setLastSync(new Date());
    }
  }, [isLoading]);

  // Update relative time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const toolCount = Object.keys(state.tools).length;

  return (
    <div className={cn(
      "flex items-center justify-center gap-2 px-4 h-[24px] min-h-[24px]",
      "bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700",
      "text-[10px] text-slate-500 dark:text-slate-400",
      className
    )}>
      {/* Tool count */}
      <span className="font-medium">{toolCount} tools</span>

      <span className="text-slate-300 dark:text-slate-600">-</span>

      {/* Sync status */}
      <span>
        {isLoading ? 'Syncing...' : `Synced ${formatRelativeTime(lastSync)}`}
      </span>

      <span className="text-slate-300 dark:text-slate-600">-</span>

      {/* Keyboard shortcuts hint */}
      <span>
        <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[9px] font-mono">⌘?</kbd>
        {' '}for shortcuts
      </span>
    </div>
  );
}
