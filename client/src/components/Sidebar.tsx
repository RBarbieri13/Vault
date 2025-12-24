import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ToolModal } from './ToolModal';
import { ModeToggle } from './mode-toggle';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { 
  Search, Plus, MoreHorizontal, FolderPlus, 
  Trash, Edit, Download, Upload, Star, 
  GripVertical, Command, ChevronRight,
  Menu
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from '@/hooks/use-toast';
import { useHotkeys } from 'react-hotkeys-hook';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Sortable Item Component
function SortableToolItem({ id, tool, isActive }: { id: string, tool: any, isActive: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.4 : 1,
  };

  const { dispatch } = useApp();

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "group flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-all cursor-pointer select-none border border-transparent",
        isActive 
          ? "bg-primary text-primary-foreground font-medium shadow-sm" 
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:border-sidebar-border/50"
      )}
      onClick={() => dispatch({ type: 'SELECT_TOOL', payload: { id: tool.id } })}
      data-testid={`tool-item-${tool.id}`}
    >
      <div {...attributes} {...listeners} className="opacity-0 group-hover:opacity-50 hover:!opacity-100 cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-opacity">
        <GripVertical className="w-3.5 h-3.5" />
      </div>
      <div className="truncate flex-1 min-w-0">
        <div className="font-medium truncate leading-tight">{tool.name}</div>
        <div className="text-[10px] text-muted-foreground truncate opacity-80 mt-0.5">{tool.whatItIs || tool.summary}</div>
      </div>
      {tool.isPinned && <Star className="w-3 h-3 fill-current text-yellow-500 flex-shrink-0" />}
    </div>
  );
}

export function Sidebar({ className }: { className?: string }) {
  const { state, dispatch } = useApp();
  const [isAddToolOpen, setIsAddToolOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Keyboard shortcuts
  useHotkeys('mod+k', (e) => { e.preventDefault(); document.getElementById('search-tools')?.focus() });
  useHotkeys('mod+n', (e) => { e.preventDefault(); setIsAddToolOpen(true) });

  // Filter tools based on search
  const filteredTools = Object.values(state.tools).filter(t => 
    t.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
    t.tags.some(tag => tag.toLowerCase().includes(state.searchQuery.toLowerCase())) ||
    t.type.toLowerCase().includes(state.searchQuery.toLowerCase())
  );
  
  const isSearching = state.searchQuery.length > 0;

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find category containing the active item
    const activeCategory = state.categories.find(c => c.toolIds.includes(active.id as string));
    if (!activeCategory) return;

    // If over item is also in the same category
    if (activeCategory.toolIds.includes(over.id as string)) {
      const oldIndex = activeCategory.toolIds.indexOf(active.id as string);
      const newIndex = activeCategory.toolIds.indexOf(over.id as string);
      const newOrder = arrayMove(activeCategory.toolIds, oldIndex, newIndex);
      
      dispatch({
        type: 'REORDER_TOOLS',
        payload: { categoryId: activeCategory.id, newOrder }
      });
    }
  };

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

  return (
    <div className={cn("flex flex-col h-full bg-sidebar text-sidebar-foreground", className)}>
      {/* Header - Sticky */}
      <div className="p-4 border-b border-sidebar-border bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/60 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1 rounded-md">
              <Command className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-lg tracking-tight">AI Vault</h2>
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
            className="pl-9 bg-sidebar-accent/50 border-transparent shadow-none focus-visible:ring-1 focus-visible:bg-background transition-all" 
            value={state.searchQuery}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: { query: e.target.value } })}
          />
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-6">
          
          {/* Favorites Section */}
          {!isSearching && (
             <div className="space-y-1">
               <div className="flex items-center justify-between px-2 mb-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Favorites</h3>
               </div>
               {Object.values(state.tools).filter(t => t.isPinned).map(tool => (
                 <div 
                   key={tool.id}
                   className={cn(
                     "flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-all cursor-pointer group border border-transparent",
                     state.selectedToolId === tool.id
                       ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm border-sidebar-border/50" 
                       : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                   )}
                   onClick={() => dispatch({ type: 'SELECT_TOOL', payload: { id: tool.id } })}
                 >
                   <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                   <span className="truncate font-medium">{tool.name}</span>
                 </div>
               ))}
               {Object.values(state.tools).filter(t => t.isPinned).length === 0 && (
                 <div className="px-2 py-3 text-xs text-muted-foreground italic border border-dashed border-sidebar-border rounded-md text-center bg-sidebar-accent/20">
                   Star tools to pin them here
                 </div>
               )}
             </div>
          )}

          {/* Categories Tree */}
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-1">
              {isSearching ? (
                 <div className="space-y-1">
                   <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Search Results</h3>
                   {filteredTools.map(tool => (
                      <div 
                        key={tool.id}
                        className={cn(
                          "flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors cursor-pointer",
                          state.selectedToolId === tool.id
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                        onClick={() => dispatch({ type: 'SELECT_TOOL', payload: { id: tool.id } })}
                      >
                         <div className="truncate flex-1">
                          <div className="font-medium">{tool.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate opacity-80">{tool.whatItIs || tool.summary}</div>
                        </div>
                      </div>
                   ))}
                   {filteredTools.length === 0 && (
                     <div className="px-2 py-8 text-sm text-muted-foreground text-center">
                       No results found for "{state.searchQuery}"
                     </div>
                   )}
                 </div>
              ) : (
                <Accordion type="multiple" defaultValue={state.categories.filter(c => !c.collapsed).map(c => c.id)} className="w-full space-y-1">
                  {state.categories.map(category => (
                    <AccordionItem value={category.id} key={category.id} className="border-none">
                      <div className="flex items-center group/cat hover:bg-sidebar-accent/30 rounded-md pr-1 transition-colors">
                         <AccordionTrigger 
                           className="py-2 px-2 hover:no-underline hover:bg-transparent flex-1 justify-start gap-2 text-sm font-semibold text-sidebar-foreground/80 hover:text-sidebar-foreground"
                         >
                           <span className="truncate text-left flex-1">{category.name}</span>
                           <span className="text-xs font-normal text-muted-foreground bg-sidebar-accent/50 px-1.5 py-0.5 rounded-full">{category.toolIds.length}</span>
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
                      
                      <AccordionContent className="pb-2 pt-0 pl-0">
                        <SortableContext items={category.toolIds} strategy={verticalListSortingStrategy}>
                          <div className="border-l border-sidebar-border/50 pl-2 ml-3.5 space-y-1 mt-1">
                            {category.toolIds.map(toolId => {
                               const tool = state.tools[toolId];
                               if (!tool) return null;
                               return <SortableToolItem key={tool.id} id={tool.id} tool={tool} isActive={state.selectedToolId === tool.id} />;
                            })}
                            {category.toolIds.length === 0 && (
                              <div className="px-2 py-3 text-xs text-muted-foreground italic border border-dashed border-sidebar-border/50 rounded bg-sidebar-accent/10 ml-1">
                                Empty category
                              </div>
                            )}
                          </div>
                        </SortableContext>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
            <DragOverlay>
              {activeId ? (
                 <div className="bg-popover text-popover-foreground shadow-xl rounded-md p-2 border border-primary/20 opacity-90 w-64">
                    Dragging Item...
                 </div>
              ) : null}
            </DragOverlay>
          </DndContext>

        </div>
      </ScrollArea>

      {/* Footer Actions - Sticky */}
      <div className="p-4 border-t border-sidebar-border space-y-2 bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/60 sticky bottom-0 z-10">
        <Button className="w-full justify-start shadow-sm" variant="outline" onClick={() => setIsAddToolOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Tool <span className="ml-auto text-xs text-muted-foreground font-mono">⌘N</span>
        </Button>
        <Button className="w-full justify-start hover:bg-sidebar-accent" variant="ghost" onClick={handleAddCategory}>
          <FolderPlus className="w-4 h-4 mr-2" /> New Category
        </Button>
      </div>

      <ToolModal isOpen={isAddToolOpen} onClose={() => setIsAddToolOpen(false)} />
    </div>
  );
}

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-80">
        <Sidebar className="h-full border-none w-full" />
      </SheetContent>
    </Sheet>
  )
}
