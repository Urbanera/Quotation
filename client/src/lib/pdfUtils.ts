import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Formats PDF output to A4 size with proper page setup
 */
export async function generatePDF(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id '${elementId}' not found`);
    throw new Error(`Element with id '${elementId}' not found`);
  }

  try {
    // Create a pdf with A4 dimensions (portrait)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Get page dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Set margins (10mm)
    const margin = 10;
    const contentWidth = pdfWidth - (margin * 2);
    
    // Force element to be visible even if it's hidden
    const originalDisplay = element.style.display;
    element.style.display = 'block';
    
    // Get the element as a canvas with high resolution
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution for better quality
      useCORS: true, // Allow images from other domains
      allowTaint: true, // Allow images to taint canvas
      logging: false, // Disable logging
      backgroundColor: '#FFFFFF', // White background
    });
    
    // Calculate the scale ratio to fit within page width (accounting for margins)
    const ratio = contentWidth / canvas.width;
    const scaledHeight = canvas.height * ratio;
    
    // Get image data from canvas
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    
    // Calculate how many pages we need
    const contentHeight = pdfHeight - (margin * 2);
    const pageCount = Math.ceil(scaledHeight / contentHeight);
    
    // Add image to PDF, potentially across multiple pages
    for (let i = 0; i < pageCount; i++) {
      // Add new pages after the first page
      if (i > 0) {
        pdf.addPage();
      }
      
      // Calculate the portion of the image to use for this page
      const position = -i * contentHeight / ratio; // Shift up for each page
      
      // Add the image to the PDF
      pdf.addImage(
        imgData, 'JPEG', 
        margin, margin, // X, Y position (with margins)
        contentWidth, scaledHeight, // Width and height in the PDF
        `page-${i}`, // Alias for this image
        'FAST', // Compression 
        position // Vertical position shift
      );
    }
    
    // Save the PDF
    pdf.save(filename);
    
    // Restore original display style
    element.style.display = originalDisplay;
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
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