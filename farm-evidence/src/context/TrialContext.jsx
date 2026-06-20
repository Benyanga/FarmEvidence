import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getMe, login, register } from "../api/auth";

const VALID_MODE_VALUES = new Set(['farmer', 'researcher', 'research']);

function normalizeMode(value) {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'research') return 'researcher';
  return VALID_MODE_VALUES.has(normalized) ? normalized : null;
}

export const TrialContext = createContext();

export function useTrialContext() {
  const context = useContext(TrialContext);
  if (!context) {
    throw new Error("useTrialContext must be used within TrialContextProvider");
  }
  return context;
}

export function canAccess(role, feature) {
  if (!role) return false;

  const accessRules = {
    statistics: ["Researcher"],
    cross_comparison: ["Researcher"],
    system_plus: ["Farmer", "Researcher"],
    bilingual: ["Farmer"],
    scenario: ["Farmer", "Researcher"],
    pdf_reports: ["Farmer", "Researcher"],
    agronomic_full: ["Researcher"],
  };

  return (accessRules[feature] || []).includes(role);
}

/**
 * Hard guard function: enforces mode at the route/component level
 * @param {string} currentMode - 'farmer' | 'researcher' | null
 * @param {string} requiredMode - 'farmer' | 'researcher'
 * @returns {boolean}
 */
export function enforceMode(currentMode, requiredMode) {
  return currentMode === requiredMode;
}

export function logout() {
  try {
    localStorage.removeItem('authToken');
    localStorage.removeItem('mode');
    localStorage.removeItem('role');
    localStorage.removeItem('lang');
    localStorage.removeItem('activeTrial');
    localStorage.removeItem('activeFarm');
  } catch (error) {
    console.warn('Failed to clear localStorage during logout:', error);
  }
  window.location.href = '/login';
}

export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getAvatarColor(name) {
  const palette = ['#2D5016', '#C8860A', '#4A7FB5', '#7A5C8A', '#B23A2E', '#9C9388'];
  if (!name) return palette[0];
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

export function TrialContextProvider({ children }) {
  const [mode, setModeState] = useState(null);
  const [activeTrial, setActiveTrialState] = useState(null);
  const [activeFarm, setActiveFarmState] = useState(null);
  const [role, setRoleState] = useState(null);
  const [lang, setLangState] = useState("en");
  const [user, setUser] = useState(null);
  
  const [authLoading, setAuthLoading] = useState(true);

  const isDemoAccount = user?.isDemo === true;

  const setMode = useCallback((newMode) => {
    try {
      const normalized = normalizeMode(newMode);
      if (normalized === null) {
        localStorage.removeItem("mode");
      } else {
        localStorage.setItem("mode", normalized);
      }
      setModeState(normalized);
    } catch (error) {
      console.warn("Failed to persist mode:", error);
      setModeState(normalizeMode(newMode));
    }
  }, []);

  const setActiveTrial = useCallback((trial) => {
    try {
      if (trial === null) {
        localStorage.removeItem("activeTrial");
      } else {
        localStorage.setItem("activeTrial", JSON.stringify(trial));
      }
      setActiveTrialState(trial);
    } catch (error) {
      console.warn("Failed to persist activeTrial:", error);
      setActiveTrialState(trial);
    }
  }, []);

  const setActiveFarm = useCallback((farm) => {
    try {
      if (farm === null) {
        localStorage.removeItem("activeFarm");
      } else {
        localStorage.setItem("activeFarm", JSON.stringify(farm));
      }
      setActiveFarmState(farm);
    } catch (error) {
      console.warn("Failed to persist activeFarm:", error);
      setActiveFarmState(farm);
    }
  }, []);

  const setRole = useCallback((newRole) => {
    try {
      if (newRole === null) {
        localStorage.removeItem("role");
      } else {
        localStorage.setItem("role", newRole);
      }
      setRoleState(newRole);
    } catch (error) {
      console.warn("Failed to persist role:", error);
      setRoleState(newRole);
    }
  }, []);

  const setLang = useCallback((newLang) => {
    try {
      if (newLang === null) {
        localStorage.removeItem("lang");
      } else {
        localStorage.setItem("lang", newLang);
      }
      setLangState(newLang);
    } catch (error) {
      console.warn("Failed to persist lang:", error);
      setLangState(newLang);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const storedMode = localStorage.getItem("mode");
      const inferredMode = normalizeMode(storedMode);
      if (inferredMode) setModeState(inferredMode);

      const storedTrial = localStorage.getItem("activeTrial");
      if (storedTrial) {
        try {
          setActiveTrialState(JSON.parse(storedTrial));
        } catch (e) {
          console.warn("Failed to parse activeTrial from localStorage:", e);
        }
      }

      const storedFarm = localStorage.getItem("activeFarm");
      if (storedFarm) {
        try {
          setActiveFarmState(JSON.parse(storedFarm));
        } catch (e) {
          console.warn("Failed to parse activeFarm from localStorage:", e);
        }
      }

      const storedRole = localStorage.getItem("role");
      if (storedRole) setRoleState(storedRole);

      const storedLang = localStorage.getItem("lang");
      if (storedLang) setLangState(storedLang);

      try {
        const current = window?.location?.pathname || '';
        if (!localStorage.getItem('mode') && current) {
          const farmerPrefixes = ['/data-entry', '/dashboard', '/setup', '/alerts', '/reports', '/comparison', '/trajectory', '/help'];
          const researcherPrefixes = ['/analysis', '/trials', '/cba', '/research'];
          if (farmerPrefixes.some((p) => current.startsWith(p))) {
            setModeState('farmer');
          } else if (researcherPrefixes.some((p) => current.startsWith(p))) {
            setModeState('researcher');
          }
        }
      } catch (e) {
        // ignore
      }

      // If Clerk token getter is available, fetch current user from backend
      const getter = typeof window !== 'undefined' ? window.__getClerkTokenGetter : null;
      if (getter && typeof getter === 'function') {
        setAuthLoading(true);
        try {
          const { data } = await getMe();
          if (!mounted) return;
          if (data?.user) {
            setUser(data.user);
            setModeState(data.user.mode);
            setRoleState(data.user.role);
            setLangState(data.user.language || 'en');
          }
        } catch (error) {
          console.warn('Failed to fetch current user via Clerk token:', error);
        } finally {
          if (mounted) setAuthLoading(false);
        }
      } else {
        setAuthLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await getMe();
    if (data?.user) {
      setUser(data.user);
      setMode(data.user.mode);
      setRole(data.user.role);
      setLang(data.user.language || 'en');
    }
    return data;
  }, [setLang, setMode, setRole]);



  const value = {
    mode,
    setMode,
    activeTrial,
    setActiveTrial,
    activeFarm,
    setActiveFarm,
    role,
    setRole,
    lang,
    setLang,
    user,
    authLoading,
    isDemoAccount,
    refreshUser,
    logout,
  };

  return <TrialContext.Provider value={value}>{children}</TrialContext.Provider>;
}
