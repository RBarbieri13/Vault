import React, { useMemo } from 'react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { typeColors, statusColors, tagColors, TOOL_TYPES, TOOL_STATUSES, type ToolType, type ToolStatus } from '@/lib/data';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

interface ToolbarProps {
  onAddTool?: () => void;
  onRefresh?: () => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  className?: string;
}

export function Toolbar({
  onAddTool,
  onRefresh,
  viewMode = 'list',
  onViewModeChange,
  className,
}: ToolbarProps) {
  const { state, dispatch } = useApp();

  // Get unique tags from tools
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    Object.values(state.tools).forEach(tool => {
      tool.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [state.tools]);

  // Count filtered tools
  const filteredCount = useMemo(() => {
    let tools = Object.values(state.tools);

    if (state.typeFilter !== 'all') {
      tools = tools.filter(t => t.type === state.typeFilter);
    }
    if (state.statusFilter !== 'all') {
      tools = tools.filter(t => t.status === state.statusFilter);
    }
    if (state.tagFilters.length > 0) {
      tools = tools.filter(t =>
        state.tagFilters.some(tag => t.tags?.includes(tag))
      );
    }
    if (state.dateFilter !== 'all') {
      const now = new Date();
      tools = tools.filter(t => {
        const created = new Date(t.createdAt);
        switch (state.dateFilter) {
          case 'today':
            return created.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return created >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return created >= monthAgo;
          case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            return created >= yearAgo;
          default:
            return true;
        }
      });
    }

    return tools.length;
  }, [state.tools, state.typeFilter, state.statusFilter, state.tagFilters, state.dateFilter]);

  // Check if any filters are active
  const hasActiveFilters =
    state.typeFilter !== 'all' ||
    state.statusFilter !== 'all' ||
    state.tagFilters.length > 0 ||
    state.dateFilter !== 'all';

  const handleClearFilters = () => {
    dispatch({ type: 'CLEAR_ALL_FILTERS' });
  };

  // Get display text for filters
  const typeLabel = state.typeFilter === 'all' ? 'All Types' : state.typeFilter;
  const statusLabel = state.statusFilter === 'all' ? 'All Status' : `Status: ${state.statusFilter.charAt(0).toUpperCase() + state.statusFilter.slice(1)}`;
  const tagsLabel = state.tagFilters.length === 0
    ? 'All Tags'
    : state.tagFilters.length === 1
      ? `Tags: ${state.tagFilters[0]}`
      : `Tags: ${state.tagFilters.length} selected`;
  const dateLabel = state.dateFilter === 'all'
    ? 'All Time'
    : state.dateFilter === 'today'
      ? 'Added Today'
      : state.dateFilter === 'week'
        ? 'Added This Week'
        : state.dateFilter === 'month'
          ? 'Added This Month'
          : 'Added This Year';

  return (
    <div className={cn(
      "flex items-center gap-2 px-4 h-[44px] min-h-[44px]",
      "bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700",
      className
    )}>
      {/* Type Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-7 px-3 text-[11px] font-medium gap-1",
              "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
              "hover:bg-slate-100 dark:hover:bg-slate-700",
              state.typeFilter !== 'all' && "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            )}
          >
            {typeLabel}
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuItem
            className="text-xs"
            onClick={() => dispatch({ type: 'SET_TYPE_FILTER', payload: { filter: 'all' } })}
          >
            <span className={cn(
              "w-2 h-2 rounded-full mr-2 bg-slate-300"
            )} />
            All Types
            {state.typeFilter === 'all' && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {TOOL_TYPES.map(type => {
            const color = typeColors[type];
            return (
              <DropdownMenuItem
                key={type}
                className="text-xs"
                onClick={() => dispatch({ type: 'SET_TYPE_FILTER', payload: { filter: type } })}
              >
                <span
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: color?.text }}
                />
                {type}
                {state.typeFilter === type && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-7 px-3 text-[11px] font-medium gap-1",
              "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
              "hover:bg-slate-100 dark:hover:bg-slate-700",
              state.statusFilter !== 'all' && "border-green-300 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            )}
          >
            {statusLabel}
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuItem
            className="text-xs"
            onClick={() => dispatch({ type: 'SET_STATUS_FILTER', payload: { filter: 'all' } })}
          >
            All Status
            {state.statusFilter === 'all' && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {TOOL_STATUSES.map(status => {
            const color = statusColors[status];
            return (
              <DropdownMenuItem
                key={status}
                className="text-xs capitalize"
                onClick={() => dispatch({ type: 'SET_STATUS_FILTER', payload: { filter: status } })}
              >
                <span
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: color?.text }}
                />
                {status}
                {state.statusFilter === status && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Tags Filter Dropdown (Multi-select) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-7 px-3 text-[11px] font-medium gap-1",
              "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
              "hover:bg-slate-100 dark:hover:bg-slate-700",
              state.tagFilters.length > 0 && "border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
            )}
          >
            {tagsLabel}
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44 max-h-64 overflow-y-auto">
          {state.tagFilters.length > 0 && (
            <>
              <DropdownMenuItem
                className="text-xs text-slate-500"
                onClick={() => dispatch({ type: 'SET_TAG_FILTERS', payload: { tags: [] } })}
              >
                Clear all tags
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {allTags.map(tag => {
            const isSelected = state.tagFilters.includes(tag);
            const color = tagColors[tag] || tagColors.default;
            return (
              <DropdownMenuCheckboxItem
                key={tag}
                checked={isSelected}
                onCheckedChange={(checked) => {
                  if (checked) {
                    dispatch({ type: 'ADD_TAG_FILTER', payload: { tag } });
                  } else {
                    dispatch({ type: 'REMOVE_TAG_FILTER', payload: { tag } });
                  }
                }}
                className="text-xs"
              >
                <span
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: color?.text }}
                />
                {tag}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Date Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-7 px-3 text-[11px] font-medium gap-1",
              "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
              "hover:bg-slate-100 dark:hover:bg-slate-700",
              state.dateFilter !== 'all' && "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            )}
          >
            {dateLabel}
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuItem
            className="text-xs"
            onClick={() => dispatch({ type: 'SET_DATE_FILTER', payload: { filter: 'all' } })}
          >
            All Time
            {state.dateFilter === 'all' && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-xs"
            onClick={() => dispatch({ type: 'SET_DATE_FILTER', payload: { filter: 'today' } })}
          >
            Added Today
            {state.dateFilter === 'today' && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs"
            onClick={() => dispatch({ type: 'SET_DATE_FILTER', payload: { filter: 'week' } })}
          >
            Added This Week
            {state.dateFilter === 'week' && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs"
            onClick={() => dispatch({ type: 'SET_DATE_FILTER', payload: { filter: 'month' } })}
          >
            Added This Month
            {state.dateFilter === 'month' && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs"
            onClick={() => dispatch({ type: 'SET_DATE_FILTER', payload: { filter: 'year' } })}
          >
            Added This Year
            {state.dateFilter === 'year' && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[11px] text-slate-500 hover:text-slate-700"
          onClick={handleClearFilters}
        >
          <X className="w-3 h-3 mr-1" />
          Clear
        </Button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Item Count Badge */}
      <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[11px] text-slate-600 dark:text-slate-400">
        <span className="font-medium">{filteredCount}</span>
        <span>items</span>
      </div>
    </div>
  );
}

// Removed QuickFilters component as it's not needed in the new design
