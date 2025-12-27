import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      className={cn(
        "flex items-center gap-1 px-3 h-[28px] min-h-[28px]",
        "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700",
        "text-[10px] text-slate-500 dark:text-slate-400",
        className
      )}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isFirst = index === 0;

        return (
          <React.Fragment key={index}>
            {isFirst && (
              <Home className="w-3 h-3 mr-0.5" />
            )}
            {index > 0 && (
              <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
            )}
            {item.href && !isLast ? (
              <a
                href={item.href}
                className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                {item.icon && <span className="mr-1">{item.icon}</span>}
                {item.label}
              </a>
            ) : (
              <span
                className={cn(
                  isLast && "text-slate-700 dark:text-slate-200 font-medium"
                )}
              >
                {item.icon && <span className="mr-1">{item.icon}</span>}
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// Default breadcrumb items for the main view
export const defaultBreadcrumb: BreadcrumbItem[] = [
  { label: 'Home', href: '/' },
  { label: 'AI Tools', href: '/tools' },
  { label: 'Chatbots', href: '/tools/chatbots' },
  { label: 'LLM Platforms' },
];
