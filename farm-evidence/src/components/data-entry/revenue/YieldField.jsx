export function YieldField({ id, value, onChange }) {
  return (
    <label className="field-group">
      <span className="field-label">Yield (kg/ha)</span>
      <input
        id={id}
        type="number"
        min="0"
        step="any"
        className="field-input"
        placeholder="Yield (kg/ha)"
        value={value ?? ""}
        onChange={onChange}
      />
    </label>
  );
}

