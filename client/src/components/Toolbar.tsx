import React, { useMemo, useState } from 'react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { typeColors, statusColors, tagColors, TOOL_TYPES, TOOL_STATUSES } from '@/lib/data';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  X,
  Table,
  Grid3x3,
  List,
  Columns,
  Filter,
  ArrowUpDown,
  Layers,
  Download,
  Bookmark,
  RefreshCw,
  Trash2,
  Plus,
  Check,
  Settings,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface ToolbarProps {
  onAddTool?: () => void;
  onRefresh?: () => void;
  onDeleteSelected?: () => void;
  viewMode?: 'table' | 'grid' | 'list';
  onViewModeChange?: (mode: 'table' | 'grid' | 'list') => void;
  selectedCount?: number;
  className?: string;
}

export function Toolbar({
  onAddTool,
  onRefresh,
  onDeleteSelected,
  viewMode = 'table',
  onViewModeChange,
  selectedCount = 0,
  className,
}: ToolbarProps) {
  const { state, dispatch } = useApp();
  const [columnsVisible, setColumnsVisible] = useState({
    icon: true,
    name: true,
    type: true,
    status: true,
    desc: true,
    tags: true,
    source: true,
    rating: true,
    access: true,
    owner: true,
    modified: true,
  });

  // Get unique tags from tools
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    Object.values(state.tools).forEach(tool => {
      tool.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [state.tools]);

  // Check if any filters are active
  const hasActiveFilters =
    state.typeFilter !== 'all' ||
    state.statusFilter !== 'all' ||
    state.tagFilters.length > 0 ||
    state.dateFilter !== 'all';

  const activeFilterCount = [
    state.typeFilter !== 'all' ? 1 : 0,
    state.statusFilter !== 'all' ? 1 : 0,
    state.tagFilters.length > 0 ? 1 : 0,
    state.dateFilter !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleClearFilters = () => {
    dispatch({ type: 'CLEAR_ALL_FILTERS' });
  };

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-3 h-[32px] min-h-[32px]",
      "bg-[#1e2433] border-b border-slate-700/50",
      className
    )}>
      {/* View Mode Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-2 text-[10px] font-medium gap-1",
              "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            <Table className="w-3 h-3" />
            View
            <ChevronDown className="w-2.5 h-2.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-32">
          <DropdownMenuItem
            className="text-[10px]"
            onClick={() => onViewModeChange?.('table')}
          >
            <Table className="w-3 h-3 mr-2" />
            Table
            {viewMode === 'table' && <Check className="w-3 h-3 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-[10px]"
            onClick={() => onViewModeChange?.('grid')}
          >
            <Grid3x3 className="w-3 h-3 mr-2" />
            Grid
            {viewMode === 'grid' && <Check className="w-3 h-3 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-[10px]"
            onClick={() => onViewModeChange?.('list')}
          >
            <List className="w-3 h-3 mr-2" />
            List
            {viewMode === 'list' && <Check className="w-3 h-3 ml-auto" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Columns Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-2 text-[10px] font-medium gap-1",
              "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            <Columns className="w-3 h-3" />
            Columns
            <ChevronDown className="w-2.5 h-2.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuLabel className="text-[9px] text-slate-500">
            Toggle Columns
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(columnsVisible).map(([key, visible]) => (
            <DropdownMenuCheckboxItem
              key={key}
              checked={visible}
              onCheckedChange={(checked) => setColumnsVisible(prev => ({ ...prev, [key]: checked }))}
              className="text-[10px] capitalize"
            >
              {key}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-2 text-[10px] font-medium gap-1",
              "text-slate-400 hover:text-slate-200 hover:bg-white/5",
              hasActiveFilters && "text-cyan-400"
            )}
          >
            <Filter className="w-3 h-3" />
            Filter +
            {activeFilterCount > 0 && (
              <span className="ml-0.5 text-[8px] px-1 py-0.5 bg-cyan-500 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className="w-2.5 h-2.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuLabel className="text-[9px] text-slate-500">
            Filter by Type
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-[10px]"
            onClick={() => dispatch({ type: 'SET_TYPE_FILTER', payload: { filter: 'all' } })}
          >
            All Types
            {state.typeFilter === 'all' && <Check className="w-3 h-3 ml-auto" />}
          </DropdownMenuItem>
          {TOOL_TYPES.slice(0, 6).map(type => {
            const color = typeColors[type];
            return (
              <DropdownMenuItem
                key={type}
                className="text-[10px]"
                onClick={() => dispatch({ type: 'SET_TYPE_FILTER', payload: { filter: type } })}
              >
                <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: color?.text }} />
                {type}
                {state.typeFilter === type && <Check className="w-3 h-3 ml-auto" />}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[9px] text-slate-500">
            Filter by Status
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {TOOL_STATUSES.map(status => {
            const color = statusColors[status];
            return (
              <DropdownMenuItem
                key={status}
                className="text-[10px] capitalize"
                onClick={() => dispatch({ type: 'SET_STATUS_FILTER', payload: { filter: status } })}
              >
                <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: color?.text }} />
                {status}
                {state.statusFilter === status && <Check className="w-3 h-3 ml-auto" />}
              </DropdownMenuItem>
            );
          })}
          {hasActiveFilters && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-[10px] text-red-500"
                onClick={handleClearFilters}
              >
                <X className="w-3 h-3 mr-2" />
                Clear All Filters
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-2 text-[10px] font-medium gap-1",
              "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            <ArrowUpDown className="w-3 h-3" />
            Sort
            <ChevronDown className="w-2.5 h-2.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuItem className="text-[10px]">Name A-Z</DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]">Name Z-A</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[10px]">Type</DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]">Status</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[10px]">Date Added ↑</DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]">Date Added ↓</DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]">Rating ↑</DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]">Rating ↓</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Group Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-2 text-[10px] font-medium gap-1",
              "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            <Layers className="w-3 h-3" />
            Group
            <ChevronDown className="w-2.5 h-2.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuItem className="text-[10px]">
            <Check className="w-3 h-3 mr-2" />
            By Type
          </DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]">By Status</DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]">By Category</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[10px]">No Grouping</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-2 text-[10px] font-medium gap-1",
              "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            <Download className="w-3 h-3" />
            Export
            <ChevronDown className="w-2.5 h-2.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuItem className="text-[10px]">Export CSV</DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]">Export JSON</DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]">Export Markdown</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[10px]">Print View</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings Button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200 hover:bg-white/5"
        title="Settings"
      >
        <Settings className="w-3.5 h-3.5" />
      </Button>

      {/* My Filters */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-2 text-[10px] font-medium gap-1",
              "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            <Bookmark className="w-3 h-3" />
            My Filters
            <ChevronDown className="w-2.5 h-2.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuLabel className="text-[9px] text-slate-500">
            Saved Filters
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[10px]">Pinned Tools</DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]">LLM Chatbots</DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]">Image Generation</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[10px]">
            <Plus className="w-3 h-3 mr-2" />
            Save Current Filter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bulk Actions (shown when items selected) */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-1.5 mr-2">
          <span className="text-[10px] text-slate-400 mr-1">
            {selectedCount} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] text-slate-400 hover:text-slate-200 hover:bg-white/5"
          >
            Merge
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] text-slate-400 hover:text-slate-200 hover:bg-white/5"
          >
            Archive
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] text-slate-400 hover:text-slate-200 hover:bg-white/5"
          >
            Tag
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={onDeleteSelected}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </div>
      )}

      {/* Refresh Button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200 hover:bg-white/5"
        onClick={onRefresh}
        title="Refresh"
      >
        <RefreshCw className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
