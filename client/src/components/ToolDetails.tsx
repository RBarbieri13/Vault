import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { Tool, getTypeColor, getTagColor, statusColors } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Sparkline, UsageBar } from './Sparkline';
import {
  ExternalLink, Edit2, Trash2, Calendar, Hash, Star, Copy, X,
  TrendingUp, Activity, ChevronRight, Globe, Users, Link2
} from 'lucide-react';
import { ToolModal } from './ToolModal';
import { toast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ToolDetailsProps {
  tool?: Tool | null;
  onClose?: () => void;
}

// Get owner info based on tool
const getOwner = (tool: Tool) => {
  const hash = tool.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const names = ['Jason D.', 'Alice S.', 'Mike K.', 'Sarah L.', 'Tom B.', 'Emma W.'];
  return names[hash % names.length];
};

// Get access label
const getAccessLabel = (tool: Tool) => {
  if (tool.isPinned) return 'Public';
  if (tool.tags?.includes('Ent') || tool.tags?.includes('Int')) return 'Team';
  return 'Public';
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

// Get source domain from URL
const getSourceDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
};

// Format date
const formatDate = (date: Date | number | string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format relative time
const formatRelativeTime = (date: Date | number | string): string => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'just now';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

export function ToolDetails({ tool: propTool, onClose }: ToolDetailsProps) {
  const { state, apiMutations } = useApp();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const selectedTool = propTool || (state.selectedToolId ? state.tools[state.selectedToolId] : null);

  if (!selectedTool) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mb-4">
          <Hash className="w-6 h-6 text-slate-500" />
        </div>
        <h3 className="text-sm font-medium text-slate-300 mb-1">No tool selected</h3>
        <p className="text-[11px] text-slate-500 max-w-[180px] leading-relaxed">
          Select a tool from the list to view its details
        </p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm(`Delete "${selectedTool.name}"?`)) {
      try {
        await apiMutations.deleteTool(selectedTool.id);
        toast({ title: 'Deleted', description: `${selectedTool.name} has been removed.` });
        onClose?.();
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete tool." });
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(selectedTool.url);
    toast({ title: 'Copied', description: 'URL copied to clipboard.' });
  };

  const handleTogglePin = async () => {
    try {
      await apiMutations.updateTool(selectedTool.id, { isPinned: !selectedTool.isPinned });
      toast({
        title: selectedTool.isPinned ? 'Unpinned' : 'Pinned',
        description: `${selectedTool.name} ${selectedTool.isPinned ? 'removed from' : 'added to'} favorites.`,
      });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update tool." });
    }
  };

  const typeColor = getTypeColor(selectedTool.type);
  const statusDisplay = getStatusDisplay(selectedTool.status);
  const statusColor = statusColors[selectedTool.status] || { bg: '#f1f5f9', text: '#475569' };

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col overflow-hidden bg-[#1e2433]">
        {/* Header - Enhanced with gradient background */}
        <div className="flex items-start justify-between p-3 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/60 to-transparent">
          <h2 className="text-sm font-semibold text-white truncate flex items-center gap-2">
            {selectedTool.icon && <span className="text-base">{selectedTool.icon}</span>}
            <span className="truncate">{selectedTool.name}</span>
          </h2>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Content - Compact Field List */}
        <div className="flex-1 overflow-auto thin-scrollbar p-3">
          <div className="space-y-2.5">
            {/* Type & Status Row */}
            <div className="flex items-center gap-2">
              <span
                className="text-[9px] font-semibold px-2 py-0.5 rounded uppercase border"
                style={{
                  backgroundColor: `${typeColor.bg}50`,
                  color: typeColor.text,
                  borderColor: `${typeColor.text}30`
                }}
              >
                {selectedTool.type}
              </span>
              <span
                className="text-[9px] font-medium px-2 py-0.5 rounded flex items-center gap-1 border"
                style={{
                  backgroundColor: `${statusColor.bg}40`,
                  color: statusColor.text,
                  borderColor: `${statusColor.text}30`
                }}
              >
                <span className="text-[8px]">{statusDisplay.icon}</span>
                {statusDisplay.label}
              </span>
            </div>

            {/* Description - with better visual separation */}
            <div className="pt-2">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.05em] block mb-1.5">Description</span>
              <p className="text-[11px] text-slate-200 leading-relaxed">
                {selectedTool.whatItIs || selectedTool.summary}
              </p>
            </div>

            {/* Tags - with styled chips */}
            <div>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.05em] block mb-1.5">Tags</span>
              <div className="flex flex-wrap gap-1">
                {selectedTool.tags?.length ? (
                  selectedTool.tags.map((tag, idx) => {
                    const tagColor = getTagColor(tag);
                    return (
                      <span
                        key={idx}
                        className="text-[9px] px-1.5 py-0.5 rounded border"
                        style={{
                          backgroundColor: `${tagColor.bg}40`,
                          color: tagColor.text,
                          borderColor: `${tagColor.text}30`
                        }}
                      >
                        {tag}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-[10px] text-slate-500 italic">No tags</span>
                )}
              </div>
            </div>

            {/* Metadata Section */}
            <div className="pt-2 mt-2 border-t border-slate-700/30 space-y-2">
              {/* Source */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Source</span>
                <a
                  href={selectedTool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-400 flex items-center gap-1 hover:text-blue-300 hover:underline transition-colors"
                >
                  <Link2 className="w-3 h-3" />
                  {getSourceDomain(selectedTool.url)}
                </a>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Rating</span>
                <span className="text-[11px] text-amber-400 tracking-tight">
                  {'★'.repeat(Math.min(5, Math.ceil((selectedTool.usage || 50) / 20)))}
                  <span className="text-slate-600">{'★'.repeat(5 - Math.min(5, Math.ceil((selectedTool.usage || 50) / 20)))}</span>
                </span>
              </div>

              {/* Access */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Access</span>
                <span className="text-[10px] text-slate-200 flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-emerald-400" />
                  {getAccessLabel(selectedTool)}
                </span>
              </div>

              {/* Owner */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Owner</span>
                <span className="text-[10px] text-slate-200 flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-slate-400" />
                  {getOwner(selectedTool)}
                </span>
              </div>

              {/* Date Added */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Added</span>
                <span className="text-[10px] text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {formatDate(selectedTool.createdAt)}
                </span>
              </div>

              {/* Last Modified */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Modified</span>
                <span className="text-[10px] text-slate-300">
                  {formatRelativeTime(selectedTool.createdAt)}
                </span>
              </div>
            </div>

            {/* Trend & Usage - Enhanced card styling */}
            <div className="pt-3 mt-1 border-t border-slate-700/30">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-md bg-slate-800/60 border border-slate-700/40">
                  <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    Trend
                  </div>
                  <Sparkline
                    data={selectedTool.trend || [5, 5, 5, 5, 5, 5, 5]}
                    width={60}
                    height={18}
                    strokeWidth={1.5}
                  />
                </div>
                <div className="p-2.5 rounded-md bg-slate-800/60 border border-slate-700/40">
                  <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-blue-400" />
                    Usage
                  </div>
                  <div className="flex items-center gap-2">
                    <UsageBar value={selectedTool.usage || 50} width={45} height={5} />
                    <span className="text-[10px] font-semibold text-slate-200">
                      {selectedTool.usage || 50}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Enhanced styling */}
        <div className="flex items-center gap-2 p-3 border-t border-slate-700/50 bg-slate-900/30">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                onClick={handleCopyLink}
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px]">Copy URL</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 w-7 p-0 transition-colors",
                  selectedTool.isPinned
                    ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                    : "text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                )}
                onClick={handleTogglePin}
              >
                <Star className={cn("w-3.5 h-3.5", selectedTool.isPinned && "fill-current")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px]">{selectedTool.isPinned ? 'Unpin' : 'Pin'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={selectedTool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="h-7 w-7 p-0 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px]">Open URL</TooltipContent>
          </Tooltip>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-[10px] bg-transparent border-slate-600 text-slate-300 hover:bg-white/5 hover:text-white hover:border-slate-500 transition-colors"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit2 className="w-3 h-3 mr-1.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-[10px] bg-transparent border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 transition-colors"
            onClick={handleDelete}
          >
            <Trash2 className="w-3 h-3 mr-1.5" />
            Delete
          </Button>
        </div>

        <ToolModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          toolToEdit={selectedTool}
        />
      </div>
    </TooltipProvider>
  );
}
