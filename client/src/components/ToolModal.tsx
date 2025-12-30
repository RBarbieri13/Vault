import React, { useState, useCallback } from 'react';
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
import { useUrlAnalysis } from '@/hooks/use-url-analysis';
import { Loader2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

const toolSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Must be a valid URL'),
  type: z.string().min(1, 'Type is required'),
  summary: z.string().optional(),
  whatItIs: z.string().optional(),
  capabilities: z.string().optional(),
  bestFor: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
});

interface ToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolToEdit?: Tool;
}

export function ToolModal({ isOpen, onClose, toolToEdit }: ToolModalProps) {
  const { state, apiMutations } = useApp();
  const { analyze, isAnalyzing, error: analysisError, reset: resetAnalysis } = useUrlAnalysis();
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
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

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, getValues } = useForm({
    resolver: zodResolver(toolSchema),
    defaultValues,
  });

  // Auto-analyze URL when it changes (with debounce)
  const handleAnalyzeUrl = useCallback(async () => {
    const url = getValues('url');
    if (!url || !url.startsWith('http')) return;

    setAnalysisStatus('idle');
    const result = await analyze(url);
    
    if (result?.success) {
      const { data } = result;
      // Auto-fill all fields from analysis
      setValue('name', data.name, { shouldValidate: true });
      setValue('type', data.type, { shouldValidate: true });
      setValue('summary', data.summary || '');
      setValue('whatItIs', data.whatItIs || '');
      setValue('capabilities', data.capabilities?.join('\n') || '');
      setValue('bestFor', data.bestFor?.join('\n') || '');
      setValue('tags', data.tags?.join(', ') || '');
      setValue('notes', data.notes || '');
      
      // Set category if valid
      if (data.categoryId && state.categories.some(c => c.id === data.categoryId)) {
        setValue('categoryId', data.categoryId, { shouldValidate: true });
      }
      setAnalysisStatus('success');
      // Clear success status after 3 seconds
      setTimeout(() => setAnalysisStatus('idle'), 3000);
    } else {
      setAnalysisStatus('error');
    }
  }, [analyze, getValues, setValue, state.categories]);

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
      resetAnalysis();
      setAnalysisStatus('idle');
    }
  }, [isOpen, toolToEdit, state.categories, reset, resetAnalysis]);

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
          status: 'active',
          trend: [5, 5, 5, 5, 5, 5, 5],
          usage: 50,
          contentType: 'tool',
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
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{toolToEdit ? 'Edit Tool' : 'Add New Tool'}</DialogTitle>
          <DialogDescription>
            {toolToEdit ? 'Make changes to your tool here.' : 'Paste a URL and click analyze to auto-fill fields.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* URL Input with Analyze Button */}
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <div className="flex gap-2">
              <Input 
                id="url" 
                {...register('url')} 
                placeholder="https://example.com" 
                className="flex-1"
                data-testid="input-tool-url" 
              />
              <Button
                type="button"
                variant={analysisStatus === 'success' ? 'default' : 'secondary'}
                size="sm"
                onClick={handleAnalyzeUrl}
                disabled={isAnalyzing || !watch('url')}
                className="min-w-[100px] transition-all"
                data-testid="button-analyze"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Analyzing
                  </>
                ) : analysisStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                    Done
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
            {errors.url && <p className="text-red-500 text-xs">{errors.url.message as string}</p>}
            {analysisStatus === 'error' && analysisError && (
              <p className="text-amber-500 text-xs flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {analysisError}
              </p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} placeholder="e.g. ChatGPT" data-testid="input-tool-name" />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message as string}</p>}
          </div>

          {/* Type and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Input id="type" {...register('type')} placeholder="e.g. CHATBOT" data-testid="input-tool-type" />
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

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" {...register('tags')} placeholder="LLM, Productivity, Coding" data-testid="input-tool-tags" />
          </div>

          {/* What It Is */}
          <div className="space-y-2">
            <Label htmlFor="whatItIs">What It Is</Label>
            <Textarea id="whatItIs" {...register('whatItIs')} placeholder="A brief description..." className="resize-none h-16" data-testid="input-tool-whatItIs" />
          </div>

          {/* Capabilities and Best For */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capabilities">Capabilities (one per line)</Label>
              <Textarea id="capabilities" {...register('capabilities')} placeholder="Feature 1&#10;Feature 2" className="resize-none h-24" data-testid="input-tool-capabilities" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bestFor">Best For (one per line)</Label>
              <Textarea id="bestFor" {...register('bestFor')} placeholder="Use case 1&#10;Use case 2" className="resize-none h-24" data-testid="input-tool-bestFor" />
            </div>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
             <Label htmlFor="notes">Notes (Optional)</Label>
             <Textarea id="notes" {...register('notes')} placeholder="Any extra observations..." className="resize-none h-14" data-testid="input-tool-notes" />
          </div>

          {/* Summary (collapsed by default) */}
          <details className="space-y-2">
            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">Legacy Summary (optional)</summary>
            <Textarea id="summary" {...register('summary')} placeholder="Brief description..." className="resize-none h-16 mt-2" data-testid="input-tool-summary" />
          </details>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">Cancel</Button>
            <Button type="submit" disabled={isAnalyzing} data-testid="button-save-tool">
              {isAnalyzing ? 'Analyzing...' : 'Save Tool'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
