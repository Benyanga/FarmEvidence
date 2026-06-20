import { lazy, Suspense, useMemo } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings2,
  ClipboardList,
  TrendingUp,
  Bell,
  FileText,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { useTrialContext, logout } from '../context/TrialContext';
import { IconLeaf } from '../components/ui/Icons';
import { DemoBanner } from '../components/shared/DemoBanner';
import { Topbar } from '../components/shared/Topbar';
import { SettingsLayout } from '../pages/settings/SettingsLayout';

// Lazy-load all farmer pages
const FarmerDashboard = lazy(() => import('../pages/farmer/FarmerDashboard').then((m) => ({ default: m.default })));
const FarmerSetup = lazy(() => import('../pages/farmer/FarmerSetup').then((m) => ({ default: m.default })));
const FarmerDataEntry = lazy(() => import('../pages/farmer/FarmerDataEntry').then((m) => ({ default: m.default })));
const SeasonComparison = lazy(() => import('../pages/farmer/SeasonComparison').then((m) => ({ default: m.default })));
const FarmerTrajectory = lazy(() => import('../pages/farmer/FarmerTrajectory').then((m) => ({ default: m.default })));
const FarmerAlerts = lazy(() => import('../pages/farmer/FarmerAlerts').then((m) => ({ default: m.default })));
const FarmerReports = lazy(() => import('../pages/farmer/FarmerReports').then((m) => ({ default: m.default })));
const FarmerHelp = lazy(() => import('../pages/farmer/FarmerHelp').then((m) => ({ default: m.default })));
const ProfileSettings = lazy(() => import('../pages/settings/ProfileSettings').then((m) => ({ default: m.ProfileSettings })));
const SecuritySettings = lazy(() => import('../pages/settings/SecuritySettings').then((m) => ({ default: m.SecuritySettings })));
const AppearanceSettings = lazy(() => import('../pages/settings/AppearanceSettings').then((m) => ({ default: m.AppearanceSettings })));
const NotificationSettings = lazy(() => import('../pages/settings/NotificationSettings').then((m) => ({ default: m.NotificationSettings })));
const LanguageSettings = lazy(() => import('../pages/settings/LanguageSettings').then((m) => ({ default: m.LanguageSettings })));
const DefaultParamsSettings = lazy(() => import('../pages/settings/DefaultParamsSettings').then((m) => ({ default: m.DefaultParamsSettings })));
const PrivacySettings = lazy(() => import('../pages/settings/PrivacySettings').then((m) => ({ default: m.PrivacySettings })));

// Kinyarwanda translations for sidebar labels
const LABELS = {
  en: {
    dashboard: 'Dashboard',
    setup: 'Setup',
    myFarm: 'MY FARM',
    dataEntry: 'Data Entry',
    comparison: 'Season Comparison',
    trajectory: 'Trajectory',
    insights: 'INSIGHTS',
    alerts: 'Alerts',
    reports: 'Reports',
    help: 'Help',
    signOut: 'Sign out',
  },
  kin: {
    dashboard: 'Imbonerahamwe',
    setup: 'Igenamiterere',
    myFarm: 'UBUTAKA BWANJYE',
    dataEntry: 'Kwinjiza Amakuru',
    comparison: 'Kugereranya Ibihembwe',
    trajectory: 'Inzira',
    insights: 'UBUSHISHOZI',
    alerts: 'Imenyesha',
    reports: 'Raporo',
    help: 'Ubufasha',
    signOut: 'Gusohoka',
  },
};

function getPageTitle(pathname) {
  const mapping = [
    ['/dashboard', 'Dashboard'],
    ['/setup', 'Setup'],
    ['/data-entry', 'Data Entry'],
    ['/comparison', 'Season Comparison'],
    ['/trajectory', 'Trajectory'],
    ['/alerts', 'Alerts'],
    ['/reports', 'Reports'],
    ['/help', 'Help'],
  ];
  const route = mapping.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return route ? route[1] : 'Farmer';
}

export default function FarmerApp() {
  const { lang, activeFarm } = useTrialContext();
  const location = useLocation();

  const currentLang = lang === 'kin' ? 'kin' : 'en';
  const labels = LABELS[currentLang];
  const pageTitle = getPageTitle(location.pathname);
  const settingsLabel = currentLang === 'kin' ? 'Igenamiterere' : 'Settings';
  const isSettingsActive = location.pathname.startsWith('/settings');

  const alertCount = useMemo(() => {
    if (!activeFarm) return 0;
    if (typeof activeFarm === 'object') {
      return activeFarm.alertCount ?? activeFarm.alert_count ?? (Array.isArray(activeFarm.alerts) ? activeFarm.alerts.length : 0);
    }
    return 0;
  }, [activeFarm]);

  const dataEntryPath = useMemo(() => {
    // For farmer mode, data entry is per year+season+farm
    // We'd need to get the current active year/season from context or route
    // For now, use placeholder that will be filled in by FarmerSetup
    return '/data-entry/year/season/:farmId';
  }, []);

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
                  <span>{labels.dashboard}</span>
                </NavLink>
                <NavLink to="/setup" className={({ isActive }) => sidebarItemClasses(isActive)}>
                  <Settings2 className="h-5 w-5" />
                  <span>{labels.setup}</span>
                </NavLink>
              </div>

              <p className="px-5 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">
                {labels.myFarm}
              </p>
              <div className="mt-2 space-y-1">
                <NavLink to="/data-entry" className={({ isActive }) => sidebarItemClasses(isActive)}>
                  <ClipboardList className="h-5 w-5" />
                  <span>{labels.dataEntry}</span>
                </NavLink>
                <NavLink to="/comparison" className={({ isActive }) => sidebarItemClasses(isActive)}>
                  <TrendingUp className="h-5 w-5" />
                  <span>{labels.comparison}</span>
                </NavLink>
                <NavLink to="/trajectory" className={({ isActive }) => sidebarItemClasses(isActive)}>
                  <TrendingUp className="h-5 w-5" />
                  <span>{labels.trajectory}</span>
                </NavLink>
              </div>

              <p className="px-5 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">
                {labels.insights}
              </p>
              <div className="mt-2 space-y-1">
                <NavLink to="/alerts" className={({ isActive }) => sidebarItemClasses(isActive)}>
                  <Bell className="h-5 w-5" />
                  <span>{labels.alerts}</span>
                  {alertCount > 0 ? (
                    <span className="ml-auto text-xs bg-clay text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-medium">
                      {alertCount}
                    </span>
                  ) : null}
                </NavLink>
                <NavLink to="/reports" className={({ isActive }) => sidebarItemClasses(isActive)}>
                  <FileText className="h-5 w-5" />
                  <span>{labels.reports}</span>
                </NavLink>
                <NavLink to="/help" className={({ isActive }) => sidebarItemClasses(isActive)}>
                  <HelpCircle className="h-5 w-5" />
                  <span>{labels.help}</span>
                </NavLink>
              </div>
            </div>

            {/* Mode badge + settings/sign out */}
            <div className="mt-auto border-t border-white/10 p-4 space-y-1">
              <div className="px-2 py-1.5 flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-medium">
                  Farmer
                </span>
              </div>
              <NavLink to="/settings" className={({ isActive }) => sidebarItemClasses(isActive || isSettingsActive)}>
                <Settings2 className="w-4 h-4" />
                <span className="text-sm">{settingsLabel}</span>
              </NavLink>
              <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm text-white/50 hover:bg-white/8 hover:text-terracotta-pale transition-colors">
                <LogOut className="w-4 h-4" />
                <span>{labels.signOut}</span>
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
              <Route path="/dashboard" element={<FarmerDashboard />} />
              <Route path="/setup" element={<FarmerSetup />} />
              <Route path="/setup/:year" element={<FarmerSetup />} />
              <Route path="/setup/:year/:season" element={<FarmerSetup />} />
              <Route path="/setup/:year/:season/new" element={<FarmerSetup />} />
              <Route path="/data-entry" element={<FarmerDataEntry />} />
              <Route path="/data-entry/:year/:season/:farmId" element={<FarmerDataEntry />} />
              <Route path="/comparison" element={<SeasonComparison />} />
              <Route path="/trajectory" element={<FarmerTrajectory />} />
              <Route path="/alerts" element={<FarmerAlerts />} />
              <Route path="/reports" element={<FarmerReports />} />
              <Route path="/help" element={<FarmerHelp />} />
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
