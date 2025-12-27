import React, { useMemo, useState } from 'react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronRight,
  Home,
  LayoutGrid,
  Columns3,
  Filter,
  ArrowUpDown,
  Group,
  Download,
  Bookmark,
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
  const [activeView, setActiveView] = useState<'table' | 'grid' | 'kanban'>('table');

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

  const handleClearFilters = () => {
    dispatch({ type: 'CLEAR_ALL_FILTERS' });
  };

  return (
    <div className={cn(
      "flex items-center gap-1 px-3 h-[40px] min-h-[40px]",
      "bg-[#1e2433] border-b border-slate-700/50",
      className
    )}>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1 text-[11px] text-slate-400 mr-4">
        <Home className="w-3.5 h-3.5" />
        <span className="hover:text-slate-200 cursor-pointer">Home</span>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <span className="hover:text-slate-200 cursor-pointer">AI Tools</span>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <span className="hover:text-slate-200 cursor-pointer">Chatbots</span>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <span className="text-slate-200">LLM Platforms</span>
      </div>

      {/* View Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 text-[11px] font-medium gap-1",
              "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            View
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-32">
          <DropdownMenuItem className="text-xs" onClick={() => setActiveView('table')}>
            Table View {activeView === 'table' && '✓'}
          </DropdownMenuItem>
          <DropdownMenuItem className="text-xs" onClick={() => setActiveView('grid')}>
            Grid View {activeView === 'grid' && '✓'}
          </DropdownMenuItem>
          <DropdownMenuItem className="text-xs" onClick={() => setActiveView('kanban')}>
            Kanban View {activeView === 'kanban' && '✓'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Columns Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 text-[11px] font-medium gap-1",
              "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            <Columns3 className="w-3.5 h-3.5" />
            Columns
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuCheckboxItem checked={true} className="text-xs">Name</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={true} className="text-xs">Type</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={true} className="text-xs">Status</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={true} className="text-xs">Description</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={true} className="text-xs">Tags</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={true} className="text-xs">Source</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={true} className="text-xs">Rating</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={true} className="text-xs">Access</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={true} className="text-xs">Owner</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filter+ Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 text-[11px] font-medium gap-1",
              "text-slate-400 hover:text-slate-200 hover:bg-white/5",
              hasActiveFilters && "text-cyan-400"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            Filter+
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuItem className="text-xs" onClick={() => dispatch({ type: 'SET_TYPE_FILTER', payload: { filter: 'CHATBOT' } })}>
            Type: Chatbot
          </DropdownMenuItem>
          <DropdownMenuItem className="text-xs" onClick={() => dispatch({ type: 'SET_TYPE_FILTER', payload: { filter: 'IMAGE' } })}>
            Type: Image
          </DropdownMenuItem>
          <DropdownMenuItem className="text-xs" onClick={() => dispatch({ type: 'SET_TYPE_FILTER', payload: { filter: 'CODE' } })}>
            Type: Code
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-xs" onClick={() => dispatch({ type: 'SET_STATUS_FILTER', payload: { filter: 'active' } })}>
            Status: Active
          </DropdownMenuItem>
          <DropdownMenuItem className="text-xs" onClick={() => dispatch({ type: 'SET_STATUS_FILTER', payload: { filter: 'beta' } })}>
            Status: Beta
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {hasActiveFilters && (
            <DropdownMenuItem className="text-xs text-red-400" onClick={handleClearFilters}>
              Clear All Filters
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 text-[11px] font-medium gap-1",
              "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuItem className="text-xs">Name (A-Z)</DropdownMenuItem>
          <DropdownMenuItem className="text-xs">Name (Z-A)</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-xs">Date (Newest)</DropdownMenuItem>
          <DropdownMenuItem className="text-xs">Date (Oldest)</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-xs">Rating (High)</DropdownMenuItem>
          <DropdownMenuItem className="text-xs">Rating (Low)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Group Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 text-[11px] font-medium gap-1",
              "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            <Group className="w-3.5 h-3.5" />
            Group
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuItem className="text-xs">No Grouping</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-xs">By Type</DropdownMenuItem>
          <DropdownMenuItem className="text-xs">By Status</DropdownMenuItem>
          <DropdownMenuItem className="text-xs">By Owner</DropdownMenuItem>
          <DropdownMenuItem className="text-xs">By Access</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Export Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 text-[11px] font-medium gap-1",
              "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            <Download className="w-3.5 h-3.5" />
            Export
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuItem className="text-xs">Export as CSV</DropdownMenuItem>
          <DropdownMenuItem className="text-xs">Export as JSON</DropdownMenuItem>
          <DropdownMenuItem className="text-xs">Export as PDF</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Spacer */}
      <div className="flex-1" />

      {/* My Filters Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 text-[11px] font-medium gap-1",
              "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            <Bookmark className="w-3.5 h-3.5" />
            My Filters
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem className="text-xs">Chatbots Only</DropdownMenuItem>
          <DropdownMenuItem className="text-xs">Active Tools</DropdownMenuItem>
          <DropdownMenuItem className="text-xs">Recently Added</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-xs text-cyan-400">
            + Save Current Filter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
