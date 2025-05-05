import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Formats PDF output to A4 size with proper page setup
 */
export async function generatePDF(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id '${elementId}' not found`);
    return;
  }

  try {
    // Create a pdf with A4 dimensions
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // A4 page dimensions (in pixels at 96 DPI)
    const a4Width = 794; // ~210mm at 96 DPI 
    const a4Height = 1123; // ~297mm at 96 DPI
    
    // Set the page margins (15mm on all sides)
    const margin = 15;
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = pdfHeight - (margin * 2);
    
    // Clone the element to avoid modifying the original
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Set the cloned element's width to match A4 paper width (minus margins)
    clonedElement.style.width = `${a4Width - (margin * 2 * 3.779)}px`; // Convert mm to px (1mm ≈ 3.779px)
    
    // Create a temporary container and append the cloned element
    const container = document.createElement('div');
    container.appendChild(clonedElement);
    document.body.appendChild(container);
    
    // Position the container off-screen but make it visible
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.height = 'auto';
    container.style.width = `${a4Width - (margin * 2 * 3.779)}px`; 
    container.style.visibility = 'visible';
    
    try {
      // Convert the element to canvas
      const canvas = await html2canvas(clonedElement, { 
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false
      });
      
      // Get canvas dimensions
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate the scaling ratio to fit the content width
      const ratio = contentWidth / imgWidth;
      
      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate how many pages we need
      const totalPages = Math.ceil((imgHeight * ratio) / contentHeight);
      
      // Add each page
      for (let page = 0; page < totalPages; page++) {
        // Add a new page after the first one
        if (page > 0) {
          pdf.addPage();
        }
        
        // Calculate what part of the image to use for this page
        const srcY = page * contentHeight / ratio;
        const srcHeight = Math.min(contentHeight / ratio, imgHeight - srcY);
        
        // Create a temporary canvas for the current page
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = imgWidth;
        pageCanvas.height = srcHeight;
        
        // Draw the appropriate part of the original canvas onto this one
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(canvas, 0, srcY, imgWidth, srcHeight, 0, 0, imgWidth, srcHeight);
          
          // Add this slice to the PDF
          const pageImgData = pageCanvas.toDataURL('image/png');
          pdf.addImage(pageImgData, 'PNG', margin, margin, contentWidth, srcHeight * ratio);
        }
      }
      
      // Save the PDF
      pdf.save(filename);
    } finally {
      // Cleanup: remove temporary container
      document.body.removeChild(container);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}

/**
 * Direct download of PDF without preview for list views
 */
export async function downloadPDF(url: string, filename: string): Promise<void> {
  try {
    // Fetch the PDF content
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }
    
    // Convert response to blob
    const blob = await response.blob();
    
    // Create a URL for the blob
    const blobUrl = URL.createObjectURL(blob);
    
    // Create a temporary link and click it to download
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error downloading PDF:', error);
  }
}