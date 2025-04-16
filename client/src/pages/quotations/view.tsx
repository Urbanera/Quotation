import { useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileText, FileOutput, Printer, Download, Edit } from "lucide-react";
import { QuotationWithDetails } from "@shared/schema";
import BasicQuote from "@/components/PDFQuotes/BasicQuote";
import PresentationQuote from "@/components/PDFQuotes/PresentationQuote";
import { useToast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function ViewQuotation() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const basicQuoteRef = useRef<any>(null);
  const presentationQuoteRef = useRef<any>(null);

  const { data: quotation, isLoading } = useQuery<QuotationWithDetails>({
    queryKey: [`/api/quotations/${id}`],
    enabled: !!id,
  });

  const handlePrint = () => {
    if (window.print) {
      window.print();
    } else {
      toast({
        title: "Print not supported",
        description: "Printing is not supported in your browser",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading quotation data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center py-8">
            <p className="text-red-500">Quotation not found. Please check the URL and try again.</p>
            <Button 
              variant="outline" 
              onClick={() => navigate("/quotations")}
              className="mt-4"
            >
              Back to Quotations
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:max-w-7xl lg:mx-auto lg:px-8">
          <div className="py-6 md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0 flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate("/quotations")}
                className="mr-4"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Quotation #{id}
              </h2>
            </div>
            <div className="mt-4 flex flex-wrap md:mt-0 md:ml-4 gap-3">
              <Button 
                variant="outline"
                onClick={handlePrint}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button 
                variant="outline"
                onClick={() => toast({
                  title: "Download",
                  description: "Download functionality will be implemented soon."
                })}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button 
                onClick={() => navigate(`/quotations/edit/${id}`)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Quotation
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Tabs */}
      <div className="mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="basic" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Basic Quote
              </TabsTrigger>
              <TabsTrigger value="presentation" className="flex items-center">
                <FileOutput className="mr-2 h-4 w-4" />
                Presentation Quote
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="mt-6">
              <div className="bg-white shadow rounded-lg p-6">
                <BasicQuote ref={basicQuoteRef} quotation={quotation} />
              </div>
            </TabsContent>
            
            <TabsContent value="presentation" className="mt-6">
              <div className="bg-white shadow rounded-lg p-6">
                <PresentationQuote ref={presentationQuoteRef} quotation={quotation} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
