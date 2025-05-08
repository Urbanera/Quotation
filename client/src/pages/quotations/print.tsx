import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import BasicQuote from "@/components/PDFQuotes/BasicQuote";
import PresentationQuote from "@/components/PDFQuotes/PresentationQuote";
import { QuotationWithDetails } from "@shared/schema";

// This is a standalone print page without layout components
export default function PrintQuotation() {
  const { id } = useParams<{ id: string }>();
  const [location] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  
  // Determine quote type from URL
  const isPresentationQuote = location.includes('/presentation');
  
  // Fetch quotation data
  const { data: quotation } = useQuery<QuotationWithDetails>({
    queryKey: [`/api/quotations/${id}/details`],
    enabled: !!id,
  });
  
  useEffect(() => {
    if (quotation) {
      setIsLoading(false);
      // Automatically print when data is loaded
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [quotation]);
  
  if (isLoading || !quotation) {
    return <div className="p-8 text-center">Loading quotation data...</div>;
  }
  
  return (
    <div className="print-container p-5 max-w-[210mm] mx-auto bg-white">
      {/* Print button visible only on screen */}
      <button 
        id="print-button"
        onClick={() => window.print()}
        className="mb-4 px-4 py-2 bg-primary text-white rounded shadow hover:bg-primary/90 transition-colors print:hidden"
      >
        Print Now
      </button>
      
      {/* The actual content to print */}
      <div id="print-content">
        {isPresentationQuote ? (
          <PresentationQuote quotation={quotation} />
        ) : (
          <BasicQuote quotation={quotation} />
        )}
      </div>
    </div>
  );
}