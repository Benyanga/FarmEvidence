import { Outlet, NavLink } from 'react-router-dom';

const TABS = [
  { path: '/settings/profile', label: 'Profile' },
  { path: '/settings/security', label: 'Security' },
  { path: '/settings/appearance', label: 'Appearance' },
  { path: '/settings/notifications', label: 'Notifications' },
  { path: '/settings/language', label: 'Language & Region' },
  { path: '/settings/defaults', label: 'Default Parameters' },
  { path: '/settings/privacy', label: 'Data & Privacy' },
];

export function SettingsLayout() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-display-page-title text-soil mb-6">Settings</h1>
      <div className="flex gap-8">
        <nav className="w-48 flex-shrink-0 space-y-1">
          {TABS.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive ? 'bg-canopy-pale text-canopy font-medium' : 'text-soil-soft hover:bg-mist'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
