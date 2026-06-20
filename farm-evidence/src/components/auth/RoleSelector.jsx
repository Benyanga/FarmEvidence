import { useSessionStore } from "../../store/sessionStore";

const ROLES = ["Farmer", "Researcher"];

export function RoleSelector() {
  const role = useSessionStore((s) => s.role);
  const setRole = useSessionStore((s) => s.setRole);
  const setMode = useSessionStore((s) => s.setMode);
  return (
    <div className="flex gap-2">
      {ROLES.map((r) => (
        <button
          key={r}
          type="button"
          className={role === r ? "btn btn-primary" : "btn btn-secondary"}
          onClick={() => {
            setRole(r);
            setMode(r === 'Farmer' ? 'FARMER' : 'RESEARCH');
          }}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
