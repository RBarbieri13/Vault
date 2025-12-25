import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/lib/store';
import { Tool } from '@/lib/data';

const toolSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Must be a valid URL'),
  type: z.string().min(1, 'Type is required'),
  summary: z.string().optional(),
  whatItIs: z.string().optional(),
  capabilities: z.string().optional(), // New line separated
  bestFor: z.string().optional(), // New line separated
  notes: z.string().optional(),
  tags: z.string().optional(), // We'll parse comma separated tags
  categoryId: z.string().min(1, 'Category is required'),
});

interface ToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolToEdit?: Tool;
}

export function ToolModal({ isOpen, onClose, toolToEdit }: ToolModalProps) {
  const { state, apiMutations } = useApp();
  
  const defaultValues = {
    name: toolToEdit?.name || '',
    url: toolToEdit?.url || '',
    type: toolToEdit?.type || '',
    summary: toolToEdit?.summary || '',
    whatItIs: toolToEdit?.whatItIs || '',
    capabilities: toolToEdit?.capabilities?.join('\n') || '',
    bestFor: toolToEdit?.bestFor?.join('\n') || '',
    notes: toolToEdit?.notes || '',
    tags: toolToEdit?.tags.join(', ') || '',
    categoryId: toolToEdit?.categoryId || state.categories[0]?.id || '',
  };

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    resolver: zodResolver(toolSchema),
    defaultValues,
  });

  // Reset form when opening/closing or changing edit mode
  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: toolToEdit?.name || '',
        url: toolToEdit?.url || '',
        type: toolToEdit?.type || '',
        summary: toolToEdit?.summary || '',
        whatItIs: toolToEdit?.whatItIs || '',
        capabilities: toolToEdit?.capabilities?.join('\n') || '',
        bestFor: toolToEdit?.bestFor?.join('\n') || '',
        notes: toolToEdit?.notes || '',
        tags: toolToEdit?.tags.join(', ') || '',
        categoryId: toolToEdit?.categoryId || state.categories[0]?.id || '',
      });
    }
  }, [isOpen, toolToEdit, state.categories, reset]);

  const onSubmit = async (data: any) => {
    const tagsArray = data.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
    const capabilitiesArray = data.capabilities.split('\n').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
    const bestForArray = data.bestFor.split('\n').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
    
    try {
      if (toolToEdit) {
        await apiMutations.updateTool(toolToEdit.id, {
          name: data.name,
          url: data.url,
          type: data.type,
          summary: data.summary,
          whatItIs: data.whatItIs,
          capabilities: capabilitiesArray,
          bestFor: bestForArray,
          notes: data.notes,
          tags: tagsArray,
          categoryId: data.categoryId,
        });
      } else {
        await apiMutations.createTool({
          name: data.name,
          url: data.url,
          type: data.type,
          summary: data.summary,
          whatItIs: data.whatItIs,
          capabilities: capabilitiesArray,
          bestFor: bestForArray,
          notes: data.notes,
          tags: tagsArray,
          categoryId: data.categoryId,
          isPinned: false,
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to save tool:', error);
    }
  };

  const selectedCategory = watch('categoryId');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{toolToEdit ? 'Edit Tool' : 'Add New Tool'}</DialogTitle>
          <DialogDescription>
            {toolToEdit ? 'Make changes to your tool here.' : 'Add a new AI tool to your collection.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} placeholder="e.g. ChatGPT" data-testid="input-tool-name" />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message as string}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input id="url" {...register('url')} placeholder="https://..." data-testid="input-tool-url" />
            {errors.url && <p className="text-red-500 text-xs">{errors.url.message as string}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Input id="type" {...register('type')} placeholder="e.g. Chatbot" data-testid="input-tool-type" />
              {errors.type && <p className="text-red-500 text-xs">{errors.type.message as string}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={selectedCategory} 
                onValueChange={(val) => setValue('categoryId', val)}
              >
                <SelectTrigger id="category" data-testid="select-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {state.categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-red-500 text-xs">{errors.categoryId.message as string}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" {...register('tags')} placeholder="LLM, Productivity, Coding" data-testid="input-tool-tags" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatItIs">What It Is (1-2 sentences)</Label>
            <Textarea id="whatItIs" {...register('whatItIs')} placeholder="A brief, high-level description..." className="resize-none h-20" data-testid="input-tool-whatItIs" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capabilities">Capabilities (one per line)</Label>
              <Textarea id="capabilities" {...register('capabilities')} placeholder="- Feature 1&#10;- Feature 2" className="resize-none h-32" data-testid="input-tool-capabilities" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bestFor">Best For (one per line)</Label>
              <Textarea id="bestFor" {...register('bestFor')} placeholder="- User Type 1&#10;- Use Case 2" className="resize-none h-32" data-testid="input-tool-bestFor" />
            </div>
          </div>
          
          <div className="space-y-2">
             <Label htmlFor="notes">Notes (Optional)</Label>
             <Textarea id="notes" {...register('notes')} placeholder="Any extra observations..." className="resize-none h-16" data-testid="input-tool-notes" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Legacy Summary</Label>
            <Textarea id="summary" {...register('summary')} placeholder="Brief description..." className="resize-none h-20" data-testid="input-tool-summary" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">Cancel</Button>
            <Button type="submit" data-testid="button-save-tool">Save Tool</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
