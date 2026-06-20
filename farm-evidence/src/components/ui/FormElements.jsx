export function Input({ className = '', ...props }) {
  return (
    <input
      className={`block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${className}`}
      {...props}
    />
  );
}
