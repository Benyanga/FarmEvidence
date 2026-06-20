import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api from '../../api/index';

export default function ClerkTokenProvider({ children }) {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    // expose a global getter for the API layer to obtain Clerk tokens
    window.__getClerkTokenGetter = async () => {
      try {
        if (!getToken) return null;
        return await getToken({ template: 'standard' });
      } catch (e) {
        return null;
      }
    };

    // request interceptor ensures Authorization header set using Clerk token
    const id = api.interceptors.request.use(async (config) => {
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
        // ignore
      }
      return config;
    });

    return () => {
      delete window.__getClerkTokenGetter;
      try { api.interceptors.request.eject(id); } catch {}
    };
  }, [getToken, isSignedIn]);

  return children ?? null;
}
