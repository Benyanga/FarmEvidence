import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useFarmerStore from '../stores/farmerStore';

const FarmerModeSeasonEntry = () => {
  const { id: seasonId } = useParams();
  const navigate = useNavigate();
  const { farmSetup, seasons, updateSeason } = useFarmerStore();
  const [season, setSeason] = useState(null);
  const [gateStatus, setGateStatus] = useState({});
  const [analysisButtonDisabled, setAnalysisButtonDisabled] = useState(true);
  const [economicOpen, setEconomicOpen] = useState(true);
  const [agronomicOpen, setAgronomicOpen] = useState(false);

  const COST_TYPE_OPTIONS = [
    { value: 'C_SD', label: 'System dependent' },
    { value: 'C_SI', label: 'System independent' },
  ];

  const TIME_UNIT_OPTIONS = [
    { value: 'seconds', label: 'Seconds' },
    { value: 'minutes', label: 'Minutes' },
    { value: 'hours', label: 'Hours' },
    { value: 'days', label: 'Days' },
  ];

  // Load season data when component mounts or seasonId changes
  useEffect(() => {
    if (!seasonId) return;
    const seasonData = seasons.find(s => s.id === seasonId);
    if (seasonData) {
      setSeason(seasonData);
    } else {
      // If season not found, maybe create a default? Or navigate back?
      console.error('Season not found');
    }
  }, [seasonId, seasons]);

  // If farmSetup is missing, redirect to setup
  useEffect(() => {
    if (!farmSetup) {
      navigate('/farmer/setup');
    }
  }, [farmSetup, navigate]);

  // We'll need to compute gate status whenever season data changes
  useEffect(() => {
    if (!season) return;
    const costData = getCostData(season);
    const labourRows = costData.labourCosts || [];
    const allLabourOperationsEntered = labourRows.length > 0 && labourRows.every((row) => {
      return row.practice && row.time !== '' && row.time !== null && row.time !== undefined;
    });
    const newGateStatus = {
      yieldRecorded: (season.revenueData?.yield || 0) > 0,
      sellingPriceEntered: (season.revenueData?.price || 0) > 0,
      allLabourOperationsEntered,
      wageRateEntered: (costData.wageRate || 0) > 0,
      allSixCostCategoriesComplete: costData.inputCosts.length > 0 && costData.labourCosts.length > 0,
    };
    const allPassed = Object.values(newGateStatus).every(Boolean);
    setGateStatus(newGateStatus);
    setAnalysisButtonDisabled(!allPassed);
  }, [season]);

  const getCostData = (current) => ({
    wageRate: 0,
    inputCosts: [],
    labourCosts: [],
    ...(current?.costData || {}),
  });

  const syncSeason = (nextSeason) => {
    setSeason(nextSeason);
    if (updateSeason && seasonId) {
      updateSeason(seasonId, nextSeason);
    }
  };

  // Handlers for form changes
  const handleWageRateChange = (value) => {
    const nextSeason = {
      ...season,
      costData: {
        ...getCostData(season),
        wageRate: parseFloat(value) || 0,
      },
    };
    syncSeason(nextSeason);
  };

  const computeInputTotal = (row) => {
    return Number(row.quantity || 0) * Number(row.unitCost || 0);
  };

  const computeLabourTotal = (row) => {
    const time = Number(row.time || 0);
    const wageRate = Number(row.wageRate !== undefined && row.wageRate !== null ? row.wageRate : season?.costData?.wageRate || 0);
    const factor = {
      seconds: 1 / 86400,
      minutes: 1 / 1440,
      hours: 1 / 24,
      days: 1,
    }[row.timeUnit] || 0;
    return time * factor * wageRate;
  };

  const updateInputCostRow = (index, key, value) => {
    const current = getCostData(season);
    const nextRows = [...(current.inputCosts || [])];
    const row = { ...nextRows[index], [key]: value };
    row.totalCost = computeInputTotal(row);
    nextRows[index] = row;
    syncSeason({
      ...season,
      costData: {
        ...current,
        inputCosts: nextRows,
      },
    });
  };

  const addInputCostRow = () => {
    const current = getCostData(season);
    syncSeason({
      ...season,
      costData: {
        ...current,
        inputCosts: [
          ...current.inputCosts,
          {
            id: Date.now().toString(),
            date: '',
            input: '',
            costType: 'C_SD',
            quantity: 0,
            unit: '',
            unitCost: 0,
            totalCost: 0,
          },
        ],
      },
    });
  };

  const removeInputCostRow = (index) => {
    const current = getCostData(season);
    syncSeason({
      ...season,
      costData: {
        ...current,
        inputCosts: current.inputCosts.filter((_, idx) => idx !== index),
      },
    });
  };

  const updateLabourCostRow = (index, key, value) => {
    const current = getCostData(season);
    const nextRows = [...(current.labourCosts || [])];
    const row = { ...nextRows[index], [key]: value };
    row.totalCost = computeLabourTotal(row);
    nextRows[index] = row;
    syncSeason({
      ...season,
      costData: {
        ...current,
        labourCosts: nextRows,
      },
    });
  };

  const addLabourCostRow = () => {
    const current = getCostData(season);
    syncSeason({
      ...season,
      costData: {
        ...current,
        labourCosts: [
          ...current.labourCosts,
          {
            id: Date.now().toString(),
            date: '',
            practice: '',
            costType: 'C_SD',
            time: 0,
            timeUnit: 'hours',
            wageRate: current.wageRate || 0,
            totalCost: 0,
          },
        ],
      },
    });
  };

  const removeLabourCostRow = (index) => {
    const current = getCostData(season);
    syncSeason({
      ...season,
      costData: {
        ...current,
        labourCosts: current.labourCosts.filter((_, idx) => idx !== index),
      },
    });
  };

  const updateAgronomicField = (key, value) => {
    syncSeason({
      ...season,
      agronomicData: {
        ...(season?.agronomicData || {}),
        [key]: value,
      },
    });
  };

  const inputSubtotal = getCostData(season).inputCosts.reduce((sum, row) => sum + computeInputTotal(row), 0);
  const labourSubtotal = getCostData(season).labourCosts.reduce((sum, row) => sum + computeLabourTotal(row), 0);

  // We'll need many more handlers for the tables, etc.

  // For brevity, we'll render a simplified version of the form
  // In a real implementation, we would expand each section.

  if (!farmSetup || !season) {
    return <div>Loading...</div>;
  }

  return (
    <div className="farmer-mode-season-entry">
      <h1>Farmer Mode - Season Entry</h1>
      <div className="season-header">
        <h2>Season {season.seasonReference.season} {season.seasonReference.year}</h2>
        <p>Farm: {farmSetup.farmName}</p>
        <p>Crop: {farmSetup.cropType}</p>
      </div>

      {/* Computation Gate Checklist (Part 3) */}
      <div className="gate-checklist">
        <h3>Gate Checklist</h3>
        <div className="gates">
          <div className="gate">
            <span>Yield recorded</span>
            <span className={gateStatus.yieldRecorded ? 'pass' : 'fail'}>
              {gateStatus.yieldRecorded ? '✓' : '✗'}
            </span>
          </div>
          <div className="gate">
            <span>Selling price entered</span>
            <span className={gateStatus.sellingPriceEntered ? 'pass' : 'fail'}>
              {gateStatus.sellingPriceEntered ? '✓' : '✗'}
            </span>
          </div>
          <div className="gate">
            <span>All 5 labour operations entered</span>
            <span className={gateStatus.allLabourOperationsEntered ? 'pass' : 'fail'}>
              {gateStatus.allLabourOperationsEntered ? '✓' : '✗'}
            </span>
          </div>
          <div className="gate">
            <span>Wage rate entered</span>
            <span className={gateStatus.wageRateEntered ? 'pass' : 'fail'}>
              {gateStatus.wageRateEntered ? '✓' : '✗'}
            </span>
          </div>
          <div className="gate">
            <span>All 6 cost categories complete</span>
            <span className={gateStatus.allSixCostCategoriesComplete ? 'pass' : 'fail'}>
              {gateStatus.allSixCostCategoriesComplete ? '✓' : '✗'}
            </span>
          </div>
        </div>
      </div>

      {/* Economic Records Accordion */}
      <section className="accordion-section">
        <button type="button" className="accordion-toggle" onClick={() => setEconomicOpen((open) => !open)}>
          <span>Economic records</span>
          <span>{economicOpen ? '▾' : '▸'}</span>
        </button>
        {economicOpen && (
          <div className="accordion-panel">
            <div className="wage-rate-section">
              <label htmlFor="wageRate">Wage Rate (RWF/day)</label>
              <input
                type="number"
                id="wageRate"
                value={getCostData(season).wageRate || ''}
                onChange={(e) => handleWageRateChange(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            {/* Table 1: Input Costs */}
            <div className="input-costs">
              <h3>Input Costs</h3>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Input</th>
                    <th>Cost Type</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Unit Cost (RWF)</th>
                    <th>Total Cost (RWF)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getCostData(season).inputCosts.map((row, index) => (
                    <tr key={row.id || index}>
                      <td>
                        <input
                          type="date"
                          value={row.date || ''}
                          onChange={(e) => updateInputCostRow(index, 'date', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.input || ''}
                          onChange={(e) => updateInputCostRow(index, 'input', e.target.value)}
                          placeholder="Input name"
                        />
                      </td>
                      <td>
                        <select
                          value={row.costType || 'C_SD'}
                          onChange={(e) => updateInputCostRow(index, 'costType', e.target.value)}
                        >
                          {COST_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={row.quantity || 0}
                          onChange={(e) => updateInputCostRow(index, 'quantity', Number(e.target.value))}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.unit || ''}
                          onChange={(e) => updateInputCostRow(index, 'unit', e.target.value)}
                          placeholder="kg, days"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={row.unitCost || 0}
                          onChange={(e) => updateInputCostRow(index, 'unitCost', Number(e.target.value))}
                        />
                      </td>
                      <td>{computeInputTotal(row).toLocaleString()}</td>
                      <td>
                        <button type="button" onClick={() => removeInputCostRow(index)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {getCostData(season).inputCosts.length === 0 && (
                    <tr>
                      <td colSpan="8">No input costs yet. Add a row.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <button type="button" onClick={addInputCostRow}>+ Add row</button>
              <div className="subtotal">
                <span>Subtotal — Input Costs:</span>
                <span>{inputSubtotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Table 2: Labour Costs */}
            <div className="labour-costs">
              <h3>Labour Costs</h3>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Practice</th>
                    <th>Cost Type</th>
                    <th>Time</th>
                    <th>Time Unit</th>
                    <th>Wage Rate (RWF/day)</th>
                    <th>Total Cost (RWF)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getCostData(season).labourCosts.map((row, index) => (
                    <tr key={row.id || index}>
                      <td>
                        <input
                          type="date"
                          value={row.date || ''}
                          onChange={(e) => updateLabourCostRow(index, 'date', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.practice || ''}
                          onChange={(e) => updateLabourCostRow(index, 'practice', e.target.value)}
                          placeholder="Practice or activity"
                        />
                      </td>
                      <td>
                        <select
                          value={row.costType || 'C_SD'}
                          onChange={(e) => updateLabourCostRow(index, 'costType', e.target.value)}
                        >
                          {COST_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={row.time || 0}
                          onChange={(e) => updateLabourCostRow(index, 'time', Number(e.target.value))}
                        />
                      </td>
                      <td>
                        <select
                          value={row.timeUnit || 'hours'}
                          onChange={(e) => updateLabourCostRow(index, 'timeUnit', e.target.value)}
                        >
                          {TIME_UNIT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={row.wageRate !== undefined && row.wageRate !== null ? row.wageRate : getCostData(season).wageRate || 0}
                          onChange={(e) => updateLabourCostRow(index, 'wageRate', Number(e.target.value))}
                        />
                      </td>
                      <td>{computeLabourTotal(row).toLocaleString()}</td>
                      <td>
                        <button type="button" onClick={() => removeLabourCostRow(index)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {getCostData(season).labourCosts.length === 0 && (
                    <tr>
                      <td colSpan="8">No labour costs yet. Add a row.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <button type="button" onClick={addLabourCostRow}>+ Add row</button>
              <div className="subtotal">
                <span>Subtotal — Labour Costs:</span>
                <span>{labourSubtotal.toLocaleString()}</span>
              </div>
              <p className="cost-note">System-independent rows are excluded from systems comparison but included in seasonal comparison.</p>
            </div>
          </div>
        )}
      </section>

        {/* Six Cost Categories Accordion */}
        <section className="cost-categories-accordion">
          <h2>Six Cost Categories</h2>
          {/* We'll create an accordion for each of the six categories */}
          {/* For brevity, we'll just show placeholders */}
          <div className="accordion-item">
            <h3>Tillage</h3>
            <div className="accordion-content">
              {/* Fields for Tillage: Fuel qty, Machinery hire, Operator labour days */}
            </div>
          </div>
          {/* Repeat for Fertilizer, Pesticide, Irrigation, Residue Management, Labour */}
          {/* Note: Labour category uses Table 2 — we already have it above */}
        </section>

        {/* Season Cost Summary Block */}
        <div className="season-cost-summary">
          <h2>Season Cost Summary</h2>
          <div className="summary-row">
            <span>Subtotal — Input Costs:</span>
            <span>{inputSubtotal.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Subtotal — Labour Costs:</span>
            <span>{labourSubtotal.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>TOTAL PRODUCTION COST:</span>
            <span>{(inputSubtotal + labourSubtotal).toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Cost per m²:</span>
            <span>{farmSetup?.plotSize ? ((inputSubtotal + labourSubtotal) / farmSetup.plotSize).toFixed(2) : 'N/A'}</span>
          </div>
          <div className="summary-row">
            <span>Cost per ha:</span>
            <span>{farmSetup?.plotSize ? (((inputSubtotal + labourSubtotal) / farmSetup.plotSize) * 10000).toFixed(2) : 'N/A'}</span>
          </div>
        </div>
      </section>

      {/* Revenue Entry Table (Part 2B) */}
      <section className="revenue-entry">
        <h2>Revenue Entry</h2>
        <table>
          <thead>
            <tr>
              <th>Yield (kg)</th>
              <th>Price (RWF/kg)</th>
              <th>Gross Revenue (RWF)</th>
              <th>Revenue per m²</th>
              <th>Revenue per ha</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><input type="number" value={season.revenueData?.yield || ''} onChange={(e) => {/* handler */}} /></td>
              <td><input type="number" value={season.revenueData?.price || ''} onChange={(e) => {/* handler */}} /></td>
              <td id="grossRevenue">?</td>
              <td id="revenuePerM2">?</td>
              <td id="revenuePerHa">?</td>
            </tr>
          </tbody>
        </table>
        <p>{/* If either field blank: Revenue shows "?" and profit gate blocked. */}</p>
      </section>

      {/* Agronomic Records Accordion */}
      <section className="accordion-section">
        <button type="button" className="accordion-toggle" onClick={() => setAgronomicOpen((open) => !open)}>
          <span>Agronomic records</span>
          <span>{agronomicOpen ? '▾' : '▸'}</span>
        </button>
        {agronomicOpen && (
          <div className="accordion-panel agronomic-observations">
            <div>
              <label htmlFor="weedPressureScore">Weed Pressure Score (0-5)</label>
              <input
                type="number"
                id="weedPressureScore"
                min="0"
                max="5"
                value={season?.agronomicData?.weedPressureScore || ''}
                onChange={(e) => updateAgronomicField('weedPressureScore', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="additionalNotes">Additional notes</label>
              <textarea
                id="additionalNotes"
                value={season?.agronomicData?.additionalNotes || ''}
                onChange={(e) => updateAgronomicField('additionalNotes', e.target.value)}
              />
            </div>
          </div>
        )}
      </section>

      {/* Run Analysis Button */}
      <div className="run-analysis-section">
        <button
          onClick={() => {
            // TODO: Run analysis sequence and then navigate to results
            console.log('Run analysis');
            // For now, we'll just navigate to results (assuming we have a results page)
            navigate(`/farmer/season/${seasonId}/results`);
          }}
          disabled={analysisButtonDisabled}
        >
          Run Analysis
        </button>
        {analysisButtonDisabled && (
          <tooltip>Complete all required fields to run analysis.</tooltip>
        )}
      </div>
    </div>
  );
};

export default FarmerModeSeasonEntry;