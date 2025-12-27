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
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
          <Hash className="w-5 h-5 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">No tool selected</h3>
        <p className="text-xs mt-1 max-w-[200px]">Select a tool from the list to view details</p>
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
      <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between p-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
            {selectedTool.icon && <span>{selectedTool.icon}</span>}
            {selectedTool.name}
          </h2>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-400 hover:text-slate-600"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Content - Compact Field List */}
        <div className="flex-1 overflow-auto p-3">
          <div className="space-y-3">
            {/* Type */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Type</span>
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase"
                style={{ backgroundColor: typeColor.bg, color: typeColor.text }}
              >
                {selectedTool.type}
              </span>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Status</span>
              <span
                className="text-[9px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1"
                style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
              >
                <span>{statusDisplay.icon}</span>
                {statusDisplay.label}
              </span>
            </div>

            {/* Description */}
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Description</span>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedTool.whatItIs || selectedTool.summary}
              </p>
            </div>

            {/* Tags */}
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Tags</span>
              <div className="text-[10px] text-slate-600 dark:text-slate-300">
                {selectedTool.tags?.join(', ') || 'No tags'}
              </div>
            </div>

            {/* Source */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Source</span>
              <a
                href={selectedTool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
              >
                <Link2 className="w-3 h-3" />
                {getSourceDomain(selectedTool.url)}
              </a>
            </div>

            {/* Rating */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Rating</span>
              <span className="text-[10px] text-yellow-500">
                {'★'.repeat(Math.min(5, Math.ceil((selectedTool.usage || 50) / 20)))}
                {'☆'.repeat(5 - Math.min(5, Math.ceil((selectedTool.usage || 50) / 20)))}
              </span>
            </div>

            {/* Access */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Access</span>
              <span className="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Globe className="w-3 h-3 text-green-500" />
                {getAccessLabel(selectedTool)}
              </span>
            </div>

            {/* Owner */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Owner</span>
              <span className="text-[10px] text-slate-600 dark:text-slate-300">
                {getOwner(selectedTool)}
              </span>
            </div>

            {/* Date Added */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Date Added</span>
              <span className="text-[10px] text-slate-600 dark:text-slate-300">
                {formatDate(selectedTool.createdAt)}
              </span>
            </div>

            {/* Last Modified */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Last Modified</span>
              <span className="text-[10px] text-slate-600 dark:text-slate-300">
                {formatRelativeTime(selectedTool.createdAt)}
              </span>
            </div>

            {/* Trend & Usage */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <TrendingUp className="w-2.5 h-2.5" />
                    Trend
                  </div>
                  <Sparkline
                    data={selectedTool.trend || [5, 5, 5, 5, 5, 5, 5]}
                    width={60}
                    height={16}
                    strokeWidth={1}
                  />
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5" />
                    Usage
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UsageBar value={selectedTool.usage || 50} width={40} height={4} />
                    <span className="text-[9px] font-medium text-slate-600 dark:text-slate-300">
                      {selectedTool.usage || 50}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 p-3 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-[10px]"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit2 className="w-3 h-3 mr-1.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-[10px] text-red-500 hover:text-red-600 border-red-200 hover:border-red-300 hover:bg-red-50"
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
