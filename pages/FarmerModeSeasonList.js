import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useFarmerStore from '../stores/farmerStore';

const FarmerModeSeasonList = () => {
  const navigate = useNavigate();
  const { farmSetup, seasons } = useFarmerStore();

  useEffect(() => {
    if (!farmSetup) {
      // Redirect to setup if farm setup is not done
      navigate('/farmer/setup');
    }
  }, [farmSetup, navigate]);

  const handleAddSeason = () => {
    // Create a new season with default values
    const newSeason = {
      // We'll generate a season reference based on the last season or default
      seasonReference: {
        season: 'A',
        year: new Date().getFullYear()
      },
      // Initialize empty data for cost entry, revenue, agronomic observations
      costData: {
        // We'll structure this according to the specification
        wageRate: 0,
        workingHoursPerDay: 8,
        inputCosts: [], // Table 1
        labourCosts: [], // Table 2
        // The six categories will be derived from the tables? Or we store them separately?
        // For simplicity, we store the raw tables and compute the categories when needed.
      },
      revenueData: {
        yield: null,
        price: null
      },
      agronomicData: {
        weedPressureScore: null,
        additionalNotes: ''
      }
    };
    // Add to store
    const store = useFarmerStore.getState();
    store.addSeason(newSeason);
    // Navigate to the new season's entry page
    navigate(`/farmer/season/${newSeason.id}`);
  };

  if (!farmSetup) {
    return <div>Loading setup...</div>;
  }

  return (
    <div className="farmer-mode-season-list">
      <h1>Farmer Mode - Seasons</h1>
      <div className="season-list-header">
        <h2>{farmSetup.farmName}</h2>
        <button onClick={handleAddSeason}>+ New Season</button>
      </div>
      <div className="seasons-container">
        {seasons.length === 0 ? (
          <p>No seasons recorded yet. Click "+ New Season" to start.</p>
        ) : (
          seasons.map((season) => (
            <div key={season.id} className="season-card" onClick={() => navigate(`/farmer/season/${season.id}`)}>
              <div className="season-info">
                <h3>Season {season.seasonReference.season} {season.seasonReference.year}</h3>
                <p>Crop: {farmSetup.cropType}</p>
                <p>Plot size: {farmSetup.plotSize} {farmSetup.plotSizeUnit}</p>
              </div>
              <div className="season-status">
                {/* We can compute completion status here */}
                <span>Status: {/* TODO: compute */}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FarmerModeSeasonList;