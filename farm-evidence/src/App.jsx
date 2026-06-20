import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { TrialContextProvider, useTrialContext } from './context/TrialContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

const ModeSelect = lazy(() => import('./pages/auth/ModeSelect'));
const ActionSelect = lazy(() => import('./pages/auth/ActionSelect'));
const DemoEntry = lazy(() => import('./pages/auth/DemoEntry').then((m) => ({ default: m.DemoEntry })));
const Register = lazy(() => import('./pages/auth/Register'));
const Login = lazy(() => import('./pages/auth/Login'));
const FarmerApp = lazy(() => import('./farmer/FarmerApp'));
const ResearcherApp = lazy(() => import('./researcher/ResearcherApp'));

function AppRoutes() {
  const { mode, user, authLoading, setMode } = useTrialContext();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    const theme = user.theme || 'system';
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = (prefersDark) => {
      const shouldUseDark = theme === 'dark' || (theme === 'system' && prefersDark);
      document.documentElement.classList.toggle('dark', shouldUseDark);
    };

    applyTheme(mediaQuery.matches);

    const handleChange = (event) => {
      if (theme === 'system') {
        applyTheme(event.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [user?.theme]);

  const p = location.pathname || '';
  const farmerPrefixes = ['/data-entry', '/dashboard', '/setup', '/alerts', '/reports', '/comparison', '/trajectory', '/help'];
  const researcherPrefixes = ['/analysis', '/trials', '/cba', '/research'];
  const inferredMode = mode || (farmerPrefixes.some((pref) => p.startsWith(pref)) ? 'farmer' : researcherPrefixes.some((pref) => p.startsWith(pref)) ? 'researcher' : null);

  useEffect(() => {
    if (!mode && inferredMode) setMode(inferredMode);
  }, [mode, inferredMode, setMode]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-soil-faint">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/welcome" element={<ModeSelect />} />
      <Route path="/welcome/:mode" element={<ActionSelect />} />
      <Route path="/welcome/:mode/demo" element={<DemoEntry />} />
      <Route path="/welcome/:mode/register" element={<Register />} />
      <Route path="/welcome/:mode/login" element={<Login />} />
      <Route path="/role-select" element={<Navigate to="/welcome" replace />} />
      <Route path="/login" element={<Navigate to="/welcome" replace />} />
      <Route path="/register" element={<Navigate to="/welcome" replace />} />

      {!user && <Route path="*" element={<Navigate to="/welcome" replace />} />}

      {mode === 'farmer' && (
        <Route path="/*" element={<ProtectedRoute><FarmerApp /></ProtectedRoute>} />
      )}

      {mode === 'researcher' && (
        <Route path="/*" element={<ProtectedRoute><ResearcherApp /></ProtectedRoute>} />
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <TrialContextProvider>
      <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
        <AppRoutes />
      </Suspense>
    </TrialContextProvider>
  );
}
