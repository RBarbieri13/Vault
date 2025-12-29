import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Home, Folder } from 'lucide-react';

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
        "flex items-center gap-1.5 px-3 h-[28px] min-h-[28px]",
        "bg-slate-50 dark:bg-[#1e2433] border-b border-slate-200 dark:border-slate-700/50",
        "text-[11px]",
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
              <Home className="w-3.5 h-3.5 mr-0.5 text-slate-400 dark:text-slate-500" />
            )}
            {index > 0 && (
              <span className="text-slate-400 dark:text-slate-500 mx-1 text-[10px]">›</span>
            )}
            {!isFirst && !isLast && (
              <Folder className="w-3 h-3 mr-0.5 text-slate-400 dark:text-slate-500" />
            )}
            {item.href && !isLast ? (
              <a
                href={item.href}
                className={cn(
                  "text-slate-500 dark:text-slate-400",
                  "hover:text-slate-700 dark:hover:text-blue-400",
                  "hover:underline transition-colors cursor-pointer"
                )}
              >
                {item.icon && <span className="mr-1">{item.icon}</span>}
                {item.label}
              </a>
            ) : (
              <span
                className={cn(
                  "text-slate-500 dark:text-slate-400",
                  isLast && "text-slate-800 dark:text-slate-100 font-medium"
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
