import React from 'react';
import { cn } from '@/lib/utils';

interface Shortcut {
  keys: string[];
  label: string;
}

const shortcuts: Shortcut[] = [
  { keys: ['⌘', 'K'], label: 'Search' },
  { keys: ['⌘', 'N'], label: 'New' },
  { keys: ['⌘', 'E'], label: 'Edit' },
  { keys: ['⌘', 'D'], label: 'Duplicate' },
  { keys: ['⌘', '⌫'], label: 'Delete' },
  { keys: ['Tab'], label: 'Navigate' },
  { keys: ['Space'], label: 'Select' },
  { keys: ['⌘', 'A'], label: 'Select All' },
  { keys: ['?'], label: 'Help' },
];

interface KeyboardShortcutsBarProps {
  className?: string;
}

export function KeyboardShortcutsBar({ className }: KeyboardShortcutsBarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 px-4 h-[20px] min-h-[20px]",
        "bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700",
        className
      )}
    >
      {shortcuts.map((shortcut, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-slate-300 dark:text-slate-600">|</span>
          )}
          <div className="flex items-center gap-1">
            {shortcut.keys.map((key, i) => (
              <kbd
                key={i}
                className={cn(
                  "text-[8px] px-1 py-0.5 font-mono",
                  "bg-slate-200 dark:bg-slate-700 rounded",
                  "text-slate-600 dark:text-slate-300",
                  "border border-slate-300 dark:border-slate-600"
                )}
              >
                {key}
              </kbd>
            ))}
            <span className="text-[9px] text-slate-500 dark:text-slate-400 ml-0.5">
              {shortcut.label}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
