export function ReportSection({ title, children }) {
  return (
    <section className="card mb-3">
      <h3 className="heading-3 mb-3">{title}</h3>
      {children}
    </section>
  );
}

