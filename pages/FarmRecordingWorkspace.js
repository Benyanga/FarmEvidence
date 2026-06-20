import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useRecordingStore from '../stores/recordingStore';
import api from '../services/api';

const FarmRecordingWorkspace = () => {
  const { year, season, farm_id } = useParams();
  const navigate = useNavigate();
  const farmSeasonId = `${year}-${season}-${farm_id}`; // Construct farm_season_id
  const [gateStatus, setGateStatus] = useState({});
  const [analysisButtonDisabled, setAnalysisButtonDisabled] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [area, setArea] = useState(''); // Area m²
  const [extrapolationFactor, setExtrapolationFactor] = useState(1); // Factor ×N
  const [wageRate, setWageRate] = useState(500); // Wage RWF/day
  const [systemType, setSystemType] = useState('CA'); // System badge (CA or CF)
  const [crop, setCrop] = useState('Maize'); // Crop

  const {
    entries: economicRecords,
    revenue,
    agronomicObservations,
    csiDrivers,
    loading,
    error,
    loadEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    saveRevenue,
    saveAgronomicObservation,
    saveCsiDrivers,
    autoSave,
    loadAgronomicObservations,
    loadCsiDrivers,
    loadRevenue
  } = useRecordingStore();

  // Load data for this farm
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load economic records
        await loadEntries(farmSeasonId, farmSeasonId);
        // Load agronomic observations
        await loadAgronomicObservations(farmSeasonId, farmSeasonId);
        // Load CSI drivers
        await loadCsiDrivers(farmSeasonId, farmSeasonId);
        // Load revenue
        await loadRevenue(farmSeasonId, farmSeasonId);
        // Load gate status
        loadGateStatus();
        // Load farm metadata (would come from a farm/seasons API)
        loadFarmMetadata();
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };

    loadData();

    // Set up auto-save interval
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [farmSeasonId, loadEntries, loadAgronomicObservations, loadCsiDrivers, loadRevenue, autoSave]);

  // Load gate status from server
  const loadGateStatus = async () => {
    try {
      const response = await api.get(`/api/gates/${farmSeasonId}/${farmSeasonId}`);
      setGateStatus(response.data);
      // Update analysis button based on gate status
      setAnalysisButtonDisabled(!response.data.all_passed);
    } catch (err) {
      console.error('Failed to load gate status:', err);
      setAnalysisButtonDisabled(true); // Disable button on error
    }
  };

  // Load farm metadata (simplified - would come from API)
  const loadFarmMetadata = async () => {
    try {
      // In a real app, this would fetch from /api/farms/{farm_id} or similar
      // For now, we'll set some default values
      setArea('1000');
      setExtrapolationFactor(1);
      setWageRate(500);
      setSystemType('CA');
      setCrop('Maize');
    } catch (err) {
      console.error('Failed to load farm metadata:', err);
    }
  };

  // Handle offline/online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial state
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-save completion handler (would be triggered by store)
  useEffect(() => {
    if (lastSavedTime) {
      // Show "Saved [time]" in context strip temporarily
      // Implementation would update UI to show this message
      console.log(`Saved at ${lastSavedTime}`);
    }
  }, [lastSavedTime]);

  // Handle saving revenue
  const handleSaveRevenue = (yieldKg, priceRwf) => {
    saveRevenue(farmSeasonId, farmSeasonId, yieldKg, priceRwf);
  };

  // Handle saving agronomic observation
  const handleSaveAgronomicObservation = (observationData, observedAt) => {
    saveAgronomicObservation({
      ...observationData,
      plot_id: farmSeasonId,
      trial_season_id: farmSeasonId,
      observed_at: observedAt,
      mode: 'farmer'
    });
  };

  // Handle saving CSI drivers
  const handleSaveCsiDrivers = (drivers) => {
    saveCsiDrivers(farmSeasonId, farmSeasonId, drivers);
  };

  // Handle running analysis
  const handleRunAnalysis = async () => {
    try {
      // In a real app, this would navigate to CBA results
      // For now, we'll just simulate
      console.log('Running analysis for farm:', farmSeasonId);
      // Navigation would happen here
      navigate(`/cba-results/${year}/${season}/${farm_id}`);
    } catch (err) {
      console.error('Failed to run analysis:', err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="farm-recording-workspace">
      {/* Context Strip */}
      <div className="context-strip">
        <div className="farm-info">
          <span>{farm_id}</span> · 
          <span className={`system-badge ${systemType.toLowerCase()}`}>{systemType}</span> · 
          <span>{crop}</span> · 
          <span>{area} m²</span> · 
          <span>Factor ×{extrapolationFactor}</span> · 
          <span>Season {season}</span> · 
          <span>Wage {wageRate} RWF/day</span>
        </div>
        <div className="sync-indicator">
          {isOffline ? (
            <div className="offline">
              <span>●</span> Offline — changes saved locally
            </div>
          ) : isSaving ? (
            <div className="saving">
              <span>●</span> Saving...
            </div>
          ) : lastSavedTime ? (
            <div className="synced">
              <span>●</span> Synced {lastSavedTime}
            </div>
          ) : (
            <div className="synced">
              <span>●</span> Synced just now
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <span>Data Entry › </span>
        <span>{year} › </span>
        <span>Season {season} {year} › </span>
        <span>{farm_id}</span>
      </nav>

      {/* Economic Records Accordion */}
      <section className="accordion economic-records">
        <h2>Economic records — {farm_id}</h2>
        {/* Table for economic records would go here */}
        <div className="economic-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Item/Activity</th>
                <th>Category</th>
                <th>Sub-category</th>
                <th>Unit</th>
                <th>Quantity</th>
                <th>Unit Cost (RWF)</th>
                <th>Total Plot (RWF)</th>
                <th>Total Ha (RWF)</th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {economicRecords.map((record) => (
                <tr key={record._id}>
                  <td>{new Date(record.entry_date).toLocaleDateString()}</td>
                  <td>{record.item_activity}</td>
                  <td>{record.category}</td>
                  <td>{record.sub_category}</td>
                  <td>{record.unit || '-'}</td>
                  <td>{record.quantity}</td>
                  <td>{record.unit_cost_rwf}</td>
                  <td>{record.total_plot_rwf}</td>
                  <td>{record.total_ha_rwf !== null ? record.total_ha_rwf : '-'}</td>
                  <td>{record.note || '-'}</td>
                  <td>
                    <button onClick={() => {/* Edit record */}}>Edit</button>
                    <button onClick={() => {/* Delete record */}}>Delete</button>
                  </td>
                </tr>
              ))}
              {economicRecords.length === 0 && (
                <tr>
                  <td colSpan="11">No records yet. Add your first economic record.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <button onClick={() => {/* Add record */}} className="add-record-button">
          Add record
        </button>
        {/* Revenue section */}
        <div className="revenue-section">
          <h3>Revenue</h3>
          <div className="revenue-fields">
            <div>
              <label>Yield from farm [kg]</label>
              <input 
                type="number" 
                placeholder="Enter yield"
                value={revenue?.yield_raw_kg || ''}
                onChange={(e) => {/* Handle yield change - would trigger save */}} 
              />
            </div>
            <div>
              <label>Selling price [RWF/kg]</label>
              <input 
                type="number" 
                placeholder="Enter price"
                value={revenue?.selling_price_rwf_kg || ''}
                onChange={(e) => {/* Handle price change - would trigger save */}} 
              />
            </div>
          </div>
          {revenue && (
            <div className="revenue-results">
              <div>Revenue (plot): {revenue.revenue_plot_rwf} RWF</div>
              <div>Revenue (ha): {revenue.revenue_ha_rwf} RWF</div>
            </div>
          )}
          <button 
            onClick={() => {/* Save revenue */}} 
            disabled={!(revenue?.yield_raw_kg && revenue?.selling_price_rwf_kg)}
          >
            Save
          </button>
        </div>
      </section>

      {/* Agronomic Records Accordion */}
      <section className="accordion agronomic-records">
        <h2>Agronomic records — {farm_id}</h2>
        {/* Three columns: Planting, Mid-season, Harvest */}
        <div className="observation-stages">
          <div className="stage">
            <h3>Planting</h3>
            <div className="observation-form">
              <div className="form-group">
                <label>Soil colour [1-5]</label>
                <input 
                  type="number" 
                  min="1" 
                  max="5" 
                  value={agronomicObservations.PLANTING?.soil_colour_score || ''}
                  onChange={(e) => {/* Handle change */}} 
                />
              </div>
              <div className="form-group">
                <label>Earthworm count</label>
                <input 
                  type="number" 
                  min="0" 
                  value={agronomicObservations.PLANTING?.earthworm_count || ''}
                  onChange={(e) => {/* Handle change */}} 
                />
              </div>
              <div className="form-group">
                <label>Soil structure [1-5]</label>
                <input 
                  type="number" 
                  min="1" 
                  max="5" 
                  value={agronomicObservations.PLANTING?.soil_structure_score || ''}
                  onChange={(e) => {/* Handle change */}} 
                />
              </div>
              <div className="form-group">
                <label>Weed pressure [0-5]</label>
                <input 
                  type="number" 
                  min="0" 
                  max="5" 
                  value={agronomicObservations.PLANTING?.weed_pressure_score || ''}
                  onChange={(e) => {/* Handle change */}} 
                />
              </div>
              <div className="form-group">
                <label>Pest incidence [%]</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  value={agronomicObservations.PLANTING?.pest_incidence_pct || ''}
                  onChange={(e) => {/* Handle change */}} 
                />
              </div>
              <button 
                onClick={() => {
                  // Save planting observation
                  handleSaveAgronomicObservation({
                    soil_colour_score: parseInt(e.target.value) || undefined,
                    // ... other fields
                  }, 'PLANTING');
                }}
                disabled={/* validation */ false}
              >
                Save Observation
              </button>
            </div>
          </div>
          <div className="stage">
            <h3>Mid-season</h3>
            {/* Similar form for mid-season */}
          </div>
          <div className="stage">
            <h3>Harvest</h3>
            {/* Similar form for harvest */}
          </div>
        </div>
        {/* CSI Drivers sliders */}
        {csiDrivers && (
          <div className="csi-drivers">
            <h3>CSI Drivers</h3>
            <div className="driver-group">
              <label>J1 Rainfall:</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={csiDrivers.j1_rainfall || 0.5}
                onChange={(e) => {/* Handle change */}} 
              />
              <span>{(csiDrivers.j1_rainfall || 0.5).toFixed(2)}</span>
            </div>
            {/* Repeat for J2-J6 */}
            <div className="csi-result">
              <strong>CSI Value: </span>{csiDrivers.csi_value?.toFixed(3) || '0.000'}</span>
              <span> ({csiDrivers.csi_level || 'N/A'})</span>
            </div>
          </div>
        )}
        {!csiDrivers && (
          <div className="csi-drivers">
            <h3>CSI Drivers</h3>
            <p>No CSI data recorded yet.</p>
          </div>
        )}
        {/* Within-season trajectory table */}
        <div className="trajectory-table">
          <h3>Within-season trajectory</h3>
          {/* Table showing observations across seasons */}
          {agronomicObservations.PLANTING || agronomicObservations.MID_SEASON || agronomicObservations.HARVEST ? (
            <table>
              <thead>
                <tr>
                  <th>Observation</th>
                  <th>Planting</th>
                  <th>Mid-season</th>
                  <th>Harvest</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Soil colour</td>
                  <td>{agronomicObservations.PLANTING?.soil_colour_score || '-'}</td>
                  <td>{agronomicObservations.MID_SEASON?.soil_colour_score || '-'}</td>
                  <td>{agronomicObservations.HARVEST?.soil_colour_score || '-'}</td>
                </tr>
                {/* More rows for other indicators */}
              </tbody>
            </table>
          ) : (
            <p>No trajectory data available yet.</p>
          )}
        </div>
        {/* Live narrative cards */}
        <div className="narrative-cards">
          <h3>Season narrative</h3>
          {/* Narrative insights based on observations */}
          <p>Based on your observations, the season is progressing normally.</p>
        </div>
      </section>

      {/* Gate Checklist */}
      <section className="gate-checklist">
        <h3>Gate Checklist</h3>
        <div className="gates">
          {/* Display each gate with pass/fail status */}
          <div className="gate">
            <span>Labour</span>
            <span className={gateStatus.labour ? 'pass' : 'fail'}>
              {gateStatus.labour !== undefined ? (gateStatus.labour ? '✓' : '✗') : '?'}
            </span>
          </div>
          <div className="gate">
            <span>Tillage</span>
            <span className={gateStatus.tillage ? 'pass' : 'fail'}>
              {gateStatus.tillage !== undefined ? (gateStatus.tillage ? '✓' : '✗') : '?'}
            </span>
          </div>
          <div className="gate">
            <span>Fertilizer</span>
            <span className={gateStatus.fertilizer ? 'pass' : 'fail'}>
              {gateStatus.fertilizer !== undefined ? (gateStatus.fertilizer ? '✓' : '✗') : '?'}
            </span>
          </div>
          <div className="gate">
            <span>Pesticide</span>
            <span className={gateStatus.pesticide ? 'pass' : 'fail'}>
              {gateStatus.pesticide !== undefined ? (gateStatus.pesticide ? '✓' : '✗') : '?'}
            </span>
          </div>
          <div className="gate">
            <span>Irrigation</span>
            <span className={gateStatus.irrigation ? 'pass' : 'fail'}>
              {gateStatus.irrigation !== undefined ? (gateStatus.irrigation ? '✓' : '✗') : '?'}
            </span>
          </div>
          <div className="gate">
            <span>Residue</span>
            <span className={gateStatus.residue ? 'pass' : 'fail'}>
              {gateStatus.residue !== undefined ? (gateStatus.residue ? '✓' : '✗') : '?'}
            </span>
          </div>
          <div className="gate">
            <span>Yield</span>
            <span className={gateStatus.yield ? 'pass' : 'fail'}>
              {gateStatus.yield !== undefined ? (gateStatus.yield ? '✓' : '✗') : '?'}
            </span>
          </div>
          <div className="gate">
            <span>Selling price</span>
            <span className={gateStatus.selling_price ? 'pass' : 'fail'}>
              {gateStatus.selling_price !== undefined ? (gateStatus.selling_price ? '✓' : '✗') : '?'}
            </span>
          </div>
        </div>
        <div className="all-status">
          <span>All gates passed: {gateStatus.all_passed ? 'Yes' : 'No'}</span>
        </div>
      </section>

      {/* Run Analysis Button */}
      <button 
        onClick={handleRunAnalysis}
        disabled={analysisButtonDisabled || loading}
        className="run-analysis-button"
      >
        Run Analysis
      </button>
      
      {/* Adoption Cost Section (would appear after analysis) */}
      {/* This would be conditionally rendered based on analysis results */}
    </div>
  );
};

export default FarmRecordingWorkspace;