import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { FilePlus, Search, FileText, IndianRupee, Ban, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { Invoice } from '@shared/schema';

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: invoices, isLoading, error } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
    queryFn: async () => {
      const response = await fetch('/api/invoices');
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      return response.json();
    }
  });

  // Filter invoices based on search term
  const filteredInvoices = invoices?.filter(invoice => {
    const searchLower = searchTerm.toLowerCase();
    return (
      invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
      invoice.status.toLowerCase().includes(searchLower)
    );
  });

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
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-gray-500">Manage all customer invoices</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Invoices</CardTitle>
              <CardDescription>View and manage customer invoices</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search invoices..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center p-4">Loading invoices...</div>
          )}

          {error && (
            <div className="flex justify-center p-4 text-red-500">
              Error loading invoices
            </div>
          )}

          {!isLoading && !error && filteredInvoices && filteredInvoices.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mb-2" />
              <h3 className="text-lg font-medium">No invoices found</h3>
              <p className="text-sm text-gray-500">{searchTerm ? 'Try a different search term' : 'Approved quotations can be converted to invoices'}</p>
            </div>
          )}

          {!isLoading && !error && filteredInvoices && filteredInvoices.length > 0 && (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{format(new Date(invoice.invoiceDate), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{format(new Date(invoice.dueDate), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>₹{invoice.totalAmount.toLocaleString('en-IN')}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/invoices/${invoice.id}`}>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-1" /> View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}