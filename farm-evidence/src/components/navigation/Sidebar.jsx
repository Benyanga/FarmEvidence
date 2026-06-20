import { Link, NavLink, useLocation } from "react-router-dom";
import { useSessionStore } from "../../store/sessionStore";
import { useDataStore } from "../../store/dataStore";
import { getComputationGates } from "../../utils/computationGates";
import {
  LayoutDashboard,
  Settings2,
  Database,
  Calculator,
  TrendingUp,
  BarChart2,
  AlertTriangle,
  Lightbulb,
  Bell,
  FileDown,
  HelpCircle,
  Info,
  LogOut
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    label: "CORE",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, status: "active" },
      { id: "setup", label: "Setup", icon: Settings2, status: "green" },
      { id: "data-entry", label: "Data Entry", icon: Database, badge: "8 gates", badgeType: "amber" }
    ]
  },
  {
    label: "ANALYSIS",
    items: [
      { id: "cba-results", label: "CBA Results", icon: Calculator, status: "amber" },
      { id: "trends", label: "Trends", icon: TrendingUp },
      { id: "statistics", label: "Statistics", icon: BarChart2, badge: "RCBD", badgeType: "green", hideInFarmer: true },
      { id: "risk-scenarios", label: "Risk & Scenarios", icon: AlertTriangle }
    ]
  },
  {
    label: "INSIGHTS",
    items: [
      { id: "explainability", label: "Explainability", icon: Lightbulb },
      { id: "alerts", label: "Alerts", icon: Bell, badge: "2", badgeType: "amber" },
      { id: "reports", label: "PDF Reports", icon: FileDown }
    ]
  }
];

const WORKSPACE_ROUTES = {
  dashboard: "",
  "data-entry": "",
  "cba-results": "cba-results",
  trends: "trends",
  statistics: "statistics",
  "risk-scenarios": "risk-scenarios",
  explainability: "explainability",
  alerts: "alerts",
  reports: "reports",
};

function getWorkspaceTarget(activeFarm, itemId) {
  if (!activeFarm) {
    const mainRoutes = {
      "cba-results": "/analysis/cba-results",
      trends: "/analysis/trends",
      statistics: "/analysis/statistics",
      "risk-scenarios": "/analysis/risk-scenarios",
      explainability: "/analysis/explainability",
      alerts: "/analysis/alerts",
      reports: "/analysis/reports",
    };
    return mainRoutes[itemId] || `/${itemId}`;
  }
  const { year, season, recordId } = activeFarm;
  const base = `/data-entry/${year}/${season}/${recordId}`;
  const suffix = WORKSPACE_ROUTES[itemId];
  if (itemId === "dashboard") return `/dashboard`;
  if (itemId === "data-entry") return `/data-entry/${year}/${season}`;
  if (suffix) return `/analysis/${suffix}`;
  return base;
}

export function Sidebar() {
  const { pathname } = useLocation();
  const mode = useSessionStore((s) => s.mode);
  const setMode = useSessionStore((s) => s.setMode);
  const activeFarm = useSessionStore((s) => s.activeFarm);
  const sessionLocked = useSessionStore((s) => s.sessionLocked);
  const modeLabel = mode === 'RESEARCH' ? 'Research Mode' : 'Farmer Mode';
  const setup = useDataStore((s) => s.setup);
  const activeFarmRecord = useDataStore((s) => s.farmSeasonRecords[activeFarm?.recordId]);
  const gateCount = activeFarmRecord ? getComputationGates(setup, activeFarmRecord, mode).length : mode === 'RESEARCH' ? 9 : 8;

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-name">
          <span>Farm</span>
          <span>Evidence</span>
        </div>
        <div className="sidebar__brand-subtitle">FIELD SCHOOL DATA PLATFORM</div>
      </div>

      <div className="sidebar__mode-panel">
        {!sessionLocked ? (
          <div className="sidebar__mode-toggle">
            <button
              type="button"
              className={`sidebar__mode-button ${mode === 'FARMER' ? 'active' : ''}`}
              aria-pressed={mode === 'FARMER'}
              onClick={() => setMode('FARMER')}
            >
              Farmer Mode
            </button>
            <button
              type="button"
              className={`sidebar__mode-button ${mode === 'RESEARCH' ? 'active' : ''}`}
              aria-pressed={mode === 'RESEARCH'}
              onClick={() => setMode('RESEARCH')}
            >
              Research Mode
            </button>
          </div>
        ) : (
          <div className="sidebar__mode-toggle" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--fe-grey-500)' }}>Locked: {mode === 'RESEARCH' ? 'Research' : 'Farmer'} mode</span>
          </div>
        )}
        <div className="sidebar__context">Current mode: {modeLabel}</div>
      </div>

      <div className="sidebar__active-farm" style={{ marginBottom: '18px', padding: '16px', borderRadius: '14px', border: '1px solid var(--fe-border-default)', background: 'var(--fe-grey-050)' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--fe-grey-500)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {mode === 'RESEARCH' ? 'Active Trial' : 'Active Farm'}
        </div>
        {activeFarm ? (
          <Link to={`/data-entry/${activeFarm.year}/${activeFarm.season}/${activeFarm.recordId}`} className="sidebar__active-farm-link" style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: 'var(--fe-teal-900)' }}>
            {activeFarm.farmName || `Trial ${activeFarm.recordId}`} · Season {activeFarm.season} {activeFarm.year}
          </Link>
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--fe-grey-500)' }}>
            {mode === 'RESEARCH' ? 'No active trial selected' : 'No active farm selected'}
          </div>
        )}
      </div>

      <div className="sidebar__content">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="sidebar__nav-section">
            <div className="sidebar__nav-section-label">{section.label}</div>
            <div className="sidebar__nav-items">
              {section.items
                .filter(item => !(item.hideInFarmer && mode === 'FARMER'))
                .map((item) => {
                  const IconComponent = item.icon;
                  const target = item.id === 'setup'
                    ? '/setup'
                    : item.id === 'data-entry'
                      ? (activeFarm ? `/data-entry/${activeFarm.year}/${activeFarm.season}/${activeFarm.recordId}` : '/data-entry')
                      : getWorkspaceTarget(activeFarm, item.id);
                  const isActive = item.id === 'setup'
                    ? pathname.startsWith('/setup')
                    : item.id === 'data-entry'
                      ? pathname.startsWith('/data-entry')
                      : pathname === target;

                  return (
                    <NavLink
                      key={item.id}
                      to={target}
                      className={({ isActive: linkActive }) => `sidebar__nav-item ${isActive || linkActive ? 'active' : ''}`}
                    >
                      <div className="sidebar__nav-icon-wrapper">
                        <IconComponent size={17} />
                      </div>
                      <span>{item.label}</span>
                      {item.status === 'green' && <span className="sidebar__status-dot" />}
                      {((item.id === 'data-entry') ? `${gateCount} gates` : item.badge) && (
                        <span className={`sidebar__nav-badge ${item.badgeType === 'green' ? 'badge-green' : 'badge-amber'}`}>
                          {(item.id === 'data-entry') ? `${gateCount} gates` : item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar__footer">
        <Link to="/help" className="sidebar__footer-link">
          <HelpCircle size={17} />
          <span>Help & Docs</span>
        </Link>
        <Link to="/mode-rules" className="sidebar__footer-link">
          <Info size={17} />
          <span>Mode Rules</span>
        </Link>
        <div className="sidebar__footer-link sidebar__footer-link--action">
          <LogOut size={17} />
          <span>Sign out</span>
        </div>
      </div>
    </aside>
  );
}

