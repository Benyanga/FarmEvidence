const defaultHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const base = (path) => `/api${path}`;

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON response from ${res.url} (${res.status}): ${text.slice(0, 150)}`);
  }
}

export async function getEconomicRecords(plot_id, trial_season_id, token) {
  const q = new URLSearchParams({ plot_id, trial_season_id }).toString();
  const res = await fetch(base(`/records/economic?${q}`), { headers: defaultHeaders(token) });
  return res.json();
}

export async function addEconomicRecord(payload, token) {
  const res = await fetch(base(`/records/economic/add`), {
    method: "POST",
    headers: defaultHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateEconomicRecord(recordId, updates, token) {
  const res = await fetch(base(`/records/economic/${recordId}`), {
    method: "PATCH",
    headers: defaultHeaders(token),
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteEconomicRecord(recordId, token) {
  const res = await fetch(base(`/records/economic/${recordId}`), {
    method: "DELETE",
    headers: defaultHeaders(token),
  });
  return res.json();
}

export async function saveRevenue(payload, token) {
  const res = await fetch(base(`/records/revenue`), {
    method: "POST",
    headers: defaultHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getRevenue(plot_id, trial_season_id, token) {
  const q = new URLSearchParams({ plot_id, trial_season_id }).toString();
  const res = await fetch(base(`/records/revenue?${q}`), { headers: defaultHeaders(token) });
  return res.json();
}

export async function saveAgronomic(payload, token) {
  const res = await fetch(base(`/records/agronomic`), {
    method: "POST",
    headers: defaultHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getAgronomic(plot_id, trial_season_id, token) {
  const q = new URLSearchParams({ plot_id, trial_season_id }).toString();
  const res = await fetch(base(`/records/agronomic?${q}`), { headers: defaultHeaders(token) });
  return res.json();
}

export async function saveCsi(payload, token) {
  const res = await fetch(base(`/records/csi`), {
    method: "POST",
    headers: defaultHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getCsi(plot_id, trial_season_id, token) {
  const q = new URLSearchParams({ plot_id, trial_season_id }).toString();
  const res = await fetch(base(`/records/csi?${q}`), { headers: defaultHeaders(token) });
  return res.json();
}

export async function getPlotGates(plot_id, trial_season_id, token) {
  const q = new URLSearchParams({ plot_id, trial_season_id }).toString();
  const res = await fetch(base(`/gates?${q}`), { headers: defaultHeaders(token) });
  return res.json();
}

export async function getLabour(plot_id, trial_season_id, token) {
  const q = new URLSearchParams({ plot_id, trial_season_id }).toString();
  const res = await fetch(base(`/records/labour?${q}`), { headers: defaultHeaders(token) });
  return res.json();
}

export async function addLabour(payload, token) {
  const res = await fetch(base(`/records/labour`), {
    method: 'POST',
    headers: defaultHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateLabour(id, updates, token) {
  const res = await fetch(base(`/records/labour/${id}`), {
    method: 'PATCH',
    headers: defaultHeaders(token),
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteLabour(id, token) {
  const res = await fetch(base(`/records/labour/${id}`), {
    method: 'DELETE',
    headers: defaultHeaders(token),
  });
  return res.json();
}

export async function getComputationResults(farm_season_id, token) {
  const res = await fetch(base(`/computation-results/${farm_season_id}`), {
    headers: defaultHeaders(token),
  });
  return res.json();
}

export async function getFarmerDashboardLatest(farm_id, season_ref, token) {
  const res = await fetch(base(`/computation-results/latest/${encodeURIComponent(farm_id)}/${encodeURIComponent(season_ref)}`), {
    headers: defaultHeaders(token),
  });
  return res.json();
}

export async function getFarmerDashboardPrior(farm_id, token) {
  const res = await fetch(base(`/computation-results/prior/${encodeURIComponent(farm_id)}`), {
    headers: defaultHeaders(token),
  });
  return res.json();
}

export async function getAlerts(farm_id, season_ref, token) {
  const res = await fetch(base(`/alerts/${encodeURIComponent(farm_id)}/${encodeURIComponent(season_ref)}`), {
    headers: defaultHeaders(token),
  });
  return res.json();
}

export async function getSeasonHistory(farm_id, token) {
  const res = await fetch(base(`/season-history/${encodeURIComponent(farm_id)}`), {
    headers: defaultHeaders(token),
  });
  return res.json();
}

export async function getAgronomicSummary(farm_id, season_ref, token) {
  const res = await fetch(base(`/agronomic-summary/${encodeURIComponent(farm_id)}/${encodeURIComponent(season_ref)}`), {
    headers: defaultHeaders(token),
  });
  return res.json();
}

export async function getGates(farm_id, season_ref, token) {
  const res = await fetch(base(`/gates/${encodeURIComponent(farm_id)}/${encodeURIComponent(season_ref)}`), {
    headers: defaultHeaders(token),
  });
  return res.json();
}

export async function getFarmSeasonRecords(farmId, token) {
  const res = await fetch(base(`/farm-seasons/by-farm/${encodeURIComponent(farmId)}`), {
    headers: defaultHeaders(token),
  });
  return res.json();
}

export async function getFarmSeasonRecord(farmId, seasonRef, token) {
  const res = await fetch(base(`/farm-seasons/by-farm/${encodeURIComponent(farmId)}/${encodeURIComponent(seasonRef)}`), {
    headers: defaultHeaders(token),
  });
  return res.json();
}

export async function saveFarmSeasonRecord(payload, token) {
  const res = await fetch(base(`/farm-seasons`), {
    method: 'POST',
    headers: defaultHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function createTrial(payload, token) {
  const res = await fetch(base(`/trials`), {
    method: 'POST',
    headers: defaultHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getTrial(trialId, token) {
  const res = await fetch(base(`/trials/${encodeURIComponent(trialId)}`), {
    headers: defaultHeaders(token),
  });
  return res.json();
}

export async function getTrials(query = {}, token) {
  const q = new URLSearchParams(query).toString();
  const res = await fetch(base(`/trials${q ? `?${q}` : ''}`), {
    headers: defaultHeaders(token),
  });
  return res.json();
}

export async function updateTrial(trialId, updates, token) {
  const res = await fetch(base(`/trials/${encodeURIComponent(trialId)}`), {
    method: 'PATCH',
    headers: defaultHeaders(token),
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function getTrialPlots(trialId, token) {
  const res = await fetch(base(`/plots/trial/${encodeURIComponent(trialId)}`), {
    headers: defaultHeaders(token),
  });
  return parseJsonResponse(res);
}

export async function createPlot(plotPayload, token) {
  const res = await fetch(base(`/plots`), {
    method: 'POST',
    headers: defaultHeaders(token),
    body: JSON.stringify(plotPayload),
  });
  return parseJsonResponse(res);
}

export async function addPlotInput(plotId, payload, token) {
  const res = await fetch(base(`/plots/${encodeURIComponent(plotId)}/inputs`), {
    method: 'POST',
    headers: defaultHeaders(token),
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(res);
}

export async function deletePlotInput(plotId, rowId, token) {
  const res = await fetch(base(`/plots/${encodeURIComponent(plotId)}/inputs/${encodeURIComponent(rowId)}`), {
    method: 'DELETE',
    headers: defaultHeaders(token),
  });
  return parseJsonResponse(res);
}

export async function addPlotLabour(plotId, payload, token) {
  const res = await fetch(base(`/plots/${encodeURIComponent(plotId)}/labour`), {
    method: 'POST',
    headers: defaultHeaders(token),
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(res);
}

export async function deletePlotLabour(plotId, rowId, token) {
  const res = await fetch(base(`/plots/${encodeURIComponent(plotId)}/labour/${encodeURIComponent(rowId)}`), {
    method: 'DELETE',
    headers: defaultHeaders(token),
  });
  return parseJsonResponse(res);
}

export async function updatePlot(plotId, payload, token) {
  const res = await fetch(base(`/plots/${encodeURIComponent(plotId)}`), {
    method: 'PATCH',
    headers: defaultHeaders(token),
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(res);
}

export async function patchPlotYield(plotId, payload, token) {
  const res = await fetch(base(`/plots/${encodeURIComponent(plotId)}/yield`), {
    method: 'PATCH',
    headers: defaultHeaders(token),
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(res);
}

export async function getTrialResults(trial_season_id, token) {
  const res = await fetch(base(`/trial-results/${trial_season_id}`), {
    headers: defaultHeaders(token),
  });
  if (!res.ok) {
    let error = `Request failed ${res.status}`;
    try {
      const text = await res.text();
      if (text) {
        error += `: ${text}`;
      }
    } catch {
      // ignore
    }
    return { ok: false, error };
  }

  try {
    return await res.json();
  } catch (err) {
    return { ok: false, error: err?.message || "Invalid JSON response from trial API" };
  }
}

export default {
  getEconomicRecords,
  addEconomicRecord,
  updateEconomicRecord,
  deleteEconomicRecord,
  saveRevenue,
  getRevenue,
  saveAgronomic,
  getAgronomic,
  saveCsi,
  getCsi,
  getPlotGates,
  getGates,
  getFarmSeasonRecords,
  getFarmSeasonRecord,
  saveFarmSeasonRecord,
  createTrial,
  getTrial,
  updateTrial,
  getTrialPlots,
  createPlot,
  addPlotInput,
  deletePlotInput,
  addPlotLabour,
  deletePlotLabour,
  patchPlotYield,
  getLabour,
  addLabour,
  updateLabour,
  deleteLabour,
  getComputationResults,
  getTrialResults,
};
