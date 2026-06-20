import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });

api.interceptors.request.use(async (config) => {
  try {
    const getter = window.__getClerkTokenGetter;
    if (typeof getter === 'function') {
      const token = await getter();
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (e) {
    // ignore token attach errors
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const createTrial   = (data)           => api.post('/trials', data);
export const getTrials     = ()               => api.get('/trials');
export const getTrial      = (id)             => api.get(`/trials/${id}`);
export const updateTrial   = (id, data)       => api.patch(`/trials/${id}`, data);

export const createPlot    = (data)           => api.post('/plots', data);
export const getPlots      = (trialId)        => api.get(`/plots/trial/${trialId}`);
export const getPlot       = (id)             => api.get(`/plots/${id}`);
export const updatePlot    = (id, data)       => api.put(`/plots/${id}`, data);
export const addInputCost  = (plotId, row)    => api.post(`/plots/${plotId}/inputs`, row);
export const addLabourCost = (plotId, row)    => api.post(`/plots/${plotId}/labour`, row);
export const updateYield   = (plotId, data)   => api.patch(`/plots/${plotId}/yield`, data);

export const getTrajectory = (trialId)       => api.get(`/seasons/trajectory/${trialId}`);
export const getSeasonCnb  = (trialId)       => api.get(`/seasons/cnb/${trialId}`);

export const getAnalysis   = (trialId)        => api.get(`/analysis/${trialId}`);

export default api;
