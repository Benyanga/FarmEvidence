export function IconLeaf({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 18C10 18 3 13 3 7.5a7 7 0 0 1 14 0C17 13 10 18 10 18z" />
      <path d="M10 18V10" />
      <path d="M10 12c-1.5-1-3-1.5-4-1" />
    </svg>
  );
}

export function IconMicroscope({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4h2v6H7z" />
      <path d="M9 4h2v3H9z" />
      <path d="M6 10h6" />
      <path d="M10 10v4" />
      <path d="M7 16h6" />
      <circle cx="10" cy="14" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function IconUsers({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="3" />
      <circle cx="13" cy="7" r="3" />
      <path d="M1 17c0-3 2.5-5 6-5" />
      <path d="M19 17c0-3-2.5-5-6-5" />
      <path d="M7 12c1 0 2 .2 3 .5" />
    </svg>
  );
}

export function IconPlay({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="8" />
      <path d="M8 7l5 3-5 3V7z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconPenLine({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 3l4 4-9 9H4v-4l9-9z" />
      <path d="M3 17h14" />
    </svg>
  );
}

export function IconKey({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="10" r="4.5" />
      <path d="M11.5 10h7" />
      <path d="M16 10v2.5" />
      <path d="M18.5 10v1.5" />
    </svg>
  );
}

export function IconClapperboard({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="16" height="12" rx="1.5" />
      <path d="M2 9h16" />
      <path d="M6 6V3" />
      <path d="M10 6V3" />
      <path d="M14 6V3" />
      <path d="M4 6l2-3" />
      <path d="M8 6l2-3" />
      <path d="M12 6l2-3" />
    </svg>
  );
}

export function IconAlertTriangle({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3L18 17H2L10 3z" />
      <path d="M10 9v4" />
      <circle cx="10" cy="14.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function IconXCircle({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="8" />
      <path d="M7 7l6 6M13 7l-6 6" />
    </svg>
  );
}

export function IconInfoCircle({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="8" />
      <path d="M10 9v5" />
      <circle cx="10" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function IconCheckCircle({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="8" />
      <path d="M6.5 10.5l2.5 2.5 4-5" />
    </svg>
  );
}

export function IconSprout({ className = 'w-5 h-5' }) {
  // Used for info alerts in Farmer Mode (replaces 🌱 used as alert icon)
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17V9" />
      <path d="M10 13c0-3 3-5 6-4-1 3-3 5-6 4z" />
      <path d="M10 11c0-3-3-5-6-4 1 3 3 5 6 4z" />
    </svg>
  );
}

export function IconAlertOctagon({ className = 'w-5 h-5' }) {
  // Used for error alerts (replaces ❗)
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 2.5h5l4 4v5l-4 4h-5l-4-4v-5l4-4z" />
      <path d="M10 7v4" />
      <circle cx="10" cy="13" r="0.5" fill="currentColor" />
    </svg>
  );
}
