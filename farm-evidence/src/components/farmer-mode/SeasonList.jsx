// SeasonList.jsx
// List of all recorded seasons, chronological, with [+ New Season] button
import React, { useEffect, useState } from "react";
import { getSeasons, saveSeason } from "../../utils/farmerSeasonApi";

export default function SeasonList({ farmName, onSelectSeason, onAddSeason }) {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!farmName) return;
    setLoading(true);
    setError("");
    getSeasons(farmName)
      .then((s) => setSeasons(s))
      .catch(() => setError("Failed to load seasons"))
      .finally(() => setLoading(false));
  }, [farmName]);

  async function handleAddSeason() {
    const year = new Date().getFullYear();
    const season = ["A", "B", "C"][seasons.length % 3];
    const label = `Season ${season} ${year + Math.floor(seasons.length / 3)}`;
    const newSeason = { farmName, label, year: year + Math.floor(seasons.length / 3), season, status: "not-started" };
    setLoading(true);
    setError("");
    try {
      const saved = await saveSeason(newSeason);
      setSeasons([...seasons, saved]);
      if (onAddSeason) onAddSeason(saved);
    } catch (e) {
      setError("Failed to add season");
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(season) {
    if (onSelectSeason) onSelectSeason(season);
  }

  return (
    <div className="card p-4 max-w-lg mx-auto mt-8">
      <h2 className="heading-2 mb-4">Seasons</h2>
      {error && <div className="alert alert-danger mb-2">{error}</div>}
      {loading ? <div>Loading...</div> : (
        <>
          <ul className="list-group mb-3">
            {seasons.length === 0 && <li className="list-group-item">No seasons recorded yet.</li>}
            {seasons.map((s) => (
              <li key={s._id || s.id} className="list-group-item d-flex justify-content-between align-items-center">
                <span>{s.label}</span>
                <button className="btn btn-outline-primary btn-sm" onClick={() => handleSelect(s)}>Open</button>
              </li>
            ))}
          </ul>
          <button className="btn btn-success" onClick={handleAddSeason}>+ New Season</button>
        </>
      )}
    </div>
  );
}
