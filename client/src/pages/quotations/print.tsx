import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import BasicQuote from "@/components/PDFQuotes/BasicQuote";
import PresentationQuote from "@/components/PDFQuotes/PresentationQuote";
import { QuotationWithDetails } from "@shared/schema";

// Add custom print styles
const printStyles = `
@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }
  
  html, body {
    height: 100%;
    margin: 0 !important;
    padding: 0 !important;
    width: 100%;
  }
  
  .print-container {
    margin: 0 !important;
    padding: 0 !important;
    max-width: none !important;
    width: 100%;
  }
  
  #print-content {
    transform: scale(1);
    transform-origin: top center;
    width: 100%;
  }
  
  /* Adjust all logo sections to match the reference */
  .logo-container img {
    display: block;
    margin: 0 auto;
    max-height: 60px;
  }
  
  /* Ensure each page break works correctly */
  .page-break {
    page-break-after: always;
    break-after: page;
  }
  
  /* Set fixed dimensions for page containers */
  .page-container {
    width: 100%;
    height: 297mm;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
    position: relative;
  }
  
  /* Adjust image containers to display properly */
  .image-grid {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    grid-auto-flow: row !important;
    gap: 20px !important;
    width: 100% !important;
  }
  
  .image-container {
    width: 100% !important;
    height: 200px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    overflow: hidden !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 6px !important;
  }
  
  .image-container img {
    max-width: 100% !important;
    max-height: 190px !important;
    object-fit: contain !important;
  }
}
`;

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
  
  // Add print styles to head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = printStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
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
    <div className="print-container p-5 w-full mx-auto bg-white">
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