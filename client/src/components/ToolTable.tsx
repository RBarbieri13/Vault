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
  MessageSquare,
  Globe
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
import { cn } from "@/lib/utils";

// Helper for type badges - subtle, consistent palette with slight elevation
const getTypeColor = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('chat') || t.includes('assistant')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm';
  if (t.includes('image') || t.includes('design') || t.includes('creative')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 shadow-sm';
  if (t.includes('dev') || t.includes('code') || t.includes('agent')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 shadow-sm';
  if (t.includes('sim') || t.includes('data')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 shadow-sm';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-sm';
};

// Helper for icons based on type - standardized container
const TypeIcon = ({ type }: { type: string }) => {
  const t = type.toLowerCase();
  let Icon = Bot;
  let colorClass = "text-slate-500";
  
  if (t.includes('chat') || t.includes('assistant')) { Icon = MessageSquare; colorClass = "text-blue-500"; }
  else if (t.includes('image') || t.includes('design')) { Icon = Palette; colorClass = "text-purple-500"; }
  else if (t.includes('dev') || t.includes('code')) { Icon = Code2; colorClass = "text-emerald-500"; }
  else if (t.includes('sim') || t.includes('agent')) { Icon = Cpu; colorClass = "text-amber-500"; }
  else if (t.includes('web') || t.includes('site')) { Icon = Globe; colorClass = "text-cyan-500"; }

  return (
    <div className="w-9 h-9 rounded-md bg-muted/50 flex items-center justify-center shrink-0 border border-transparent group-hover:bg-muted group-hover:border-border/50 transition-colors">
      <Icon className={cn("w-5 h-5", colorClass)} />
    </div>
  );
};

// Helper for tag colors (deterministic hash) - pill style with elevation
const getTagColor = (tag: string) => {
  const colors = [
    'text-pink-700 bg-pink-50 border-pink-100 shadow-sm',
    'text-indigo-700 bg-indigo-50 border-indigo-100 shadow-sm',
    'text-cyan-700 bg-cyan-50 border-cyan-100 shadow-sm',
    'text-orange-700 bg-orange-50 border-orange-100 shadow-sm',
    'text-teal-700 bg-teal-50 border-teal-100 shadow-sm',
  ];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export function ToolTable() {
  const { state, dispatch, apiMutations } = useApp();
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

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this tool?")) {
      try {
        await apiMutations.deleteTool(id);
        toast({ title: "Tool Deleted", description: "Tool has been removed from the vault." });
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete tool.", variant: "destructive" });
      }
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
          className="translate-y-[2px] opacity-50 data-[state=checked]:opacity-100"
        />
      ),
      cell: ({ row }) => (
        <div className="border-l-[3px] border-transparent group-data-[state=selected]:border-primary h-full flex items-center pl-4 -ml-4 transition-colors">
           <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px] opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 transition-opacity"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: "icon",
      header: "",
      cell: ({ row }) => <TypeIcon type={row.original.type} />,
      size: 60,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 h-8 data-[state=open]:bg-accent font-semibold text-muted-foreground hover:text-foreground"
          >
            Name
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="flex flex-col max-w-[240px]">
          <span className="font-semibold text-base text-foreground truncate tracking-tight">{row.getValue("name")}</span>
          <a 
            href={row.original.url} 
            target="_blank" 
            rel="noreferrer" 
            className="text-[11px] text-muted-foreground truncate hover:underline hover:text-primary flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.url.replace(/^https?:\/\//, '')}
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: ({ column }) => {
        return (
          <div className="border-l border-border/40 pl-4 -ml-4 h-full flex items-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="-ml-4 h-8 font-semibold text-muted-foreground hover:text-foreground"
            >
              Type
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => (
        <div className="border-l border-border/40 pl-4 -ml-4 h-full flex items-center">
          <Badge variant="outline" className={`font-medium whitespace-nowrap px-3 py-1 rounded-full border-none ${getTypeColor(row.getValue("type"))}`}>
            {row.getValue("type")}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "whatItIs",
      header: () => <div className="border-l border-border/40 pl-4 -ml-4 h-full flex items-center font-semibold text-muted-foreground">Description</div>,
      cell: ({ row }) => (
        <div className="border-l border-border/40 pl-4 -ml-4 h-full flex items-center">
          <div className="max-w-[320px] truncate text-muted-foreground/70 text-sm" title={row.getValue("whatItIs") || row.original.summary}>
            {row.getValue("whatItIs") || row.original.summary}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "tags",
      header: () => <div className="border-l border-border/40 pl-4 -ml-4 h-full flex items-center font-semibold text-muted-foreground">Tags</div>,
      cell: ({ row }) => (
        <div className="border-l border-border/40 pl-4 -ml-4 h-full flex items-center">
          <div className="flex flex-wrap gap-2 max-w-[200px]">
            {(row.getValue("tags") as string[]).slice(0, 3).map((tag) => (
              <span key={tag} className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${getTagColor(tag)}`}>
                {tag}
              </span>
            ))}
            {(row.getValue("tags") as string[]).length > 3 && (
              <span className="text-[10px] text-muted-foreground px-1.5 self-center bg-muted rounded-full py-0.5 min-w-[20px] text-center border border-border shadow-sm">
                +{(row.getValue("tags") as string[]).length - 3}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <div className="border-l border-border/40 pl-4 -ml-4 h-full flex items-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="-ml-4 h-8 font-semibold text-muted-foreground hover:text-foreground"
            >
              Date
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => (
        <div className="border-l border-border/40 pl-4 -ml-4 h-full flex items-center">
          <span className="text-muted-foreground whitespace-nowrap text-xs font-medium">
            {format(row.getValue("createdAt"), 'MMM d, yyyy')}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="border-l border-border/40 pl-4 -ml-4 h-full flex items-center"></div>,
      cell: ({ row }) => {
        const tool = row.original;
        return (
          <div className="border-l border-border/40 pl-4 -ml-4 h-full flex items-center justify-end pr-2">
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-md shadow-sm border border-border/50 p-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-muted"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await apiMutations.updateTool(tool.id, { isPinned: !tool.isPinned });
                      } catch (error) {
                        console.error('Failed to toggle pin:', error);
                      }
                    }}
                  >
                    <Star className={`h-4 w-4 ${tool.isPinned ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Favorite</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(tool);
                    }}
                  >
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(tool.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </div>
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
    <div className="h-full flex flex-col bg-background">
      {/* Sticky Header Row */}
      <div className="flex-none border-b shadow-sm z-20 relative">
        <Table>
          <TableHeader className="bg-muted/80 backdrop-blur supports-[backdrop-filter]:bg-muted/60 sticky top-0">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() }} className="h-12 text-xs font-semibold uppercase tracking-wider text-foreground/70 first:pl-4">
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
                  className="group h-[60px] hover:bg-muted/30 data-[state=selected]:bg-primary/5 border-b border-border/30 transition-colors relative"
                  onClick={() => dispatch({ type: 'SELECT_TOOL', payload: { id: row.original.id } })}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={{ width: cell.column.getSize() }} className="py-2 text-sm px-4 first:pl-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground py-12">
                    <div className="p-4 rounded-full bg-muted/50 mb-2">
                      <Bot className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-lg font-medium">No tools found</p>
                    <p className="text-sm opacity-70 max-w-[250px]">
                      Try adjusting your search or filters, or add a new tool to get started.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)} className="mt-4">
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
