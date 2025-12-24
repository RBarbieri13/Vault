import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ExternalLink, Edit2, Trash2, Calendar, Hash, Tag, Star, Copy } from 'lucide-react';
import { ToolModal } from './ToolModal';
import { toast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function ToolDetails() {
  const { state, dispatch } = useApp();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const selectedTool = state.selectedToolId ? state.tools[state.selectedToolId] : null;

  if (!selectedTool) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-slate-50/50 dark:bg-slate-900/20">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <Hash className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-lg font-medium text-foreground">No tool selected</h3>
        <p className="max-w-sm mt-2">Select a tool from the sidebar to view its details, or create a new one to get started.</p>
        <Button className="mt-6" onClick={() => dispatch({ type: 'ADD_TOOL', payload: { name: '', url: '', type: '', summary: '', whatItIs: '', capabilities: [], bestFor: [], tags: [], categoryId: state.categories[0]?.id || '' } })}>
          Create New Tool
        </Button>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${selectedTool.name}"?`)) {
      dispatch({ type: 'DELETE_TOOL', payload: { id: selectedTool.id } });
      toast({ title: 'Tool deleted', description: `${selectedTool.name} has been removed.` });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(selectedTool.url);
    toast({ title: 'Link copied', description: 'URL copied to clipboard.' });
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <Badge variant="outline" className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
              {selectedTool.type}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(selectedTool.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
            {selectedTool.name}
            {selectedTool.isPinned && <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => dispatch({ type: 'TOGGLE_PIN', payload: { id: selectedTool.id } })}>
                <Star className={`w-5 h-5 ${selectedTool.isPinned ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Pin to favorites</TooltipContent>
          </Tooltip>
          
          <Button variant="ghost" size="icon" onClick={() => setIsEditModalOpen(true)} data-testid="button-edit-tool">
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete} data-testid="button-delete-tool">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-8">
        <Card className="border-none shadow-sm bg-card/50">
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">What It Is</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {selectedTool.whatItIs || selectedTool.summary || "No description provided."}
              </p>
            </div>

            {selectedTool.capabilities && selectedTool.capabilities.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Capabilities</h3>
                <ul className="grid gap-2">
                  {selectedTool.capabilities.map((cap, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedTool.bestFor && selectedTool.bestFor.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Best For</h3>
                <ul className="grid gap-2">
                  {selectedTool.bestFor.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {selectedTool.notes && (
              <div className="pt-4 border-t border-border/50">
                 <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Notes</h3>
                 <p className="text-sm text-muted-foreground italic">{selectedTool.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
           <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex-1 truncate font-mono text-sm text-blue-600 dark:text-blue-400">
                  {selectedTool.url}
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCopyLink}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => window.open(selectedTool.url, '_blank')}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
           </Card>

           <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Classification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedTool.tags.length > 0 ? (
                  selectedTool.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1 text-sm">
                      <Tag className="w-3 h-3 mr-1 opacity-50" />
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground italic">No tags</span>
                )}
              </div>
            </CardContent>
           </Card>
        </div>
      </div>

      <ToolModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        toolToEdit={selectedTool} 
      />
    </div>
  );
}
