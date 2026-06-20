import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrialContext, getInitials, getAvatarColor } from '../../context/TrialContext';

export function Topbar({ pageTitle }) {
  const { user, logout } = useTrialContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initials = getInitials(user?.name);
  const avatarColor = getAvatarColor(user?.name);

  return (
    <div className="h-14 bg-paper border-b border-ledger-soft flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-sm font-semibold text-soil tracking-[-0.01em]">{pageTitle}</h1>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((current) => !current)}
          className="flex items-center gap-2.5 group"
          title={`${user?.name || ''} — ${user?.email || ''}`}
        >
          {user?.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-ledger group-hover:ring-canopy/30 transition-all"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white group-hover:ring-canopy/30 transition-all"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>
          )}
        </button>

        <div className="absolute right-0 mt-1 hidden group-hover:block">
          {/* Optional rich hover tooltip could go here */}
        </div>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-paper rounded-xl border border-ledger-soft shadow-float py-1.5 z-50 animate-in slide-in-from-top-1 fade-in duration-150">
            <div className="px-4 py-3 border-b border-ledger-soft">
              <p className="text-sm font-semibold text-soil truncate">{user?.name}</p>
              <p className="text-xs text-soil-faint truncate mt-0.5">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                setDropdownOpen(false);
                navigate('/settings/profile');
              }}
              className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm text-soil hover:bg-mist transition-colors"
            >
              View Profile
            </button>
            <button
              onClick={() => {
                setDropdownOpen(false);
                navigate('/settings');
              }}
              className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm text-soil hover:bg-mist transition-colors"
            >
              Settings
            </button>
            <div className="border-t border-ledger-soft mt-1 pt-1">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm text-terracotta hover:bg-terracotta-pale transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
