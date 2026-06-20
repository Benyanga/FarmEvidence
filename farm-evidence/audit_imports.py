import os
import pathlib
import re
from collections import defaultdict

root = pathlib.Path(__file__).resolve().parent
server_root = root / 'server'
src_root = root / 'src'
root_dirs = [('server', server_root), ('src', src_root)]

exts = ['.js', '.jsx', '.ts', '.tsx', '.json']
index_exts = ['/index.js', '/index.jsx', '/index.ts', '/index.tsx']

files = []
for name, base in root_dirs:
    if base.exists():
        for path in sorted(base.rglob('*')):
            if path.is_file():
                files.append(path)

file_set = {path.resolve(): path for path in files}
file_rel = {path.resolve(): path.relative_to(root) for path in files}

import_pattern = re.compile(r"(?:import\s+(?:[^'\"]+from\s+)?|require\()(['\"])(\.\.?/[^'\"]+)\1")

imports = {}
reverse_imports = defaultdict(set)
missing_targets = []

for path in files:
    text = path.read_text(encoding='utf-8', errors='ignore')
    deps = []
    for match in import_pattern.finditer(text):
        dep = match.group(2)
        deps.append(dep)
        dep_path = (path.parent / dep)
        resolved = None
        if dep_path.exists() and dep_path.is_file():
            resolved = dep_path.resolve()
        else:
            for ext in exts:
                candidate = dep_path.with_suffix(ext)
                if candidate.exists():
                    resolved = candidate.resolve()
                    break
            if not resolved:
                for idx in index_exts:
                    candidate = path.parent / (dep + idx)
                    if candidate.exists():
                        resolved = candidate.resolve()
                        break
        if resolved:
            reverse_imports[resolved].add(path.resolve())
        else:
            missing_targets.append((file_rel[path.resolve()], dep))
    imports[file_rel[path.resolve()]] = deps

# compute dead files: existing files not imported by any other file in server/src (excluding root entry points maybe)
dead_files = []
for path in files:
    if path.resolve() not in reverse_imports and path.name not in ('App.jsx', 'main.jsx', 'server.js', 'index.js', 'TrialContext.jsx'):
        dead_files.append(file_rel[path.resolve()])

print('=== FILES ===')
for name, base in root_dirs:
    print(f'\n{name.upper()} FILES:')
    if not base.exists():
        print('  <missing>')
        continue
    for path in sorted(base.rglob('*')):
        if path.is_file():
            size = path.stat().st_size
            empty = 'EMPTY' if size == 0 else 'NONEMPTY'
            print(f'{path.relative_to(root)}\t{size}\t{empty}')

print('\n=== MISSING IMPORT TARGETS ===')
if not missing_targets:
    print('None')
else:
    for src, dep in missing_targets:
        print(f'{src} -> {dep}')

print('\n=== DEAD FILES (no incoming relative imports) ===')
for f in sorted(dead_files):
    print(f)

print('\n=== IMPORT DEPENDENCY SUMMARY ===')
print(f'total files scanned: {len(files)}')
print(f'total imports found: {sum(len(deps) for deps in imports.values())}')
print(f'missing import targets: {len(missing_targets)}')
print(f'dead candidate files: {len(dead_files)}')
