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
  Hash, Settings, FileText, Download, Upload, FolderPlus
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
        "flex items-center gap-1.5 py-1.5 pr-2 cursor-pointer transition-all duration-150 group",
        "text-[11px] leading-tight",
        isSelected
          ? "bg-gradient-to-r from-primary/20 to-transparent border-l-[3px] border-l-primary text-foreground font-semibold"
          : "text-sidebar-foreground hover:bg-foreground/8 hover:text-foreground border-l-[3px] border-l-transparent"
      )}
      style={{ paddingLeft: paddingLeft - 3 }}
      onClick={hasChildren ? onToggle : onClick}
    >
      {/* Expand/collapse chevron */}
      {hasChildren ? (
        <span className={cn(
          "w-3 h-3 flex items-center justify-center transition-transform duration-150",
          isExpanded ? "text-foreground" : "text-muted-foreground"
        )}>
          {isExpanded ? (
            <ChevronDown className="w-2.5 h-2.5" />
          ) : (
            <ChevronRight className="w-2.5 h-2.5" />
          )}
        </span>
      ) : (
        <span className="w-3" />
      )}

      {/* Icon */}
      {icon && (
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-muted-foreground">
          {icon}
        </span>
      )}

      {/* Label */}
      <span className="truncate flex-1 font-medium">{label}</span>

      {/* Count badge */}
      {count !== undefined && count > 0 && (
        <span className={cn(
          "text-[10px] min-w-[20px] text-center px-1.5 py-0.5 rounded-full",
          "bg-foreground/10",
          isSelected ? "text-primary" : "text-muted-foreground"
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
}

function SectionHeader({ label, icon, count, isExpanded, onToggle }: SectionHeaderProps) {
  // Hide section if count is 0
  if (count === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 cursor-pointer mt-2",
        "text-[10px] font-bold uppercase tracking-[0.08em]",
        "text-muted-foreground hover:text-foreground transition-colors",
        "border-l-2 border-l-primary/40"
      )}
      onClick={onToggle}
    >
      <span className={cn(
        "w-3 h-3 flex items-center justify-center transition-transform duration-150",
        isExpanded ? "text-foreground" : "text-muted-foreground"
      )}>
        {isExpanded ? (
          <ChevronDown className="w-2.5 h-2.5" />
        ) : (
          <ChevronRight className="w-2.5 h-2.5" />
        )}
      </span>
      {icon && <span className="w-3 h-3 flex items-center justify-center text-muted-foreground">{icon}</span>}
      <span className="flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-[9px] text-muted-foreground bg-foreground/10 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}

export function Sidebar({ className }: { className?: string }) {
  const { state, dispatch, apiMutations } = useApp();
  const [isAddToolOpen, setIsAddToolOpen] = useState(false);
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

  // Build AI Tools hierarchy
  const aiToolsTree = useMemo(() => {
    const tools = Object.values(state.tools).filter(t => t.contentType === 'tool');

    // Count by type
    const chatbotCount = tools.filter(t => t.type === 'CHATBOT').length;
    const creativeCount = tools.filter(t => ['IMAGE', 'CREATIVE', 'VIDEO', 'AUDIO'].includes(t.type)).length;
    const devCount = tools.filter(t => ['DEV', 'CODE'].includes(t.type)).length;
    const writingCount = tools.filter(t => t.type === 'WRITING').length;

    return { chatbotCount, creativeCount, devCount, writingCount };
  }, [state.tools]);

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

  // Get chatbot tools for LLM Platforms sub-items
  const chatbotTools = useMemo(() =>
    Object.values(state.tools).filter(t => t.type === 'CHATBOT'),
    [state.tools]
  );

  return (
    <div className={cn(
      "flex flex-col h-full w-[240px] min-w-[240px]",
      "bg-sidebar text-sidebar-foreground",
      className
    )}>
      {/* Header */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded">
              <Box className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm tracking-tight text-foreground">AI Vault</h2>
          </div>
          <div className="flex items-center gap-0.5">
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-foreground/10"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">Manage</DropdownMenuLabel>
                <DropdownMenuSeparator />
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
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
          <Input
            id="sidebar-search"
            placeholder="Search All..."
            className={cn(
              "pl-8 h-8 text-[11px] bg-secondary border-border",
              "text-foreground placeholder:text-muted-foreground",
              "focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:bg-card"
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

          {/* ALL TOOLS Section */}
          <SectionHeader
            label="ALL TOOLS"
            count={allToolsCount || 24}
            isExpanded={expandedSections.alltools}
            onToggle={() => toggleSection('alltools')}
          />
          {expandedSections.alltools && (
            <div className="mb-2">
              {/* Chatbots */}
              <SidebarItem
                id="chatbots"
                label="Chatbots"
                icon={<Bot className="w-3.5 h-3.5" />}
                count={aiToolsTree.chatbotCount || 8}
                isExpanded={expandedCategories.chatbots}
                isSelected={state.typeFilter === 'CHATBOT'}
                hasChildren={true}
                depth={1}
                onToggle={() => toggleCategory('chatbots')}
                onClick={() => {
                  dispatch({ type: 'CLEAR_ALL_FILTERS' });
                  dispatch({ type: 'SET_TYPE_FILTER', payload: { filter: 'CHATBOT' } });
                }}
              />
              {expandedCategories.chatbots && (
                <div>
                  {/* LLM Platforms */}
                  <SidebarItem
                    id="llmplatforms"
                    label="LLM Platforms"
                    icon={<Folder className="w-3 h-3" />}
                    isExpanded={expandedCategories.llmplatforms}
                    hasChildren={true}
                    depth={2}
                    onToggle={() => toggleCategory('llmplatforms')}
                  />
                  {expandedCategories.llmplatforms && (
                    <div>
                      <SidebarItem id="consumer" label="Consumer" depth={3} icon={<span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />} />
                      <SidebarItem id="anthropic-sub" label="Anthropic" depth={3} icon={<span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />} />
                      <SidebarItem id="openai-sub" label="OpenAI" depth={3} icon={<span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />} />
                      <SidebarItem id="gpt4turbo" label="GPT-4 Turbo" depth={3} icon={<span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />} />
                      <SidebarItem id="gpt4o" label="GPT-4o" depth={3} icon={<span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />} />
                    </div>
                  )}
                </div>
              )}

              {/* Anthropic with count */}
              <SidebarItem
                id="anthropic"
                label="Anthropic"
                icon={<span className="text-[10px]">A</span>}
                count={2}
                isExpanded={expandedCategories.anthropic}
                hasChildren={true}
                depth={1}
                onToggle={() => toggleCategory('anthropic')}
              />
              {expandedCategories.anthropic && (
                <div>
                  <SidebarItem id="claude35" label="Claude 3.5" depth={2} icon={<span className="w-1.5 h-1.5 rounded-full bg-slate-500" />} />
                  <SidebarItem id="claude3opus" label="Claude 3 Opus" depth={2} icon={<span className="w-1.5 h-1.5 rounded-full bg-slate-500" />} />
                </div>
              )}

              {/* Creative */}
              <SidebarItem
                id="creative"
                label="Creative"
                icon={<Sparkles className="w-3.5 h-3.5 text-pink-400" />}
                count={aiToolsTree.creativeCount || 32}
                isExpanded={expandedCategories.creative}
                isSelected={state.typeFilter === 'IMAGE' || state.typeFilter === 'VIDEO' || state.typeFilter === 'AUDIO'}
                hasChildren={true}
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
                hasChildren={true}
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
                hasChildren={true}
                depth={1}
                onToggle={() => toggleCategory('writing')}
                onClick={() => {
                  dispatch({ type: 'CLEAR_ALL_FILTERS' });
                  dispatch({ type: 'SET_TYPE_FILTER', payload: { filter: 'WRITING' } });
                }}
              />
            </div>
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
