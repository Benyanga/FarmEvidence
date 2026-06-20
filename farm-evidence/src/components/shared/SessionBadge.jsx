import { useSessionStore } from "../../store/sessionStore";

export function SessionBadge() {
  const mode = useSessionStore((s) => s.mode);
  const role = useSessionStore((s) => s.role);
  const locked = useSessionStore((s) => s.sessionLocked);
  return (
    <div className="rounded bg-green-800 px-3 py-1 body-sm font-bold text-white">
      {locked ? `${mode} MODE — ${role}` : "MODE NOT LOCKED"}
    </div>
  );
}
