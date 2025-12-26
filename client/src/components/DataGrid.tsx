import React, { useMemo, useState } from 'react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Tool, getTypeColor, getTagColor, formatDate } from '@/lib/data';
import { MiniSparkline } from './Sparkline';
import {
  Star,
  ExternalLink,
  MoreHorizontal,
  Edit,
  Trash,
  Copy,
  Pin,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface Column {
  id: string;
  label: string;
  width: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

// Updated columns to match reference: Icon, Name, Type, Description, Tags, Trend, Date
const columns: Column[] = [
  { id: 'icon', label: '', width: '36px', align: 'center' },
  { id: 'name', label: 'Name', width: '160px', sortable: true },
  { id: 'type', label: 'Type', width: '85px', sortable: true },
  { id: 'description', label: 'Description', width: '1fr' },
  { id: 'tags', label: 'Tags', width: '140px' },
  { id: 'trend', label: 'Trend', width: '56px', align: 'center' },
  { id: 'date', label: 'Date', width: '56px', sortable: true, align: 'center' },
  { id: 'actions', label: '', width: '32px', align: 'center' },
];

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  column: string;
  direction: SortDirection;
}

interface DataGridProps {
  tools?: Tool[];
  onSelectTool?: (id: string) => void;
  selectedToolId?: string | null;
  className?: string;
}

export function DataGrid({
  tools: propTools,
  onSelectTool,
  selectedToolId,
  className,
}: DataGridProps) {
  const { state, dispatch, apiMutations } = useApp();
  const [sortState, setSortState] = useState<SortState>({ column: 'name', direction: 'asc' });
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Use provided tools or fall back to state
  const allTools = propTools || Object.values(state.tools);

  // Filter tools based on search query and new filters
  const filteredTools = useMemo(() => {
    let tools = allTools;

    // Search filter
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      tools = tools.filter(tool =>
        tool.name.toLowerCase().includes(query) ||
        tool.type.toLowerCase().includes(query) ||
        tool.summary.toLowerCase().includes(query) ||
        tool.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Type filter
    if (state.typeFilter !== 'all') {
      tools = tools.filter(t => t.type === state.typeFilter);
    }

    // Status filter
    if (state.statusFilter !== 'all') {
      tools = tools.filter(t => t.status === state.statusFilter);
    }

    // Tags filter
    if (state.tagFilters.length > 0) {
      tools = tools.filter(t =>
        state.tagFilters.some(tag => t.tags?.includes(tag))
      );
    }

    // Date filter
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

    return tools;
  }, [allTools, state.searchQuery, state.typeFilter, state.statusFilter, state.tagFilters, state.dateFilter]);

  // Sort tools
  const sortedTools = useMemo(() => {
    if (!sortState.direction) return filteredTools;

    return [...filteredTools].sort((a, b) => {
      let comparison = 0;

      switch (sortState.column) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          comparison = 0;
      }

      return sortState.direction === 'desc' ? -comparison : comparison;
    });
  }, [filteredTools, sortState]);

  const handleSort = (columnId: string) => {
    setSortState(prev => {
      if (prev.column !== columnId) {
        return { column: columnId, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { column: columnId, direction: 'desc' };
      }
      if (prev.direction === 'desc') {
        return { column: columnId, direction: null };
      }
      return { column: columnId, direction: 'asc' };
    });
  };

  const handleTogglePin = async (tool: Tool, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiMutations.updateTool(tool.id, { isPinned: !tool.isPinned });
      toast({
        title: tool.isPinned ? "Unpinned" : "Pinned",
        description: `${tool.name} ${tool.isPinned ? 'removed from' : 'added to'} favorites.`,
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update tool." });
    }
  };

  const handleCopyUrl = (tool: Tool, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(tool.url);
    toast({ title: "Copied", description: "URL copied to clipboard." });
  };

  const handleDelete = async (tool: Tool, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${tool.name}"?`)) {
      try {
        await apiMutations.deleteTool(tool.id);
        toast({ title: "Deleted", description: `${tool.name} has been removed.` });
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete tool." });
      }
    }
  };

  const handleSelectRow = (id: string) => {
    if (onSelectTool) {
      onSelectTool(id);
    } else {
      dispatch({ type: 'SELECT_TOOL', payload: { id } });
    }
  };

  const gridTemplateColumns = columns.map(c => c.width).join(' ');

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-slate-900", className)}>
      {/* Header */}
      <div
        className={cn(
          "grid items-center gap-2 px-2 h-[32px] min-h-[32px]",
          "bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700",
          "text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
        )}
        style={{ gridTemplateColumns }}
      >
        {columns.map(col => (
          <div
            key={col.id}
            className={cn(
              "flex items-center gap-0.5 truncate",
              col.align === 'center' && "justify-center",
              col.align === 'right' && "justify-end",
              col.sortable && "cursor-pointer hover:text-slate-700 dark:hover:text-slate-200"
            )}
            onClick={() => col.sortable && handleSort(col.id)}
          >
            {col.label}
            {col.sortable && (
              <span className="w-3 h-3 flex items-center justify-center">
                {sortState.column === col.id && sortState.direction === 'asc' && (
                  <ArrowUp className="w-2.5 h-2.5" />
                )}
                {sortState.column === col.id && sortState.direction === 'desc' && (
                  <ArrowDown className="w-2.5 h-2.5" />
                )}
                {sortState.column !== col.id && (
                  <ArrowUpDown className="w-2.5 h-2.5 opacity-30" />
                )}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto">
        {sortedTools.map((tool, index) => {
          const isSelected = (selectedToolId || state.selectedToolId) === tool.id;
          const isHovered = hoveredRow === tool.id;
          const typeColor = getTypeColor(tool.type);

          return (
            <div
              key={tool.id}
              className={cn(
                "grid items-center gap-2 px-2 h-[32px] min-h-[32px]",
                "border-b border-slate-100 dark:border-slate-800",
                "cursor-pointer transition-colors",
                isSelected
                  ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-2 border-l-transparent",
                index % 2 === 1 && !isSelected && "bg-slate-50/50 dark:bg-slate-800/20"
              )}
              style={{ gridTemplateColumns }}
              onClick={() => handleSelectRow(tool.id)}
              onMouseEnter={() => setHoveredRow(tool.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {/* Icon */}
              <div className="flex justify-center items-center">
                <button
                  className={cn(
                    "w-6 h-6 flex items-center justify-center rounded text-xs",
                    tool.isPinned
                      ? "text-yellow-500"
                      : "text-slate-600 dark:text-slate-400"
                  )}
                  onClick={(e) => handleTogglePin(tool, e)}
                  title={tool.isPinned ? "Unpin" : "Pin"}
                >
                  {tool.isPinned ? (
                    <Star className="w-3.5 h-3.5 fill-yellow-500" />
                  ) : (
                    <span className="text-[11px]">{tool.icon || '◎'}</span>
                  )}
                </button>
              </div>

              {/* Name */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate">
                  {tool.name}
                </span>
                {isHovered && (
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-slate-400 hover:text-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Type badge */}
              <div className="flex items-center">
                <span
                  className="text-[9px] font-medium px-1.5 py-0.5 rounded truncate"
                  style={{
                    backgroundColor: typeColor.bg,
                    color: typeColor.text,
                  }}
                >
                  {tool.type}
                </span>
              </div>

              {/* Description (summary) */}
              <div className="flex items-center min-w-0">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                  {tool.summary}
                </span>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-0.5 overflow-hidden">
                {tool.tags?.slice(0, 2).map(tag => {
                  const tagColor = getTagColor(tag);
                  return (
                    <span
                      key={tag}
                      className="text-[8px] font-medium px-1.5 py-0.5 rounded truncate"
                      style={{
                        backgroundColor: tagColor.bg,
                        color: tagColor.text,
                      }}
                    >
                      {tag}
                    </span>
                  );
                })}
                {tool.tags && tool.tags.length > 2 && (
                  <span className="text-[8px] text-slate-400">
                    +{tool.tags.length - 2}
                  </span>
                )}
              </div>

              {/* Trend sparkline */}
              <div className="flex justify-center">
                <MiniSparkline data={tool.trend || []} />
              </div>

              {/* Date */}
              <div className="flex justify-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {formatDate(tool.createdAt)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-5 w-5 text-slate-400 hover:text-slate-600",
                        !isHovered && "opacity-0",
                        isHovered && "opacity-100"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); handleTogglePin(tool, e as any); }}
                      className="text-xs"
                    >
                      <Pin className="w-3 h-3 mr-2" />
                      {tool.isPinned ? 'Unpin' : 'Pin'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleCopyUrl(tool, e as any)}
                      className="text-xs"
                    >
                      <Copy className="w-3 h-3 mr-2" />
                      Copy URL
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs">
                      <Edit className="w-3 h-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => handleDelete(tool, e as any)}
                      className="text-xs text-red-600 focus:text-red-600"
                    >
                      <Trash className="w-3 h-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {sortedTools.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-400">
            <p className="text-sm">No tools found</p>
            {state.searchQuery && (
              <p className="text-xs mt-1">
                Try adjusting your search or filter terms
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
