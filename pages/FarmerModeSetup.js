import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useFarmerStore from '../stores/farmerStore';

const FarmerModeSetup = () => {
  const navigate = useNavigate();
  const { setFarmSetup } = useFarmerStore();

  const [formData, setFormData] = useState({
    farmName: '',
    farmerName: '',
    plotSize: '',
    plotSizeUnit: 'ha', // ha or m²
    cropType: 'Maize', // Maize · Beans · Wheat · Sorghum · Other
    seasonReference: { season: 'A', year: new Date().getFullYear() }, // Season A / B / C + Year
    language: 'English' // English · Kinyarwanda
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSeasonChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      seasonReference: {
        ...prev.seasonReference,
        [name]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate required fields
    if (!formData.farmName || !formData.plotSize || !formData.cropType) {
      alert('Please fill in all required fields');
      return;
    }
    // Save to store
    setFarmSetup(formData);
    // Navigate to season list
    navigate('/farmer/seasons');
  };

  return (
    <div className="farmer-mode-setup">
      <h1>Farmer Mode Setup</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="farmName">Farm name *</label>
          <input
            type="text"
            id="farmName"
            name="farmName"
            value={formData.farmName}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="farmerName">Farmer name</label>
          <input
            type="text"
            id="farmerName"
            name="farmerName"
            value={formData.farmerName}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="plotSize">Plot size *</label>
          <input
            type="number"
            id="plotSize"
            name="plotSize"
            value={formData.plotSize}
            onChange={handleChange}
            required
            min="0.01"
            step="0.01"
          />
          <select
            id="plotSizeUnit"
            name="plotSizeUnit"
            value={formData.plotSizeUnit}
            onChange={handleChange}
          >
            <option value="ha">ha</option>
            <option value="m²">m²</option>
          </select>
        </div>
        <div>
          <label htmlFor="cropType">Crop type *</label>
          <select
            id="cropType"
            name="cropType"
            value={formData.cropType}
            onChange={handleChange}
            required
          >
            <option value="Maize">Maize</option>
            <option value="Beans">Beans</option>
            <option value="Wheat">Wheat</option>
            <option value="Sorghum">Sorghum</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label>Season reference *</label>
          <div>
            <select
              name="season"
              value={formData.seasonReference.season}
              onChange={handleSeasonChange}
              required
            >
              <option value="A">Season A</option>
              <option value="B">Season B</option>
              <option value="C">Season C</option>
            </select>
            <select
              name="year"
              value={formData.seasonReference.year}
              onChange={handleSeasonChange}
              required
            >
              {[new Date().getFullYear() - 5, new Date().getFullYear() + 1].reduce((acc, year) => {
                for (let y = acc[0]; y <= acc[1]; y++) acc.push(y);
                return acc;
              }, []).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="language">Language</label>
          <select
            id="language"
            name="language"
            value={formData.language}
            onChange={handleChange}
          >
            <option value="English">English</option>
            <option value="Kinyarwanda">Kinyarwanda</option>
          </select>
        </div>
        <button type="submit">Save and Continue</button>
      </form>
    </div>
  );
};

export default FarmerModeSetup;