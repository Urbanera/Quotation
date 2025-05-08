import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * A simplified PDF generation approach that works more reliably
 * @param element The HTML element to convert to PDF
 * @param filename The name of the downloaded file
 */
export const exportToPdf = async (element: HTMLElement, filename: string): Promise<void> => {
  try {
    // Create a PDF in A4 format
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
        
        /* Keep content together */
        .footer, .quote-footer, .summary-section, .total-section {
          page-break-inside: avoid;
          break-inside: avoid;
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
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Apply data attributes to help with PDF generation
    const roomSections = clone.querySelectorAll('.room-section');
    roomSections.forEach(section => {
      (section as HTMLElement).setAttribute('data-room-section', 'true');
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
    
    // Convert to canvas
    const canvas = await html2canvas(clone, {
      scale: 2, // Higher resolution
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
    
    // Get image data
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate needed pages
    const pageCount = Math.ceil(imgHeight / (pageHeight - 20));
    
    // For single page documents
    if (pageCount <= 1) {
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`${filename}.pdf`);
      return;
    }
    
    // For multi-page documents
    let heightLeft = imgHeight;
    let position = 0;
    let currentPage = 0;
    
    // Add first page
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(pageHeight - 20, imgHeight));
    heightLeft -= (pageHeight - 20);
    position += (pageHeight - 20);
    
    // Add subsequent pages
    while (heightLeft > 0) {
      currentPage++;
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