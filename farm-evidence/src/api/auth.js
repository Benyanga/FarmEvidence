import api from './index';  // your existing axios instance

// Legacy register/login have been removed in favor of Clerk-hosted
// SignUp/SignIn flows. Calling these will reject with a helpful error.
export const register = (_data) => Promise.reject(new Error('Deprecated: register() removed — use Clerk SignUp UI instead'));
export const login = (_data) => Promise.reject(new Error('Deprecated: login() removed — use Clerk SignIn UI instead'));

// Profile and account operations are proxied to the backend /api/auth/*
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.patch('/auth/me', data);
export const updateEmail = (data) => api.patch('/auth/me/email', data);
export const changePassword = (_data) => Promise.reject(new Error('Password changes are managed by Clerk; use Clerk account settings'));
export const deleteAccount = (data) => api.delete('/auth/me', { data });
export const exportMyData = () => api.get('/auth/me/export', { responseType: 'blob' });
