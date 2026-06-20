import { Navigate } from 'react-router-dom';
import { useTrialContext } from '../../context/TrialContext';

export function ProtectedRoute({ children }) {
  const { user, token, authLoading } = useTrialContext();

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-soil-faint">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
