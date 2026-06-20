import { useDataStore } from "../../../store/dataStore";
import { useSessionStore } from "../../../store/sessionStore";
import { useEffect } from "react";
import { computeRevenue } from "../../../engine/formulas/revenue";
import { YieldField } from "./YieldField";
import { SellingPriceField } from "./SellingPriceField";

export function RevenueEntry() {
  const activeFarm = useSessionStore((s) => s.activeFarm);
  const seasonKey = activeFarm ? `${activeFarm.year}-${activeFarm.season}` : "season-1";
  const season = useDataStore((s) => s.seasons[seasonKey] ?? s.seasons["season-1"]);
  const updateRevenue = useDataStore((s) => s.updateRevenue);
  const autosave = useDataStore((s) => s.autosave);
  const revenue = season?.revenue ?? {};
  let computed = null;
  if (Number(revenue.yield_kg_ha) > 0 && Number(revenue.sellingPrice) > 0) {
    computed = computeRevenue(Number(revenue.yield_kg_ha), Number(revenue.sellingPrice));
  }

  // Auto-save when revenue data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      autosave();
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [revenue, autosave]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="heading-2">Revenue</h2>
        <button type="button" className="btn btn-secondary" onClick={autosave}>
          Save Records
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <YieldField
          id="section-revenue-yield"
          value={revenue.yield_kg_ha}
          onChange={(e) => updateRevenue(seasonKey, { ...revenue, yield_kg_ha: Number(e.target.value) })}
        />
        <SellingPriceField
          id="section-revenue-price"
          value={revenue.sellingPrice}
          onChange={(e) => updateRevenue(seasonKey, { ...revenue, sellingPrice: Number(e.target.value) })}
        />
      </div>
      <p className="body-sm">Revenue = {computed === null ? "Pending inputs" : `${computed.toFixed(2)} RWF/ha`}</p>
    </div>
  );
}

