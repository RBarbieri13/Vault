import React, { useMemo, useState, useCallback } from 'react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Tool, getTypeColor, getTagColor, SortField, GroupBy } from '@/lib/data';
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
  GripVertical,
  Tag,
  Plus,
  X,
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
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  useSortable,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

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

// Format modified time - clearer format
const formatModified = (date: Date | number | string): string => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours} hr`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} wk`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} mo`;
  return `${Math.floor(diffDays / 365)} yr`;
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
  { id: 'modified', label: 'Modified', width: '52px', align: 'center' },
  { id: 'actions', label: '', width: '28px', align: 'center' },
];


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

// Custom label colors for visual distinction
const labelColors = [
  { bg: '#3b82f6', text: '#ffffff' }, // blue
  { bg: '#10b981', text: '#ffffff' }, // green
  { bg: '#f59e0b', text: '#000000' }, // amber
  { bg: '#ef4444', text: '#ffffff' }, // red
  { bg: '#8b5cf6', text: '#ffffff' }, // violet
  { bg: '#ec4899', text: '#ffffff' }, // pink
  { bg: '#06b6d4', text: '#000000' }, // cyan
  { bg: '#84cc16', text: '#000000' }, // lime
];

const getLabelColor = (label: string) => {
  const hash = label.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return labelColors[hash % labelColors.length];
};

// Droppable category header component
interface DroppableCategoryProps {
  type: string;
  isOver: boolean;
  children: React.ReactNode;
}

function DroppableCategory({ type, isOver, children }: DroppableCategoryProps) {
  const { setNodeRef } = useDroppable({
    id: `category-${type}`,
    data: { type: 'category', categoryType: type },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-all duration-200",
        isOver && "ring-2 ring-blue-500 ring-inset bg-blue-500/10"
      )}
    >
      {children}
    </div>
  );
}

// Draggable row component
interface DraggableRowProps {
  tool: Tool;
  rowNum: number;
  isSelected: boolean;
  isRowChecked: boolean;
  isHovered: boolean;
  gridTemplateColumns: string;
  onSelect: () => void;
  onHover: (id: string | null) => void;
  onTogglePin: (tool: Tool, e: React.MouseEvent) => void;
  onCopyUrl: (tool: Tool, e: React.MouseEvent) => void;
  onDelete: (tool: Tool, e: React.MouseEvent) => void;
  onToggleRowSelection: () => void;
  onOpenLabelDialog: (tool: Tool) => void;
  localIndex: number;
}

function DraggableRow({
  tool,
  rowNum,
  isSelected,
  isRowChecked,
  isHovered,
  gridTemplateColumns,
  onSelect,
  onHover,
  onTogglePin,
  onCopyUrl,
  onDelete,
  onToggleRowSelection,
  onOpenLabelDialog,
  localIndex,
}: DraggableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: tool.id,
    data: { type: 'tool', tool },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeColor = getTypeColor(tool.type);
  const owner = getOwner(tool);
  const access = getAccessIcon(tool);
  const statusDisplay = getStatusDisplay(tool.status);
  const AccessIcon = access.icon;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, gridTemplateColumns }}
      className={cn(
        "grid items-center gap-0 px-2 h-[24px] min-h-[24px] group",
        "border-b border-slate-700/20",
        "cursor-pointer transition-all duration-100",
        isDragging && "opacity-50 bg-blue-500/20 z-50 shadow-lg",
        isSelected
          ? "bg-gradient-to-r from-blue-500/15 via-blue-500/8 to-transparent border-l-[3px] border-l-blue-500"
          : isRowChecked
            ? "bg-blue-500/8 border-l-[3px] border-l-blue-400/60"
            : "hover:bg-white/[0.04] border-l-[3px] border-l-transparent",
        localIndex % 2 === 1 && !isSelected && !isRowChecked && "bg-white/[0.015]"
      )}
      onClick={onSelect}
      onMouseEnter={() => onHover(tool.id)}
      onMouseLeave={() => onHover(null)}
      {...attributes}
    >
      {/* Drag Handle + Row Number */}
      <div className="flex justify-center items-center px-1 gap-0.5">
        <span
          {...listeners}
          className={cn(
            "cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 transition-colors",
            "opacity-0 group-hover:opacity-100"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3 h-3" />
        </span>
        <span className="text-[9px] text-slate-400 font-mono">{rowNum}</span>
      </div>

      {/* Checkbox */}
      <div className="flex justify-center items-center">
        <Checkbox
          checked={isRowChecked}
          onCheckedChange={onToggleRowSelection}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "h-3.5 w-3.5 border-slate-500 transition-all",
            "hover:border-slate-400 hover:bg-white/5",
            "data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
          )}
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
          onClick={(e) => onTogglePin(tool, e)}
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
          className="text-[8px] font-semibold px-1.5 py-0.5 rounded truncate uppercase border"
          style={{
            backgroundColor: `${typeColor.bg}50`,
            color: typeColor.text,
            borderColor: `${typeColor.text}30`
          }}
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

      {/* Tags + Custom Labels */}
      <div className="flex items-center gap-0.5 overflow-hidden px-1 group/tags">
        {/* Custom Labels first */}
        {tool.customLabels?.slice(0, 1).map(label => {
          const labelColor = getLabelColor(label);
          return (
            <span
              key={`label-${label}`}
              className="text-[7px] font-medium px-1.5 py-0.5 rounded truncate flex items-center gap-0.5"
              style={{
                backgroundColor: labelColor.bg,
                color: labelColor.text,
              }}
            >
              <Tag className="w-2 h-2" />
              {label}
            </span>
          );
        })}
        {/* Regular Tags */}
        {tool.tags?.slice(0, tool.customLabels?.length ? 1 : 2).map(tag => {
          const tagColor = getTagColor(tag);
          return (
            <span
              key={tag}
              className="text-[7px] font-medium px-1.5 py-0.5 rounded truncate border"
              style={{
                backgroundColor: `${tagColor.bg}60`,
                color: tagColor.text,
                borderColor: `${tagColor.text}25`
              }}
            >
              {tag}
            </span>
          );
        })}
        {((tool.tags?.length || 0) + (tool.customLabels?.length || 0)) > 2 && (
          <span
            className="text-[7px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded cursor-pointer hover:bg-white/10 hover:text-slate-300 transition-colors"
            title={[...(tool.customLabels || []), ...(tool.tags || [])].slice(2).join(', ')}
          >
            +{(tool.tags?.length || 0) + (tool.customLabels?.length || 0) - 2}
          </span>
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
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onOpenLabelDialog(tool); }}
              className="text-[10px]"
            >
              <Tag className="w-3 h-3 mr-2" />
              Add Label
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onTogglePin(tool, e as unknown as React.MouseEvent); }}
              className="text-[10px]"
            >
              <Pin className="w-3 h-3 mr-2" />
              {tool.isPinned ? 'Unpin' : 'Pin'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => onCopyUrl(tool, e as unknown as React.MouseEvent)}
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
              onClick={(e) => onDelete(tool, e as unknown as React.MouseEvent)}
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
}

export function DataGrid({
  tools: propTools,
  onSelectTool,
  selectedToolId,
  className,
  selectedRows: externalSelectedRows,
  onSelectionChange,
}: DataGridProps) {
  const { state, dispatch, apiMutations } = useApp();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [labelDialogTool, setLabelDialogTool] = useState<Tool | null>(null);
  const [newLabel, setNewLabel] = useState('');
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
    // Status groups
    active: true,
    beta: true,
    deprecated: true,
    inactive: true,
    // Category groups
    chatbots: true,
    image: true,
    video: true,
    audio: true,
    development: true,
    automation: true,
    writing: true,
    research: true,
  });
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string>>(new Set());

  // Use external selection if provided, otherwise use internal
  const selectedRows = externalSelectedRows || internalSelectedRows;
  const setSelectedRows = onSelectionChange || setInternalSelectedRows;

  // Use provided tools or fall back to state
  const allTools = propTools || Object.values(state.tools);
  
  // Get sort and group settings from global state
  const { sortField, sortDirection, groupBy, visibleColumns } = state;

  // Filter tools based on search query and filters
  const filteredTools = useMemo(() => {
    let tools = allTools;

    // Enhanced multi-token search across multiple fields
    if (state.searchQuery.trim()) {
      const tokens = state.searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);
      
      tools = tools.filter(tool => {
        // Build searchable text from all relevant fields
        const searchableFields: string[] = [
          tool.name,
          tool.type,
          tool.summary,
          tool.url,
          tool.whatItIs,
          tool.capabilities,
          tool.bestFor,
          tool.notes,
          tool.status,
          tool.categoryId,
          ...(tool.tags || []),
        ].filter((f): f is string => typeof f === 'string' && f.length > 0);
        
        const searchableText = searchableFields.map(f => f.toLowerCase()).join(' ');
        
        // All tokens must match somewhere in the searchable text
        return tokens.every(token => searchableText.includes(token));
      });
    }
    
    // Filter for pinned tools if activeFilter is 'pinned'
    if (state.activeFilter === 'pinned') {
      tools = tools.filter(t => t.isPinned);
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
  }, [allTools, state.searchQuery, state.typeFilter, state.statusFilter, state.tagFilters, state.dateFilter, state.activeFilter]);

  // Sort tools using global state
  const sortedTools = useMemo(() => {
    return [...filteredTools].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'rating':
          comparison = (a.usage || 0) - (b.usage || 0);
          break;
        case 'usage':
          comparison = (a.usage || 0) - (b.usage || 0);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [filteredTools, sortField, sortDirection]);

  // Group tools based on global groupBy state
  const groupedTools = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Tools': sortedTools };
    }
    
    const groups: Record<string, Tool[]> = {};
    sortedTools.forEach(tool => {
      let groupKey: string;
      switch (groupBy) {
        case 'type':
          groupKey = tool.type || 'OTHER';
          break;
        case 'status':
          groupKey = tool.status || 'unknown';
          break;
        case 'category':
          groupKey = tool.categoryId || 'uncategorized';
          break;
        default:
          groupKey = tool.type || 'OTHER';
      }
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(tool);
    });
    return groups;
  }, [sortedTools, groupBy]);

  // Get sorted category order
  const sortedCategories = useMemo(() => {
    return Object.keys(groupedTools).sort((a, b) => {
      const orderA = categoryMeta[a]?.order || 99;
      const orderB = categoryMeta[b]?.order || 99;
      return orderA - orderB;
    });
  }, [groupedTools]);

  const handleSort = (columnId: string) => {
    // Map column IDs to sort fields
    const columnToSortField: Record<string, SortField> = {
      name: 'name',
      type: 'type',
      status: 'status',
      date: 'date',
      rating: 'rating',
      modified: 'date',
    };
    
    const newSortField = columnToSortField[columnId];
    if (!newSortField) return;
    
    // Toggle direction if same field, otherwise start with asc
    const newDirection = sortField === newSortField && sortDirection === 'asc' ? 'desc' : 'asc';
    dispatch({ type: 'SET_SORT', payload: { field: newSortField, direction: newDirection } });
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

  // Drag and drop handlers
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      setOverId(over.id as string);
    } else {
      setOverId(null);
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // If dropping on a category
    if (overData?.type === 'category' && activeData?.type === 'tool') {
      const tool = activeData.tool as Tool;
      const targetType = overData.categoryType as string;

      // Only update if the type is different
      if (tool.type !== targetType) {
        try {
          await apiMutations.updateTool(tool.id, { type: targetType });
          toast({
            title: "Tool Moved",
            description: `${tool.name} moved to ${targetType} category.`,
          });
        } catch {
          toast({ variant: "destructive", title: "Error", description: "Failed to move tool." });
        }
      }
    }
  }, [apiMutations]);

  // Custom label handlers
  const handleOpenLabelDialog = useCallback((tool: Tool) => {
    setLabelDialogTool(tool);
    setNewLabel('');
    setLabelDialogOpen(true);
  }, []);

  const handleAddLabel = useCallback(async () => {
    if (!labelDialogTool || !newLabel.trim()) return;

    const currentLabels = labelDialogTool.customLabels || [];
    if (currentLabels.includes(newLabel.trim())) {
      toast({ variant: "destructive", title: "Duplicate", description: "This label already exists." });
      return;
    }

    try {
      await apiMutations.updateTool(labelDialogTool.id, {
        customLabels: [...currentLabels, newLabel.trim()]
      });
      toast({
        title: "Label Added",
        description: `Label "${newLabel.trim()}" added to ${labelDialogTool.name}.`,
      });
      setNewLabel('');
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to add label." });
    }
  }, [labelDialogTool, newLabel, apiMutations]);

  const handleRemoveLabel = useCallback(async (label: string) => {
    if (!labelDialogTool) return;

    const currentLabels = labelDialogTool.customLabels || [];
    try {
      await apiMutations.updateTool(labelDialogTool.id, {
        customLabels: currentLabels.filter(l => l !== label)
      });
      toast({
        title: "Label Removed",
        description: `Label "${label}" removed from ${labelDialogTool.name}.`,
      });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove label." });
    }
  }, [labelDialogTool, apiMutations]);

  const gridTemplateColumns = columns.map(c => c.width).join(' ');
  const isAllSelected = sortedTools.length > 0 && sortedTools.every(t => selectedRows.has(t.id));

  // Get active tool for drag overlay
  const activeTool = activeId ? state.tools[activeId] : null;

  let globalRowNumber = 0;

  return (
    <>
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
    <div className={cn("flex flex-col h-full bg-[#1e2433]", className)}>
      {/* Header */}
      <div
        className={cn(
          "grid items-center gap-0 px-2 h-[28px] min-h-[28px]",
          "bg-[#252b3b] border-b border-slate-700/50",
          "text-[9px] font-semibold uppercase tracking-[0.04em] text-slate-400"
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
              col.sortable && "cursor-pointer hover:text-slate-200 transition-colors"
            )}
            onClick={() => col.sortable && handleSort(col.id)}
          >
            {col.id === 'checkbox' ? (
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={() => isAllSelected ? deselectAll() : selectAll()}
                className="h-3.5 w-3.5 border-slate-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
              />
            ) : (
              <>
                {col.label}
                {col.sortable && (
                  <span className="w-3 h-3 flex items-center justify-center ml-0.5">
                    {sortField === col.id && sortDirection === 'asc' && (
                      <ArrowUp className="w-2.5 h-2.5 text-blue-400" />
                    )}
                    {sortField === col.id && sortDirection === 'desc' && (
                      <ArrowDown className="w-2.5 h-2.5 text-blue-400" />
                    )}
                    {sortField !== col.id && (
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-30" />
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

          const isDropTarget = overId === `category-${type}`;

          return (
            <div key={type} className="border-b border-slate-700/30">
              {/* Group Header - Droppable */}
              <DroppableCategory type={type} isOver={isDropTarget}>
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 h-[28px]",
                    "bg-gradient-to-r from-slate-800/80 to-slate-800/40",
                    "cursor-pointer hover:from-slate-700/80 hover:to-slate-700/40",
                    "border-b border-slate-700/50 border-l-2",
                    isDropTarget ? "border-l-blue-500 from-blue-500/20" : "border-l-slate-600",
                    "transition-all duration-150 group"
                  )}
                  onClick={() => toggleGroup(type)}
                >
                  <span className={cn(
                    "text-slate-400 transition-transform duration-150",
                    isExpanded && "text-slate-300"
                  )}>
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </span>
                  <Checkbox
                    checked={isGroupFullySelected}
                    ref={(el) => {
                      if (el) (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = isGroupPartiallySelected;
                    }}
                    onCheckedChange={() => toggleGroupSelection(type)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-3.5 w-3.5 border-slate-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  />
                  <span
                    className="w-5 h-5 flex items-center justify-center rounded text-[11px] shadow-sm"
                    style={{ backgroundColor: meta.color }}
                  >
                    {meta.icon}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-200">
                    {type}
                  </span>
                  <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded-full">
                    {categoryTools.length}
                  </span>
                  {isDropTarget && (
                    <span className="text-[9px] text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded animate-pulse">
                      Drop here
                    </span>
                  )}
                  <div className="flex-1" />
                  <button
                    className="text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              </DroppableCategory>

              {/* Group Rows - Sortable */}
              {isExpanded && (
                <SortableContext items={categoryTools.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {categoryTools.map((tool, localIndex) => {
                    globalRowNumber++;
                    const rowNum = globalRowNumber;
                    const isSelected = (selectedToolId || state.selectedToolId) === tool.id;
                    const isRowChecked = selectedRows.has(tool.id);
                    const isHovered = hoveredRow === tool.id;

                    return (
                      <DraggableRow
                        key={tool.id}
                        tool={tool}
                        rowNum={rowNum}
                        isSelected={isSelected}
                        isRowChecked={isRowChecked}
                        isHovered={isHovered}
                        gridTemplateColumns={gridTemplateColumns}
                        onSelect={() => handleSelectRow(tool.id)}
                        onHover={setHoveredRow}
                        onTogglePin={handleTogglePin}
                        onCopyUrl={handleCopyUrl}
                        onDelete={handleDelete}
                        onToggleRowSelection={() => toggleRowSelection(tool.id)}
                        onOpenLabelDialog={handleOpenLabelDialog}
                        localIndex={localIndex}
                      />
                    );
                  })}
                </SortableContext>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {sortedTools.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] py-12">
            <div className="text-5xl mb-4 opacity-50">🔍</div>
            <p className="text-sm font-medium text-slate-300">No tools found</p>
            {state.searchQuery ? (
              <p className="text-xs text-slate-500 mt-2 text-center max-w-[280px]">
                Try adjusting your search or filter terms to find what you're looking for
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-2 text-center max-w-[280px]">
                Add your first AI tool to get started
              </p>
            )}
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTool && (
          <div
            className="flex items-center gap-2 px-3 py-2 bg-slate-800/95 rounded-lg border border-blue-500/50 shadow-xl"
            style={{ width: '280px' }}
          >
            <span
              className="w-5 h-5 flex items-center justify-center rounded text-[9px] font-bold"
              style={{ backgroundColor: getTypeColor(activeTool.type).bg, color: getTypeColor(activeTool.type).text }}
            >
              {activeTool.icon || activeTool.name.substring(0, 2)}
            </span>
            <span className="text-[11px] font-medium text-white truncate">
              {activeTool.name}
            </span>
            <span
              className="text-[8px] font-semibold px-1.5 py-0.5 rounded uppercase ml-auto"
              style={{
                backgroundColor: `${getTypeColor(activeTool.type).bg}50`,
                color: getTypeColor(activeTool.type).text,
              }}
            >
              {activeTool.type}
            </span>
          </div>
        )}
      </DragOverlay>
    </div>
    </DndContext>

    {/* Custom Label Dialog */}
    <Dialog open={labelDialogOpen} onOpenChange={setLabelDialogOpen}>
      <DialogContent className="sm:max-w-[400px] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-100 flex items-center gap-2">
            <Tag className="w-4 h-4 text-purple-400" />
            Manage Labels
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {labelDialogTool && (
            <>
              <p className="text-[11px] text-slate-400">
                Add custom labels to <span className="text-white font-medium">{labelDialogTool.name}</span>
              </p>

              {/* Current Labels */}
              {labelDialogTool.customLabels && labelDialogTool.customLabels.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {labelDialogTool.customLabels.map(label => {
                    const labelColor = getLabelColor(label);
                    return (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded group"
                        style={{ backgroundColor: labelColor.bg, color: labelColor.text }}
                      >
                        {label}
                        <button
                          onClick={() => handleRemoveLabel(label)}
                          className="opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Add New Label */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter label name..."
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                  className="flex-1 h-8 text-[11px] bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                />
                <Button
                  size="sm"
                  onClick={handleAddLabel}
                  disabled={!newLabel.trim()}
                  className="h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLabelDialogOpen(false)}
            className="text-[10px] border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

// Export selection count for use in other components
export function useDataGridSelection() {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  return { selectedRows, setSelectedRows, selectedCount: selectedRows.size };
}
