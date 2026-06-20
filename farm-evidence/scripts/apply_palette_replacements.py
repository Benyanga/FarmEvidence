from pathlib import Path
import re

mapping = {
    '#6B7280': 'var(--fe-grey-500)',
    '#111827': 'var(--fe-grey-900)',
    '#991B1B': 'var(--fe-profit-neg)',
    '#92400E': 'var(--fe-amber-700)',
    '#9CA3AF': 'var(--fe-grey-400)',
    '#E2E8F0': 'var(--fe-grey-200)',
    '#FFFFFF': 'var(--fe-white)',
    '#ffffff': 'var(--fe-white)',
    '#F8FAFC': 'var(--fe-grey-050)',
    '#FEF3C7': 'var(--fe-amber-100)',
    '#F0FDF4': 'var(--fe-green-100)',
    '#22C55E': 'var(--fe-green-500)',
    '#F59E0B': 'var(--fe-amber-400)',
    '#E5E7EB': 'var(--fe-grey-200)',
    '#A8CDE8': 'var(--fe-white)',
    '#FAEEDA': 'var(--fe-cf-bg)',
    '#185FA5': 'var(--fe-ca-text)',
    '#4E2600': 'var(--fe-cf-text)',
    '#FEEBC8': 'var(--fe-amber-100)',
    '#FEF2F2': 'var(--fe-error-bg)',
    '#F3F4F6': 'var(--fe-grey-100)',
    '#0C447C': 'var(--fe-teal-900)',
    '#EF4444': 'var(--fe-critical)',
    '#94A3B8': 'var(--fe-grey-400)',
    '#F1F5F9': 'var(--fe-grey-100)',
    '#D1D5DB': 'var(--fe-grey-300)',
    '#1E2D40': 'var(--fe-teal-900)',
    '#E6F1FB': 'var(--fe-ca-bg)',
    '#EFF4FA': 'var(--fe-ca-bg)',
    '#FEE2E2': 'var(--fe-error-bg)',
    '#0F172A': 'var(--fe-grey-900)',
    '#0369A1': 'var(--fe-ca-border)',
    '#0C4A6E': 'var(--fe-teal-900)',
    '#0F766E': 'var(--fe-teal-700)',
    '#1565C0': 'var(--fe-ca-border)',
    '#15803D': 'var(--fe-green-900)',
    '#166534': 'var(--fe-green-900)',
    '#1A3A4A': 'var(--fe-teal-900)',
    '#1A5C2A': 'var(--fe-green-800)',
    '#1f2937': 'var(--fe-grey-900)',
    '#27500A': 'var(--fe-green-900)',
    '#2E7D32': 'var(--fe-profit-pos)',
    '#374151': 'var(--fe-grey-700)',
    '#375B2C': 'var(--fe-green-900)',
    '#3B6D11': 'var(--fe-green-900)',
    '#3C3489': 'var(--fe-t3-border)',
    '#5B21B6': 'var(--fe-t3-text)',
    '#633806': 'var(--fe-cf-border)',
    '#64748B': 'var(--fe-grey-500)',
    '#6A8E40': 'var(--fe-green-700)',
    '#6B4F1A': 'var(--fe-cf-border)',
    '#7BB8D4': 'var(--fe-ca-bg)',
    '#7DA053': 'var(--fe-green-700)',
    '#86EFAC': 'var(--fe-green-100)',
    '#A32D2D': 'var(--fe-profit-neg)',
    '#A97E2E': 'var(--fe-amber-700)',
    '#B5D4F4': 'var(--fe-ca-bg)',
    '#B91C1C': 'var(--fe-critical)',
    '#BBF7D0': 'var(--fe-green-100)',
    '#C0DD97': 'var(--fe-green-100)',
    '#CBD5E1': 'var(--fe-grey-300)',
    '#CECBF6': 'var(--fe-t3-bg)',
    '#D2A33A': 'var(--fe-amber-700)',
    '#D6E2D2': 'var(--fe-ca-bg)',
    '#D8B4FE': 'var(--fe-t3-bg)',
    '#D97706': 'var(--fe-amber-700)',
    '#DC2626': 'var(--fe-critical)',
    '#DCFCE7': 'var(--fe-green-100)',
    '#E0F2FE': 'var(--fe-ca-bg)',
    '#E4EFF8': 'var(--fe-ca-bg)',
    '#EAF3DE': 'var(--fe-green-050)',
    '#EEEDFE': 'var(--fe-t3-bg)',
    '#EEF4EE': 'var(--fe-green-050)',
    '#F0F9FF': 'var(--fe-ca-bg)',
    '#F5F4FF': 'var(--fe-t3-bg)',
    '#F8F9FA': 'var(--fe-grey-050)',
    '#F9FAFB': 'var(--fe-grey-050)',
    '#F0A500': 'var(--fe-amber-700)',
    '#D1FAE5': 'var(--fe-green-100)',
    '#FDE68A': 'var(--fe-amber-100)',
    '#FECACA': 'var(--fe-error-bg)',
    '#2563EB': 'var(--fe-link)',
    '#ECFDF5': 'var(--fe-green-100)',
    '#4B5563': 'var(--fe-grey-700)',
    '#BA7517': 'var(--fe-amber-700)',
    '#FFF1F1': 'var(--fe-error-bg)',
    '#FFF9C4': 'var(--fe-warning-100)',
    '#FFFBEB': 'var(--fe-warning-50)',
    '#FFFDF5': 'var(--fe-warning-50)',
    '#FFFFFF': 'var(--fe-white)',
    '#fff': 'var(--fe-white)',
    '#FFF': 'var(--fe-white)',
    'rgba(240,165,0,0.15)': 'var(--fe-amber-100-15)',
    'rgba(240,165,0,0.35)': 'var(--fe-amber-400-35)',
    'rgba(30,45,64,0.12)': 'var(--fe-teal-900-12)',
    'rgba(30,45,64,0.25)': 'var(--fe-teal-900-25)',
    'rgba(30,45,64,0.10)': 'var(--fe-teal-900-10)',
    '#EFF4FA': 'var(--fe-ca-bg)',
    'rgba(0,0,0,.04)': 'var(--fe-black-04)',
    'rgba(0,0,0,0.04)': 'var(--fe-black-04)',
    'rgba(255,111,0,0.14)': 'var(--fe-amber-500-14)',
    'rgba(67,160,71,0.15)': 'var(--fe-green-500-15)',
    'rgba(18,28,40,0.10)': 'var(--fe-black-10)',
    'rgba(255,255,255,0.24)': 'var(--fe-white-24)',
    'rgba(226,232,240,0.85)': 'var(--fe-grey-200-85)',
    'rgba(255,255,255,0.07)': 'var(--fe-white-07)',
    'rgba(255,255,255,0.62)': 'var(--fe-white-62)',
    'rgba(255,111,0,0.22)': 'var(--fe-amber-500-22)',
    'rgba(34,197,94,0.3)': 'var(--fe-green-500-30)',
    '#A8CDE8': 'var(--fe-ca-soft)',
    '#F4F7F3': 'var(--fe-surface-100)',
    '#115E59': 'var(--fe-teal-700)',
    '#27500A': 'var(--fe-green-900)',
    '#ECFDF3': 'var(--fe-green-050)',
    'rgba(67,160,71,0.14)': 'var(--fe-green-500-14)',
    'rgba(67,160,71,0.22)': 'var(--fe-green-500-22)',
    'rgba(30,45,64,0.06)': 'var(--fe-teal-900-06)',
    'rgba(226,232,240,0.95)': 'var(--fe-grey-200-95)',
    'rgba(30,45,64,0.6)': 'var(--fe-teal-900-60)',
    '#FFEBEE': 'var(--fe-error-bg)',
    '#B06A00': 'var(--fe-amber-700)',
    '#FCD34D': 'var(--fe-amber-500)',
    '#A8CDE8': 'var(--fe-white)',
    '#EFF4FA': 'var(--fe-ca-bg)',
    '#E4EFF8': 'var(--fe-ca-bg)',
    '#FAC775': 'var(--fe-amber-100)',
    '#FFF1F1': 'var(--fe-error-bg)',
    '#FFF9C4': 'var(--fe-warning-100)',
    '#FFFBEB': 'var(--fe-warning-50)',
    '#FFFDF5': 'var(--fe-warning-50)',
    '#cbaAcc': 'var(--fe-graph-blue)',
    '#d4edda': 'var(--fe-green-100)',
    '#f8d7da': 'var(--fe-error-bg)',
    '#fff3cd': 'var(--fe-amber-100)',
}
shadow_mapping = {
    '0 1px 4px rgba(0,0,0,0.06)': 'var(--fe-shadow-surface)',
    '0 1px 4px rgba(0, 0, 0, 0.06)': 'var(--fe-shadow-surface)',
    '0 1px 4px rgba(0,0,0,.06)': 'var(--fe-shadow-surface)',
    '0 1px 3px rgba(0,0,0,.05)': 'var(--fe-shadow-xs)',
    '0 1px 3px rgba(0,0,0,0.05)': 'var(--fe-shadow-xs)',
}

root_files = {Path('src/index.css'), Path('src/pages/screens/dashboard.css')}

files = [p for ext in ('*.js', '*.jsx', '*.css') for p in Path('src').rglob(ext)]
modified = 0
for path in files:
    text = path.read_text(encoding='utf-8')
    orig = text
    target = text
    if path.name == 'index.css':
        root_end = target.find('}\n\n')
        if root_end != -1:
            root_end += 3
            prefix = target[:root_end]
            body = target[root_end:]
        else:
            prefix = ''
            body = target
        for k, v in mapping.items():
            pattern = re.compile(re.escape(k), re.IGNORECASE)
            body = pattern.sub(v, body)
        for k, v in shadow_mapping.items():
            pattern = re.compile(re.escape(k), re.IGNORECASE)
            body = pattern.sub(v, body)
        text = prefix + body
    else:
        for k, v in mapping.items():
            pattern = re.compile(re.escape(k), re.IGNORECASE)
            target = pattern.sub(v, target)
        for k, v in shadow_mapping.items():
            pattern = re.compile(re.escape(k), re.IGNORECASE)
            target = pattern.sub(v, target)
        text = target
    if text != orig:
        path.write_text(text, encoding='utf-8')
        modified += 1
print(f'Processed {len(files)} JS/JSX/CSS files, modified {modified}')
