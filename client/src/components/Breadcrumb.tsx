import React from 'react';
import { cn } from '@/lib/utils';
import { Home, Bot, MessageSquare, Cpu } from 'lucide-react';
import { useApp } from '@/lib/store';
import type { ToolType } from '@/lib/data';

interface NavigationTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  filter?: {
    type: 'clear' | 'type' | 'tag';
    value?: ToolType | string;
  };
}

const navigationTabs: NavigationTab[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <Home className="w-3.5 h-3.5" />,
    filter: { type: 'clear' },
  },
  {
    id: 'ai-tools',
    label: 'AI Tools',
    icon: <Cpu className="w-3.5 h-3.5" />,
    filter: { type: 'clear' }, // Shows all AI tools
  },
  {
    id: 'chatbots',
    label: 'Chatbots',
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    filter: { type: 'type', value: 'CHATBOT' },
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: <Bot className="w-3.5 h-3.5" />,
    filter: { type: 'type', value: 'AGENT' },
  },
];

interface BreadcrumbProps {
  className?: string;
}

export function Breadcrumb({ className }: BreadcrumbProps) {
  const { state, dispatch } = useApp();

  // Determine which tab is active based on current filters
  const getActiveTabId = (): string => {
    if (state.typeFilter === 'CHATBOT') return 'chatbots';
    if (state.typeFilter === 'AGENT') return 'agents';
    if (state.typeFilter === 'all' && state.tagFilters.length === 0) {
      return 'home';
    }
    return 'ai-tools';
  };

  const activeTabId = getActiveTabId();

  const handleTabClick = (tab: NavigationTab) => {
    if (!tab.filter) return;

    switch (tab.filter.type) {
      case 'clear':
        dispatch({ type: 'CLEAR_ALL_FILTERS' });
        break;
      case 'type':
        dispatch({ type: 'CLEAR_ALL_FILTERS' });
        dispatch({ type: 'SET_TYPE_FILTER', payload: { filter: tab.filter.value as ToolType } });
        break;
      case 'tag':
        dispatch({ type: 'CLEAR_ALL_FILTERS' });
        dispatch({ type: 'ADD_TAG_FILTER', payload: { tag: tab.filter.value as string } });
        break;
    }
  };

  return (
    <nav
      className={cn(
        "flex items-center gap-1 px-3 h-[32px] min-h-[32px]",
        "bg-card border-b border-border",
        "text-[11px]",
        className
      )}
      aria-label="Navigation"
    >
      {navigationTabs.map((tab, index) => {
        const isActive = tab.id === activeTabId;

        return (
          <React.Fragment key={tab.id}>
            {index > 0 && (
              <span className="text-muted-foreground/50 mx-0.5 text-[10px]">›</span>
            )}
            <button
              onClick={() => handleTabClick(tab)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md",
                "transition-all duration-150",
                "hover:bg-accent/50",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// Legacy export for backwards compatibility
export const defaultBreadcrumb = navigationTabs.map(tab => ({
  label: tab.label,
  href: undefined,
}));
