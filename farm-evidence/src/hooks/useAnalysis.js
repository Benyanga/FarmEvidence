import { useState, useEffect } from 'react';
import { getAnalysis } from '../api';

export function useAnalysis(trialId) {
  const [analysis, setAnalysis] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!trialId) return;
    setLoading(true);
    getAnalysis(trialId)
      .then(r => { setAnalysis(r.data); setError(null); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [trialId]);

  const refresh = () => {
    setLoading(true);
    getAnalysis(trialId)
      .then(r => { setAnalysis(r.data); setError(null); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  return { analysis, loading, error, refresh };
}
