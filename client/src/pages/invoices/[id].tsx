import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLocation, useParams } from "wouter";
import InvoiceDetails from "@/components/invoices/InvoiceDetails";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/invoices")}
          className="mr-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>
        <h1 className="text-3xl font-bold">Invoice Details</h1>
      </div>

      <InvoiceDetails invoiceId={parseInt(id || "0")} />
    </div>
  );
}