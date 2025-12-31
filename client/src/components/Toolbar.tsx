import React, { useMemo } from 'react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { typeColors, statusColors, tagColors, TOOL_TYPES, TOOL_STATUSES, SortField, SortDirection, GroupBy, VisibleColumns, Tool } from '@/lib/data';
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
  Link,
  FileText,
  Upload,
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

  const handleSort = (field: SortField, direction: SortDirection) => {
    dispatch({ type: 'SET_SORT', payload: { field, direction } });
  };

  const handleGroupBy = (groupBy: GroupBy) => {
    dispatch({ type: 'SET_GROUP_BY', payload: { groupBy } });
  };

  const handleToggleColumn = (column: keyof VisibleColumns) => {
    dispatch({ type: 'TOGGLE_COLUMN', payload: { column } });
  };

  const handleExport = (format: 'csv' | 'json' | 'markdown') => {
    const tools = Object.values(state.tools);
    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'csv': {
        const headers = ['Name', 'Type', 'URL', 'Summary', 'Tags', 'Status', 'Usage'];
        const rows = tools.map(t => [
          t.name,
          t.type,
          t.url,
          t.summary.replace(/,/g, ';'),
          (t.tags || []).join(';'),
          t.status,
          t.usage?.toString() || ''
        ]);
        content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        filename = 'ai_tools.csv';
        mimeType = 'text/csv';
        break;
      }
      case 'json': {
        content = JSON.stringify(tools, null, 2);
        filename = 'ai_tools.json';
        mimeType = 'application/json';
        break;
      }
      case 'markdown': {
        const header = '| Name | Type | URL | Summary | Status |\n|------|------|-----|---------|--------|\n';
        const rows = tools.map(t => `| ${t.name} | ${t.type} | ${t.url} | ${t.summary.substring(0, 50)}... | ${t.status} |`);
        content = header + rows.join('\n');
        filename = 'ai_tools.md';
        mimeType = 'text/markdown';
        break;
      }
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-3 h-[32px] min-h-[32px]",
      "bg-card border-b border-border",
      className
    )}>
      {/* View Mode Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-2.5 text-[10px] font-medium gap-1.5",
              "text-muted-foreground hover:text-foreground hover:bg-foreground/10",
              "transition-colors"
            )}
          >
            <Table className="w-3 h-3" />
            View
            <ChevronDown className="w-2.5 h-2.5" />
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
              "h-6 px-2.5 text-[10px] font-medium gap-1.5",
              "text-muted-foreground hover:text-foreground hover:bg-foreground/10",
              "transition-colors"
            )}
          >
            <Columns className="w-3 h-3" />
            Columns
            <ChevronDown className="w-2.5 h-2.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuLabel className="text-[9px] text-muted-foreground">
            Toggle Columns
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(Object.keys(state.visibleColumns) as Array<keyof VisibleColumns>).map((key) => (
            <DropdownMenuCheckboxItem
              key={key}
              checked={state.visibleColumns[key]}
              onCheckedChange={() => handleToggleColumn(key)}
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
              "h-6 px-2.5 text-[10px] font-medium gap-1.5",
              "text-muted-foreground hover:text-foreground hover:bg-foreground/10",
              "transition-colors",
              hasActiveFilters && "text-primary bg-primary/10"
            )}
          >
            <Filter className="w-3 h-3" />
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-1 text-[8px] px-1.5 py-0.5 bg-blue-500 text-white rounded-full font-semibold min-w-[18px] text-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className="w-2.5 h-2.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuLabel className="text-[9px] text-muted-foreground">
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
          <DropdownMenuLabel className="text-[9px] text-muted-foreground">
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
              "h-6 px-2.5 text-[10px] font-medium gap-1.5",
              "text-muted-foreground hover:text-foreground hover:bg-foreground/10",
              "transition-colors"
            )}
          >
            <ArrowUpDown className="w-3 h-3" />
            Sort
            <ChevronDown className="w-2.5 h-2.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuItem className="text-[10px]" onClick={() => handleSort('name', 'asc')}>
            Name A-Z
            {state.sortField === 'name' && state.sortDirection === 'asc' && <Check className="w-3 h-3 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]" onClick={() => handleSort('name', 'desc')}>
            Name Z-A
            {state.sortField === 'name' && state.sortDirection === 'desc' && <Check className="w-3 h-3 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[10px]" onClick={() => handleSort('type', 'asc')}>
            Type
            {state.sortField === 'type' && <Check className="w-3 h-3 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]" onClick={() => handleSort('status', 'asc')}>
            Status
            {state.sortField === 'status' && <Check className="w-3 h-3 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[10px]" onClick={() => handleSort('date', 'asc')}>
            Date Added (Oldest)
            {state.sortField === 'date' && state.sortDirection === 'asc' && <Check className="w-3 h-3 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]" onClick={() => handleSort('date', 'desc')}>
            Date Added (Newest)
            {state.sortField === 'date' && state.sortDirection === 'desc' && <Check className="w-3 h-3 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]" onClick={() => handleSort('usage', 'desc')}>
            Usage (High to Low)
            {state.sortField === 'usage' && state.sortDirection === 'desc' && <Check className="w-3 h-3 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]" onClick={() => handleSort('usage', 'asc')}>
            Usage (Low to High)
            {state.sortField === 'usage' && state.sortDirection === 'asc' && <Check className="w-3 h-3 ml-auto" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Group Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-2.5 text-[10px] font-medium gap-1.5",
              "text-muted-foreground hover:text-foreground hover:bg-foreground/10",
              "transition-colors"
            )}
          >
            <Layers className="w-3 h-3" />
            Group
            <ChevronDown className="w-2.5 h-2.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuItem className="text-[10px]" onClick={() => handleGroupBy('type')}>
            {state.groupBy === 'type' && <Check className="w-3 h-3 mr-2" />}
            {state.groupBy !== 'type' && <span className="w-3 mr-2" />}
            By Type
          </DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]" onClick={() => handleGroupBy('status')}>
            {state.groupBy === 'status' && <Check className="w-3 h-3 mr-2" />}
            {state.groupBy !== 'status' && <span className="w-3 mr-2" />}
            By Status
          </DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]" onClick={() => handleGroupBy('category')}>
            {state.groupBy === 'category' && <Check className="w-3 h-3 mr-2" />}
            {state.groupBy !== 'category' && <span className="w-3 mr-2" />}
            By Category
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[10px]" onClick={() => handleGroupBy('none')}>
            {state.groupBy === 'none' && <Check className="w-3 h-3 mr-2" />}
            {state.groupBy !== 'none' && <span className="w-3 mr-2" />}
            No Grouping
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-2.5 text-[10px] font-medium gap-1.5",
              "text-muted-foreground hover:text-foreground hover:bg-foreground/10",
              "transition-colors"
            )}
          >
            <Download className="w-3 h-3" />
            Export
            <ChevronDown className="w-2.5 h-2.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuItem className="text-[10px]" onClick={() => handleExport('csv')}>Export CSV</DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]" onClick={() => handleExport('json')}>Export JSON</DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]" onClick={() => handleExport('markdown')}>Export Markdown</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[10px]" onClick={() => window.print()}>Print View</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* My Filters */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-2.5 text-[10px] font-medium gap-1.5",
              "text-muted-foreground hover:text-foreground hover:bg-foreground/10",
              "transition-colors"
            )}
          >
            <Bookmark className="w-3 h-3" />
            My Filters
            <ChevronDown className="w-2.5 h-2.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuLabel className="text-[9px] text-muted-foreground">
            Quick Filters
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-[10px]"
            onClick={() => {
              dispatch({ type: 'CLEAR_ALL_FILTERS' });
              dispatch({ type: 'SET_TAG_FILTERS', payload: { tags: [] } });
              // Filter to show only pinned tools - we'll handle this in DataGrid
              dispatch({ type: 'SET_ACTIVE_FILTER', payload: { filter: 'pinned' } });
            }}
          >
            Pinned Tools
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-[10px]"
            onClick={() => {
              dispatch({ type: 'CLEAR_ALL_FILTERS' });
              dispatch({ type: 'SET_TYPE_FILTER', payload: { filter: 'CHATBOT' } });
            }}
          >
            LLM Chatbots
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-[10px]"
            onClick={() => {
              dispatch({ type: 'CLEAR_ALL_FILTERS' });
              dispatch({ type: 'SET_TYPE_FILTER', payload: { filter: 'IMAGE' } });
            }}
          >
            Image Generation
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-[10px]"
            onClick={() => {
              dispatch({ type: 'CLEAR_ALL_FILTERS' });
              dispatch({ type: 'SET_TYPE_FILTER', payload: { filter: 'CODE' } });
            }}
          >
            Code Assistants
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-[10px]"
            onClick={handleClearFilters}
          >
            <X className="w-3 h-3 mr-2" />
            Clear All Filters
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Add Content Button - Primary Action */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            className={cn(
              "h-6 px-3.5 text-[10px] font-semibold gap-1.5",
              "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500",
              "text-white",
              "shadow-md shadow-blue-500/30",
              "transition-all duration-150",
              "hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5",
              "active:translate-y-0"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            Add
            <ChevronDown className="w-2.5 h-2.5 opacity-80" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-[9px] text-muted-foreground">
            Add New Content
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-[10px] cursor-pointer"
            onClick={onAddTool}
          >
            <Link className="w-3.5 h-3.5 mr-2 text-cyan-500" />
            Import from URL
            <span className="ml-auto text-[8px] text-muted-foreground">⌘N</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-[10px] cursor-pointer"
            onClick={onAddTool}
          >
            <FileText className="w-3.5 h-3.5 mr-2 text-emerald-500" />
            Add Manually
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-[10px] cursor-pointer opacity-50"
            disabled
          >
            <Upload className="w-3.5 h-3.5 mr-2 text-purple-500" />
            Import from File
            <span className="ml-auto text-[8px] text-muted-foreground">Soon</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Bulk Actions (shown when items selected) */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-1.5 mr-2">
          <span className="text-[10px] text-muted-foreground mr-1">
            {selectedCount} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground hover:bg-foreground/5"
          >
            Merge
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground hover:bg-foreground/5"
          >
            Archive
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground hover:bg-foreground/5"
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
        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-foreground/5"
        onClick={onRefresh}
        title="Refresh"
      >
        <RefreshCw className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
