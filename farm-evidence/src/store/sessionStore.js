import { create } from "zustand";

const persistedMode = typeof window !== "undefined" ? window.localStorage.getItem("mode") : null;
const persistedUserRole = typeof window !== "undefined" ? window.localStorage.getItem("userRole") : null;

let initialMode = "FARMER";
let initialLanguage = "en";
let initialRole = "Farmer";

if (persistedMode === "RESEARCH") {
  initialMode = "RESEARCH";
} else if (persistedMode === "FARMER") {
  initialMode = "FARMER";
}

if (persistedUserRole) {
  try {
    const parsed = JSON.parse(persistedUserRole);
    if (parsed.role) initialRole = parsed.role;
    if (parsed.lang) initialLanguage = parsed.lang;
  } catch (error) {
    console.warn("Failed to parse persisted userRole", error);
  }
}

export const useSessionStore = create((set) => ({
  mode: initialMode,
  language: initialLanguage,
  role: initialRole,
  sessionLocked: false,
  activeFarm: null,
  activePlot: null,
  setMode: (mode) => set((s) => {
    if (s.sessionLocked) return s;
    try {
      window.localStorage.setItem("mode", mode);
    } catch (error) {
      console.warn("Failed to persist mode to localStorage", error);
    }
    return {
      mode,
      role: mode === "FARMER" ? "Farmer" : "Researcher",
      language: mode === "RESEARCH" ? "en" : s.language,
    };
  }),
  setModeForce: (mode) => set((s) => {
    try {
      window.localStorage.setItem("mode", mode);
    } catch (error) {
      console.warn("Failed to persist mode to localStorage", error);
    }
    return {
      mode,
      role: mode === "FARMER" ? "Farmer" : "Researcher",
      language: mode === "RESEARCH" ? "en" : s.language,
    };
  }),
  setLanguage: (language) => set((s) => {
    if (s.sessionLocked) return s;
    try {
      const payload = { role: s.role, lang: language };
      window.localStorage.setItem("userRole", JSON.stringify(payload));
    } catch (error) {
      console.warn("Failed to persist language to localStorage", error);
    }
    return s.mode === "RESEARCH" ? { language: "en" } : { language };
  }),
  setRole: (role) => set((s) => {
    if (s.sessionLocked) return s;
    try {
      const payload = { role, lang: s.language };
      window.localStorage.setItem("userRole", JSON.stringify(payload));
    } catch (error) {
      console.warn("Failed to persist user role to localStorage", error);
    }
    return { role };
  }),
  setActiveFarm: (activeFarm) => set((state) => {
    // Deep compare to prevent unnecessary updates
    const prev = state.activeFarm;
    if (!prev && !activeFarm) return {};
    if (!prev || !activeFarm) return { activeFarm };
    const keys = Object.keys({ ...prev, ...activeFarm });
    const changed = keys.some((k) => prev[k] !== activeFarm[k]);
    if (changed) return { activeFarm };
    return {};
  }),
  setActivePlot: (activePlot) => set({ activePlot }),
  clearActiveFarm: () => set({ activeFarm: null, activePlot: null }),
  lockSession: () => set({ sessionLocked: true }),
  resetSession: () => set({ mode: "FARMER", language: "en", role: "Farmer", sessionLocked: false, activeFarm: null, activePlot: null }),
}));
