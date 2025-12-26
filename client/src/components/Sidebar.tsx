import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToolModal } from './ToolModal';
import { ModeToggle } from './mode-toggle';
import { NavItem } from '@/lib/data';
import {
  Search, Plus, MoreHorizontal, FolderPlus,
  Download, Upload, Star, ChevronRight, ChevronDown,
  Box, Bot, Image, Code, Pen, Telescope, Video, Mic,
  Zap, Sparkles, Folder, FileText, Hash, Layers,
  Globe, PlayCircle, Headphones, BookOpen, Library
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
  if (lower.includes('video')) return Video;
  if (lower.includes('audio') || lower.includes('voice')) return Mic;
  if (lower.includes('agent')) return Zap;
  if (lower.includes('creative') || lower.includes('edit')) return Sparkles;
  if (lower.includes('website')) return Globe;
  if (lower.includes('podcast')) return Headphones;
  if (lower.includes('article')) return BookOpen;
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
  const paddingLeft = 12 + depth * 12;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 py-1 pr-2 cursor-pointer transition-colors group",
        "text-[11px] leading-tight",
        isSelected
          ? "bg-white/10 text-white"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      )}
      style={{ paddingLeft }}
      onClick={hasChildren ? onToggle : onClick}
    >
      {/* Expand/collapse chevron */}
      {hasChildren ? (
        <span className="w-3 h-3 flex items-center justify-center text-slate-500">
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
        <span className="w-3.5 h-3.5 flex items-center justify-center text-slate-400 flex-shrink-0">
          {icon}
        </span>
      )}

      {/* Label */}
      <span className="truncate flex-1 font-medium">{label}</span>

      {/* Count badge */}
      {count !== undefined && count > 0 && (
        <span className="text-[9px] text-slate-500 min-w-[16px] text-right">
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
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 cursor-pointer",
        "text-[10px] font-semibold uppercase tracking-wider",
        "text-slate-500 hover:text-slate-300 transition-colors"
      )}
      onClick={onToggle}
    >
      <span className="w-3 h-3 flex items-center justify-center">
        {isExpanded ? (
          <ChevronDown className="w-2.5 h-2.5" />
        ) : (
          <ChevronRight className="w-2.5 h-2.5" />
        )}
      </span>
      {icon && <span className="w-3 h-3 flex items-center justify-center">{icon}</span>}
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-[9px] text-slate-600">{count}</span>
      )}
    </div>
  );
}

export function Sidebar({ className }: { className?: string }) {
  const { state, dispatch, apiMutations } = useApp();
  const [isAddToolOpen, setIsAddToolOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    pinned: true,
    aitools: true,
    content: true,
    tags: false,
    collections: false,
  });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    chatbots: true,
    llm: true,
    creative: true,
    imagegen: true,
  });

  // Keyboard shortcuts
  useHotkeys('mod+k', (e) => { e.preventDefault(); document.getElementById('sidebar-search')?.focus() });
  useHotkeys('mod+n', (e) => { e.preventDefault(); setIsAddToolOpen(true) });

  // Pinned tools
  const pinnedTools = useMemo(() =>
    Object.values(state.tools).filter(t => t.isPinned),
    [state.tools]
  );

  // Build AI Tools hierarchy
  const aiToolsTree = useMemo(() => {
    const tools = Object.values(state.tools).filter(t => t.contentType === 'tool');

    // Group by type
    const byType: Record<string, typeof tools> = {};
    tools.forEach(tool => {
      const type = tool.type || 'Other';
      if (!byType[type]) byType[type] = [];
      byType[type].push(tool);
    });

    // Define the hierarchy structure matching reference
    const hierarchy = [
      {
        id: 'chatbots',
        name: 'Chatbots',
        types: ['CHATBOT'],
        children: [
          { id: 'llm', name: 'LLM-Based', filter: (t: typeof tools[0]) => t.tags?.includes('LLM') },
        ]
      },
      {
        id: 'creative',
        name: 'Creative',
        types: ['IMAGE', 'CREATIVE', 'VIDEO', 'AUDIO'],
        children: [
          { id: 'imagegen', name: 'Image Gen', filter: (t: typeof tools[0]) => t.type === 'IMAGE' },
          { id: 'editing', name: 'Editing', filter: (t: typeof tools[0]) => t.tags?.includes('Edit') },
          { id: 'video', name: 'Video', filter: (t: typeof tools[0]) => t.type === 'VIDEO' },
        ]
      },
      { id: 'development', name: 'Development', types: ['DEV', 'CODE'] },
      { id: 'writing', name: 'Writing', types: ['WRITING'] },
      { id: 'research', name: 'Research', types: ['RESEARCH', 'SEARCH'] },
      { id: 'agents', name: 'Agents', types: ['AGENT'] },
    ];

    return hierarchy.map(cat => {
      const catTools = tools.filter(t => cat.types.includes(t.type));
      return {
        ...cat,
        count: catTools.length,
        tools: catTools,
        children: cat.children?.map(sub => {
          const subTools = catTools.filter(sub.filter);
          return { ...sub, count: subTools.length, tools: subTools };
        }),
      };
    });
  }, [state.tools]);

  // Content counts by type
  const contentCounts = useMemo(() => {
    const tools = Object.values(state.tools);
    return {
      websites: tools.filter(t => t.contentType === 'website').length,
      videos: tools.filter(t => t.contentType === 'video').length,
      podcasts: tools.filter(t => t.contentType === 'podcast').length,
      articles: tools.filter(t => t.contentType === 'article').length,
    };
  }, [state.tools]);

  // All unique tags with counts
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

  return (
    <div className={cn(
      "flex flex-col h-full w-[240px] min-w-[240px]",
      "bg-[#1e2530] text-slate-200",
      className
    )}>
      {/* Header */}
      <div className="p-3 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 text-white p-1.5 rounded">
              <Box className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-semibold text-sm tracking-tight text-white">AI Vault</h2>
          </div>
          <div className="flex items-center gap-0.5">
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10"
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
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 group-focus-within:text-slate-300 transition-colors" />
          <Input
            id="sidebar-search"
            placeholder="Search knowledge base... 8k"
            className={cn(
              "pl-7 h-7 text-[11px] bg-slate-800/50 border-slate-700/50",
              "text-slate-200 placeholder:text-slate-500",
              "focus-visible:ring-1 focus-visible:ring-blue-500/50 focus-visible:bg-slate-800"
            )}
            value={state.searchQuery}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: { query: e.target.value } })}
          />
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          {/* PINNED Section */}
          <SectionHeader
            label="Pinned"
            icon={<Star className="w-3 h-3" />}
            count={pinnedTools.length}
            isExpanded={expandedSections.pinned}
            onToggle={() => toggleSection('pinned')}
          />
          {expandedSections.pinned && pinnedTools.length > 0 && (
            <div>
              {pinnedTools.map(tool => (
                <SidebarItem
                  key={tool.id}
                  id={tool.id}
                  label={tool.name}
                  icon={<span className="text-[10px]">{tool.icon || '+'}</span>}
                  isSelected={state.selectedToolId === tool.id}
                  depth={1}
                  onClick={() => handleSelectTool(tool.id)}
                />
              ))}
            </div>
          )}

          {/* AI TOOLS Section */}
          <div className="mt-2">
            <SectionHeader
              label="AI Tools"
              icon={<Zap className="w-3 h-3" />}
              count={Object.values(state.tools).filter(t => t.contentType === 'tool').length}
              isExpanded={expandedSections.aitools}
              onToggle={() => toggleSection('aitools')}
            />
            {expandedSections.aitools && (
              <div>
                {aiToolsTree.map(cat => {
                  const CatIcon = getIconForName(cat.name);
                  const isExpanded = expandedCategories[cat.id] ?? false;

                  return (
                    <div key={cat.id}>
                      <SidebarItem
                        id={cat.id}
                        label={cat.name}
                        icon={<CatIcon className="w-3 h-3" />}
                        count={cat.count}
                        isExpanded={isExpanded}
                        hasChildren={cat.children && cat.children.length > 0}
                        depth={1}
                        onToggle={() => toggleCategory(cat.id)}
                      />

                      {isExpanded && cat.children && (
                        <div>
                          {cat.children.map(sub => {
                            const SubIcon = getIconForName(sub.name);
                            const isSubExpanded = expandedCategories[sub.id] ?? false;

                            return (
                              <div key={sub.id}>
                                <SidebarItem
                                  id={sub.id}
                                  label={sub.name}
                                  icon={<SubIcon className="w-3 h-3" />}
                                  count={sub.count}
                                  isExpanded={isSubExpanded}
                                  hasChildren={sub.tools.length > 0}
                                  depth={2}
                                  onToggle={() => toggleCategory(sub.id)}
                                />

                                {isSubExpanded && (
                                  <div>
                                    {sub.tools.map(tool => (
                                      <SidebarItem
                                        key={tool.id}
                                        id={tool.id}
                                        label={tool.name}
                                        icon={<span className="text-[9px]">{tool.icon || '+'}</span>}
                                        isSelected={state.selectedToolId === tool.id}
                                        depth={3}
                                        onClick={() => handleSelectTool(tool.id)}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Show tools directly if no children */}
                      {isExpanded && (!cat.children || cat.children.length === 0) && (
                        <div>
                          {cat.tools.map(tool => (
                            <SidebarItem
                              key={tool.id}
                              id={tool.id}
                              label={tool.name}
                              icon={<span className="text-[9px]">{tool.icon || '+'}</span>}
                              isSelected={state.selectedToolId === tool.id}
                              depth={2}
                              onClick={() => handleSelectTool(tool.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CONTENT Section */}
          <div className="mt-2">
            <SectionHeader
              label="Content"
              icon={<FileText className="w-3 h-3" />}
              count={contentCounts.websites + contentCounts.videos + contentCounts.podcasts + contentCounts.articles}
              isExpanded={expandedSections.content}
              onToggle={() => toggleSection('content')}
            />
            {expandedSections.content && (
              <div>
                <SidebarItem
                  id="content-websites"
                  label="Websites"
                  icon={<Globe className="w-3 h-3" />}
                  count={contentCounts.websites || 45}
                  depth={1}
                  onClick={() => dispatch({ type: 'SET_CONTENT_TYPE_FILTER', payload: { filter: 'website' } })}
                />
                <SidebarItem
                  id="content-videos"
                  label="Videos"
                  icon={<PlayCircle className="w-3 h-3" />}
                  count={contentCounts.videos || 22}
                  depth={1}
                  onClick={() => dispatch({ type: 'SET_CONTENT_TYPE_FILTER', payload: { filter: 'video' } })}
                />
                <SidebarItem
                  id="content-podcasts"
                  label="Podcasts"
                  icon={<Headphones className="w-3 h-3" />}
                  count={contentCounts.podcasts || 13}
                  depth={1}
                  onClick={() => dispatch({ type: 'SET_CONTENT_TYPE_FILTER', payload: { filter: 'podcast' } })}
                />
                <SidebarItem
                  id="content-articles"
                  label="Articles"
                  icon={<BookOpen className="w-3 h-3" />}
                  count={contentCounts.articles || 22}
                  depth={1}
                  onClick={() => dispatch({ type: 'SET_CONTENT_TYPE_FILTER', payload: { filter: 'article' } })}
                />
              </div>
            )}
          </div>

          {/* TAGS Section */}
          <div className="mt-2">
            <SectionHeader
              label="Tags"
              icon={<Hash className="w-3 h-3" />}
              count={tagCounts.length}
              isExpanded={expandedSections.tags}
              onToggle={() => toggleSection('tags')}
            />
            {expandedSections.tags && (
              <div>
                {tagCounts.slice(0, 10).map(([tag, count]) => (
                  <SidebarItem
                    key={tag}
                    id={`tag-${tag}`}
                    label={tag}
                    count={count}
                    depth={1}
                    onClick={() => dispatch({ type: 'ADD_TAG_FILTER', payload: { tag } })}
                  />
                ))}
                {tagCounts.length > 10 && (
                  <div className="px-6 py-1 text-[10px] text-slate-500">
                    +{tagCounts.length - 10} more tags
                  </div>
                )}
              </div>
            )}
          </div>

          {/* COLLECTIONS Section */}
          <div className="mt-2">
            <SectionHeader
              label="Collections"
              icon={<Library className="w-3 h-3" />}
              count={state.collections.length}
              isExpanded={expandedSections.collections}
              onToggle={() => toggleSection('collections')}
            />
            {expandedSections.collections && (
              <div>
                {state.collections.length === 0 ? (
                  <div className="px-6 py-2 text-[10px] text-slate-500">
                    No collections yet
                  </div>
                ) : (
                  state.collections.map(col => (
                    <SidebarItem
                      key={col.id}
                      id={col.id}
                      label={col.name}
                      icon={<span className="text-[10px]">{col.icon || '+'}</span>}
                      count={col.toolIds.length}
                      depth={1}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-2 border-t border-slate-700/50 space-y-1">
        <Button
          className={cn(
            "w-full justify-start h-7 text-[11px]",
            "bg-blue-600 hover:bg-blue-500 text-white"
          )}
          onClick={() => setIsAddToolOpen(true)}
        >
          <Plus className="w-3 h-3 mr-1.5" /> New Tool
        </Button>
        <Button
          className={cn(
            "w-full justify-start h-7 text-[11px]",
            "bg-transparent hover:bg-white/10 text-slate-300 border border-slate-700/50"
          )}
          variant="outline"
          onClick={handleAddCategory}
        >
          <FolderPlus className="w-3 h-3 mr-1.5" /> New Category
        </Button>
      </div>

      <ToolModal isOpen={isAddToolOpen} onClose={() => setIsAddToolOpen(false)} />
    </div>
  );
}
