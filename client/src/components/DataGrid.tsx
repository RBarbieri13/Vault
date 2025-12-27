import React, { useMemo, useState } from 'react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Tool, getTypeColor, getTagColor, getStatusColor } from '@/lib/data';
import {
  Star,
  MoreHorizontal,
  Edit,
  Trash,
  Copy,
  Pin,
  ChevronRight,
  ChevronDown,
  Check,
  Globe,
  Lock,
  Users,
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
import { Checkbox } from '@/components/ui/checkbox';

interface DataGridProps {
  tools?: Tool[];
  onSelectTool?: (id: string) => void;
  selectedToolId?: string | null;
  className?: string;
}

// Star rating component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-3 h-3",
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-600"
          )}
        />
      ))}
    </div>
  );
}

// User avatar component
function UserAvatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
  return (
    <div
      className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-semibold text-white"
      )}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

// Group header component
function GroupHeader({
  label,
  count,
  isExpanded,
  onToggle,
}: {
  label: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 cursor-pointer",
        "bg-[#252b3b] border-b border-slate-700/50",
        "hover:bg-[#2a3142]"
      )}
      onClick={onToggle}
    >
      <span className="w-4 h-4 flex items-center justify-center text-slate-400">
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
      </span>
      <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-[10px] text-slate-500">({count})</span>
    </div>
  );
}

export function DataGrid({
  tools: propTools,
  onSelectTool,
  selectedToolId,
  className,
}: DataGridProps) {
  const { state, dispatch, apiMutations } = useApp();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    CHATGPT: true,
    IMAGE: true,
    CODE: true,
  });

  // Use provided tools or fall back to state
  const allTools = propTools || Object.values(state.tools);

  // Filter tools
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

    return tools;
  }, [allTools, state.searchQuery, state.typeFilter, state.statusFilter, state.tagFilters]);

  // Group tools by type
  const groupedTools = useMemo(() => {
    const groups: Record<string, Tool[]> = {};
    filteredTools.forEach(tool => {
      const groupKey = tool.type;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(tool);
    });
    return groups;
  }, [filteredTools]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
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

  const handleCheckboxChange = (toolId: string, checked: boolean) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(toolId);
      } else {
        next.delete(toolId);
      }
      return next;
    });
  };

  // Mock data for additional fields
  const getSource = (tool: Tool) => {
    const domain = tool.url.replace(/^https?:\/\//, '').split('/')[0];
    return domain;
  };

  const getRating = (tool: Tool) => {
    return Math.floor((tool.usage || 50) / 20) + 1;
  };

  const getAccess = (tool: Tool) => {
    return tool.status === 'active' ? 'Public' : tool.status === 'beta' ? 'Team' : 'Private';
  };

  const getOwner = (tool: Tool) => {
    const owners = [
      { name: 'Jason D.', color: '#3b82f6' },
      { name: 'Mike K.', color: '#22c55e' },
      { name: 'Anna S.', color: '#f59e0b' },
    ];
    return owners[tool.name.length % owners.length];
  };

  let rowIndex = 0;

  return (
    <div className={cn("flex flex-col h-full bg-[#1e2433]", className)}>
      {/* Header */}
      <div
        className={cn(
          "grid items-center gap-1 px-2 h-[32px] min-h-[32px]",
          "bg-[#252b3b] border-b border-slate-700/50",
          "text-[10px] font-semibold uppercase tracking-wider text-slate-500"
        )}
        style={{ gridTemplateColumns: '24px 32px 28px 140px 70px 70px 1fr 100px 80px 80px 70px 60px 28px' }}
      >
        <div className="flex justify-center">
          <Checkbox className="w-3.5 h-3.5" />
        </div>
        <div className="text-center">#</div>
        <div></div>
        <div>Name</div>
        <div>Type</div>
        <div>Status</div>
        <div>Desc</div>
        <div>Tags</div>
        <div>Source</div>
        <div>Rating</div>
        <div>Access</div>
        <div>Owner</div>
        <div></div>
      </div>

      {/* Body with grouped rows */}
      <div className="flex-1 overflow-auto thin-scrollbar">
        {Object.entries(groupedTools).map(([group, tools]) => {
          const isExpanded = expandedGroups[group] !== false;

          return (
            <div key={group}>
              {/* Group Header */}
              <GroupHeader
                label={group}
                count={tools.length}
                isExpanded={isExpanded}
                onToggle={() => toggleGroup(group)}
              />

              {/* Group Rows */}
              {isExpanded && tools.map((tool) => {
                rowIndex++;
                const isSelected = (selectedToolId || state.selectedToolId) === tool.id;
                const isHovered = hoveredRow === tool.id;
                const isChecked = selectedRows.has(tool.id);
                const typeColor = getTypeColor(tool.type);
                const source = getSource(tool);
                const rating = getRating(tool);
                const access = getAccess(tool);
                const owner = getOwner(tool);

                return (
                  <div
                    key={tool.id}
                    className={cn(
                      "grid items-center gap-1 px-2 h-[32px] min-h-[32px]",
                      "border-b border-slate-700/30",
                      "cursor-pointer transition-colors",
                      isSelected
                        ? "bg-cyan-500/20 border-l-2 border-l-cyan-400"
                        : "hover:bg-white/5 border-l-2 border-l-transparent"
                    )}
                    style={{ gridTemplateColumns: '24px 32px 28px 140px 70px 70px 1fr 100px 80px 80px 70px 60px 28px' }}
                    onClick={() => handleSelectRow(tool.id)}
                    onMouseEnter={() => setHoveredRow(tool.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    {/* Checkbox */}
                    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => handleCheckboxChange(tool.id, checked as boolean)}
                        className="w-3.5 h-3.5"
                      />
                    </div>

                    {/* Row number */}
                    <div className="text-[10px] text-slate-500 text-center">
                      {rowIndex}
                    </div>

                    {/* Icon */}
                    <div className="flex justify-center items-center">
                      <button
                        className={cn(
                          "w-5 h-5 flex items-center justify-center rounded text-xs",
                          tool.isPinned
                            ? "text-yellow-400"
                            : "text-slate-500"
                        )}
                        onClick={(e) => handleTogglePin(tool, e)}
                      >
                        {tool.isPinned ? (
                          <Star className="w-3.5 h-3.5 fill-yellow-400" />
                        ) : (
                          <span className="text-[11px]">{tool.icon || '◎'}</span>
                        )}
                      </button>
                    </div>

                    {/* Name */}
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[11px] font-medium text-slate-200 truncate">
                        {tool.name}
                      </span>
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

                    {/* Status */}
                    <div className="flex items-center">
                      {tool.status === 'active' ? (
                        <span className="flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          <Check className="w-2.5 h-2.5" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-600/50 text-slate-400">
                          {tool.status}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <div className="flex items-center min-w-0">
                      <span className="text-[10px] text-slate-400 truncate">
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
                    </div>

                    {/* Source */}
                    <div className="flex items-center">
                      <span className="text-[10px] text-cyan-400 truncate">
                        {source}
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center">
                      <StarRating rating={rating} />
                    </div>

                    {/* Access */}
                    <div className="flex items-center gap-1">
                      {access === 'Public' ? (
                        <Globe className="w-3 h-3 text-slate-500" />
                      ) : access === 'Team' ? (
                        <Users className="w-3 h-3 text-slate-500" />
                      ) : (
                        <Lock className="w-3 h-3 text-slate-500" />
                      )}
                      <span className="text-[10px] text-slate-400">{access}</span>
                    </div>

                    {/* Owner */}
                    <div className="flex items-center">
                      <UserAvatar name={owner.name} color={owner.color} />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-5 w-5 text-slate-500 hover:text-slate-300",
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
                            className="text-xs text-red-400 focus:text-red-400"
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
        {filteredTools.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-500">
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
