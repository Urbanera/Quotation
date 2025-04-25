import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { DialogFooter } from '@/components/ui/dialog';

interface ConvertToInvoiceFormProps {
  quotationId: number;
  onClose: () => void;
}

export default function ConvertToInvoiceForm({ quotationId, onClose }: ConvertToInvoiceFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [dueDate, setDueDate] = useState<Date | undefined>(addDays(new Date(), 30));
  const [notes, setNotes] = useState('');

  const convertToInvoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        'POST',
        `/api/quotations/${quotationId}/convert-to-invoice`,
        {
          dueDate: dueDate ? dueDate.toISOString() : undefined,
          notes: notes || null,
        }
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Invoice Created',
        description: 'The quotation has been successfully converted to an invoice.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/quotations/${quotationId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      onClose();
      // Navigate to the new invoice
      navigate(`/invoices/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to convert to invoice: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="due-date">Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="due-date"
                variant={'outline'}
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !dueDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, 'PPP') : 'No due date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="invoice-notes">Notes (Optional)</Label>
          <Textarea
            id="invoice-notes"
            placeholder="Add any additional information for this invoice"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => convertToInvoiceMutation.mutate()}
          className="bg-purple-600 hover:bg-purple-700"
          disabled={convertToInvoiceMutation.isPending}
        >
          {convertToInvoiceMutation.isPending ? 'Creating...' : 'Create Invoice'}
        </Button>
      </DialogFooter>
    </>
  );
}