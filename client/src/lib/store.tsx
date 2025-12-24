import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Tool, Category, AppState, INITIAL_CATEGORIES, INITIAL_TOOLS, generateId } from './data';

// Actions
type Action =
  | { type: 'ADD_TOOL'; payload: Omit<Tool, 'id' | 'createdAt' | 'isPinned'> }
  | { type: 'UPDATE_TOOL'; payload: Partial<Tool> & { id: string } }
  | { type: 'DELETE_TOOL'; payload: { id: string } }
  | { type: 'ADD_CATEGORY'; payload: { name: string } }
  | { type: 'DELETE_CATEGORY'; payload: { id: string } }
  | { type: 'RENAME_CATEGORY'; payload: { id: string; name: string } }
  | { type: 'TOGGLE_CATEGORY'; payload: { id: string } }
  | { type: 'TOGGLE_PIN'; payload: { id: string } }
  | { type: 'SELECT_TOOL'; payload: { id: string | null } }
  | { type: 'SET_SEARCH_QUERY'; payload: { query: string } }
  | { type: 'REORDER_TOOLS'; payload: { categoryId: string; newOrder: string[] } }
  | { type: 'IMPORT_DATA'; payload: { categories: Category[]; tools: Record<string, Tool> } }
  | { type: 'TOGGLE_SIDEBAR' };

// Initial State
const initialState: AppState = {
  categories: INITIAL_CATEGORIES,
  tools: INITIAL_TOOLS,
  selectedToolId: null,
  searchQuery: '',
  isSidebarOpen: true,
};

// Reducer
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_TOOL': {
      const newId = generateId();
      const newTool: Tool = {
        ...action.payload,
        id: newId,
        createdAt: Date.now(),
        isPinned: false,
      };
      
      const categoryIndex = state.categories.findIndex(c => c.id === newTool.categoryId);
      if (categoryIndex === -1) return state;

      const newCategories = [...state.categories];
      newCategories[categoryIndex] = {
        ...newCategories[categoryIndex],
        toolIds: [...newCategories[categoryIndex].toolIds, newId]
      };

      return {
        ...state,
        tools: { ...state.tools, [newId]: newTool },
        categories: newCategories,
        selectedToolId: newId, // Select newly added tool
      };
    }
    case 'UPDATE_TOOL': {
      const { id, ...updates } = action.payload;
      if (!state.tools[id]) return state;

      const oldTool = state.tools[id];
      // Merge updates, but specifically handle optional fields that might be cleared
      const newTool = { 
         ...oldTool, 
         ...updates,
         // Ensure arrays are handled correctly if passed in payload
         capabilities: updates.capabilities || oldTool.capabilities || [],
         bestFor: updates.bestFor || oldTool.bestFor || [],
      };
      
      // Handle Category Change
      let newCategories = state.categories;
      if (updates.categoryId && updates.categoryId !== oldTool.categoryId) {
        newCategories = state.categories.map(cat => {
          if (cat.id === oldTool.categoryId) {
            return { ...cat, toolIds: cat.toolIds.filter(tid => tid !== id) };
          }
          if (cat.id === updates.categoryId) {
            return { ...cat, toolIds: [...cat.toolIds, id] };
          }
          return cat;
        });
      }

      return {
        ...state,
        tools: { ...state.tools, [id]: newTool },
        categories: newCategories,
      };
    }
    case 'DELETE_TOOL': {
      const { id } = action.payload;
      const tool = state.tools[id];
      if (!tool) return state;

      const newTools = { ...state.tools };
      delete newTools[id];

      const newCategories = state.categories.map(cat => ({
        ...cat,
        toolIds: cat.toolIds.filter(tid => tid !== id)
      }));

      return {
        ...state,
        tools: newTools,
        categories: newCategories,
        selectedToolId: state.selectedToolId === id ? null : state.selectedToolId,
      };
    }
    case 'ADD_CATEGORY': {
      const newId = generateId();
      const newCategory: Category = {
        id: newId,
        name: action.payload.name,
        collapsed: false,
        toolIds: [],
      };
      return {
        ...state,
        categories: [...state.categories, newCategory],
      };
    }
    case 'DELETE_CATEGORY': {
      // Moves tools to "Uncategorized" or deletes them?
      // Let's delete the tools for simplicity, or move them to the first available category.
      // Request says "delete categories", implies management.
      // I'll just prevent deleting if it has tools, or delete all tools within.
      // Let's go with: Delete category also deletes its tools for now to keep it simple, or user has to empty it first.
      // Better UX: Move to a default "Uncategorized" category if it exists, or just delete tools.
      // I will implement "Delete tools within" for simplicity in this prototype.
      
      const catId = action.payload.id;
      const category = state.categories.find(c => c.id === catId);
      if (!category) return state;

      const toolsToDelete = category.toolIds;
      const newTools = { ...state.tools };
      toolsToDelete.forEach(tid => delete newTools[tid]);

      return {
        ...state,
        categories: state.categories.filter(c => c.id !== catId),
        tools: newTools,
        selectedToolId: toolsToDelete.includes(state.selectedToolId || '') ? null : state.selectedToolId,
      };
    }
    case 'RENAME_CATEGORY': {
      return {
        ...state,
        categories: state.categories.map(c => 
          c.id === action.payload.id ? { ...c, name: action.payload.name } : c
        ),
      };
    }
    case 'TOGGLE_CATEGORY': {
      return {
        ...state,
        categories: state.categories.map(c => 
          c.id === action.payload.id ? { ...c, collapsed: !c.collapsed } : c
        ),
      };
    }
    case 'TOGGLE_PIN': {
      const tool = state.tools[action.payload.id];
      if (!tool) return state;
      return {
        ...state,
        tools: {
          ...state.tools,
          [action.payload.id]: { ...tool, isPinned: !tool.isPinned }
        }
      };
    }
    case 'SELECT_TOOL': {
      return { ...state, selectedToolId: action.payload.id };
    }
    case 'SET_SEARCH_QUERY': {
      return { ...state, searchQuery: action.payload.query };
    }
    case 'REORDER_TOOLS': {
      const { categoryId, newOrder } = action.payload;
      return {
        ...state,
        categories: state.categories.map(c => 
          c.id === categoryId ? { ...c, toolIds: newOrder } : c
        ),
      };
    }
    case 'IMPORT_DATA': {
      return {
        ...state,
        categories: action.payload.categories,
        tools: action.payload.tools,
        selectedToolId: null,
      };
    }
    case 'TOGGLE_SIDEBAR': {
      return { ...state, isSidebarOpen: !state.isSidebarOpen };
    }
    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'ai_tool_vault_v1';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
    const persisted = localStorage.getItem(STORAGE_KEY);
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted);
        // Basic schema validation could go here
        return { ...initial, ...parsed, searchQuery: '' }; // Reset transient state
      } catch (e) {
        console.error("Failed to load state from localStorage", e);
      }
    }
    return initial;
  });

  useEffect(() => {
    const { searchQuery, isSidebarOpen, selectedToolId, ...persistedState } = state;
    // We persist selectedToolId too if we want, but let's persist the main data
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
       categories: state.categories,
       tools: state.tools
    }));
  }, [state.categories, state.tools]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
