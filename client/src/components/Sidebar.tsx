import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ToolModal } from './ToolModal';
import { 
  Search, Plus, MoreHorizontal, FolderPlus, 
  Trash, Edit, Download, Upload, Star, 
  GripVertical, Command, ChevronRight
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
  DragEndEvent
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
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const { dispatch } = useApp();

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "group flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer select-none",
        isActive 
          ? "bg-primary text-primary-foreground font-medium" 
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
      onClick={() => dispatch({ type: 'SELECT_TOOL', payload: { id: tool.id } })}
      data-testid={`tool-item-${tool.id}`}
    >
      <div {...attributes} {...listeners} className="opacity-0 group-hover:opacity-50 hover:!opacity-100 cursor-grab active:cursor-grabbing p-0.5">
        <GripVertical className="w-3 h-3" />
      </div>
      <div className="truncate flex-1">
        <div className="font-medium text-foreground">{tool.name}</div>
        <div className="text-[10px] text-muted-foreground truncate">{tool.whatItIs || tool.summary}</div>
      </div>
      {tool.isPinned && <Star className="w-3 h-3 fill-current opacity-50" />}
    </div>
  );
}

export function Sidebar() {
  const { state, dispatch } = useApp();
  const [isAddToolOpen, setIsAddToolOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find which category we are in
    // This simple implementation assumes we only reorder within the same category for now
    // Or we need to look up which category holds these items.
    
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
    if (name) dispatch({ type: 'ADD_CATEGORY', payload: { name } });
  };

  const handleRenameCategory = (id: string, currentName: string) => {
    const name = prompt("Rename category:", currentName);
    if (name) dispatch({ type: 'RENAME_CATEGORY', payload: { id, name } });
  };

  return (
    <div className="w-80 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col h-screen flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg tracking-tight flex items-center gap-2">
            <Command className="w-5 h-5" />
            AI Vault
          </h2>
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
        
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tools..." 
            className="pl-9 bg-sidebar-accent/50 border-none shadow-none focus-visible:ring-1" 
            value={state.searchQuery}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: { query: e.target.value } })}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          
          {/* Favorites Section */}
          {!isSearching && (
             <div className="space-y-1">
               <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Favorites</h3>
               {Object.values(state.tools).filter(t => t.isPinned).map(tool => (
                 <div 
                   key={tool.id}
                   className={cn(
                     "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
                     state.selectedToolId === tool.id
                       ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                       : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                   )}
                   onClick={() => dispatch({ type: 'SELECT_TOOL', payload: { id: tool.id } })}
                 >
                   <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                   <span className="truncate">{tool.name}</span>
                 </div>
               ))}
               {Object.values(state.tools).filter(t => t.isPinned).length === 0 && (
                 <div className="px-2 text-xs text-muted-foreground italic">No pinned tools</div>
               )}
             </div>
          )}

          {/* Categories Tree */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="space-y-1">
              {isSearching ? (
                 <div className="space-y-1">
                   <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Search Results</h3>
                   {filteredTools.map(tool => (
                      <div 
                        key={tool.id}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
                          state.selectedToolId === tool.id
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                        onClick={() => dispatch({ type: 'SELECT_TOOL', payload: { id: tool.id } })}
                      >
                        <div className="w-3.5 h-3.5" />
                        <span className="truncate">{tool.name}</span>
                      </div>
                   ))}
                   {filteredTools.length === 0 && <div className="px-2 text-sm text-muted-foreground">No results found.</div>}
                 </div>
              ) : (
                <Accordion type="multiple" defaultValue={state.categories.filter(c => !c.collapsed).map(c => c.id)} className="w-full">
                  {state.categories.map(category => (
                    <AccordionItem value={category.id} key={category.id} className="border-none mb-1">
                      <div className="flex items-center group/cat hover:bg-sidebar-accent/30 rounded-md pr-1">
                         <AccordionTrigger 
                           className="py-1.5 px-2 hover:no-underline hover:bg-transparent flex-1 justify-start gap-2 text-sm font-medium"
                         >
                           <span className="truncate text-left">{category.name}</span>
                         </AccordionTrigger>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                                <MoreHorizontal className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRenameCategory(category.id, category.name)}>
                                <Edit className="w-3 h-3 mr-2" /> Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => dispatch({ type: 'DELETE_CATEGORY', payload: { id: category.id } })} className="text-destructive focus:text-destructive">
                                <Trash className="w-3 h-3 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </div>
                      
                      <AccordionContent className="pb-1 pt-0 pl-2">
                        <SortableContext items={category.toolIds} strategy={verticalListSortingStrategy}>
                          <div className="border-l border-sidebar-border/50 pl-1 ml-2 space-y-0.5 mt-1">
                            {category.toolIds.map(toolId => {
                               const tool = state.tools[toolId];
                               if (!tool) return null;
                               return <SortableToolItem key={tool.id} id={tool.id} tool={tool} isActive={state.selectedToolId === tool.id} />;
                            })}
                            {category.toolIds.length === 0 && (
                              <div className="px-2 py-2 text-xs text-muted-foreground italic">Empty category</div>
                            )}
                          </div>
                        </SortableContext>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          </DndContext>

        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button className="w-full justify-start" variant="outline" onClick={() => setIsAddToolOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Tool
        </Button>
        <Button className="w-full justify-start" variant="ghost" onClick={handleAddCategory}>
          <FolderPlus className="w-4 h-4 mr-2" /> New Category
        </Button>
      </div>

      <ToolModal isOpen={isAddToolOpen} onClose={() => setIsAddToolOpen(false)} />
    </div>
  );
}
