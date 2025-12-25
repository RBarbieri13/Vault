import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Tool, Category, AppState, generateId } from './data';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Actions
type Action =
  | { type: 'SET_INITIAL_DATA'; payload: { categories: Category[]; tools: Tool[] } }
  | { type: 'ADD_TOOL'; payload: Tool }
  | { type: 'UPDATE_TOOL'; payload: Partial<Tool> & { id: string } }
  | { type: 'DELETE_TOOL'; payload: { id: string } }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Partial<Category> & { id: string } }
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
  categories: [],
  tools: {},
  selectedToolId: null,
  searchQuery: '',
  isSidebarOpen: true,
};

// Reducer
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_INITIAL_DATA': {
      const toolsMap: Record<string, Tool> = {};
      action.payload.tools.forEach(tool => {
        toolsMap[tool.id] = {
          ...tool,
          createdAt: new Date(tool.createdAt).getTime(),
        };
      });
      return {
        ...state,
        categories: action.payload.categories,
        tools: toolsMap,
      };
    }
    case 'ADD_TOOL': {
      const newTool = {
        ...action.payload,
        createdAt: new Date(action.payload.createdAt).getTime(),
      };
      
      const categoryIndex = state.categories.findIndex(c => c.id === newTool.categoryId);
      if (categoryIndex === -1) return state;

      const newCategories = [...state.categories];
      newCategories[categoryIndex] = {
        ...newCategories[categoryIndex],
        toolIds: [...newCategories[categoryIndex].toolIds, newTool.id]
      };

      return {
        ...state,
        tools: { ...state.tools, [newTool.id]: newTool },
        categories: newCategories,
        selectedToolId: newTool.id,
      };
    }
    case 'UPDATE_TOOL': {
      const { id, ...updates } = action.payload;
      if (!state.tools[id]) return state;

      const oldTool = state.tools[id];
      const newTool = { 
         ...oldTool, 
         ...updates,
         capabilities: updates.capabilities || oldTool.capabilities || [],
         bestFor: updates.bestFor || oldTool.bestFor || [],
      };
      
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
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };
    }
    case 'UPDATE_CATEGORY': {
      const { id, ...updates } = action.payload;
      return {
        ...state,
        categories: state.categories.map(c => 
          c.id === id ? { ...c, ...updates } : c
        ),
      };
    }
    case 'DELETE_CATEGORY': {
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
  isLoading: boolean;
  apiMutations: {
    createTool: (tool: Omit<Tool, 'id' | 'createdAt'>) => Promise<void>;
    updateTool: (id: string, updates: Partial<Tool>) => Promise<void>;
    deleteTool: (id: string) => Promise<void>;
    createCategory: (name: string) => Promise<void>;
    updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const queryClient = useQueryClient();

  // Fetch initial data
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json() as Promise<Category[]>;
    },
  });

  const { data: toolsData, isLoading: toolsLoading } = useQuery({
    queryKey: ['tools'],
    queryFn: async () => {
      const res = await fetch('/api/tools');
      if (!res.ok) throw new Error('Failed to fetch tools');
      return res.json() as Promise<Tool[]>;
    },
  });

  useEffect(() => {
    if (categoriesData && toolsData) {
      dispatch({
        type: 'SET_INITIAL_DATA',
        payload: { categories: categoriesData, tools: toolsData },
      });
    }
  }, [categoriesData, toolsData]);

  // API mutations
  const createToolMutation = useMutation({
    mutationFn: async (tool: Omit<Tool, 'id' | 'createdAt'>) => {
      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tool),
      });
      if (!res.ok) throw new Error('Failed to create tool');
      return res.json() as Promise<Tool>;
    },
    onSuccess: (newTool) => {
      dispatch({ type: 'ADD_TOOL', payload: newTool });
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });

  const updateToolMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Tool> }) => {
      const res = await fetch(`/api/tools/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update tool');
      return res.json() as Promise<Tool>;
    },
    onSuccess: (updatedTool) => {
      dispatch({ type: 'UPDATE_TOOL', payload: updatedTool });
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });

  const deleteToolMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tools/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete tool');
    },
    onSuccess: (_, id) => {
      dispatch({ type: 'DELETE_TOOL', payload: { id } });
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, collapsed: false, toolIds: [] }),
      });
      if (!res.ok) throw new Error('Failed to create category');
      return res.json() as Promise<Category>;
    },
    onSuccess: (newCategory) => {
      dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Category> }) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update category');
      return res.json() as Promise<Category>;
    },
    onSuccess: (updatedCategory) => {
      dispatch({ type: 'UPDATE_CATEGORY', payload: updatedCategory });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete category');
    },
    onSuccess: (_, id) => {
      dispatch({ type: 'DELETE_CATEGORY', payload: { id } });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const apiMutations = {
    createTool: async (tool: Omit<Tool, 'id' | 'createdAt'>) => {
      await createToolMutation.mutateAsync(tool);
    },
    updateTool: async (id: string, updates: Partial<Tool>) => {
      await updateToolMutation.mutateAsync({ id, updates });
    },
    deleteTool: async (id: string) => {
      await deleteToolMutation.mutateAsync(id);
    },
    createCategory: async (name: string) => {
      await createCategoryMutation.mutateAsync(name);
    },
    updateCategory: async (id: string, updates: Partial<Category>) => {
      await updateCategoryMutation.mutateAsync({ id, updates });
    },
    deleteCategory: async (id: string) => {
      await deleteCategoryMutation.mutateAsync(id);
    },
  };

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch, 
      isLoading: categoriesLoading || toolsLoading,
      apiMutations,
    }}>
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
