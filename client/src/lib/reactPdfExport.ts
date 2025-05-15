import React, { ReactElement } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Document, PDFDownloadLink } from '@react-pdf/renderer';

/**
 * Export a React-PDF Document element to PDF
 * @param element The React-PDF Document element
 * @param filename The filename to save as
 * @param returnBlob Whether to return the blob (for email) or download
 * @returns Promise resolving to a Blob if returnBlob is true
 */
export const exportReactPdf = async (
  element: ReactElement,
  filename: string,
  returnBlob: boolean = false
): Promise<void | Blob> => {
  try {
    // Generate the PDF using react-pdf renderer
    const blob = await pdf(element).toBlob();
    
    if (returnBlob) {
      return blob;
    } else {
      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
  } catch (error) {
    console.error('Error generating React PDF:', error);
    throw error;
  }
};