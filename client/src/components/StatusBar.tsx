import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

interface StatusBarProps {
  selectedCount?: number;
  className?: string;
}

export function StatusBar({ selectedCount = 0, className }: StatusBarProps) {
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

  // Build active filter description
  const getFilterDescription = () => {
    const parts: string[] = [];
    if (state.typeFilter !== 'all') {
      parts.push(`Type=${state.typeFilter}`);
    }
    if (state.statusFilter !== 'all') {
      parts.push(`Status=${state.statusFilter}`);
    }
    if (state.tagFilters.length > 0) {
      parts.push(`Tags=${state.tagFilters.join(',')}`);
    }
    if (state.dateFilter !== 'all') {
      parts.push(`Date=${state.dateFilter}`);
    }
    return parts.length > 0 ? `Filters: ${parts.join(', ')}` : null;
  };

  const filterDescription = getFilterDescription();

  return (
    <div className={cn(
      "flex items-center justify-between gap-4 px-4 h-[22px] min-h-[22px]",
      "bg-[#1a1f2e] border-t border-slate-700/50",
      "text-[10px] text-slate-400",
      className
    )}>
      {/* Left side - counts and filters */}
      <div className="flex items-center gap-3">
        <span className="font-medium tabular-nums">
          {toolCount} items
        </span>

        {selectedCount > 0 && (
          <>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400 font-medium">
              {selectedCount} selected
            </span>
          </>
        )}

        {filterDescription && (
          <>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500">
              {filterDescription}
            </span>
          </>
        )}
      </div>

      {/* Right side - sync status and version */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          {isLoading ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              Last sync: {formatRelativeTime(lastSync)}
            </>
          )}
        </span>

        <span className="font-mono text-slate-500">v2.4.1</span>
      </div>
    </div>
  );
}
