import React from 'react';
import { useParams } from 'wouter';
import { Card } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { FileInvoice, ChevronRight, Home } from 'lucide-react';
import InvoiceDetails from '@/components/invoices/InvoiceDetails';

export default function InvoiceDetailsPage() {
  const params = useParams<{ id: string }>();
  const invoiceId = parseInt(params.id);

  if (isNaN(invoiceId)) {
    return <div className="container mx-auto py-6">Invalid invoice ID</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink href="/">
            <Home className="h-4 w-4 mr-1" />
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink href="/invoices">
            <FileInvoice className="h-4 w-4 mr-1" />
            Invoices
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbSeparator>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Invoice Details</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Invoice Details</h1>
        <p className="text-gray-500">View and manage invoice information</p>
      </div>

      <InvoiceDetails invoiceId={invoiceId} />
    </div>
  );
}