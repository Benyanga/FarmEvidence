export function SellingPriceField({ id, value, onChange }) {
  return (
    <label className="field-group">
      <span className="field-label">Selling Price (RWF/kg)</span>
      <input
        id={id}
        type="number"
        min="0"
        step="any"
        className="field-input"
        placeholder="Selling Price (RWF/kg)"
        value={value ?? ""}
        onChange={onChange}
      />
    </label>
  );
}

