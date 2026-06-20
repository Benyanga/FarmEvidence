/**
 * SKELETON — shown while data is loading, replaces "Loading..." text.
 * Use in every analysis page's loading state.
 *
 * Uses the .skeleton CSS class defined in src/index.css which provides
 * a shimmer animation effect with warm-tinted gradient background.
 */

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function KPICardSkeleton() {
  return (
    <div className="bg-paper rounded-xl border border-ledger-soft border-t-[3px] border-t-ledger shadow-card p-5">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
