import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Prepares a clone of the element with proper page break styling before rendering to PDF
 * This helps ensure consistent page breaks
 */
const prepareElementForPdf = (element: HTMLElement): HTMLElement => {
  // Clone the element to avoid modifying the original
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Add page break styling to tables and sections
  const tables = clone.querySelectorAll('table');
  tables.forEach(table => {
    const tableElement = table as HTMLElement;
    tableElement.style.pageBreakInside = 'avoid';
    tableElement.style.breakInside = 'avoid';
  });
  
  // Add page break before to section headings (except the first one)
  const sections = clone.querySelectorAll('h2, h3');
  sections.forEach((section, index) => {
    if (index > 0) {
      const sectionElement = section as HTMLElement;
      sectionElement.style.pageBreakBefore = 'always';
      sectionElement.style.breakBefore = 'page';
      sectionElement.style.marginTop = '20px';
    }
  });
  
  // Ensure footers stay with their content
  const footers = clone.querySelectorAll('.footer, .quote-footer, .summary, .total-section');
  footers.forEach(footer => {
    const footerElement = footer as HTMLElement;
    footerElement.style.pageBreakInside = 'avoid';
    footerElement.style.breakInside = 'avoid';
  });
  
  // Add data attributes for print CSS to target
  const roomSections = clone.querySelectorAll('.room-section');
  roomSections.forEach((section, index) => {
    const sectionElement = section as HTMLElement;
    sectionElement.dataset.roomSection = 'true';
  });
  
  const summarySection = clone.querySelector('.summary-section');
  if (summarySection) {
    (summarySection as HTMLElement).dataset.section = 'summary';
  }
  
  const totalSection = clone.querySelector('.total-section');
  if (totalSection) {
    (totalSection as HTMLElement).dataset.section = 'total';
  }
  
  return clone;
};

/**
 * Converts an HTML element to a PDF and downloads it
 * @param element The HTML element to convert to PDF
 * @param filename The name of the downloaded file
 */
export const exportToPdf = async (element: HTMLElement, filename: string): Promise<void> => {
  try {
    // Prepare the element with proper page break styling
    const preparedElement = prepareElementForPdf(element);
    
    // Temporarily append the prepared element to the document for rendering
    preparedElement.style.position = 'absolute';
    preparedElement.style.left = '-9999px';
    preparedElement.style.width = '210mm'; // A4 width
    document.body.appendChild(preparedElement);
    
    // Create a PDF in A4 format
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    
    // Calculate dimensions for A4 page size
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Set a standard padding/margin (in mm)
    const padding = 10;
    
    // Calculate content area dimensions with margins
    const contentWidth = pageWidth - (padding * 2);
    const contentHeight = pageHeight - (padding * 2);
    
    // Create a canvas of the element with enhanced settings
    const canvas = await html2canvas(preparedElement, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Needed for external images (like logos)
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: false,
      // Removed unsupported letterRendering option
      // Use an improved algorithm for slicing the content into pages
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.body.querySelector('[data-pdf-clone="true"]');
        if (clonedElement) {
          // Additional adjustments to the cloned element if needed
          const pageBreakElements = clonedElement.querySelectorAll('[data-page-break]');
          pageBreakElements.forEach(el => {
            (el as HTMLElement).style.pageBreakAfter = 'always';
            (el as HTMLElement).style.breakAfter = 'page';
          });
        }
      }
    });
    
    // Remove the temporary element
    document.body.removeChild(preparedElement);
    
    // Calculate the scaling factor to fit width (maintaining aspect ratio)
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate how many pages we need
    const pageCount = Math.ceil(imgHeight / contentHeight);
    
    // Add each page separately with proper positioning
    for (let i = 0; i < pageCount; i++) {
      // Add a new page for all pages after the first
      if (i > 0) {
        pdf.addPage();
      }
      
      // Calculate the position and height for this page slice
      const sourceY = i * contentHeight * (canvas.height / imgHeight);
      const sourceHeight = Math.min(
        contentHeight * (canvas.height / imgHeight),
        canvas.height - sourceY
      );
      
      // Handle last page special case
      const destHeight = (i === pageCount - 1 && imgHeight % contentHeight !== 0)
        ? (imgHeight % contentHeight)
        : contentHeight;
      
      // Add the image for this page using the correct overload
      pdf.addImage({
        imageData: imgData,
        format: 'PNG',
        x: padding,
        y: padding,
        width: imgWidth,
        height: destHeight,
        alias: `page-${i}`, // Unique identifier
        compression: 'FAST'
      });
    }
    
    // Save the PDF
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};