export function LiveComputed({ label, value, unit = "" }) {
  return (
    <div className="card state-neutral body-sm">
      <b>{label}:</b> {value ?? "Pending"} {unit}
    </div>
  );
}

