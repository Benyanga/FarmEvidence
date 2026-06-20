import { useSessionStore } from "../store/sessionStore";

export function useMode() {
  const mode = useSessionStore((s) => s.mode);
  return {
    mode,
    isFarmer: mode === "FARMER",
    isResearch: mode === "RESEARCH",
  };
}
