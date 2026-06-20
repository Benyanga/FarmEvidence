import { buildPdfFromElement } from "../../utils/pdfBuilder";

export function ReportBuilder({ targetRef }) {
  const onDownload = async () => {
    if (!targetRef?.current) return;
    const pdf = await buildPdfFromElement(targetRef.current);
    pdf.save("farm-evidence-season-report.pdf");
  };
  return (
    <button type="button" className="btn btn-primary" onClick={onDownload}>
      Download Season Report
    </button>
  );
}



