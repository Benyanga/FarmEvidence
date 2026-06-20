// farmSetupApi.js
// Frontend API for Farmer Mode farm setup
import axios from "axios";

const API_URL = "/api/farm-setup";

export async function saveFarmSetup(data) {
  const res = await axios.post(API_URL, data);
  return res.data;
}

export async function getFarmSetup(farmName) {
  const res = await axios.get(`${API_URL}/${encodeURIComponent(farmName)}`);
  return res.data;
}
