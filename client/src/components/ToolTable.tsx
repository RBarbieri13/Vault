import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { 
  ColumnDef, 
  flexRender, 
  getCoreRowModel, 
  getSortedRowModel, 
  useReactTable, 
  SortingState,
  getFilteredRowModel,
  RowSelectionState
} from '@tanstack/react-table';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Star, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  ArrowUpDown, 
  ExternalLink,
  Bot,
  Palette,
  Code2,
  Cpu,
  MessageSquare
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tool } from '@/lib/data';
import { format } from 'date-fns';
import { ToolModal } from './ToolModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';

// Helper for type badges
const getTypeColor = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('chat') || t.includes('assistant')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  if (t.includes('image') || t.includes('design') || t.includes('creative')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800';
  if (t.includes('dev') || t.includes('code') || t.includes('agent')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  if (t.includes('sim') || t.includes('data')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
};

// Helper for icons based on type
const getTypeIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('chat') || t.includes('assistant')) return <MessageSquare className="w-4 h-4 text-blue-500" />;
  if (t.includes('image') || t.includes('design')) return <Palette className="w-4 h-4 text-purple-500" />;
  if (t.includes('dev') || t.includes('code')) return <Code2 className="w-4 h-4 text-emerald-500" />;
  if (t.includes('sim') || t.includes('agent')) return <Cpu className="w-4 h-4 text-amber-500" />;
  return <Bot className="w-4 h-4 text-slate-500" />;
};

// Helper for tag colors (deterministic hash)
const getTagColor = (tag: string) => {
  const colors = [
    'text-pink-600 bg-pink-50 border-pink-200',
    'text-indigo-600 bg-indigo-50 border-indigo-200',
    'text-cyan-600 bg-cyan-50 border-cyan-200',
    'text-orange-600 bg-orange-50 border-orange-200',
    'text-teal-600 bg-teal-50 border-teal-200',
  ];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export function ToolTable() {
  const { state, dispatch } = useApp();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editingTool, setEditingTool] = useState<Tool | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter tools based on search query
  const filteredTools = useMemo(() => {
    const query = state.searchQuery.toLowerCase();
    return Object.values(state.tools).filter(tool => 
      tool.name.toLowerCase().includes(query) ||
      tool.summary.toLowerCase().includes(query) ||
      tool.tags.some(t => t.toLowerCase().includes(query)) ||
      tool.whatItIs.toLowerCase().includes(query)
    );
  }, [state.tools, state.searchQuery]);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this tool?")) {
      dispatch({ type: 'DELETE_TOOL', payload: { id } });
      toast({ title: "Tool Deleted", description: "Tool has been removed from the vault." });
    }
  };

  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
    setIsModalOpen(true);
  };

  const columns: ColumnDef<Tool>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: "icon",
      header: "",
      cell: ({ row }) => <div className="flex items-center justify-center">{getTypeIcon(row.original.type)}</div>,
      size: 40,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 h-8 data-[state=open]:bg-accent"
          >
            Name
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="flex flex-col max-w-[200px]">
          <span className="font-medium truncate">{row.getValue("name")}</span>
          <a 
            href={row.original.url} 
            target="_blank" 
            rel="noreferrer" 
            className="text-[10px] text-muted-foreground truncate hover:underline hover:text-primary flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.url.replace(/^https?:\/\//, '')}
            <ExternalLink className="w-2 h-2" />
          </a>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 h-8"
          >
            Type
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <Badge variant="outline" className={`font-normal whitespace-nowrap ${getTypeColor(row.getValue("type"))}`}>
          {row.getValue("type")}
        </Badge>
      ),
    },
    {
      accessorKey: "whatItIs",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate text-muted-foreground" title={row.getValue("whatItIs") || row.original.summary}>
          {row.getValue("whatItIs") || row.original.summary}
        </div>
      ),
    },
    {
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {(row.getValue("tags") as string[]).slice(0, 3).map((tag) => (
            <span key={tag} className={`px-1.5 py-0.5 rounded-full text-[10px] border ${getTagColor(tag)}`}>
              {tag}
            </span>
          ))}
          {(row.getValue("tags") as string[]).length > 3 && (
            <span className="text-[10px] text-muted-foreground px-1 self-center">
              +{(row.getValue("tags") as string[]).length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 h-8"
          >
            Date
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap">
          {format(row.getValue("createdAt"), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const tool = row.original;
        return (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'TOGGLE_PIN', payload: { id: tool.id } });
                  }}
                >
                  <Star className={`h-3.5 w-3.5 ${tool.isPinned ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Favorite</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(tool);
                  }}
                >
                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(tool.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        )
      },
      size: 100,
    },
  ];

  const table = useReactTable({
    data: filteredTools,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
  });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-950">
      {/* Sticky Header Row */}
      <div className="flex-none border-b bg-muted/30">
        <Table>
          <TableHeader className="bg-muted/30 sticky top-0 z-10 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() }} className="h-10 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
        </Table>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group h-[48px] hover:bg-muted/40 data-[state=selected]:bg-muted/60 border-b border-border/40 transition-colors"
                  onClick={() => dispatch({ type: 'SELECT_TOOL', payload: { id: row.original.id } })}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={{ width: cell.column.getSize() }} className="py-1 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <div className="p-3 rounded-full bg-muted/50">
                      <Bot className="w-6 h-6" />
                    </div>
                    <p>No tools found.</p>
                    <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                      Add Your First Tool
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ToolModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingTool(undefined); }} 
        toolToEdit={editingTool} 
      />
    </div>
  );
}
