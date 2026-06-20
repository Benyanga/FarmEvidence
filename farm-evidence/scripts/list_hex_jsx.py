from pathlib import Path
import re
pattern = re.compile(r'#[0-9A-Fa-f]{6}')
colors = {}
root = Path('src')
for p in root.rglob('*.*'):
    if p.suffix.lower() not in {'.js', '.jsx'}:
        continue
    if 'node_modules' in p.parts:
        continue
    text = p.read_text(encoding='utf-8', errors='ignore')
    for m in pattern.findall(text):
        colors.setdefault(m, set()).add(str(p))
for c in sorted(colors):
    print(c, len(colors[c]))
