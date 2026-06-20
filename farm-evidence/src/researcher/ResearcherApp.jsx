import { lazy, Suspense, useMemo } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings2,
  ClipboardList,
  BarChart3,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Bell,
  FileText,
  HelpCircle,
  BookOpen,
  LogOut,
} from 'lucide-react';
import { useTrialContext, canAccess, logout } from '../context/TrialContext';
import { IconLeaf } from '../components/ui/Icons';
import { DemoBanner } from '../components/shared/DemoBanner';
import { Topbar } from '../components/shared/Topbar';
import { SettingsLayout } from '../pages/settings/SettingsLayout';

function getPageTitle(pathname) {
  const mapping = [
    ['/dashboard', 'Dashboard'],
    ['/setup', 'Setup'],
    ['/data-entry', 'Data Entry'],
    ['/analysis/cba-results', 'CBA Results'],
    ['/analysis/trends', 'Trends'],
    ['/analysis/multi-season', 'Multi-Season'],
    ['/analysis/trajectory', 'Trajectory'],
    ['/analysis/statistics', 'Statistics'],
    ['/analysis/risk-scenarios', 'Risk & Scenarios'],
    ['/analysis/explainability', 'Explainability'],
    ['/analysis/alerts', 'Alerts'],
    ['/analysis/reports', 'PDF Reports'],
    ['/help', 'Help & Docs'],
    ['/mode-rules', 'Mode Rules'],
  ];
  const route = mapping.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return route ? route[1] : 'Researcher';
}

// Lazy-load all researcher pages
const Dashboard = lazy(() => import('../pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Setup = lazy(() => import('../pages/Setup').then((m) => ({ default: m.Setup })));
const DataEntry = lazy(() => import('../pages/DataEntry').then((m) => ({ default: m.DataEntry })));
const CBAResults = lazy(() => import('../pages/analysis/CBAResults').then((m) => ({ default: m.CBAResults })));
const Trends = lazy(() => import('../pages/analysis/Trends').then((m) => ({ default: m.Trends })));
const Statistics = lazy(() => import('../pages/analysis/Statistics').then((m) => ({ default: m.Statistics })));
const RiskScenarios = lazy(() => import('../pages/analysis/RiskScenarios').then((m) => ({ default: m.RiskScenarios })));
const Explainability = lazy(() => import('../pages/analysis/Explainability').then((m) => ({ default: m.Explainability })));
const Alerts = lazy(() => import('../pages/analysis/Alerts').then((m) => ({ default: m.AlertsPage })));
const Reports = lazy(() => import('../pages/analysis/Reports').then((m) => ({ default: m.Reports })));
const Help = lazy(() => import('../pages/Help').then((m) => ({ default: m.Help })));
const ModeRules = lazy(() => import('../pages/ModeRules').then((m) => ({ default: m.ModeRules })));
const Trajectory = lazy(() => import('../pages/analysis/Trajectory').then((m) => ({ default: m.default })));
const MultiSeason = lazy(() => import('../pages/analysis/MultiSeason').then((m) => ({ default: m.MultiSeason || m.default })));
const ProfileSettings = lazy(() => import('../pages/settings/ProfileSettings').then((m) => ({ default: m.ProfileSettings })));
const SecuritySettings = lazy(() => import('../pages/settings/SecuritySettings').then((m) => ({ default: m.SecuritySettings })));
const AppearanceSettings = lazy(() => import('../pages/settings/AppearanceSettings').then((m) => ({ default: m.AppearanceSettings })));
const NotificationSettings = lazy(() => import('../pages/settings/NotificationSettings').then((m) => ({ default: m.NotificationSettings })));
const LanguageSettings = lazy(() => import('../pages/settings/LanguageSettings').then((m) => ({ default: m.LanguageSettings })));
const DefaultParamsSettings = lazy(() => import('../pages/settings/DefaultParamsSettings').then((m) => ({ default: m.DefaultParamsSettings })));
const PrivacySettings = lazy(() => import('../pages/settings/PrivacySettings').then((m) => ({ default: m.PrivacySettings })));

export default function ResearcherApp() {
  const { activeTrial, role } = useTrialContext();
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  const dataEntryPath = useMemo(() => {
    const year = activeTrial?.year ?? 'year';
    const season = activeTrial?.season ?? 'season';
    const trial = typeof activeTrial === 'string' ? activeTrial : activeTrial?.trialId ?? activeTrial?.id ?? 'trial';
    return `/data-entry/${year}/${season}/${trial}`;
  }, [activeTrial]);

  const plotCount = useMemo(() => {
    if (!activeTrial) return undefined;
    if (typeof activeTrial === 'object') {
      return (
        activeTrial.plotCount ??
        activeTrial.plot_count ??
        (Array.isArray(activeTrial.plots) ? activeTrial.plots.length : undefined)
      );
    }
    return undefined;
  }, [activeTrial]);

  const alertCount = useMemo(() => {
    if (!activeTrial) return undefined;
    if (typeof activeTrial === 'object') {
      return (
        activeTrial.alertCount ??
        activeTrial.alert_count ??
        (Array.isArray(activeTrial.alerts) ? activeTrial.alerts.length : undefined)
      );
    }
    return undefined;
  }, [activeTrial]);

  const isDataEntryActive = location.pathname.startsWith('/data-entry');

  const sidebarItemClasses = (isActive) =>
    `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-white/15 text-white border-l-2 border-white pl-3.5'
        : 'text-white/65 hover:bg-white/8 hover:text-white/90'
    }`;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900">
      <DemoBanner />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 flex-shrink-0 flex flex-col h-full overflow-y-auto bg-gradient-to-b from-[#1A3009] to-canopy text-white">
          {/* Logo area */}
          <div className="px-5 py-5 flex items-center gap-2.5 border-b border-white/10">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
              <IconLeaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg font-medium tracking-tight">FarmEvidence</span>
          </div>

          <nav className="flex-1 flex flex-col overflow-hidden">
            <div className="overflow-y-auto px-4 py-4 flex-1">
              <div className="space-y-1">
                <NavLink to="/dashboard" className={({ isActive }) => sidebarItemClasses(isActive)}>
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink to="/setup" className={({ isActive }) => sidebarItemClasses(isActive)}>
                  <Settings2 className="h-5 w-5" />
                  <span>Setup</span>
                </NavLink>
                <NavLink to={dataEntryPath} className={() => sidebarItemClasses(isDataEntryActive)}>
                  <ClipboardList className="h-5 w-5" />
                  <span>Data Entry</span>
                  {plotCount != null ? (
                    <span className="ml-auto text-xs bg-clay text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-medium">
                      {plotCount}
                    </span>
                  ) : null}
                </NavLink>
              </div>

              <p className="px-5 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">
                Analysis
              </p>
              <div className="mt-2 space-y-1">
                <NavLink to="/analysis/cba-results" className={({ isActive }) => sidebarItemClasses(isActive)}>
                  <BarChart3 className="h-5 w-5" />
                  <span>CBA Results</span>
                </NavLink>
                <NavLink to="/analysis/trends" className={({ isActive }) => sidebarItemClasses(isActive)}>
                  <TrendingUp className="h-5 w-5" />
                  <span>Trends</span>
                </NavLink>
                <NavLink to="/analysis/multi-season" className={({ isActive }) => sidebarItemClasses(isActive)}>
                  <TrendingUp className="h-5 w-5" />
                  <span>Multi-Season</span>
                </NavLink>
                <NavLink to="/analysis/trajectory" className={({ isActive }) => sidebarItemClasses(isActive)}>
                  <TrendingUp className="h-5 w-5" />
                  <span>Trajectory</span>
                </NavLink>
                {canAccess(role, 'statistics') && (
                  <NavLink to="/analysis/statistics" className={({ isActive }) => sidebarItemClasses(isActive)}>
                    <BarChart3 className="h-5 w-5" />
                    <span>Statistics RCBD</span>
                  </NavLink>
                )}
                <NavLink to="/analysis/risk-scenarios" className={({ isActive }) => sidebarItemClasses(isActive)}>
                  <ShieldAlert className="h-5 w-5" />
                  <span>Risk & Scenarios</span>
                </NavLink>
              </div>

              <p className="px-5 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">
                Insights
              </p>
              <div className="mt-2 space-y-1">
                <NavLink to="/analysis/explainability" className={({ isActive }) => sidebarItemClasses(isActive)}>
                  <Sparkles className="h-5 w-5" />
                  <span>Explainability</span>
                </NavLink>
                <NavLink to="/analysis/alerts" className={({ isActive }) => sidebarItemClasses(isActive)}>
                  <Bell className="h-5 w-5" />
                  <span>Alerts</span>
                  {alertCount > 0 ? (
                    <span className="ml-auto text-xs bg-clay text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-medium">
                      {alertCount}
                    </span>
                  ) : null}
                </NavLink>
                <NavLink to="/analysis/reports" className={({ isActive }) => sidebarItemClasses(isActive)}>
                  <FileText className="h-5 w-5" />
                  <span>PDF Reports</span>
                </NavLink>
                <NavLink to="/help" className={({ isActive }) => sidebarItemClasses(isActive)}>
                  <HelpCircle className="h-5 w-5" />
                  <span>Help & Docs</span>
                </NavLink>
                <NavLink to="/mode-rules" className={({ isActive }) => sidebarItemClasses(isActive)}>
                  <BookOpen className="h-5 w-5" />
                  <span>Mode Rules</span>
                </NavLink>
              </div>
            </div>

            {/* Mode badge + settings/sign out */}
            <div className="mt-auto border-t border-white/10 p-4 space-y-1">
              <div className="px-2 py-1.5 flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-medium">
                  Researcher
                </span>
              </div>
              <NavLink to="/settings" className={({ isActive }) => sidebarItemClasses(isActive)}>
                <Settings2 className="w-4 h-4" />
                <span className="text-sm">Settings</span>
              </NavLink>
              <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm text-white/50 hover:bg-white/8 hover:text-terracotta-pale transition-colors">
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </nav>
        </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto bg-mist">
          <Suspense fallback={<div className="min-h-screen p-6 text-slate-700">Loading FarmEvidence...</div>}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/setup" element={<Setup />} />
              <Route path="/setup/:year" element={<Setup />} />
              <Route path="/setup/:year/:season" element={<Setup />} />
              <Route path="/setup/:year/:season/new" element={<Setup />} />
              <Route path="/setup/:year/:season/:trialId" element={<Setup />} />
              <Route path="/data-entry/:year/:season/:trialId" element={<DataEntry />} />
              <Route path="/analysis/cba-results" element={<CBAResults />} />
              <Route path="/analysis/trends" element={<Trends />} />
              <Route path="/analysis/multi-season" element={<MultiSeason />} />
              <Route path="/analysis/trajectory" element={<Trajectory />} />
              <Route path="/analysis/statistics" element={<Statistics />} />
              <Route path="/analysis/risk-scenarios" element={<RiskScenarios />} />
              <Route path="/analysis/explainability" element={<Explainability />} />
              <Route path="/analysis/alerts" element={<Alerts />} />
              <Route path="/analysis/reports" element={<Reports />} />
              <Route path="/help" element={<Help />} />
              <Route path="/mode-rules" element={<ModeRules />} />
              <Route path="/settings" element={<SettingsLayout />}>
                <Route index element={<Navigate to="/settings/profile" replace />} />
                <Route path="profile" element={<ProfileSettings />} />
                <Route path="security" element={<SecuritySettings />} />
                <Route path="appearance" element={<AppearanceSettings />} />
                <Route path="notifications" element={<NotificationSettings />} />
                <Route path="language" element={<LanguageSettings />} />
                <Route path="defaults" element={<DefaultParamsSettings />} />
                <Route path="privacy" element={<PrivacySettings />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
