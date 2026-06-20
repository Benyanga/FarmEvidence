import React from 'react';

// Renders a value but shows an em-dash for null/undefined/NaN/0.
// Adds `fe-empty` class and `data-empty` attribute so CSS will show the muted dash.
export default function ValueDisplay({ value, children, className = '', title, formatter }) {
  const isMissing = value == null || (typeof value === 'number' && Number.isNaN(value)) || Number(value) === 0;
  const display = isMissing ? (children || '') : (formatter ? formatter(value) : String(value));
  return (
    <span className={`${className} fe-empty`} data-empty={isMissing} title={title}>{display}</span>
  );
}
