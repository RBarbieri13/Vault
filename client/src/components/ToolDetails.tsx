import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { Tool, getTypeColor, getTagColor } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkline, UsageBar } from './Sparkline';
import {
  ExternalLink, Edit2, Trash2, Calendar, Hash, Tag, Star, Copy, X,
  TrendingUp, Activity, ChevronRight
} from 'lucide-react';
import { ToolModal } from './ToolModal';
import { toast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ToolDetailsProps {
  tool?: Tool | null;
  onClose?: () => void;
}

export function ToolDetails({ tool: propTool, onClose }: ToolDetailsProps) {
  const { state, dispatch, apiMutations } = useApp();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Use provided tool or fall back to selected tool from state
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
      } catch (error) {
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
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update tool." });
    }
  };

  const typeColor = getTypeColor(selectedTool.type);

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ backgroundColor: typeColor.bg, color: typeColor.text }}
              >
                {selectedTool.type}
              </span>
              {selectedTool.isPinned && (
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">
              {selectedTool.icon && <span className="mr-1.5">{selectedTool.icon}</span>}
              {selectedTool.name}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleTogglePin}
                >
                  <Star className={cn(
                    "w-4 h-4",
                    selectedTool.isPinned ? "fill-yellow-500 text-yellow-500" : "text-slate-400"
                  )} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{selectedTool.isPinned ? 'Unpin' : 'Pin'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Edit2 className="w-4 h-4 text-slate-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>

            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-5">
          {/* Metrics row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Trend (7 days)
              </div>
              <div className="flex items-center gap-2">
                <Sparkline
                  data={selectedTool.trend || [5, 5, 5, 5, 5, 5, 5]}
                  width={60}
                  height={20}
                  strokeWidth={1.5}
                  fillColor="rgba(59, 130, 246, 0.1)"
                />
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {(selectedTool.trend?.[6] || 5) > (selectedTool.trend?.[0] || 5) ? '↑' : '↓'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Usage
              </div>
              <div className="flex items-center gap-2">
                <UsageBar value={selectedTool.usage || 50} width={60} height={6} />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {selectedTool.usage || 50}%
                </span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              {selectedTool.whatItIs || selectedTool.summary}
            </p>
          </div>

          {/* URL */}
          <div className="flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <div className="flex-1 truncate text-[10px] font-mono text-blue-600 dark:text-blue-400">
              {selectedTool.url}
            </div>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCopyLink}>
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => window.open(selectedTool.url, '_blank')}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>

          {/* Capabilities */}
          {selectedTool.capabilities && selectedTool.capabilities.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Capabilities
              </h4>
              <ul className="space-y-1.5">
                {selectedTool.capabilities.map((cap, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                    <ChevronRight className="w-3 h-3 mt-0.5 text-slate-400 flex-shrink-0" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Best For */}
          {selectedTool.bestFor && selectedTool.bestFor.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Best For
              </h4>
              <ul className="space-y-1.5">
                {selectedTool.bestFor.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Tags
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {selectedTool.tags && selectedTool.tags.length > 0 ? (
                selectedTool.tags.map((tag, i) => {
                  const tagColor = getTagColor(tag);
                  return (
                    <span
                      key={i}
                      className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: tagColor.bg, color: tagColor.text }}
                    >
                      {tag}
                    </span>
                  );
                })
              ) : (
                <span className="text-[10px] text-slate-400 italic">No tags</span>
              )}
            </div>
          </div>

          {/* Notes */}
          {selectedTool.notes && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Notes
              </h4>
              <p className="text-[10px] text-slate-500 italic leading-relaxed">
                {selectedTool.notes}
              </p>
            </div>
          )}

          {/* Meta */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-1 text-[9px] text-slate-400">
              <Calendar className="w-3 h-3" />
              Added {new Date(selectedTool.createdAt).toLocaleDateString()}
            </div>
          </div>
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
