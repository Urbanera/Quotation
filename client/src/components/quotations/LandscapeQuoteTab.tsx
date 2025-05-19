import React from 'react';
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { QuotationWithDetails, CompanySettings, AppSettings } from "@shared/schema";
import LandscapeQuote from "@/components/PDFQuotes/LandscapeQuote";
import LandscapeQuotePreview from "@/components/PDFQuotes/LandscapeQuotePreview";

interface LandscapeQuoteTabProps {
  quotation: QuotationWithDetails;
  companySettings: CompanySettings;
  appSettings: AppSettings;
  id: string;
}

const LandscapeQuoteTab: React.FC<LandscapeQuoteTabProps> = ({ 
  quotation, 
  companySettings, 
  appSettings,
  id
}) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      {quotation && companySettings && appSettings ? (
        <div>
          {/* Landscape preview */}
          <LandscapeQuotePreview 
            quotation={quotation} 
            companySettings={companySettings} 
            appSettings={appSettings} 
          />
          
          {/* Download button at the bottom */}
          <div className="flex flex-col items-center mt-6">
            <PDFDownloadLink 
              document={
                <LandscapeQuote 
                  quotation={quotation} 
                  companySettings={companySettings}
                  appSettings={appSettings}
                />
              } 
              fileName={`Landscape-${quotation?.quotationNumber || id}.pdf`}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              {({ blob, url, loading, error }) => 
                loading ? 
                  <>
                    <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Preparing PDF...
                  </> : 
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Landscape PDF
                  </>
              }
            </PDFDownloadLink>
            <p className="text-xs text-gray-500 mt-2">
              (This might take a few seconds to prepare)
            </p>
          </div>
        </div>
      ) : (
        <p className="text-center">Loading quotation data...</p>
      )}
    </div>
  );
};

export default LandscapeQuoteTab;