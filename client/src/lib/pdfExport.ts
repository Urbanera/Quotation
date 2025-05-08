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
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // First render the element to a canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Needed for external images
      logging: false,
      backgroundColor: '#ffffff',
    });
    
    // Get the canvas data as an image
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate dimensions to fit A4 while maintaining aspect ratio
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add the image to the PDF
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // If the content is taller than a single page, add more pages
    let heightLeft = imgHeight;
    let position = 0;
    
    while (heightLeft > pdfHeight) {
      position = position - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
    
    // Save the PDF
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};