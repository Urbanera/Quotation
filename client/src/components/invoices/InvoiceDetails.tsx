import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  CreditCard, 
  DollarSign, 
  FileText, 
  User, 
  CheckCircle, 
  AlertCircle,
  Clock,
  CalendarClock,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { Invoice, QuotationWithDetails } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface InvoiceDetailsProps {
  invoiceId: number;
}

export default function InvoiceDetails({ invoiceId }: InvoiceDetailsProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: invoice, isLoading: isInvoiceLoading } = useQuery<Invoice>({
    queryKey: [`/api/invoices/${invoiceId}`],
    enabled: !!invoiceId,
  });

  const { data: quotation, isLoading: isQuotationLoading } = useQuery<QuotationWithDetails>({
    queryKey: [`/api/quotations/${invoice?.quotationId}/details`],
    enabled: !!invoice?.quotationId,
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/invoices/${invoiceId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Invoice Deleted',
        description: 'The invoice has been deleted successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      navigate('/invoices');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete invoice: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PUT', `/api/invoices/${invoiceId}/status`, { status: 'paid' });
    },
    onSuccess: () => {
      toast({
        title: 'Invoice Updated',
        description: 'The invoice has been marked as paid.'
      });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update invoice: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  if (isInvoiceLoading || isQuotationLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!invoice) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Invoice Not Found</h3>
            <p className="text-gray-500 mt-2">The requested invoice could not be found.</p>
            <Button onClick={() => navigate('/invoices')} className="mt-4">
              Back to Invoices
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Paid</Badge>;
      case 'partially_paid':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Partially Paid</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>;
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">Invoice #{invoice.invoiceNumber}</CardTitle>
              <CardDescription>Created on {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}</CardDescription>
            </div>
            <div>
              {getStatusBadge(invoice.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Customer Information</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex items-start">
                    <User className="h-5 w-5 mt-0.5 mr-2 text-gray-400" />
                    <div>
                      <p className="font-medium">{quotation?.customer.name}</p>
                      <div className="text-sm text-gray-600 space-y-1 mt-1">
                        <div className="flex items-center">
                          <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          <span>{quotation?.customer.address}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          <span>{quotation?.customer.phone}</span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          <span>{quotation?.customer.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Invoice Details</h3>
                <div className="bg-gray-50 p-3 rounded-md space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-600">Invoice Date</span>
                    </div>
                    <span className="font-medium">
                      {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CalendarClock className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-600">Due Date</span>
                    </div>
                    <span className="font-medium">
                      {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : 'Not specified'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-600">Related Quotation</span>
                    </div>
                    <Button
                      variant="link"
                      className="p-0 h-auto font-medium text-blue-600"
                      onClick={() => navigate(`/quotations/view/${invoice.quotationId}`)}
                    >
                      #{quotation?.quotationNumber}
                    </Button>
                  </div>
                </div>
              </div>

              {invoice.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Notes</h3>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600">{invoice.notes}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Invoice Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span>{formatCurrency(quotation?.totalSellingPrice || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Discount</span>
                    <span>-{formatCurrency((quotation?.globalDiscount || 0) * (quotation?.totalSellingPrice || 0) / 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">GST ({quotation?.gstPercentage || 0}%)</span>
                    <span>{formatCurrency(quotation?.gstAmount || 0)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount</span>
                    <span>{formatCurrency(invoice.totalAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount Paid</span>
                    <span className="text-gray-900">{formatCurrency(invoice.amountPaid || 0)}</span>
                  </div>
                  <div className="flex justify-between font-medium mt-1">
                    <span className="text-gray-900">Amount Due</span>
                    <span className="text-gray-900">
                      {formatCurrency((invoice.totalAmount || 0) - (invoice.amountPaid || 0))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Payment Status</h3>
                <div className="mb-4">
                  {invoice.status === 'pending' ? (
                    <div className="flex items-center text-yellow-600">
                      <Clock className="h-5 w-5 mr-2" />
                      <span>Waiting for payment</span>
                    </div>
                  ) : invoice.status === 'paid' ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span>Fully paid</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-blue-600">
                      <CreditCard className="h-5 w-5 mr-2" />
                      <span>Partially paid</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {invoice.status === 'pending' && (
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700" 
                      onClick={() => markAsPaidMutation.mutate()}
                      disabled={markAsPaidMutation.isPending}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      {markAsPaidMutation.isPending ? 'Processing...' : 'Mark as Paid'}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(`/payments/create?invoiceId=${invoiceId}`)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 pt-0">
          <Button
            variant="outline"
            onClick={() => navigate('/invoices')}
          >
            Back to Invoices
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Delete Invoice
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the invoice and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => deleteInvoiceMutation.mutate()}
            >
              {deleteInvoiceMutation.isPending ? 'Deleting...' : 'Delete Invoice'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}