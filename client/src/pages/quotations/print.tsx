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
    <div id="print-container" style={{ padding: '20px', maxWidth: '210mm', margin: '0 auto', background: 'white' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { 
            size: A4 portrait;
            margin: 10mm; 
          }
          body { 
            background: white;
            padding: 0;
            margin: 0;
            font-family: Arial, sans-serif;
            font-size: 11px;
          }
          /* Table styling */
          table { 
            width: 100%;
            border-collapse: collapse;
          }
          th { 
            background-color: #E6E6E6 !important;
            color: #009245 !important;
            border: 1px solid #ddd;
            padding: 6px;
            font-size: 11px;
          }
          td { 
            border: 1px solid #ddd;
            padding: 6px;
            font-size: 11px;
          }
          /* Force background colors */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          /* Hide print button after printing */
          #print-button {
            display: none !important;
          }
          /* Ensure consistent font sizes */
          h1, h2, h3, p, span, div {
            font-family: Arial, sans-serif;
          }
          h1 { font-size: 16px; }
          h2 { font-size: 14px; }
          h3 { font-size: 12px; }
          p, span, div { font-size: 11px; }
        }
        
        /* Similar styling for the screen view to match PDF output */
        #print-content {
          font-family: Arial, sans-serif;
          font-size: 11px;
        }
        #print-content h1 { font-size: 16px; }
        #print-content h2 { font-size: 14px; }
        #print-content h3 { font-size: 12px; }
        #print-content p, 
        #print-content span, 
        #print-content div:not(.print-content) { 
          font-size: 11px; 
        }
        #print-content table {
          width: 100%;
          border-collapse: collapse;
        }
        #print-content th {
          background-color: #E6E6E6;
          color: #009245;
          border: 1px solid #ddd;
          padding: 6px;
        }
        #print-content td {
          border: 1px solid #ddd;
          padding: 6px;
        }
      `}} />
      
      {/* Print button visible only on screen */}
      <button 
        id="print-button"
        onClick={() => window.print()}
        style={{ 
          margin: '10px 0', 
          padding: '8px 16px', 
          background: '#4f46e5', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Print Now
      </button>
      
      {/* The actual content to print */}
      <div id="print-content" className="print-content">
        {isPresentationQuote ? (
          <PresentationQuote quotation={quotation} />
        ) : (
          <BasicQuote quotation={quotation} />
        )}
      </div>
    </div>
  );
}