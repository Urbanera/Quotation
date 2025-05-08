import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Converts an HTML element to a PDF and downloads it
 * @param element The HTML element to convert to PDF
 * @param filename The name of the downloaded file
 */
export const exportToPdf = async (element: HTMLElement, filename: string): Promise<void> => {
  try {
    // Clone the element to avoid modifying the original
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Create a temporary container with fixed dimensions matching A4 ratio
    const container = document.createElement('div');
    container.style.width = '210mm'; // A4 width
    container.style.padding = '10mm';
    container.style.backgroundColor = 'white';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.fontSize = '11px'; // Match print style font size
    container.style.fontFamily = 'Arial, sans-serif' // Ensure consistent font
    
    // Apply print-specific styling to the clone
    Array.from(clonedElement.querySelectorAll('*')).forEach(el => {
      if (el instanceof HTMLElement) {
        // Basic spacing reset
        el.style.margin = '0';
        el.style.padding = el.tagName === 'TD' || el.tagName === 'TH' ? '6px' : '0';
        
        // Font consistency
        el.style.fontFamily = 'Arial, sans-serif';
        
        // Element-specific styling
        if (el.tagName === 'H1') {
          el.style.fontSize = '16px';
          el.style.marginBottom = '8px';
        } else if (el.tagName === 'H2') {
          el.style.fontSize = '14px';
          el.style.marginBottom = '6px';
        } else if (el.tagName === 'H3') {
          el.style.fontSize = '12px';
          el.style.marginBottom = '4px';
        } else if (el.tagName === 'P') {
          el.style.fontSize = '11px';
          el.style.marginBottom = '4px';
        } else if (el.tagName === 'SPAN' || el.tagName === 'DIV') {
          el.style.fontSize = '11px';
        }
        
        // Table cell styling
        if (el.tagName === 'TD' || el.tagName === 'TH') {
          el.style.border = '1px solid #ddd';
          el.style.fontSize = '11px';
          
          // Green header cells
          if (el.tagName === 'TH') {
            el.style.backgroundColor = '#E6E6E6';
            el.style.color = '#009245';
          }
        }
        
        // Table styling
        if (el.tagName === 'TABLE') {
          el.style.width = '100%';
          el.style.borderCollapse = 'collapse';
          el.style.marginBottom = '12px';
        }
      }
    });
    
    // Put cloned element in container
    container.appendChild(clonedElement);
    document.body.appendChild(container);
    
    // Create a PDF in A4 format
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    
    // Get the PDF dimensions (minus margins)
    const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // 10mm margin on each side
    const pdfHeight = pdf.internal.pageSize.getHeight() - 20; // 10mm margin on each side
    
    // Render the container to canvas
    const canvas = await html2canvas(container, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Needed for external images
      logging: false,
      backgroundColor: '#ffffff',
      width: container.offsetWidth,
      height: container.offsetHeight,
    });
    
    // Get the canvas data
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate scaling to fit within the PDF page while maintaining proportions
    const imgWidth = pdfWidth;
    const ratio = canvas.width / imgWidth;
    const imgHeight = canvas.height / ratio;
    
    // Add the image to the PDF with 10mm margins
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    
    // If content exceeds a single page, add additional pages
    if (imgHeight > pdfHeight) {
      // The first page has already been added, account for that
      let heightLeft = imgHeight - pdfHeight;
      let position = -pdfHeight; // Start position for the second page
      
      // Add subsequent pages as needed
      while (heightLeft > 0) {
        // Add a new page
        pdf.addPage();
        
        // Add the same image but position it to show the next section
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        
        // Calculate for next page
        position -= pdfHeight;
        heightLeft -= pdfHeight;
      }
    }
    
    // Clean up temporary container
    document.body.removeChild(container);
    
    // Save the PDF
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};