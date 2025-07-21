import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { Invoice } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const editInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  status: z.enum(['pending', 'partially_paid', 'paid']),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

type EditInvoiceForm = z.infer<typeof editInvoiceSchema>;

export default function EditInvoicePage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ['/api/invoices', id],
    queryFn: () => apiRequest(`/api/invoices/${id}`),
  });

  const form = useForm<EditInvoiceForm>({
    resolver: zodResolver(editInvoiceSchema),
    defaultValues: {
      invoiceNumber: '',
      status: 'pending',
      dueDate: '',
      notes: '',
    },
  });

  // Update form when invoice data is loaded
  useEffect(() => {
    if (invoice) {
      form.reset({
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status as 'pending' | 'partially_paid' | 'paid',
        dueDate: invoice.dueDate ? format(new Date(invoice.dueDate), 'yyyy-MM-dd') : '',
        notes: invoice.notes || '',
      });
    }
  }, [invoice, form]);

  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: EditInvoiceForm) => {
      const updateData: any = {
        invoiceNumber: data.invoiceNumber,
        status: data.status,
        notes: data.notes || null,
      };

      if (data.dueDate) {
        updateData.dueDate = new Date(data.dueDate).toISOString();
      }

      return apiRequest(`/api/invoices/${id}`, {
        method: 'PUT',
        body: updateData,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Invoice updated',
        description: 'The invoice has been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      navigate('/invoices');
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating invoice',
        description: error.message || 'Failed to update invoice. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: EditInvoiceForm) => {
    updateInvoiceMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Invoice not found</h3>
            <p className="text-gray-500 mt-2">The invoice you're looking for doesn't exist.</p>
            <Button 
              onClick={() => navigate('/invoices')} 
              className="mt-4"
              variant="outline"
            >
              Back to Invoices
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/invoices')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
        <h1 className="text-3xl font-bold">Edit Invoice</h1>
        <p className="text-gray-500">Modify invoice details and settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>
            Update the invoice information. Note: Changing the invoice number will affect the next invoice number sequence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="INV-2025-001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="partially_paid">Partially Paid</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Add any additional notes about this invoice..."
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/invoices')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateInvoiceMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateInvoiceMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Read-only invoice info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Invoice Information</CardTitle>
          <CardDescription>Read-only information about this invoice</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Total Amount</Label>
              <p className="text-sm">₹{invoice.totalAmount.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Amount Paid</Label>
              <p className="text-sm">₹{invoice.amountPaid.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Amount Due</Label>
              <p className="text-sm">₹{invoice.amountDue.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Created Date</Label>
              <p className="text-sm">{format(new Date(invoice.createdAt), 'MMM dd, yyyy HH:mm')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}