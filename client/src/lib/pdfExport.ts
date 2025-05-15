import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ReactNode } from 'react';
import ReactDOM from 'react-dom';
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
        const pdfDoc = await pdf(element as ReactNode).toBlob();
        
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
    // Create a PDF in A4 format
    const htmlElement = element as HTMLElement;
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    
    // Get page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
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
    
    // For presentation quotes, we need special handling
    if (isPresentationQuote) {
      // Get the cover pages and content pages separately for presentation quotes
      const coverPages = clone.querySelectorAll<HTMLElement>(':scope > div:nth-child(-n+2)');
      const contentPages = clone.querySelector<HTMLElement>(':scope > div:nth-child(3)');
      
      if (coverPages.length > 0 && contentPages) {
        const result = await generatePresentationPdf(pdf, coverPages, contentPages, filename, returnBlob);
        return result;
      }
    }
    
    // Regular PDF generation for basic quotes
    const canvas = await html2canvas(clone, {
      scale: returnBlob ? 1.5 : 2, // Lower scale for email attachments
      useCORS: true, // For images
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794, // ~210mm at 96dpi
      windowHeight: 1123 // ~297mm at 96dpi
    });
    
    // Clean up
    document.body.removeChild(container);
    
    // Calculate dimensions
    const imgWidth = pageWidth - 20; // 10mm margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Get image data (use lower quality JPEG for email attachments to reduce size)
    const imgData = returnBlob ? 
      canvas.toDataURL('image/jpeg', 0.85) : 
      canvas.toDataURL('image/png');
    
    // Calculate needed pages
    const pageCount = Math.ceil(imgHeight / (pageHeight - 20));
    
    // For single page documents
    if (pageCount <= 1) {
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      
      if (returnBlob) {
        return pdf.output('blob');
      } else {
        pdf.save(`${filename}.pdf`);
        return;
      }
    }
    
    // For multi-page documents
    let heightLeft = imgHeight;
    let position = 0;
    
    // Add first page
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(pageHeight - 20, imgHeight));
    heightLeft -= (pageHeight - 20);
    position += (pageHeight - 20);
    
    // Add subsequent pages
    while (heightLeft > 0) {
      pdf.addPage();
      
      // Calculate source area for this page
      const sourceY = position * (canvas.height / imgHeight);
      const sourceHeight = Math.min(
        (pageHeight - 20) * (canvas.height / imgHeight),
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
      const pageImgHeight = Math.min(pageHeight - 20, heightLeft);
      
      pdf.addImage(pageImgData, 'PNG', 10, 10, imgWidth, pageImgHeight);
      
      // Update tracking variables
      heightLeft -= (pageHeight - 20);
      position += (pageHeight - 20);
    }
    
    // Save the PDF
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Special handling for presentation quotes with cover pages
 */
async function generatePresentationPdf(
  pdf: jsPDF, 
  coverPages: NodeListOf<HTMLElement>, 
  contentPage: HTMLElement, 
  filename: string,
  returnBlob: boolean = false
): Promise<void | Blob> {
  // Add each cover page as a separate page
  for (let i = 0; i < coverPages.length; i++) {
    if (i > 0) {
      pdf.addPage();
    }
    
    const coverCanvas = await html2canvas(coverPages[i], {
      scale: returnBlob ? 1.5 : 2, // Lower scale for email attachments
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const imgData = returnBlob ? 
      coverCanvas.toDataURL('image/jpeg', 0.85) : 
      coverCanvas.toDataURL('image/png');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (coverCanvas.height * imgWidth) / coverCanvas.width;
    
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(pageHeight - 20, imgHeight));
  }
  
  // Now add the content pages
  pdf.addPage();
  
  // Make sure terms and conditions section stays on one page
  const termsSection = contentPage.querySelector('[style*="pageBreakInside: avoid"]');
  if (termsSection) {
    // Add a specific class for identification
    termsSection.classList.add('terms-section');
  }
  
  const contentCanvas = await html2canvas(contentPage, {
    scale: returnBlob ? 1.5 : 2, // Lower scale for email attachments
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 20;
  const imgHeight = (contentCanvas.height * imgWidth) / contentCanvas.width;
  
  // For single page content
  if (imgHeight <= pageHeight - 20) {
    pdf.addImage(contentCanvas.toDataURL('image/png'), 'PNG', 10, 10, imgWidth, imgHeight);
    
    if (returnBlob) {
      return pdf.output('blob');
    } else {
      pdf.save(`${filename}.pdf`);
      return;
    }
  }
  
  // For multi-page content
  let heightLeft = imgHeight;
  let position = 0;
  
  // Add first content page
  pdf.addImage(contentCanvas.toDataURL('image/png'), 'PNG', 10, 10, imgWidth, Math.min(pageHeight - 20, imgHeight));
  heightLeft -= (pageHeight - 20);
  position += (pageHeight - 20);
  
  // Add subsequent content pages
  while (heightLeft > 0) {
    pdf.addPage();
    
    // Calculate source area for this page
    const sourceY = position * (contentCanvas.height / imgHeight);
    const sourceHeight = Math.min(
      (pageHeight - 20) * (contentCanvas.height / imgHeight),
      contentCanvas.height - sourceY
    );
    
    // Get just this portion of the content
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) continue;
    
    tempCanvas.width = contentCanvas.width;
    tempCanvas.height = sourceHeight;
    
    // Draw just the needed portion
    ctx.drawImage(
      contentCanvas,
      0, sourceY,
      contentCanvas.width, sourceHeight,
      0, 0,
      contentCanvas.width, sourceHeight
    );
    
    // Add to PDF (with reduced quality for email)
    const pageImgData = returnBlob ? 
      tempCanvas.toDataURL('image/jpeg', 0.85) : 
      tempCanvas.toDataURL('image/png');
    const pageImgHeight = Math.min(pageHeight - 20, heightLeft);
    
    pdf.addImage(pageImgData, 'PNG', 10, 10, imgWidth, pageImgHeight);
    
    // Update tracking variables
    heightLeft -= (pageHeight - 20);
    position += (pageHeight - 20);
  }
  
  // Save or return the PDF based on the parameter
  if (returnBlob) {
    return pdf.output('blob');
  } else {
    pdf.save(`${filename}.pdf`);
  }
}