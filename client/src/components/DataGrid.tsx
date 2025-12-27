import React, { useMemo, useState, useCallback } from 'react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Tool, getTypeColor, getTagColor } from '@/lib/data';
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
  ChevronDown,
  ChevronRight,
  Globe,
  Users,
  Settings,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';

// Owner type for display
interface Owner {
  initials: string;
  name: string;
  color: string;
}

// Generate owner from tool data
const getOwner = (tool: Tool): Owner => {
  const hash = tool.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
  const names = ['Jason D.', 'Alice S.', 'Mike K.', 'Sarah L.', 'Tom B.', 'Emma W.'];
  const idx = hash % names.length;
  return {
    initials: names[idx].split(' ').map(n => n[0]).join(''),
    name: names[idx],
    color: colors[idx],
  };
};

// Get access icon
const getAccessIcon = (tool: Tool) => {
  if (tool.isPinned) return { icon: Globe, label: 'Public', color: '#22c55e' };
  if (tool.tags?.includes('Ent') || tool.tags?.includes('Int')) return { icon: Users, label: 'Team', color: '#3b82f6' };
  return { icon: Globe, label: 'Public', color: '#22c55e' };
};

// Get source domain from URL
const getSourceDomain = (url: string): string => {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain.length > 15 ? domain.substring(0, 15) + '...' : domain;
  } catch {
    return url;
  }
};

// Format modified time
const formatModified = (date: Date | number | string): string => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}m ago`;
};

// Get status display
const getStatusDisplay = (status: string) => {
  switch (status) {
    case 'active': return { icon: '✓', label: 'Verified', color: '#10b981' };
    case 'beta': return { icon: '●', label: 'Modified', color: '#f59e0b' };
    case 'deprecated': return { icon: '⚠', label: 'Outdated', color: '#ef4444' };
    case 'inactive': return { icon: '○', label: 'Archived', color: '#6b7280' };
    default: return { icon: '●', label: 'Synced', color: '#10b981' };
  }
};

// Column definitions
interface Column {
  id: string;
  label: string;
  width: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

const columns: Column[] = [
  { id: 'num', label: '#', width: '28px', align: 'center' },
  { id: 'checkbox', label: '', width: '24px', align: 'center' },
  { id: 'icon', label: '', width: '28px', align: 'center' },
  { id: 'name', label: 'Name', width: '110px', sortable: true },
  { id: 'type', label: 'Type', width: '72px', sortable: true },
  { id: 'status', label: 'Status', width: '72px' },
  { id: 'desc', label: 'Desc', width: '1fr' },
  { id: 'tags', label: 'Tags', width: '90px' },
  { id: 'source', label: 'Source', width: '90px' },
  { id: 'rating', label: 'Rating', width: '56px', align: 'center' },
  { id: 'access', label: 'Access', width: '36px', align: 'center' },
  { id: 'owner', label: 'Owner', width: '32px', align: 'center' },
  { id: 'actions', label: '', width: '28px', align: 'center' },
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
  selectedRows?: Set<string>;
  onSelectionChange?: (selection: Set<string>) => void;
}

// Category metadata for group headers
const categoryMeta: Record<string, { icon: string; color: string; order: number }> = {
  CHATBOT: { icon: '💬', color: '#fef3c7', order: 1 },
  IMAGE: { icon: '🖼️', color: '#fce7f3', order: 2 },
  CODE: { icon: '💻', color: '#dbeafe', order: 3 },
  DEV: { icon: '💻', color: '#dbeafe', order: 3 },
  VIDEO: { icon: '📺', color: '#ccfbf1', order: 4 },
  AUDIO: { icon: '🎵', color: '#fee2e2', order: 5 },
  WRITING: { icon: '📝', color: '#dcfce7', order: 6 },
  AGENT: { icon: '🤖', color: '#ffedd5', order: 7 },
  CREATIVE: { icon: '🎨', color: '#fce7f3', order: 8 },
  RESEARCH: { icon: '🔍', color: '#f3e8ff', order: 9 },
  SEARCH: { icon: '🔍', color: '#ede9fe', order: 10 },
};

export function DataGrid({
  tools: propTools,
  onSelectTool,
  selectedToolId,
  className,
  selectedRows: externalSelectedRows,
  onSelectionChange,
}: DataGridProps) {
  const { state, dispatch, apiMutations } = useApp();
  const [sortState, setSortState] = useState<SortState>({ column: 'name', direction: 'asc' });
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    CHATBOT: true,
    IMAGE: true,
    CODE: true,
    DEV: true,
    VIDEO: true,
    AUDIO: true,
    WRITING: true,
    AGENT: true,
    CREATIVE: true,
    RESEARCH: true,
    SEARCH: true,
  });
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string>>(new Set());

  // Use external selection if provided, otherwise use internal
  const selectedRows = externalSelectedRows || internalSelectedRows;
  const setSelectedRows = onSelectionChange || setInternalSelectedRows;

  // Use provided tools or fall back to state
  const allTools = propTools || Object.values(state.tools);

  // Filter tools based on search query and filters
  const filteredTools = useMemo(() => {
    let tools = allTools;

    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      tools = tools.filter(tool =>
        tool.name.toLowerCase().includes(query) ||
        tool.type.toLowerCase().includes(query) ||
        tool.summary.toLowerCase().includes(query) ||
        tool.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

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
            return created >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          case 'month':
            return created >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          case 'year':
            return created >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
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

  // Group tools by type
  const groupedTools = useMemo(() => {
    const groups: Record<string, Tool[]> = {};
    sortedTools.forEach(tool => {
      const type = tool.type || 'OTHER';
      if (!groups[type]) groups[type] = [];
      groups[type].push(tool);
    });
    return groups;
  }, [sortedTools]);

  // Get sorted category order
  const sortedCategories = useMemo(() => {
    return Object.keys(groupedTools).sort((a, b) => {
      const orderA = categoryMeta[a]?.order || 99;
      const orderB = categoryMeta[b]?.order || 99;
      return orderA - orderB;
    });
  }, [groupedTools]);

  const handleSort = (columnId: string) => {
    setSortState(prev => {
      if (prev.column !== columnId) return { column: columnId, direction: 'asc' };
      if (prev.direction === 'asc') return { column: columnId, direction: 'desc' };
      if (prev.direction === 'desc') return { column: columnId, direction: null };
      return { column: columnId, direction: 'asc' };
    });
  };

  const toggleGroup = useCallback((type: string) => {
    setExpandedGroups(prev => ({ ...prev, [type]: !prev[type] }));
  }, []);

  const toggleRowSelection = useCallback((id: string) => {
    const next = new Set(selectedRows);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRows(next);
  }, [selectedRows, setSelectedRows]);

  const toggleGroupSelection = useCallback((type: string) => {
    const groupTools = groupedTools[type] || [];
    const allSelected = groupTools.every(t => selectedRows.has(t.id));
    const next = new Set(selectedRows);
    groupTools.forEach(t => {
      if (allSelected) {
        next.delete(t.id);
      } else {
        next.add(t.id);
      }
    });
    setSelectedRows(next);
  }, [groupedTools, selectedRows, setSelectedRows]);

  const selectAll = useCallback(() => {
    setSelectedRows(new Set(sortedTools.map(t => t.id)));
  }, [sortedTools, setSelectedRows]);

  const deselectAll = useCallback(() => {
    setSelectedRows(new Set());
  }, [setSelectedRows]);

  const handleTogglePin = async (tool: Tool, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiMutations.updateTool(tool.id, { isPinned: !tool.isPinned });
      toast({
        title: tool.isPinned ? "Unpinned" : "Pinned",
        description: `${tool.name} ${tool.isPinned ? 'removed from' : 'added to'} favorites.`,
      });
    } catch {
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
      } catch {
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
  const isAllSelected = sortedTools.length > 0 && sortedTools.every(t => selectedRows.has(t.id));

  let globalRowNumber = 0;

  return (
    <div className={cn("flex flex-col h-full bg-[#1e2433]", className)}>
      {/* Header */}
      <div
        className={cn(
          "grid items-center gap-0 px-2 h-[26px] min-h-[26px]",
          "bg-[#252b3b] border-b border-slate-700/50",
          "text-[9px] font-semibold tracking-wider text-slate-500"
        )}
        style={{ gridTemplateColumns }}
      >
        {columns.map(col => (
          <div
            key={col.id}
            className={cn(
              "flex items-center gap-0.5 truncate px-1",
              col.align === 'center' && "justify-center",
              col.align === 'right' && "justify-end",
              col.sortable && "cursor-pointer hover:text-slate-700 dark:hover:text-slate-200"
            )}
            onClick={() => col.sortable && handleSort(col.id)}
          >
            {col.id === 'checkbox' ? (
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={() => isAllSelected ? deselectAll() : selectAll()}
                className="h-3 w-3"
              />
            ) : (
              <>
                {col.label}
                {col.sortable && (
                  <span className="w-2.5 h-2.5 flex items-center justify-center">
                    {sortState.column === col.id && sortState.direction === 'asc' && (
                      <ArrowUp className="w-2 h-2" />
                    )}
                    {sortState.column === col.id && sortState.direction === 'desc' && (
                      <ArrowDown className="w-2 h-2" />
                    )}
                    {(sortState.column !== col.id || !sortState.direction) && (
                      <ArrowUpDown className="w-2 h-2 opacity-30" />
                    )}
                  </span>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Body with Groups */}
      <div className="flex-1 overflow-auto thin-scrollbar">
        {sortedCategories.map(type => {
          const categoryTools = groupedTools[type] || [];
          const meta = categoryMeta[type] || { icon: '📁', color: '#f1f5f9', order: 99 };
          const isExpanded = expandedGroups[type] ?? true;
          const groupSelected = categoryTools.filter(t => selectedRows.has(t.id)).length;
          const isGroupFullySelected = groupSelected === categoryTools.length && categoryTools.length > 0;
          const isGroupPartiallySelected = groupSelected > 0 && groupSelected < categoryTools.length;

          return (
            <div key={type} className="border-b border-slate-700/30">
              {/* Group Header */}
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2 h-[24px]",
                  "bg-[#252b3b] cursor-pointer hover:bg-[#2a3142]",
                  "border-b border-slate-700/50 group"
                )}
                onClick={() => toggleGroup(type)}
              >
                <span className="text-[8px] text-slate-400 w-3">
                  {isExpanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
                </span>
                <Checkbox
                  checked={isGroupFullySelected}
                  ref={(el) => {
                    if (el) (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = isGroupPartiallySelected;
                  }}
                  onCheckedChange={() => toggleGroupSelection(type)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-3 w-3"
                />
                <span
                  className="w-4 h-4 flex items-center justify-center rounded text-[10px]"
                  style={{ backgroundColor: meta.color }}
                >
                  {meta.icon}
                </span>
                <span className="text-[10px] font-semibold text-slate-300">
                  {type}
                </span>
                <span className="text-[9px] text-slate-400">({categoryTools.length})</span>
                <div className="flex-1" />
                <button
                  className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <Settings className="w-3 h-3" />
                </button>
              </div>

              {/* Group Rows */}
              {isExpanded && categoryTools.map((tool, localIndex) => {
                globalRowNumber++;
                const rowNum = globalRowNumber;
                const isSelected = (selectedToolId || state.selectedToolId) === tool.id;
                const isRowChecked = selectedRows.has(tool.id);
                const isHovered = hoveredRow === tool.id;
                const typeColor = getTypeColor(tool.type);
                const owner = getOwner(tool);
                const access = getAccessIcon(tool);
                const statusDisplay = getStatusDisplay(tool.status);
                const AccessIcon = access.icon;

                return (
                  <div
                    key={tool.id}
                    className={cn(
                      "grid items-center gap-0 px-2 h-[22px] min-h-[22px] group",
                      "border-b border-slate-700/30",
                      "cursor-pointer transition-colors",
                      isSelected
                        ? "bg-cyan-500/20 border-l-2 border-l-cyan-400"
                        : isRowChecked
                          ? "bg-cyan-500/10"
                          : "hover:bg-white/5 border-l-2 border-l-transparent",
                      localIndex % 2 === 1 && !isSelected && !isRowChecked && "bg-white/[0.02]"
                    )}
                    style={{ gridTemplateColumns }}
                    onClick={() => handleSelectRow(tool.id)}
                    onMouseEnter={() => setHoveredRow(tool.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    {/* Row Number */}
                    <div className="flex justify-center items-center px-1">
                      <span className="text-[9px] text-slate-400 font-mono">{rowNum}</span>
                    </div>

                    {/* Checkbox */}
                    <div className="flex justify-center items-center">
                      <Checkbox
                        checked={isRowChecked}
                        onCheckedChange={() => toggleRowSelection(tool.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-3 w-3"
                      />
                    </div>

                    {/* Icon */}
                    <div className="flex justify-center items-center">
                      <button
                        className={cn(
                          "w-5 h-5 flex items-center justify-center rounded text-[9px] font-bold",
                          tool.isPinned ? "text-yellow-500" : ""
                        )}
                        style={{ backgroundColor: typeColor.bg, color: typeColor.text }}
                        onClick={(e) => handleTogglePin(tool, e)}
                      >
                        {tool.isPinned ? (
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        ) : (
                          tool.icon || tool.name.substring(0, 2)
                        )}
                      </button>
                    </div>

                    {/* Name */}
                    <div className="flex items-center gap-1 min-w-0 px-1">
                      <span className="text-[10px] font-medium text-slate-200 truncate">
                        {tool.name}
                      </span>
                      {isHovered && (
                        <a
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 text-slate-400 hover:text-cyan-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    {/* Type badge */}
                    <div className="flex items-center px-1">
                      <span
                        className="text-[8px] font-semibold px-1.5 py-0.5 rounded truncate uppercase"
                        style={{ backgroundColor: typeColor.bg, color: typeColor.text }}
                      >
                        {tool.type}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-1 px-1">
                      <span className="text-[9px]" style={{ color: statusDisplay.color }}>
                        {statusDisplay.icon}
                      </span>
                      <span className="text-[9px] text-slate-500 truncate">
                        {statusDisplay.label}
                      </span>
                    </div>

                    {/* Description */}
                    <div className="flex items-center min-w-0 px-1">
                      <span className="text-[9px] text-slate-400 truncate">
                        {tool.summary}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-0.5 overflow-hidden px-1">
                      {tool.tags?.slice(0, 2).map(tag => {
                        const tagColor = getTagColor(tag);
                        return (
                          <span
                            key={tag}
                            className="text-[7px] font-medium px-1 py-0.5 rounded truncate"
                            style={{ backgroundColor: tagColor.bg, color: tagColor.text }}
                          >
                            {tag}
                          </span>
                        );
                      })}
                      {tool.tags && tool.tags.length > 2 && (
                        <span className="text-[7px] text-slate-400">+{tool.tags.length - 2}</span>
                      )}
                    </div>

                    {/* Source */}
                    <div className="flex items-center gap-1 px-1">
                      <span className="text-[8px]">🔗</span>
                      <span className="text-[9px] text-slate-500 truncate">{getSourceDomain(tool.url)}</span>
                    </div>

                    {/* Rating (stars) */}
                    <div className="flex justify-center items-center">
                      <span className="text-[8px] text-yellow-500 tracking-[-1px]">
                        {'★'.repeat(Math.min(5, Math.ceil((tool.usage || 50) / 20)))}
                        {'☆'.repeat(5 - Math.min(5, Math.ceil((tool.usage || 50) / 20)))}
                      </span>
                    </div>

                    {/* Access */}
                    <div className="flex justify-center items-center">
                      <AccessIcon className="w-3 h-3" style={{ color: access.color }} />
                    </div>

                    {/* Owner */}
                    <div className="flex justify-center items-center">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-semibold text-white"
                        style={{ backgroundColor: owner.color }}
                        title={owner.name}
                      >
                        {owner.initials}
                      </div>
                    </div>

                    {/* Modified */}
                    <div className="flex justify-center items-center">
                      <span className="text-[9px] text-slate-400">{formatModified(tool.createdAt)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-center items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-4 w-4 text-slate-400 hover:text-slate-600",
                              "opacity-0 group-hover:opacity-100 transition-opacity"
                            )}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); handleTogglePin(tool, e as unknown as React.MouseEvent); }}
                            className="text-[10px]"
                          >
                            <Pin className="w-3 h-3 mr-2" />
                            {tool.isPinned ? 'Unpin' : 'Pin'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleCopyUrl(tool, e as unknown as React.MouseEvent)}
                            className="text-[10px]"
                          >
                            <Copy className="w-3 h-3 mr-2" />
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-[10px]">
                            <Edit className="w-3 h-3 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => handleDelete(tool, e as unknown as React.MouseEvent)}
                            className="text-[10px] text-red-600 focus:text-red-600"
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
            </div>
          );
        })}

        {/* Empty state */}
        {sortedTools.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-400">
            <p className="text-sm">No tools found</p>
            {state.searchQuery && (
              <p className="text-xs mt-1">Try adjusting your search or filter terms</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Export selection count for use in other components
export function useDataGridSelection() {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  return { selectedRows, setSelectedRows, selectedCount: selectedRows.size };
}
