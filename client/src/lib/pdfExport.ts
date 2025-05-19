import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ReactNode } from 'react';
import { pdf as reactPdf } from '@react-pdf/renderer';

type ElementType = HTMLElement | ReactNode;

/**
 * A simplified PDF generation approach that works more reliably
 * @param element The HTML element or React PDF element to convert to PDF
 * @param filename The name of the downloaded file
 * @param isPresentationQuote Whether this is a presentation quote (special handling)
 * @param returnBlob If true, returns the PDF as a Blob instead of saving it
 * @returns Void or Blob depending on returnBlob parameter
 */
export const exportToPdf = async (
  element: ElementType, 
  filename: string, 
  isPresentationQuote: boolean = false,
  returnBlob: boolean = false
): Promise<void | Blob> => {
  try {
    // Check if the element is a React PDF element
    if (!(element instanceof HTMLElement)) {
      // Handle React PDF elements
      try {
        const pdfDoc = await reactPdf(element as any).toBlob();
        
        if (returnBlob) {
          return pdfDoc;
        } else {
          // Create a download link for the blob
          const blobUrl = URL.createObjectURL(pdfDoc);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `${filename}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
          return;
        }
      } catch (reactPdfError) {
        console.error('Error generating React PDF:', reactPdfError);
        throw reactPdfError;
      }
    }
    
    // If we get here, it's an HTML element
    const htmlElement = element as HTMLElement;
    const doc = new jsPDF('portrait', 'mm', 'a4');
    
    // Get page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Define margins - increased for better printing
    const margin = 20; // 20mm margins
    
    // Add styling to fix page breaks and layout
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body { margin: 0; padding: 0; }
        
        /* Ensure page breaks where needed */
        .room-section, div[data-room-section="true"] {
          page-break-before: always;
          break-before: page;
        }
        
        /* First room doesn't need a page break */
        .first-room, .room-section:first-of-type {
          page-break-before: auto !important;
          break-before: auto !important;
        }
        
        /* Keep content together */
        .footer, .quote-footer, .summary-section, .total-section {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        /* Terms and conditions section should not break */
        [style*="pageBreakInside: avoid"],
        [style*="page-break-inside: avoid"] {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Keep table headers with rows */
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        tr { page-break-inside: avoid; }
        
        /* Force color printing */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
    
    // Create a clone to avoid modifying the original
    const clone = htmlElement.cloneNode(true) as HTMLElement;
    
    // Apply data attributes to help with PDF generation
    const roomSections = clone.querySelectorAll('.room-section');
    roomSections.forEach((section, index) => {
      const sectionEl = section as HTMLElement;
      sectionEl.setAttribute('data-room-section', 'true');
      if (index === 0) {
        sectionEl.classList.add('first-room');
      }
    });
    
    // Add the clone to an offscreen container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '210mm'; // A4 width
    container.appendChild(style);
    container.appendChild(clone);
    document.body.appendChild(container);
    
    try {
      // Regular PDF generation for basic quotes
      const canvas = await html2canvas(clone, {
        scale: returnBlob ? 1.5 : 2, // Lower scale for email attachments
        useCORS: true, // For images
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794, // ~210mm at 96dpi
        windowHeight: 1123 // ~297mm at 96dpi
      });
      
      // Calculate dimensions
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Get image data (use lower quality JPEG for email attachments to reduce size)
      const imgData = returnBlob ? 
        canvas.toDataURL('image/jpeg', 0.85) : 
        canvas.toDataURL('image/png');
      
      // Calculate needed pages
      const pageCount = Math.ceil(imgHeight / (pageHeight - (margin * 2)));
      
      // For single page documents
      if (pageCount <= 1) {
        doc.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
        
        // Clean up
        document.body.removeChild(container);
        
        if (returnBlob) {
          return doc.output('blob');
        } else {
          doc.save(`${filename}.pdf`);
          return;
        }
      }
      
      // For multi-page documents
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      doc.addImage(imgData, 'PNG', margin, margin, imgWidth, Math.min(pageHeight - (margin * 2), imgHeight));
      heightLeft -= (pageHeight - (margin * 2));
      position += (pageHeight - (margin * 2));
      
      // Add subsequent pages
      while (heightLeft > 0) {
        doc.addPage();
        
        // Calculate source area for this page
        const sourceY = position * (canvas.height / imgHeight);
        const sourceHeight = Math.min(
          (pageHeight - (margin * 2)) * (canvas.height / imgHeight),
          canvas.height - sourceY
        );
        
        // Get just this portion
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) continue;
        
        tempCanvas.width = canvas.width;
        tempCanvas.height = sourceHeight;
        
        // Draw just the needed portion
        ctx.drawImage(
          canvas,
          0, sourceY,
          canvas.width, sourceHeight,
          0, 0,
          canvas.width, sourceHeight
        );
        
        // Add to PDF
        const pageImgData = tempCanvas.toDataURL('image/png');
        const pageImgHeight = Math.min(pageHeight - (margin * 2), heightLeft);
        
        doc.addImage(pageImgData, 'PNG', margin, margin, imgWidth, pageImgHeight);
        
        // Update tracking variables
        heightLeft -= (pageHeight - (margin * 2));
        position += (pageHeight - (margin * 2));
      }
      
      // Clean up
      document.body.removeChild(container);
      
      // Save the PDF
      if (returnBlob) {
        return doc.output('blob');
      } else {
        doc.save(`${filename}.pdf`);
      }
    } catch (error) {
      // Make sure to clean up if there's an error
      document.body.removeChild(container);
      throw error;
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};