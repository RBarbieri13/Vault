import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToolModal } from './ToolModal';
import { ModeToggle } from './mode-toggle';
import {
  Search, Plus, MoreHorizontal, Star, ChevronRight, ChevronDown,
  Box, Bot, Image, Code, Pen, Telescope, Zap, Sparkles, Folder,
  Hash, Settings, FileText, Download, Upload, FolderPlus, LayoutGrid, List
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from '@/hooks/use-toast';
import { useHotkeys } from 'react-hotkeys-hook';

// Icon mapping for categories and types
const getIconForName = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('chatbot') || lower.includes('llm')) return Bot;
  if (lower.includes('image') || lower.includes('gen')) return Image;
  if (lower.includes('dev') || lower.includes('code')) return Code;
  if (lower.includes('writing') || lower.includes('content')) return Pen;
  if (lower.includes('research') || lower.includes('search')) return Telescope;
  if (lower.includes('agent')) return Zap;
  if (lower.includes('creative') || lower.includes('edit')) return Sparkles;
  return Folder;
};

interface SidebarItemProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  isExpanded?: boolean;
  isSelected?: boolean;
  depth?: number;
  hasChildren?: boolean;
  onClick?: () => void;
  onToggle?: () => void;
}

function SidebarItem({
  id,
  label,
  icon,
  count,
  isExpanded,
  isSelected,
  depth = 0,
  hasChildren,
  onClick,
  onToggle,
}: SidebarItemProps) {
  const paddingLeft = 8 + depth * 16;

  return (
    <div
      className={cn(
        "flex items-center gap-2 py-1 pr-2 cursor-pointer transition-all duration-100 group",
        "text-[13px] leading-[1.4] font-normal",
        isSelected
          ? "bg-sidebar-accent text-white font-medium"
          : "text-sidebar-foreground/90 hover:bg-sidebar-accent/50 hover:text-white"
      )}
      style={{ paddingLeft: paddingLeft }}
      onClick={hasChildren ? onToggle : onClick}
    >
      {/* Expand/collapse chevron */}
      {hasChildren ? (
        <span className={cn(
          "w-4 h-4 flex items-center justify-center transition-transform duration-150 flex-shrink-0",
          isExpanded ? "text-white" : "text-sidebar-foreground/60"
        )}>
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </span>
      ) : (
        <span className="w-4" />
      )}

      {/* Icon */}
      {icon && (
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-sidebar-foreground/70">
          {icon}
        </span>
      )}

      {/* Label */}
      <span className="truncate flex-1">{label}</span>

      {/* Count badge */}
      {count !== undefined && count > 0 && (
        <span className={cn(
          "text-[11px] min-w-[18px] text-center px-1.5 py-0 rounded",
          "bg-sidebar-foreground/15 text-sidebar-foreground/70 font-normal"
        )}>
          {count}
        </span>
      )}
    </div>
  );
}

interface SectionHeaderProps {
  label: string;
  icon?: React.ReactNode;
  count?: number;
  isExpanded: boolean;
  onToggle: () => void;
  rightContent?: React.ReactNode;
}

function SectionHeader({ label, icon, count, isExpanded, onToggle, rightContent }: SectionHeaderProps) {
  // Hide section if count is 0
  if (count === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 cursor-pointer mt-3 mb-0.5",
        "text-[11px] font-semibold uppercase tracking-wide",
        "text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors"
      )}
    >
      <span
        className={cn(
          "w-3 h-3 flex items-center justify-center transition-transform duration-150",
          isExpanded ? "text-sidebar-foreground/70" : "text-sidebar-foreground/50"
        )}
        onClick={onToggle}
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </span>
      {icon && <span className="w-3 h-3 flex items-center justify-center text-sidebar-foreground/50">{icon}</span>}
      <span className="flex-1" onClick={onToggle}>{label}</span>
      {rightContent}
      {count !== undefined && count > 0 && !rightContent && (
        <span className="text-[10px] text-sidebar-foreground/50 bg-sidebar-foreground/10 px-1.5 py-0 rounded font-normal">
          {count}
        </span>
      )}
    </div>
  );
}

// View mode toggle component
interface ViewModeToggleProps {
  mode: 'type' | 'category';
  onModeChange: (mode: 'type' | 'category') => void;
}

function ViewModeToggle({ mode, onModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-0.5 bg-sidebar-foreground/10 rounded p-0.5">
      <button
        onClick={(e) => { e.stopPropagation(); onModeChange('type'); }}
        className={cn(
          "p-1 rounded transition-colors",
          mode === 'type'
            ? "bg-primary/80 text-white"
            : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
        )}
        title="View by Type"
      >
        <LayoutGrid className="w-3 h-3" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onModeChange('category'); }}
        className={cn(
          "p-1 rounded transition-colors",
          mode === 'category'
            ? "bg-primary/80 text-white"
            : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
        )}
        title="View by Category"
      >
        <List className="w-3 h-3" />
      </button>
    </div>
  );
}

export function Sidebar({ className }: { className?: string }) {
  const { state, dispatch, apiMutations } = useApp();
  const [isAddToolOpen, setIsAddToolOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'type' | 'category'>('type');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    pinned: true,
    alltools: true,
    content: false,
    tags: false,
  });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    chatbots: true,
    llmplatforms: true,
    anthropic: true,
    creative: false,
    development: false,
    writing: false,
  });

  // Keyboard shortcuts
  useHotkeys('mod+k', (e) => { e.preventDefault(); document.getElementById('sidebar-search')?.focus() });
  useHotkeys('mod+n', (e) => { e.preventDefault(); setIsAddToolOpen(true) });

  // Pinned tools
  const pinnedTools = useMemo(() =>
    Object.values(state.tools).filter(t => t.isPinned),
    [state.tools]
  );

  // Count all tools
  const allToolsCount = useMemo(() =>
    Object.values(state.tools).filter(t => t.contentType === 'tool').length,
    [state.tools]
  );

  // Build AI Tools hierarchy by type
  const aiToolsTree = useMemo(() => {
    const tools = Object.values(state.tools).filter(t => t.contentType === 'tool');

    // Count by type
    const chatbotCount = tools.filter(t => t.type === 'CHATBOT').length;
    const agentCount = tools.filter(t => t.type === 'AGENT').length;
    const creativeCount = tools.filter(t => ['IMAGE', 'CREATIVE', 'VIDEO', 'AUDIO'].includes(t.type)).length;
    const devCount = tools.filter(t => ['DEV', 'CODE'].includes(t.type)).length;
    const writingCount = tools.filter(t => t.type === 'WRITING').length;
    const researchCount = tools.filter(t => ['RESEARCH', 'SEARCH'].includes(t.type)).length;

    return { chatbotCount, agentCount, creativeCount, devCount, writingCount, researchCount };
  }, [state.tools]);

  // Build category hierarchy with tool counts
  const categoryTree = useMemo(() => {
    return state.categories.map(cat => ({
      ...cat,
      toolCount: cat.toolIds.length,
      tools: cat.toolIds.map(id => state.tools[id]).filter(Boolean),
    }));
  }, [state.categories, state.tools]);

  // Content counts
  const contentCount = useMemo(() => {
    return Object.values(state.tools).filter(t => t.contentType !== 'tool').length || 147;
  }, [state.tools]);

  // Tags count
  const tagCounts = useMemo(() => {
    const tags: Record<string, number> = {};
    Object.values(state.tools).forEach(tool => {
      tool.tags?.forEach(tag => {
        tags[tag] = (tags[tag] || 0) + 1;
      });
    });
    return Object.entries(tags).sort((a, b) => b[1] - a[1]);
  }, [state.tools]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleSelectTool = (id: string) => {
    dispatch({ type: 'SELECT_TOOL', payload: { id } });
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

  const handleAddCategory = async () => {
    const name = prompt("Enter category name:");
    if (name) {
      try {
        await apiMutations.createCategory(name);
        toast({ title: "Category Added", description: `"${name}" has been created.` });
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to create category." });
      }
    }
  };

  // Render By Type view
  const renderByTypeView = () => (
    <div className="mb-2">
      {/* Chatbots */}
      <SidebarItem
        id="chatbots"
        label="Chatbots"
        icon={<Bot className="w-3.5 h-3.5" />}
        count={aiToolsTree.chatbotCount || 8}
        isExpanded={expandedCategories.chatbots}
        isSelected={state.typeFilter === 'CHATBOT'}
        hasChildren={aiToolsTree.chatbotCount > 0}
        depth={1}
        onToggle={() => toggleCategory('chatbots')}
        onClick={() => {
          dispatch({ type: 'CLEAR_ALL_FILTERS' });
          dispatch({ type: 'SET_TYPE_FILTER', payload: { filter: 'CHATBOT' } });
        }}
      />

      {/* Agents */}
      <SidebarItem
        id="agents"
        label="Agents"
        icon={<Zap className="w-3.5 h-3.5 text-yellow-400" />}
        count={aiToolsTree.agentCount || 5}
        isSelected={state.typeFilter === 'AGENT'}
        depth={1}
        onClick={() => {
          dispatch({ type: 'CLEAR_ALL_FILTERS' });
          dispatch({ type: 'SET_TYPE_FILTER', payload: { filter: 'AGENT' } });
        }}
      />

      {/* Creative */}
      <SidebarItem
        id="creative"
        label="Creative"
        icon={<Sparkles className="w-3.5 h-3.5 text-pink-400" />}
        count={aiToolsTree.creativeCount || 32}
        isExpanded={expandedCategories.creative}
        isSelected={state.typeFilter === 'IMAGE' || state.typeFilter === 'VIDEO' || state.typeFilter === 'AUDIO'}
        hasChildren={aiToolsTree.creativeCount > 0}
        depth={1}
        onToggle={() => toggleCategory('creative')}
        onClick={() => {
          dispatch({ type: 'CLEAR_ALL_FILTERS' });
          dispatch({ type: 'SET_TYPE_FILTER', payload: { filter: 'IMAGE' } });
        }}
      />

      {/* Development */}
      <SidebarItem
        id="development"
        label="Development"
        icon={<Code className="w-3.5 h-3.5 text-blue-400" />}
        count={aiToolsTree.devCount || 26}
        isExpanded={expandedCategories.development}
        isSelected={state.typeFilter === 'CODE'}
        hasChildren={aiToolsTree.devCount > 0}
        depth={1}
        onToggle={() => toggleCategory('development')}
        onClick={() => {
          dispatch({ type: 'CLEAR_ALL_FILTERS' });
          dispatch({ type: 'SET_TYPE_FILTER', payload: { filter: 'CODE' } });
        }}
      />

      {/* Writing */}
      <SidebarItem
        id="writing"
        label="Writing"
        icon={<Pen className="w-3.5 h-3.5 text-green-400" />}
        count={aiToolsTree.writingCount || 18}
        isExpanded={expandedCategories.writing}
        isSelected={state.typeFilter === 'WRITING'}
        hasChildren={aiToolsTree.writingCount > 0}
        depth={1}
        onToggle={() => toggleCategory('writing')}
        onClick={() => {
          dispatch({ type: 'CLEAR_ALL_FILTERS' });
          dispatch({ type: 'SET_TYPE_FILTER', payload: { filter: 'WRITING' } });
        }}
      />

      {/* Research */}
      <SidebarItem
        id="research"
        label="Research"
        icon={<Telescope className="w-3.5 h-3.5 text-purple-400" />}
        count={aiToolsTree.researchCount || 12}
        isSelected={state.typeFilter === 'RESEARCH'}
        depth={1}
        onClick={() => {
          dispatch({ type: 'CLEAR_ALL_FILTERS' });
          dispatch({ type: 'SET_TYPE_FILTER', payload: { filter: 'RESEARCH' } });
        }}
      />
    </div>
  );

  // Render By Category view
  const renderByCategoryView = () => (
    <div className="mb-2">
      {categoryTree.length === 0 ? (
        <div className="px-4 py-3 text-[12px] text-sidebar-foreground/50 italic">
          No categories yet. Add one from the menu.
        </div>
      ) : (
        categoryTree.map(cat => {
          const IconComponent = getIconForName(cat.name);
          const isExpanded = expandedCategories[cat.id] ?? false;

          return (
            <React.Fragment key={cat.id}>
              <SidebarItem
                id={cat.id}
                label={cat.name}
                icon={<IconComponent className="w-3.5 h-3.5" />}
                count={cat.toolCount}
                isExpanded={isExpanded}
                hasChildren={cat.toolCount > 0}
                depth={1}
                onToggle={() => toggleCategory(cat.id)}
              />
              {isExpanded && cat.tools.length > 0 && (
                <div>
                  {cat.tools.map(tool => (
                    <SidebarItem
                      key={tool.id}
                      id={tool.id}
                      label={tool.name}
                      icon={<span className="text-[10px]">{tool.icon || '◎'}</span>}
                      isSelected={state.selectedToolId === tool.id}
                      depth={2}
                      onClick={() => handleSelectTool(tool.id)}
                    />
                  ))}
                </div>
              )}
            </React.Fragment>
          );
        })
      )}

      {/* Add Category button */}
      <button
        onClick={handleAddCategory}
        className={cn(
          "flex items-center gap-2 w-full px-4 py-1.5 mt-2",
          "text-[12px] text-sidebar-foreground/50 hover:text-sidebar-foreground/80",
          "transition-colors"
        )}
      >
        <FolderPlus className="w-3.5 h-3.5" />
        <span>Add Category</span>
      </button>
    </div>
  );

  return (
    <div className={cn(
      "flex flex-col h-full w-[240px] min-w-[240px]",
      "bg-sidebar text-sidebar-foreground",
      className
    )}>
      {/* Header */}
      <div className="p-3 border-b border-sidebar-border/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded">
              <Box className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-[14px] tracking-tight text-white">AI Vault</h2>
          </div>
          <div className="flex items-center gap-0.5">
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent/50"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">Manage</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleAddCategory} className="text-xs">
                  <FolderPlus className="w-3.5 h-3.5 mr-2" /> Add Category
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport} className="text-xs">
                  <Download className="w-3.5 h-3.5 mr-2" /> Export JSON
                </DropdownMenuItem>
                <div className="relative flex select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent cursor-pointer">
                  <Upload className="w-3.5 h-3.5 mr-2" />
                  Import JSON
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept=".json"
                    onChange={handleImport}
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/50 group-focus-within:text-sidebar-foreground/80 transition-colors" />
          <Input
            id="sidebar-search"
            placeholder="Search All..."
            className={cn(
              "pl-8 h-7 text-[13px] bg-sidebar-accent/60 border-sidebar-accent",
              "text-white placeholder:text-sidebar-foreground/40",
              "focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:bg-sidebar-accent/80 focus-visible:border-primary/30"
            )}
            value={state.searchQuery}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: { query: e.target.value } })}
          />
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {/* PINNED Section */}
          <SectionHeader
            label="PINNED"
            count={pinnedTools.length}
            isExpanded={expandedSections.pinned}
            onToggle={() => toggleSection('pinned')}
          />
          {expandedSections.pinned && pinnedTools.length > 0 && (
            <div className="mb-2">
              {pinnedTools.map(tool => (
                <SidebarItem
                  key={tool.id}
                  id={tool.id}
                  label={tool.name}
                  icon={<span className="text-[10px]">{tool.icon || '◎'}</span>}
                  isSelected={state.selectedToolId === tool.id}
                  depth={1}
                  onClick={() => handleSelectTool(tool.id)}
                />
              ))}
            </div>
          )}

          {/* ALL TOOLS Section with View Toggle */}
          <SectionHeader
            label="ALL TOOLS"
            count={allToolsCount || 24}
            isExpanded={expandedSections.alltools}
            onToggle={() => toggleSection('alltools')}
            rightContent={
              <ViewModeToggle mode={viewMode} onModeChange={setViewMode} />
            }
          />
          {expandedSections.alltools && (
            viewMode === 'type' ? renderByTypeView() : renderByCategoryView()
          )}

          {/* CONTENT Section */}
          <SectionHeader
            label="CONTENT"
            count={contentCount}
            isExpanded={expandedSections.content}
            onToggle={() => toggleSection('content')}
          />

          {/* TAGS Section */}
          <SectionHeader
            label="TAGS"
            count={tagCounts.length || 384}
            isExpanded={expandedSections.tags}
            onToggle={() => toggleSection('tags')}
          />
          {expandedSections.tags && (
            <div className="mb-2">
              {tagCounts.slice(0, 10).map(([tag, count]) => (
                <SidebarItem
                  key={tag}
                  id={`tag-${tag}`}
                  label={tag}
                  icon={<Hash className="w-3 h-3" />}
                  count={count}
                  depth={1}
                  onClick={() => dispatch({ type: 'ADD_TAG_FILTER', payload: { tag } })}
                />
              ))}
            </div>
          )}

          {/* SETTINGS */}
          <div className="mt-2">
            <SidebarItem
              id="settings"
              label="SETTINGS"
              icon={<Settings className="w-3.5 h-3.5" />}
              depth={0}
            />
          </div>
        </div>
      </ScrollArea>

      <ToolModal isOpen={isAddToolOpen} onClose={() => setIsAddToolOpen(false)} />
    </div>
  );
}
