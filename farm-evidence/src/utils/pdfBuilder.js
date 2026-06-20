/**
 * Converts a DOM element to a PDF document
 * @param {HTMLElement} element - The DOM element to convert
 * @returns {Promise<jsPDF>} - A promise that resolves to a jsPDF instance
 */
export async function buildPdfFromElement(element) {
  try {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    // Generate canvas from the HTML element
    const canvas = await html2canvas(element, {
      scale: 2,
      allowTaint: true,
      useCORS: true,
      backgroundColor: "var(--fe-white)",
    });

    // Get canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate PDF dimensions (A4 size: 210mm x 297mm)
    const pdfWidth = 210;
    const pdfHeight = (canvasHeight * pdfWidth) / canvasWidth;

    // Create PDF with A4 dimensions
    const pdf = new jsPDF({
      orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
      unit: "mm",
      format: "a4",
    });

    // Get actual page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Convert canvas to image and add to PDF
    const imgData = canvas.toDataURL("image/png");
    let heightLeft = pdfHeight;
    let position = 0;

    // Add image to PDF (may span multiple pages)
    pdf.addImage(imgData, "PNG", 0, position, pageWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pageWidth, pdfHeight);
      heightLeft -= pageHeight;
    }

    return pdf;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
