import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ToolModal } from './ToolModal';
import { ModeToggle } from './mode-toggle';
import { 
  Search, Plus, MoreHorizontal, FolderPlus, 
  Trash, Edit, Download, Upload, Star, 
  Command, Box
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from '@/hooks/use-toast';
import { useHotkeys } from 'react-hotkeys-hook';

export function Sidebar({ className }: { className?: string }) {
  const { state, dispatch } = useApp();
  const [isAddToolOpen, setIsAddToolOpen] = useState(false);

  // Keyboard shortcuts
  useHotkeys('mod+k', (e) => { e.preventDefault(); document.getElementById('search-tools')?.focus() });
  useHotkeys('mod+n', (e) => { e.preventDefault(); setIsAddToolOpen(true) });

  // Handle category drag and drop logic removed for simplicity in this specific "fixed sidebar" iteration request, 
  // as the request focuses more on the Table View. Categories are collapsible.

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ categories: state.categories, tools: state.tools }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "ai_tools_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast({ title: "Export Successful", description: "Your data has been downloaded." });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.categories && parsed.tools) {
          dispatch({ type: 'IMPORT_DATA', payload: parsed });
          toast({ title: "Import Successful", description: "Your library has been updated." });
        } else {
          throw new Error("Invalid format");
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Import Failed", description: "Invalid JSON file." });
      }
    };
    reader.readAsText(file);
  };

  const handleAddCategory = () => {
    const name = prompt("Enter category name:");
    if (name) {
      dispatch({ type: 'ADD_CATEGORY', payload: { name } });
      toast({ title: "Category Added", description: `"${name}" has been created.` });
    }
  };

  const handleRenameCategory = (id: string, currentName: string) => {
    const name = prompt("Rename category:", currentName);
    if (name) {
       dispatch({ type: 'RENAME_CATEGORY', payload: { id, name } });
       toast({ title: "Category Renamed", description: `Renamed to "${name}".` });
    }
  };

  const handleDeleteCategory = (id: string) => {
    if(confirm("Delete this category and all its tools?")) {
      dispatch({ type: 'DELETE_CATEGORY', payload: { id } });
      toast({ title: "Category Deleted", description: "Category and its tools removed." });
    }
  }

  // Count tools per category
  const getToolCount = (catId: string) => {
    return state.categories.find(c => c.id === catId)?.toolIds.length || 0;
  };

  return (
    <div className={cn("flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border w-[280px]", className)}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
              <Box className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-lg tracking-tight">AI Vault</h2>
          </div>
          <div className="flex items-center gap-1">
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Manage</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" /> Export JSON
                </DropdownMenuItem>
                <div className="relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer hover:bg-accent">
                  <Upload className="w-4 h-4 mr-2" />
                  Import JSON
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".json" onChange={handleImport} />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            id="search-tools"
            placeholder="Search tools... (Cmd+K)" 
            className="pl-9 bg-sidebar-accent/50 border-transparent shadow-none focus-visible:ring-1 focus-visible:bg-background transition-all h-9" 
            value={state.searchQuery}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: { query: e.target.value } })}
          />
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className="px-3 py-4 space-y-6">
          
          {/* Favorites Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Favorites</h3>
            </div>
            {Object.values(state.tools).filter(t => t.isPinned).map(tool => (
              <div 
                key={tool.id}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all cursor-pointer group border border-transparent",
                  state.selectedToolId === tool.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm" 
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
                onClick={() => dispatch({ type: 'SELECT_TOOL', payload: { id: tool.id } })}
              >
                <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                <span className="truncate font-medium">{tool.name}</span>
              </div>
            ))}
            {Object.values(state.tools).filter(t => t.isPinned).length === 0 && (
              <div className="px-2 py-3 text-xs text-muted-foreground italic text-center opacity-60">
                No pinned tools
              </div>
            )}
          </div>

          {/* Categories Tree */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categories</h3>
            </div>
            <Accordion type="multiple" defaultValue={state.categories.filter(c => !c.collapsed).map(c => c.id)} className="w-full space-y-1">
              {state.categories.map(category => (
                <AccordionItem value={category.id} key={category.id} className="border-none">
                  <div className="flex items-center group/cat hover:bg-sidebar-accent/30 rounded-md pr-1 transition-colors">
                      <AccordionTrigger 
                        className="py-1.5 px-2 hover:no-underline hover:bg-transparent flex-1 justify-start gap-2 text-sm font-medium text-sidebar-foreground/80 hover:text-sidebar-foreground"
                      >
                        <span className="truncate text-left flex-1">{category.name}</span>
                        <span className="text-xs font-normal text-muted-foreground bg-sidebar-accent/50 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {getToolCount(category.id)}
                        </span>
                      </AccordionTrigger>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/cat:opacity-100 transition-all focus:opacity-100">
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRenameCategory(category.id, category.name)}>
                            <Edit className="w-3 h-3 mr-2" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteCategory(category.id)} className="text-destructive focus:text-destructive">
                            <Trash className="w-3 h-3 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
                  
                  <AccordionContent className="pb-1 pt-0 pl-0">
                    <div className="border-l border-sidebar-border/50 pl-2 ml-3.5 space-y-0.5 mt-1">
                      {category.toolIds.map(toolId => {
                          const tool = state.tools[toolId];
                          if (!tool) return null;
                          return (
                            <div 
                              key={tool.id}
                              className={cn(
                                "flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-colors cursor-pointer",
                                state.selectedToolId === tool.id
                                  ? "text-primary font-medium bg-sidebar-accent/50" 
                                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/30"
                              )}
                              onClick={() => dispatch({ type: 'SELECT_TOOL', payload: { id: tool.id } })}
                            >
                              <span className="truncate">{tool.name}</span>
                            </div>
                          );
                      })}
                      {category.toolIds.length === 0 && (
                        <div className="px-2 py-1 text-xs text-muted-foreground italic opacity-60">
                          Empty
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

        </div>
      </ScrollArea>

      {/* Footer Actions - Sticky */}
      <div className="p-4 border-t border-sidebar-border space-y-2 bg-sidebar">
        <Button className="w-full justify-start shadow-sm" onClick={() => setIsAddToolOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Tool
        </Button>
        <Button className="w-full justify-start" variant="outline" onClick={handleAddCategory}>
          <FolderPlus className="w-4 h-4 mr-2" /> New Category
        </Button>
      </div>

      <ToolModal isOpen={isAddToolOpen} onClose={() => setIsAddToolOpen(false)} />
    </div>
  );
}
