import { useState, useEffect } from 'react';

const TECHNOLOGIES = [
  {
    id: 1,
    name: 'Drip Irrigation',
    category: 'Water',
    benefit: '↓ water 30–60%',
    challenge: '↑ installation',
    year1Net: -80,
    year5Net: 120,
    defaultSavings: 80,
    defaultAdditionalCost: 150,
  },
  {
    id: 2,
    name: 'Legume Intercropping',
    category: 'Nutrient',
    benefit: '↓ N fertilizer 50–80%',
    challenge: '↑ management complexity',
    year1Net: -20,
    year5Net: 80,
    defaultSavings: 50,
    defaultAdditionalCost: 30,
  },
  {
    id: 3,
    name: 'Mulching',
    category: 'Cover',
    benefit: '↓ weed pressure + water',
    challenge: 'material sourcing',
    year1Net: 10,
    year5Net: 60,
    defaultSavings: 40,
    defaultAdditionalCost: 30,
  },
  {
    id: 4,
    name: 'Precision Fertilization',
    category: 'Nutrient',
    benefit: '↓ waste 20–40% + ↑ yield',
    challenge: 'technology cost',
    year1Net: -40,
    year5Net: 90,
    defaultSavings: 70,
    defaultAdditionalCost: 110,
  },
  {
    id: 5,
    name: 'CA Planter / Mechanization',
    category: 'Labor',
    benefit: '↓ labor 34–50%',
    challenge: 'machinery cost',
    year1Net: -60,
    year5Net: 110,
    defaultSavings: 90,
    defaultAdditionalCost: 200,
  },
  {
    id: 6,
    name: 'Cover Crops',
    category: 'Soil',
    benefit: '↓ erosion + nutrient loss',
    challenge: 'seed + ops',
    year1Net: -50,
    year5Net: 80,
    defaultSavings: 60,
    defaultAdditionalCost: 40,
  },
  {
    id: 7,
    name: 'IPM Integration',
    category: 'Pest',
    benefit: '↓ pesticide frequency',
    challenge: 'monitoring effort',
    year1Net: 5,
    year5Net: 45,
    defaultSavings: 35,
    defaultAdditionalCost: 20,
  },
];

export function SystemPlusSetup({ initialValues = {}, onChange }) {
  const [enabled, setEnabled] = useState(initialValues.systemPlusEnabled ?? false);
  const [selectedTechs, setSelectedTechs] = useState(initialValues.selectedTechnologies ?? []);
  const [expandedTechId, setExpandedTechId] = useState(null);

  // Update parent when state changes
  useEffect(() => {
    onChange({
      systemPlusEnabled: enabled,
      selectedTechnologies: selectedTechs,
    });
  }, [enabled, selectedTechs]);

  const toggleTechnology = (tech) => {
    const isSelected = selectedTechs.some((t) => t.id === tech.id);
    if (isSelected) {
      setSelectedTechs(selectedTechs.filter((t) => t.id !== tech.id));
      if (expandedTechId === tech.id) setExpandedTechId(null);
    } else {
      setSelectedTechs([
        ...selectedTechs,
        {
          id: tech.id,
          name: tech.name,
          savings: tech.defaultSavings,
          additionalCost: tech.defaultAdditionalCost,
        },
      ]);
      setExpandedTechId(tech.id);
    }
  };

  const updateTechParams = (techId, savings, additionalCost) => {
    setSelectedTechs(
      selectedTechs.map((t) =>
        t.id === techId ? { ...t, savings, additionalCost } : t
      )
    );
  };

  const totalSavings = selectedTechs.reduce((sum, t) => sum + t.savings, 0);
  const totalAdditionalCosts = selectedTechs.reduce(
    (sum, t) => sum + t.additionalCost,
    0
  );
  const netEffect = totalSavings - totalAdditionalCosts;

  return (
    <div className="space-y-6">
      {/* SECTION 1: Enable Toggle */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-lg font-semibold text-slate-900">
              Enable System Plus (CA+ / CF+)?
            </label>
            <p className="mt-2 text-sm text-slate-600">
              Enhance your base treatment with proven technologies tailored to your site
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
              enabled ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-9' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {!enabled && (
          <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
            Standard CA and CF treatments will be used.
          </p>
        )}
      </div>

      {/* SECTION 2: Technology Library */}
      {enabled && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Technology Library
            </h2>

            {/* Technology Cards Grid */}
            <div className="space-y-4">
              {TECHNOLOGIES.map((tech) => {
                const isSelected = selectedTechs.some((t) => t.id === tech.id);
                const isExpanded = expandedTechId === tech.id;
                const selectedTech = selectedTechs.find((t) => t.id === tech.id);

                return (
                  <div key={tech.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    {/* Card Header */}
                    <button
                      type="button"
                      onClick={() => toggleTechnology(tech)}
                      className="w-full p-4 text-left hover:bg-slate-50 transition flex items-start gap-4"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">
                            {tech.name}
                          </h3>
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            {tech.category}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{tech.benefit}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Challenge: {tech.challenge}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 text-right">
                        <div>
                          <p className="text-xs text-slate-500">Cost Savings</p>
                          <p className="text-sm font-semibold text-emerald-700">
                            −RWF {tech.defaultSavings}/ha
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Additional Cost</p>
                          <p className="text-sm font-semibold text-rose-700">
                            +RWF {tech.defaultAdditionalCost}/ha
                          </p>
                        </div>
                        <div className="mt-2 border-t border-slate-200 pt-2">
                          <p className="text-xs text-slate-500">Year 1 Net</p>
                          <p
                            className={`text-sm font-semibold ${
                              tech.year1Net < 0
                                ? 'text-emerald-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {tech.year1Net < 0 ? '−' : '+'}RWF {Math.abs(tech.year1Net)}/ha
                          </p>
                          <p className="text-xs text-slate-500 mt-1">Year 5 Net</p>
                          <p
                            className={`text-sm font-semibold ${
                              tech.year5Net < 0
                                ? 'text-emerald-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {tech.year5Net < 0 ? '−' : '+'}RWF {Math.abs(tech.year5Net)}/ha
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Parameterization Form */}
                    {isSelected && isExpanded && selectedTech && (
                      <div className="border-t border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-900 mb-4">
                          Parameterise for your site
                        </p>

                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">
                              Cost Savings (RWF/ha) — for your site
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={selectedTech.savings}
                              onChange={(e) =>
                                updateTechParams(
                                  tech.id,
                                  Number(e.target.value) || 0,
                                  selectedTech.additionalCost
                                )
                              }
                              placeholder={`Reference: ${tech.defaultSavings}`}
                              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                          </label>

                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">
                              Additional Costs (RWF/ha) — for your site
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={selectedTech.additionalCost}
                              onChange={(e) =>
                                updateTechParams(
                                  tech.id,
                                  selectedTech.savings,
                                  Number(e.target.value) || 0
                                )
                              }
                              placeholder={`Reference: ${tech.defaultAdditionalCost}`}
                              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
                            />
                          </label>
                        </div>

                        <p className="mt-4 rounded-2xl bg-blue-50 p-3 text-xs text-blue-900 border border-blue-200">
                          <span className="font-semibold">Note:</span> These values are
                          illustrative defaults from Rwanda bean/maize systems.
                          Parameterise for your specific site before use in CBA.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Plus Cost Formula & Preview */}
          {selectedTechs.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-emerald-50 p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    System Plus Cost Formula
                  </p>
                  <p className="mt-2 text-sm text-slate-700 font-mono">
                    C_total(System+) = C_total(Base) − Savings_from_tech + Additional_costs_of_tech
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                  <p className="text-sm text-slate-600">Estimated net effect</p>
                  <p
                    className={`mt-2 text-3xl font-bold ${
                      netEffect >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {netEffect >= 0 ? '+' : '−'}RWF {Math.abs(netEffect).toFixed(0)}/ha
                  </p>
                  <div className="mt-3 text-xs text-slate-600 space-y-1">
                    <p>
                      Total Savings:{' '}
                      <span className="font-semibold text-emerald-700">
                        −RWF {totalSavings.toFixed(0)}/ha
                      </span>
                    </p>
                    <p>
                      Total Additional Costs:{' '}
                      <span className="font-semibold text-rose-700">
                        +RWF {totalAdditionalCosts.toFixed(0)}/ha
                      </span>
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-700 bg-white rounded-2xl p-3 border border-slate-200">
                  <span className="font-semibold">Interpretation:</span> A
                  {netEffect >= 0 ? ' positive' : ' negative'} value indicates that System Plus
                  technologies will
                  {netEffect >= 0 ? ' reduce total system costs' : ' increase total system costs'}
                  {' '}on average. Actual results depend on your site conditions and management practice.
                </p>
              </div>
            </div>
          )}

          {selectedTechs.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-slate-600">
                Select at least one technology to see cost estimates and the System Plus formula
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
