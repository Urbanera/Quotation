import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { CalendarDays, CheckCircle, Printer, RefreshCw, Ban, IndianRupee, Clock } from 'lucide-react';

interface InvoiceDetailsProps {
  invoiceId: number;
}

export default function InvoiceDetails({ invoiceId }: InvoiceDetailsProps) {
  const { toast } = useToast();

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: [`/api/invoices/${invoiceId}/details`],
    queryFn: async () => {
      const response = await fetch(`/api/invoices/${invoiceId}/details`);
      if (!response.ok) {
        throw new Error('Failed to fetch invoice details');
      }
      return response.json();
    }
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', `/api/invoices/${invoiceId}/status`, { status: 'paid' });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Invoice has been marked as paid.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}/details`] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update invoice status.',
        variant: 'destructive',
      });
    }
  });

  const markAsOverdueMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', `/api/invoices/${invoiceId}/status`, { status: 'overdue' });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Invoice has been marked as overdue.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}/details`] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update invoice status.',
        variant: 'destructive',
      });
    }
  });

  const cancelInvoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/invoices/${invoiceId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Invoice has been cancelled.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}/details`] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel invoice.',
        variant: 'destructive',
      });
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading invoice details...</div>;
  }

  if (error) {
    return <div className="flex justify-center p-8 text-red-500">Error loading invoice details</div>;
  }

  if (!invoice) {
    return <div className="flex justify-center p-8">Invoice not found</div>;
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success', label: string, icon: React.ReactNode }> = {
      pending: { variant: 'outline', label: 'Pending', icon: <Clock className="h-4 w-4 mr-1" /> },
      paid: { variant: 'success', label: 'Paid', icon: <CheckCircle className="h-4 w-4 mr-1" /> },
      partially_paid: { variant: 'secondary', label: 'Partially Paid', icon: <IndianRupee className="h-4 w-4 mr-1" /> },
      overdue: { variant: 'destructive', label: 'Overdue', icon: <RefreshCw className="h-4 w-4 mr-1" /> },
      cancelled: { variant: 'destructive', label: 'Cancelled', icon: <Ban className="h-4 w-4 mr-1" /> }
    };

    const statusInfo = statusMap[status] || statusMap.pending;
    
    return (
      <Badge variant={statusInfo.variant as any} className="flex items-center">
        {statusInfo.icon} {statusInfo.label}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Invoice {invoice.invoiceNumber}</CardTitle>
            <CardDescription>
              Created on {format(new Date(invoice.invoiceDate), 'PPP')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(invoice.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Customer</h3>
            <p className="text-sm">{invoice.customer.name}</p>
            <p className="text-sm">{invoice.customer.email}</p>
            <p className="text-sm">{invoice.customer.phone}</p>
            <p className="text-sm">{invoice.customer.address}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Invoice Details</h3>
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <CalendarDays className="h-4 w-4 mr-2" />
                <span className="text-sm">Due Date: {format(new Date(invoice.dueDate), 'PPP')}</span>
              </div>
              <div className="flex items-center">
                <IndianRupee className="h-4 w-4 mr-2" />
                <span className="text-sm">Total Amount: ₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center">
                <IndianRupee className="h-4 w-4 mr-2" />
                <span className="text-sm">Amount Paid: ₹{invoice.amountPaid.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center">
                <IndianRupee className="h-4 w-4 mr-2" />
                <span className="text-sm">Amount Due: ₹{invoice.amountDue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div>
          <h3 className="text-sm font-medium mb-2">Original Quotation</h3>
          <p className="text-sm">Quotation: {invoice.quotation?.quotationNumber || '-'}</p>
          <p className="text-sm">Title: {invoice.quotation?.title || '-'}</p>
          <p className="text-sm">Description: {invoice.quotation?.description || '-'}</p>
        </div>

        {invoice.notes && (
          <>
            <Separator className="my-4" />
            <div>
              <h3 className="text-sm font-medium mb-2">Notes</h3>
              <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>
        <div className="flex gap-2">
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <Button 
              onClick={() => markAsPaidMutation.mutate()} 
              disabled={markAsPaidMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Paid
            </Button>
          )}
          
          {invoice.status === 'pending' && (
            <Button 
              variant="destructive" 
              onClick={() => markAsOverdueMutation.mutate()}
              disabled={markAsOverdueMutation.isPending}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Mark as Overdue
            </Button>
          )}
          
          {invoice.status !== 'cancelled' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600">
                  <Ban className="h-4 w-4 mr-2" />
                  Cancel Invoice
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will cancel the invoice. You won't be able to undo this action.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => cancelInvoiceMutation.mutate()}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Cancel Invoice
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}