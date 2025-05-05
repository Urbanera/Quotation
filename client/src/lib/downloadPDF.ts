/**
 * Opens a URL in a new tab for PDF download
 * Using server-side rendering to generate the PDF
 */
export function downloadPdf(type: 'quotation' | 'invoice' | 'receipt', id: number): void {
  // Open in a new tab to avoid navigation issues
  window.open(`/api/pdf/${type}/${id}`, '_blank');
}