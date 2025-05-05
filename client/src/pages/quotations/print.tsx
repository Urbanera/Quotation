import { useEffect, useState, useRef } from "react";
import { useParams } from "wouter";
import { QuotationWithDetails, CompanySettings } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import BasicQuote from "@/components/PDFQuotes/BasicQuote";
import { generatePDF } from "@/lib/pdfUtils";

export default function PrintQuotation() {
  const { id } = useParams();
  const quoteRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: quotation } = useQuery<QuotationWithDetails>({
    queryKey: [`/api/quotations/${id}/details`],
    enabled: !!id,
    retry: 1,
  });

  useEffect(() => {
    if (quotation && quoteRef.current) {
      // Allow time for rendering
      const timer = setTimeout(async () => {
        try {
          await generatePDF('print-container', `Quotation-${quotation.quotationNumber || id}.pdf`);
          // Close the window after download is triggered
          window.close();
        } catch (err) {
          console.error('Error generating PDF:', err);
          setError('Failed to generate PDF. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [quotation, id]);

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4">
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Generating PDF...</p>
        </div>
      )}
      
      <div className="hidden">
        <div id="print-container" ref={quoteRef}>
          {quotation && <BasicQuote quotation={quotation} />}
        </div>
      </div>
    </div>
  );
}