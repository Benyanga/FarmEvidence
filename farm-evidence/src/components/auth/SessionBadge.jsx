import { useSessionStore } from "../../store/sessionStore";

export function SessionBadge() {
  const mode = useSessionStore((s) => s.mode);
  return <div className="rounded bg-emerald-800 px-3 py-1 body-sm font-bold text-white">{mode} MODE</div>;
}

