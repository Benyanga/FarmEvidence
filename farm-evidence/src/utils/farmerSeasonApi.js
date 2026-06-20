// farmerSeasonApi.js
// Frontend API for Farmer Mode season data
import axios from "axios";

const API_URL = "/api/seasons";

export async function getSeasons(farmName) {
  const res = await axios.get(`${API_URL}/${encodeURIComponent(farmName)}`);
  return res.data;
}

export async function saveSeason(data) {
  const res = await axios.post(API_URL, data);
  return res.data;
}

export async function getSeason(farmName, label) {
  const res = await axios.get(`${API_URL}/${encodeURIComponent(farmName)}/${encodeURIComponent(label)}`);
  return res.data;
}

const FARM_SEASON_API_URL = "/api/farm-seasons";

export async function getFarmSeasonRecords(farmId) {
  const res = await axios.get(`${FARM_SEASON_API_URL}/by-farm/${encodeURIComponent(farmId)}`);
  return res.data;
}

export async function getFarmSeasonRecord(farmId, seasonRef) {
  const res = await axios.get(`${FARM_SEASON_API_URL}/by-farm/${encodeURIComponent(farmId)}/${encodeURIComponent(seasonRef)}`);
  return res.data;
}

export async function saveFarmSeasonRecord(data) {
  const res = await axios.post(FARM_SEASON_API_URL, data);
  return res.data;
}
