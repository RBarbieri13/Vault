import React, { useState, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { DataGrid } from '@/components/DataGrid';
import { Toolbar } from '@/components/Toolbar';
import { StatusBar } from '@/components/StatusBar';
import { ToolDetails } from '@/components/ToolDetails';
import { ToolModal } from '@/components/ToolModal';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Menu, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/store';
import { useQueryClient } from '@tanstack/react-query';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { toast } from '@/hooks/use-toast';

export default function Home() {
  const { state, isLoading, dispatch, apiMutations } = useApp();
  const queryClient = useQueryClient();
  const [isAddToolOpen, setIsAddToolOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['tools'] });
  }, [queryClient]);

  // Delete handler for keyboard shortcut
  const handleDeleteTool = useCallback(async () => {
    if (state.selectedToolId) {
      const tool = state.tools[state.selectedToolId];
      if (tool && confirm(`Delete "${tool.name}"?`)) {
        try {
          await apiMutations.deleteTool(tool.id);
          toast({ title: 'Deleted', description: `${tool.name} has been removed.` });
        } catch (error) {
          toast({ variant: "destructive", title: "Error", description: "Failed to delete tool." });
        }
      }
    }
  }, [state.selectedToolId, state.tools, apiMutations]);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    onAddTool: () => setIsAddToolOpen(true),
    onRefresh: handleRefresh,
    onDeleteTool: handleDeleteTool,
  });

  const handleSelectTool = useCallback((id: string) => {
    dispatch({ type: 'SELECT_TOOL', payload: { id } });
    setShowDetails(true);
  }, [dispatch]);

  const selectedTool = state.selectedToolId ? state.tools[state.selectedToolId] : null;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#1a1f2e]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
          <p className="text-sm text-slate-400">Loading AI Vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#161b26]">
      {/* Mobile Sidebar */}
      <div className="md:hidden absolute top-2 left-2 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8 bg-[#1a1f2e] border-slate-700">
              <Menu className="h-4 w-4 text-slate-300" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[240px] bg-[#1a1f2e] border-slate-700">
            <Sidebar className="h-full border-none w-full" />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Layout - Dark Sidebar (fixed width) */}
      <div className="hidden md:flex h-full flex-shrink-0">
        <Sidebar className="h-full" />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#1e2433]">
        {/* Toolbar with dropdown filters */}
        <Toolbar
          onAddTool={() => setIsAddToolOpen(true)}
          onRefresh={handleRefresh}
        />

        {/* Content with optional details panel */}
        <div className="flex-1 flex overflow-hidden">
          {selectedTool && showDetails ? (
            <ResizablePanelGroup direction="horizontal" className="flex-1">
              {/* Data Grid */}
              <ResizablePanel defaultSize={70} minSize={50}>
                <DataGrid
                  onSelectTool={handleSelectTool}
                  selectedToolId={state.selectedToolId}
                  className="h-full"
                />
              </ResizablePanel>

              {/* Resize Handle */}
              <ResizableHandle
                withHandle
                className="w-[3px] bg-slate-700/50 hover:bg-cyan-500 transition-colors"
              />

              {/* Details Panel */}
              <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
                <div className="h-full overflow-auto bg-[#1e2433] border-l border-slate-700/50">
                  <ToolDetails
                    tool={selectedTool}
                    onClose={() => setShowDetails(false)}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <DataGrid
              onSelectTool={handleSelectTool}
              selectedToolId={state.selectedToolId}
              className="flex-1"
            />
          )}
        </div>

        {/* Status Bar */}
        <StatusBar />
      </main>

      {/* Add Tool Modal */}
      <ToolModal isOpen={isAddToolOpen} onClose={() => setIsAddToolOpen(false)} />
    </div>
  );
}
