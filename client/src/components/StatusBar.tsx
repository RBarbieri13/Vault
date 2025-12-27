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
  const selectedCount = 3; // Mock selected count
  const activeFilter = state.typeFilter !== 'all' ? `Type=${state.typeFilter}` : null;

  return (
    <div className={cn(
      "flex items-center justify-between px-3 h-[28px] min-h-[28px]",
      "bg-[#1a1f2e] border-t border-slate-700/50",
      "text-[10px] text-slate-400",
      className
    )}>
      {/* Left side - Keyboard shortcuts */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-slate-700/50 rounded text-[9px] font-mono text-slate-300">⌘K</kbd>
          <span>Search</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-slate-700/50 rounded text-[9px] font-mono text-slate-300">⌘N</kbd>
          <span>New</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-slate-700/50 rounded text-[9px] font-mono text-slate-300">⌘E</kbd>
          <span>Edit</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-slate-700/50 rounded text-[9px] font-mono text-slate-300">⌘D</kbd>
          <span>Duplicate</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-slate-700/50 rounded text-[9px] font-mono text-slate-300">⌘⌫</kbd>
          <span>Delete</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-slate-700/50 rounded text-[9px] font-mono text-slate-300">Tab</kbd>
          <span>Navigate</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-slate-700/50 rounded text-[9px] font-mono text-slate-300">Space</kbd>
          <span>Select</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-slate-700/50 rounded text-[9px] font-mono text-slate-300">⌘A</kbd>
          <span>Select All</span>
        </div>
      </div>

      {/* Right side - Status info */}
      <div className="flex items-center gap-2">
        <span className="font-medium">{toolCount} items</span>
        <span className="text-slate-600">|</span>
        <span>{selectedCount} selected</span>
        {activeFilter && (
          <>
            <span className="text-slate-600">|</span>
            <span>Filters: {activeFilter}</span>
          </>
        )}
        <span className="text-slate-600">|</span>
        <span>
          {isLoading ? 'Syncing...' : `Last sync: ${formatRelativeTime(lastSync)}`}
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-500">v2.4.1</span>
      </div>
    </div>
  );
}
