export function SyncBadge({ online = true, pending = 0 }) {
  const text = online ? (pending ? `Pending sync (${pending})` : "Synced") : "Offline";
  return <div className="rounded bg-slate-800 px-2 py-1 body-sm text-white">{text}</div>;
}

