import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import BasicQuote from "@/components/PDFQuotes/BasicQuote";
import "@/styles/print.css";

export default function PrintQuotation() {
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch quotation data
  const { data: quotation } = useQuery({
    queryKey: [`/api/quotations/${id}/details`],
    enabled: !!id,
  });
  
  // Fetch company settings
  const { data: companySettings } = useQuery({
    queryKey: ["/api/settings/company"],
  });
  
  useEffect(() => {
    if (quotation && companySettings) {
      setIsLoading(false);
      // Automatically print when data is loaded
      setTimeout(() => {
        window.print();
        // Close tab after printing (optional)
        // window.close();
      }, 500);
    }
  }, [quotation, companySettings]);
  
  if (isLoading) {
    return <div className="p-8 text-center">Loading quotation data...</div>;
  }
  
  return (
    <div className="p-8 bg-white">
      <BasicQuote quotation={quotation} />
    </div>
  );
}