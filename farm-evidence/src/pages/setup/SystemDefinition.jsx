import { useState, useEffect, useMemo } from 'react';

const DIMENSIONS = [
  {
    id: 1,
    name: 'Soil Disturbance',
    key: 'soilDisturbance',
    options: [
      'Zero tillage',
      'Minimum tillage',
      'Rip-line seeding',
      'Intensive tillage',
      'Plowing + harrowing',
    ],
  },
  {
    id: 2,
    name: 'Soil Cover',
    key: 'soilCover',
    options: [
      'Permanent organic cover (mulch + residues)',
      'Partial cover',
      'Bare soil',
    ],
  },
  {
    id: 3,
    name: 'Cropping System',
    key: 'croppingSystem',
    options: ['Rotation + intercropping', 'Monocropping', 'Limited rotation'],
  },
  {
    id: 4,
    name: 'Nutrient Management',
    key: 'nutrientManagement',
    options: [
      'Biological cycling + efficient use',
      'High synthetic dependency',
      'Mixed',
    ],
  },
  {
    id: 5,
    name: 'Pest & Weed Control',
    key: 'pestWeedControl',
    options: [
      'IPM + mulch suppression',
      'Manual weeding',
      'Chemical heavy',
    ],
  },
  {
    id: 6,
    name: 'Water Management',
    key: 'waterManagement',
    options: ['High WUE + mulch', 'Standard', 'Low efficiency'],
  },
  {
    id: 7,
    name: 'Residue Management',
    key: 'residueManagement',
    options: ['Retention + recycling', 'Removal', 'Burning'],
  },
  {
    id: 8,
    name: 'Energy Use',
    key: 'energyUse',
    options: ['Low energy (few ops)', 'Medium', 'High energy (multiple passes)'],
  },
  {
    id: 9,
    name: 'Risk Profile',
    key: 'riskProfile',
    options: ['Diversified + resilient', 'Moderate', 'High (monoculture)'],
  },
];

// Typical CA and CF values for comparison matrix coloring
const TYPICAL_VALUES = {
  CA: {
    soilDisturbance: 'Zero tillage',
    soilCover: 'Permanent organic cover (mulch + residues)',
    croppingSystem: 'Rotation + intercropping',
    nutrientManagement: 'Biological cycling + efficient use',
    pestWeedControl: 'IPM + mulch suppression',
    waterManagement: 'High WUE + mulch',
    residueManagement: 'Retention + recycling',
    energyUse: 'Low energy (few ops)',
    riskProfile: 'Diversified + resilient',
  },
  CF: {
    soilDisturbance: 'Plowing + harrowing',
    soilCover: 'Bare soil',
    croppingSystem: 'Monocropping',
    nutrientManagement: 'High synthetic dependency',
    pestWeedControl: 'Chemical heavy',
    waterManagement: 'Standard',
    residueManagement: 'Removal',
    energyUse: 'High energy (multiple passes)',
    riskProfile: 'High (monoculture)',
  },
};

export function SystemDefinition({ trialId, treatments = [], onComplete, onSave }) {
  const [definitions, setDefinitions] = useState({});
  const [definedStatus, setDefinedStatus] = useState({});
  const [saving, setSaving] = useState(false);

  // Initialize state from treatments
  useEffect(() => {
    const initDefs = {};
    const initStatus = {};
    treatments.forEach((treatment) => {
      initDefs[treatment.code] = treatment.systemDefinition || {};
      initStatus[treatment.code] = treatment.systemDefinition?.defined ?? false;
    });
    setDefinitions(initDefs);
    setDefinedStatus(initStatus);
  }, [treatments]);

  const updateDefinition = (treatmentCode, dimensionKey, value) => {
    setDefinitions((prev) => ({
      ...prev,
      [treatmentCode]: {
        ...prev[treatmentCode],
        [dimensionKey]: value,
      },
    }));
  };

  const toggleDefined = (treatmentCode) => {
    setDefinedStatus((prev) => ({
      ...prev,
      [treatmentCode]: !prev[treatmentCode],
    }));
  };

  const allSystemsDefined = useMemo(
    () =>
      treatments.length > 0 &&
      treatments.every((t) => definedStatus[t.code] === true),
    [treatments, definedStatus]
  );

  const getSystemCompleteness = (treatmentCode) => {
    const def = definitions[treatmentCode] || {};
    const filledDimensions = DIMENSIONS.filter((d) => def[d.key]).length;
    return filledDimensions === DIMENSIONS.length;
  };

  const handleSave = async () => {
    if (!allSystemsDefined) return;

    setSaving(true);
    try {
      // Prepare payload
      const systemDefinitions = {};
      treatments.forEach((treatment) => {
        systemDefinitions[treatment.code] = {
          ...definitions[treatment.code],
          defined: definedStatus[treatment.code],
        };
      });

      // Call API
      const response = await fetch(`/api/trials/${trialId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemDefinitions }),
      });

      if (!response.ok) throw new Error('Failed to save system definitions');

      // Notify parent
      if (onSave) onSave(systemDefinitions);
      if (onComplete) onComplete(true);
    } catch (error) {
      console.error('[SystemDefinition]', error);
    } finally {
      setSaving(false);
    }
  };

  const getColorClass = (treatmentCode, dimensionKey, value) => {
    if (!value) return 'bg-slate-50';
    if (TYPICAL_VALUES.CA[dimensionKey] === value) return 'bg-emerald-50';
    if (TYPICAL_VALUES.CF[dimensionKey] === value) return 'bg-blue-50';
    return 'bg-slate-50';
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-900">
          <span className="font-semibold">⚠️ System Integrity Rule:</span> All
          systems must be fully parameterised before data entry is enabled. No
          undefined or partially described system may be used in a comparison.
        </p>
      </div>

      {/* Treatment Definition Cards */}
      <div className="space-y-6">
        {treatments.map((treatment) => {
          const isComplete = getSystemCompleteness(treatment.code);
          const isDefined = definedStatus[treatment.code];
          const isDimensionFilled = (dimensionKey) =>
            definitions[treatment.code]?.[dimensionKey];

          return (
            <div
              key={treatment.code}
              className="rounded-3xl border border-slate-200 bg-white overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {treatment.name}
                  </h2>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-200 text-slate-700">
                    {treatment.code}
                  </span>
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                    isDefined && isComplete
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isDefined && isComplete ? (
                    <>
                      <span>✓</span>
                      <span>Defined</span>
                    </>
                  ) : (
                    <>
                      <span>⚠</span>
                      <span>Incomplete</span>
                    </>
                  )}
                </div>
              </div>

              {/* Card Body - Dimension Rows */}
              <div className="divide-y divide-slate-200">
                {DIMENSIONS.map((dimension) => (
                  <div key={dimension.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-32 flex-shrink-0">
                      <label className="text-sm font-medium text-slate-900">
                        {dimension.name}
                      </label>
                      {isDimensionFilled(dimension.key) ? (
                        <p className="text-xs text-emerald-600 font-semibold mt-1">
                          ✓ Selected
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 mt-1">Required</p>
                      )}
                    </div>

                    <select
                      value={definitions[treatment.code]?.[dimension.key] || ''}
                      onChange={(e) =>
                        updateDefinition(
                          treatment.code,
                          dimension.key,
                          e.target.value
                        )
                      }
                      className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="">— Select —</option>
                      {dimension.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Defined Checkbox */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isDefined}
                  onChange={() => toggleDefined(treatment.code)}
                  className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label className="text-sm font-medium text-slate-900">
                  System is fully defined
                </label>
                {!isComplete && isDefined && (
                  <span className="text-xs text-amber-600 font-semibold">
                    (Complete all 9 dimensions first)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Matrix */}
      {treatments.length > 1 && (
        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              System Comparison Matrix
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Green cells indicate CA-typical practices. Blue cells indicate CF-typical practices.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 w-48">
                    Dimension
                  </th>
                  {treatments.map((treatment) => (
                    <th
                      key={treatment.code}
                      className="px-6 py-3 text-left font-semibold text-slate-900"
                    >
                      {treatment.code}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {DIMENSIONS.map((dimension) => (
                  <tr key={dimension.id}>
                    <td className="px-6 py-3 font-medium text-slate-900 w-48">
                      {dimension.name}
                    </td>
                    {treatments.map((treatment) => {
                      const value =
                        definitions[treatment.code]?.[dimension.key] || '';
                      return (
                        <td
                          key={`${treatment.code}-${dimension.id}`}
                          className={`px-6 py-3 text-sm text-slate-700 ${getColorClass(
                            treatment.code,
                            dimension.key,
                            value
                          )}`}
                        >
                          {value || '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-50 border border-emerald-200" />
              <span className="text-slate-700">CA-typical practice</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-50 border border-blue-200" />
              <span className="text-slate-700">CF-typical practice</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-slate-50 border border-slate-200" />
              <span className="text-slate-700">Other or undefined</span>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-600">
          {allSystemsDefined ? (
            <span className="font-semibold text-emerald-700">
              ✓ All systems fully defined. Ready to enable data entry.
            </span>
          ) : (
            <span>
              {treatments.filter((t) => !definedStatus[t.code]).length} of{' '}
              {treatments.length} system{treatments.length !== 1 ? 's' : ''} still
              needs completion.
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={!allSystemsDefined || saving}
          onClick={handleSave}
          className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {saving ? 'Saving…' : 'Complete System Definitions'}
        </button>
      </div>
    </div>
  );
}
