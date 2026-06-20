import React from 'react';

/**
 * CARD DESIGN RATIONALE:
 *
 * Three card "moods" for three situations:
 *
 * Card (default): resting surface. White, depth-1 shadow, border on all
 *   sides in ledger-soft, 3px top border in the accent color. Feels like
 *   a piece of paper lying on the mist background.
 *
 * Card variant="raised": for selected/active/hover states. Same card but
 *   lifts with depth-2 shadow and no side border — the border is replaced
 *   by shadow depth so it doesn't look "selected via border thickness."
 *   Used for: the active plot card in DataEntry, the selected year button
 *   in Setup, an expanded accordion section.
 *
 * Card variant="tinted": for cards whose content has a specific semantic
 *   color identity (e.g. a Phase Mature card that should read green without
 *   screaming green). Gets a very subtle tinted background (accent color
 *   at 5% opacity) + the accent border top.
 *
 * Interactive cards (onClick present): get cursor-pointer + hover lift +
 *   a subtle hover bg shift. The lift is translateY(-2px) to make them
 *   feel clearly clickable vs static content cards.
 */

const ACCENT_BORDER = {
  ca:    'border-t-canopy',
  cf:    'border-t-clay',
  canopy: 'border-t-canopy',
  clay:   'border-t-clay',
  sky:    'border-t-sky',
  terracotta: 'border-t-terracotta',
  amber:  'border-t-amber',
  'tier-base':  'border-t-[#9C9388]',
  'tier-sys':   'border-t-clay',
  'tier-time':  'border-t-sky',
  'tier-adopt': 'border-t-[#7A5C8A]',
  'phase-transition':    'border-t-amber',
  'phase-stabilization': 'border-t-sky',
  'phase-mature':        'border-t-canopy',
  none: 'border-t-transparent'
};

const TINT_BG = {
  ca:     'bg-canopy-pale/30',
  cf:     'bg-clay-pale/30',
  canopy: 'bg-canopy-pale/30',
  clay:   'bg-clay-pale/30',
  sky:    'bg-sky-pale/30',
  terracotta: 'bg-terracotta-pale/30',
  amber:  'bg-amber-pale/30',
  none:   'bg-paper'
};

export function Card({
  accent = 'none',
  variant = 'default',  // 'default' | 'raised' | 'tinted'
  interactive = false,
  selected = false,
  onClick,
  children,
  className = '',
  padded = true
}) {
  const isClickable = interactive || !!onClick;
  const bgClass = variant === 'tinted' ? (TINT_BG[accent] || 'bg-paper') : 'bg-paper';

  const shadowClass = selected
    ? 'shadow-raised ring-2 ring-canopy/20'
    : variant === 'raised'
    ? 'shadow-raised'
    : 'shadow-card';

  const hoverClass = isClickable
    ? 'hover:-translate-y-0.5 hover:shadow-raised cursor-pointer group'
    : '';

  const borderClass = variant === 'raised'
    ? 'border-0'
    : 'border border-ledger-soft';

  return (
    <div
      onClick={onClick}
      className={`
        ${bgClass} rounded-xl
        border-t-[3px] ${ACCENT_BORDER[accent] || ACCENT_BORDER.none}
        ${borderClass}
        ${shadowClass}
        ${hoverClass}
        transition-all duration-[180ms] cubic-bezier(0.16,1,0.3,1)
        ${padded ? 'p-5' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * KPI Card — upgraded with size variants and delta formatting.
 */
export function KPICard({
  label,
  value,
  unit,
  accent = 'none',
  delta,
  deltaLabel,
  isOutput = false,
  sublabel,
  className = ''
}) {
  return (
    <Card accent={accent} className={className}>
      <p className="text-label mb-2">{label}</p>
      <p className={`text-kpi ${isOutput ? 'text-canopy' : ''}`}>
        {value ?? <span className="text-soil-faint">—</span>}
        {unit && value != null && (
          <span className="text-sm text-soil-faint font-sans font-normal ml-1.5">{unit}</span>
        )}
      </p>
      {sublabel && <p className="text-meta mt-1">{sublabel}</p>}
      {delta != null && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-mono
          ${delta >= 0 ? 'text-canopy' : 'text-terracotta'}`}>
          <span className="text-base leading-none">{delta >= 0 ? '↑' : '↓'}</span>
          <span>{typeof delta === 'number' ? Math.abs(delta).toLocaleString() : delta}</span>
          {deltaLabel && <span className="text-soil-faint font-sans ml-0.5">{deltaLabel}</span>}
        </div>
      )}
    </Card>
  );
}

/**
 * Comparison KPI Card — CA vs CF side by side.
 */
export function ComparisonKPICard({
  label,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  unit,
  winner,
  sublabel
}) {
  return (
    <Card accent="none">
      <p className="text-label mb-3">{label}</p>
      <div className="flex gap-4">
        <div className="flex-1 border-l-[3px] border-canopy pl-3">
          <p className="text-xs font-semibold text-canopy mb-1">{leftLabel}</p>
          <p className="text-kpi-sm">
            {leftValue ?? '—'}
            {unit && leftValue != null && (
              <span className="text-xs text-soil-faint font-sans ml-1">{unit}</span>
            )}
          </p>
        </div>
        <div className="w-px bg-ledger self-stretch" />
        <div className="flex-1 border-l-[3px] border-clay pl-3">
          <p className="text-xs font-semibold text-clay mb-1">{rightLabel}</p>
          <p className="text-kpi-sm">
            {rightValue ?? '—'}
            {unit && rightValue != null && (
              <span className="text-xs text-soil-faint font-sans ml-1">{unit}</span>
            )}
          </p>
        </div>
      </div>
      {(winner || sublabel) && (
        <div className="mt-3 pt-3 border-t border-ledger-soft flex items-center gap-1.5 text-meta">
          {winner && (
            <>
              <span>Higher:</span>
              <span className={winner === leftLabel ? 'text-canopy font-semibold' : 'text-clay font-semibold'}>
                {winner}
              </span>
            </>
          )}
          {sublabel && <span className="ml-auto">{sublabel}</span>}
        </div>
      )}
    </Card>
  );
}
