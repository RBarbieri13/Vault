import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { Tool, getTypeColor } from '@/lib/data';
import { Button } from '@/components/ui/button';
import {
  X, Edit2, Trash2, Star, Check, Globe, Users, Lock
} from 'lucide-react';
import { ToolModal } from './ToolModal';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ToolDetailsProps {
  tool?: Tool | null;
  onClose?: () => void;
}

// Star rating component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-3.5 h-3.5",
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-600"
          )}
        />
      ))}
    </div>
  );
}

export function ToolDetails({ tool: propTool, onClose }: ToolDetailsProps) {
  const { state, dispatch, apiMutations } = useApp();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Use provided tool or fall back to selected tool from state
  const selectedTool = propTool || (state.selectedToolId ? state.tools[state.selectedToolId] : null);

  if (!selectedTool) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-[#1e2433]">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
          <span className="text-slate-500 text-lg">?</span>
        </div>
        <h3 className="text-sm font-medium text-slate-400">No tool selected</h3>
        <p className="text-xs mt-1 text-slate-500 max-w-[200px]">Select a tool from the list to view details</p>
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

  const typeColor = getTypeColor(selectedTool.type);
  const rating = Math.floor((selectedTool.usage || 50) / 20) + 1;
  const access = selectedTool.status === 'active' ? 'Public' : selectedTool.status === 'beta' ? 'Team' : 'Private';
  const source = selectedTool.url.replace(/^https?:\/\//, '').split('/')[0];

  // Mock owner and dates
  const owners = [
    { name: 'Jason D.', color: '#3b82f6' },
    { name: 'Mike K.', color: '#22c55e' },
    { name: 'Anna S.', color: '#f59e0b' },
  ];
  const owner = owners[selectedTool.name.length % owners.length];
  const dateAdded = new Date(selectedTool.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#1e2433]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <h2 className="text-sm font-semibold text-white truncate">
          {selectedTool.name}
        </h2>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-400 hover:text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto thin-scrollbar px-4 py-3 space-y-4">
        {/* Type */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Type</span>
          <span className="text-[11px] text-slate-300">{selectedTool.type === 'CHATBOT' ? 'Chatbot' : selectedTool.type}</span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Status</span>
          {selectedTool.status === 'active' ? (
            <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
              <Check className="w-3 h-3" />
              Verified
            </span>
          ) : (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-600/50 text-slate-400 capitalize">
              {selectedTool.status}
            </span>
          )}
        </div>

        {/* Description */}
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Description</span>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {selectedTool.whatItIs || selectedTool.summary}
          </p>
        </div>

        {/* Tags */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Tags</span>
          <div className="flex items-center gap-1">
            {selectedTool.tags?.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-700 text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Source */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Source</span>
          <span className="text-[11px] text-cyan-400">{source}</span>
        </div>

        {/* Rating */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Rating</span>
          <StarRating rating={rating} />
        </div>

        {/* Access */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Access</span>
          <div className="flex items-center gap-1.5">
            {access === 'Public' ? (
              <Globe className="w-3.5 h-3.5 text-slate-500" />
            ) : access === 'Team' ? (
              <Users className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="text-[11px] text-slate-300">{access}</span>
          </div>
        </div>

        {/* Owner */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Owner</span>
          <span className="text-[11px] text-slate-300">{owner.name}</span>
        </div>

        {/* Date Added */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Date Added</span>
          <span className="text-[11px] text-slate-300">{dateAdded}</span>
        </div>

        {/* Last Modified */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Last Modified</span>
          <span className="text-[11px] text-slate-300">2 hours ago</span>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-700/50">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-7 text-[11px] bg-transparent border-slate-600 text-slate-300 hover:bg-white/5 hover:text-white"
          onClick={() => setIsEditModalOpen(true)}
        >
          <Edit2 className="w-3 h-3 mr-1.5" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-7 text-[11px] bg-transparent border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-400"
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
  );
}
