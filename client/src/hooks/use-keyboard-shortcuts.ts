import { useEffect, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useApp } from '@/lib/store';

interface KeyboardShortcutOptions {
  onAddTool?: () => void;
  onSearch?: () => void;
  onToggleSidebar?: () => void;
  onRefresh?: () => void;
  onNextTool?: () => void;
  onPrevTool?: () => void;
  onOpenTool?: () => void;
  onDeleteTool?: () => void;
  onTogglePin?: () => void;
}

export function useKeyboardShortcuts(options: KeyboardShortcutOptions = {}) {
  const { state, dispatch } = useApp();

  const {
    onAddTool,
    onSearch,
    onToggleSidebar,
    onRefresh,
    onNextTool,
    onPrevTool,
    onOpenTool,
    onDeleteTool,
    onTogglePin,
  } = options;

  // Get sorted tool list for navigation
  const getToolList = useCallback(() => {
    return Object.values(state.tools).sort((a, b) => a.name.localeCompare(b.name));
  }, [state.tools]);

  // Navigate to next tool
  const handleNextTool = useCallback(() => {
    const tools = getToolList();
    if (tools.length === 0) return;

    const currentIndex = state.selectedToolId
      ? tools.findIndex(t => t.id === state.selectedToolId)
      : -1;

    const nextIndex = currentIndex < tools.length - 1 ? currentIndex + 1 : 0;
    dispatch({ type: 'SELECT_TOOL', payload: { id: tools[nextIndex].id } });
  }, [state.selectedToolId, getToolList, dispatch]);

  // Navigate to previous tool
  const handlePrevTool = useCallback(() => {
    const tools = getToolList();
    if (tools.length === 0) return;

    const currentIndex = state.selectedToolId
      ? tools.findIndex(t => t.id === state.selectedToolId)
      : 0;

    const prevIndex = currentIndex > 0 ? currentIndex - 1 : tools.length - 1;
    dispatch({ type: 'SELECT_TOOL', payload: { id: tools[prevIndex].id } });
  }, [state.selectedToolId, getToolList, dispatch]);

  // Open current tool URL
  const handleOpenTool = useCallback(() => {
    if (state.selectedToolId) {
      const tool = state.tools[state.selectedToolId];
      if (tool?.url) {
        window.open(tool.url, '_blank');
      }
    }
  }, [state.selectedToolId, state.tools]);

  // Toggle pin for current tool
  const handleTogglePin = useCallback(() => {
    if (state.selectedToolId) {
      dispatch({ type: 'TOGGLE_PIN', payload: { id: state.selectedToolId } });
    }
  }, [state.selectedToolId, dispatch]);

  // Cmd/Ctrl + K - Focus search
  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch();
    } else {
      document.getElementById('search-tools')?.focus();
    }
  }, { enableOnFormTags: true });

  // Cmd/Ctrl + N - New tool
  useHotkeys('mod+n', (e) => {
    e.preventDefault();
    onAddTool?.();
  });

  // Cmd/Ctrl + B - Toggle sidebar
  useHotkeys('mod+b', (e) => {
    e.preventDefault();
    if (onToggleSidebar) {
      onToggleSidebar();
    } else {
      dispatch({ type: 'TOGGLE_SIDEBAR' });
    }
  });

  // Cmd/Ctrl + R - Refresh (but not browser refresh)
  useHotkeys('mod+shift+r', (e) => {
    e.preventDefault();
    onRefresh?.();
  });

  // Arrow down - Next tool
  useHotkeys('down', (e) => {
    // Only if not in an input
    if (document.activeElement?.tagName === 'INPUT') return;
    e.preventDefault();
    if (onNextTool) {
      onNextTool();
    } else {
      handleNextTool();
    }
  });

  // Arrow up - Previous tool
  useHotkeys('up', (e) => {
    // Only if not in an input
    if (document.activeElement?.tagName === 'INPUT') return;
    e.preventDefault();
    if (onPrevTool) {
      onPrevTool();
    } else {
      handlePrevTool();
    }
  });

  // Enter - Open tool URL
  useHotkeys('enter', (e) => {
    // Only if not in an input
    if (document.activeElement?.tagName === 'INPUT') return;
    e.preventDefault();
    if (onOpenTool) {
      onOpenTool();
    } else {
      handleOpenTool();
    }
  });

  // P - Toggle pin
  useHotkeys('p', (e) => {
    // Only if not in an input
    if (document.activeElement?.tagName === 'INPUT') return;
    e.preventDefault();
    if (onTogglePin) {
      onTogglePin();
    } else {
      handleTogglePin();
    }
  });

  // Escape - Deselect / clear search
  useHotkeys('escape', (e) => {
    e.preventDefault();
    if (state.searchQuery) {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: { query: '' } });
    } else if (state.selectedToolId) {
      dispatch({ type: 'SELECT_TOOL', payload: { id: null } });
    }
    // Blur any focused input
    (document.activeElement as HTMLElement)?.blur?.();
  });

  // Delete/Backspace - Delete selected tool
  useHotkeys('delete, backspace', (e) => {
    // Only if not in an input
    if (document.activeElement?.tagName === 'INPUT') return;
    e.preventDefault();
    if (state.selectedToolId) {
      onDeleteTool?.();
    }
  });

  // Slash - Focus search (vim-like)
  useHotkeys('/', (e) => {
    // Only if not in an input
    if (document.activeElement?.tagName === 'INPUT') return;
    e.preventDefault();
    document.getElementById('search-tools')?.focus();
  });

  return {
    handleNextTool,
    handlePrevTool,
    handleOpenTool,
    handleTogglePin,
  };
}

// Keyboard shortcut display component data
export const KEYBOARD_SHORTCUTS = [
  { keys: ['⌘', 'K'], description: 'Search' },
  { keys: ['⌘', 'N'], description: 'New tool' },
  { keys: ['⌘', 'B'], description: 'Toggle sidebar' },
  { keys: ['↑', '↓'], description: 'Navigate tools' },
  { keys: ['Enter'], description: 'Open URL' },
  { keys: ['P'], description: 'Toggle pin' },
  { keys: ['Esc'], description: 'Clear / deselect' },
  { keys: ['/'], description: 'Focus search' },
];
