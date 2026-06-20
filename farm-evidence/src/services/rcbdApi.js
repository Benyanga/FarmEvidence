// API for RCBD trial config and plot data
const base = (path) => `/api/rcbd${path}`;

export async function getTrialConfig() {
  const res = await fetch(base('/config'));
  return res.json();
}

export async function setTrialConfig(config) {
  const res = await fetch(base('/config'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  return res.json();
}

export async function getPlots() {
  const res = await fetch(base('/plots'));
  return res.json();
}

export async function getPlotData(plotId) {
  const res = await fetch(base(`/plot/${encodeURIComponent(plotId)}`));
  return res.json();
}

export async function setPlotData(plotId, data) {
  const res = await fetch(base(`/plot/${encodeURIComponent(plotId)}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getAllPlotData() {
  const res = await fetch(base('/plot-data'));
  return res.json();
}

export async function resetTrial() {
  const res = await fetch(base('/reset'), { method: 'POST' });
  return res.json();
}
