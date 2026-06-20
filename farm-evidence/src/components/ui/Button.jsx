/**
 * BUTTON DESIGN RULES
 *
 * Design decisions:
 *
 * 1. OPTICAL CENTERING: letter-spacing: 0.01em on all button labels gives
 *    text slightly more breathing room, counteracting the optical squeeze
 *    that happens when a medium-weight label sits inside a solid fill.
 *
 * 2. MICRO-LIFT ON HOVER: translateY(-1px) + heavier shadow = button rises
 *    toward the cursor. Combined with active:translate-y-0 it gives a
 *    "press" sensation.
 *
 * 3. INNER HIGHLIGHT: primary/secondary buttons have a 1px inset top border
 *    in a lighter tint (white at 15% opacity) — the classic "top edge
 *    catch light" that makes flat fills look physically pressable, not flat.
 *    Implemented via a pseudo-element since Tailwind can't express inset
 *    box-shadow with arbitrary values cleanly in JSX; use the CSS class
 *    .btn-highlight.
 *
 * 4. FOCUS RING: 2px offset ring in the button's own color at 35% opacity,
 *    NOT the default blue outline. Accessibility maintained, visual language
 *    consistent.
 *
 * 5. LOADING STATE: a prop `loading` adds a spinner and disables the button
 *    without the caller needing to manage disabled state separately.
 */

const VARIANTS = {
  primary: [
    'relative bg-canopy text-white',
    'hover:bg-canopy-light hover:-translate-y-px hover:shadow-raised',
    'active:translate-y-0 active:shadow-card active:bg-canopy',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canopy/40 focus-visible:ring-offset-2',
    'border border-canopy/80',
    'btn-highlight'
  ].join(' '),

  secondary: [
    'relative bg-clay text-white',
    'hover:bg-clay-light hover:-translate-y-px hover:shadow-raised',
    'active:translate-y-0 active:shadow-card active:bg-clay',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2',
    'border border-clay/80',
    'btn-highlight'
  ].join(' '),

  outline: [
    'bg-paper text-soil',
    'border border-ledger',
    'hover:border-soil-soft hover:bg-mist hover:-translate-y-px hover:shadow-card',
    'active:translate-y-0 active:bg-ledger-soft',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soil/20 focus-visible:ring-offset-2'
  ].join(' '),

  ghost: [
    'bg-transparent text-soil-soft',
    'hover:bg-mist hover:text-soil',
    'active:bg-ledger-soft',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soil/20 focus-visible:ring-offset-2'
  ].join(' '),

  danger: [
    'relative bg-terracotta text-white',
    'hover:bg-terracotta/90 hover:-translate-y-px hover:shadow-raised',
    'active:translate-y-0 active:bg-terracotta',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40 focus-visible:ring-offset-2',
    'border border-terracotta/80',
    'btn-highlight'
  ].join(' '),

  link: [
    'bg-transparent text-canopy p-0 h-auto rounded-none',
    'hover:text-canopy-light underline-offset-2 hover:underline',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canopy/30 focus-visible:ring-offset-1'
  ].join(' ')
};

const SIZES = {
  xs: 'h-7  px-2.5 text-xs  rounded-md  gap-1   tracking-[0.01em]',
  sm: 'h-8  px-3   text-xs  rounded-md  gap-1.5 tracking-[0.01em]',
  md: 'h-10 px-4   text-sm  rounded-lg  gap-2   tracking-[0.01em]',
  lg: 'h-12 px-6   text-base rounded-lg gap-2.5 tracking-[0.01em]',
  xl: 'h-14 px-8   text-base rounded-xl gap-3   tracking-[0.01em] font-semibold'
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  children,
  className = '',
  ...props
}) {
  return (
    <button
      disabled={loading || props.disabled}
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-[var(--t-normal)]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        disabled:shadow-none
        ${VARIANTS[variant]} ${SIZES[size]} ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent
          rounded-full animate-spin" />
      ) : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
}
