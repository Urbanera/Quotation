import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Converts an HTML element to a PDF and downloads it
 * @param element The HTML element to convert to PDF
 * @param filename The name of the downloaded file
 */
export const exportToPdf = async (element: HTMLElement, filename: string): Promise<void> => {
  try {
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
    
    // Create a canvas of the element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Needed for external images (like logos)
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    // Calculate the scaling factor to fit width (maintaining aspect ratio)
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/png');
    
    // If content fits on one page, simply add it
    pdf.addImage(imgData, 'PNG', padding, padding, imgWidth, imgHeight);
    
    // If content is taller than page, create additional pages
    if (imgHeight > contentHeight) {
      let remainingHeight = imgHeight;
      let currentPosition = 0;
      
      // First page is already added
      remainingHeight -= contentHeight;
      currentPosition += contentHeight;
      
      // Add additional pages as needed
      while (remainingHeight > 0) {
        pdf.addPage();
        
        // Calculate source area height for this page
        const sourceHeight = Math.min(remainingHeight, contentHeight);
        
        // Calculate source area position in the canvas
        const sourceY = currentPosition * (canvas.height / imgHeight);
        
        // Calculate source area height in canvas pixels
        const sourceHeightInPx = sourceHeight * (canvas.height / imgHeight);
        
        // Create a new canvas for just this portion
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = sourceHeightInPx;
        
        // Draw the relevant portion to the temporary canvas
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas, 
            0, sourceY, 
            canvas.width, sourceHeightInPx, 
            0, 0, 
            tempCanvas.width, tempCanvas.height
          );
          
          // Add this portion to the PDF
          const pageImgData = tempCanvas.toDataURL('image/png');
          pdf.addImage(pageImgData, 'PNG', padding, padding, imgWidth, sourceHeight);
        }
        
        // Update tracking variables for next page
        remainingHeight -= sourceHeight;
        currentPosition += sourceHeight;
      }
    }
    
    // Save the PDF
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};