"""Compute readiness from READINESS_DNA.json. Numbers are counted here, never typed by hand.

Usage: py -3 -X utf8 readiness_report.py [--check]
  --check exits 1 if any layer has an unknown status or a category is empty.
"""
import json, sys
from pathlib import Path

# Windows consoles default to cp1252; Ukrainian output must not depend on the caller.
for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding='utf-8')
    except (AttributeError, ValueError):
        pass

HERE = Path(__file__).resolve().parent
DNA = json.loads((HERE / 'READINESS_DNA.json').read_text(encoding='utf-8'))
SCORE = DNA['scoring']

def category_score(cat):
    counted = [l for l in cat['layers'] if SCORE.get(l['status']) is not None]
    if not counted:
        return 0.0, 0, 0, len(cat['layers'])
    got = sum(SCORE[l['status']] for l in counted)
    done = sum(1 for l in counted if l['status'] == 'DONE')
    return got / len(counted), done, len(counted), len(cat['layers'])

def main():
    rows, total_got, total_counted = [], 0.0, 0
    problems = []
    for cat in DNA['categories']:
        if not cat['layers']:
            problems.append(f"{cat['id']} has no layers")
        for layer in cat['layers']:
            if layer['status'] not in SCORE:
                problems.append(f"{layer['id']} unknown status {layer['status']}")
        pct, done, counted, all_layers = category_score(cat)
        blocked = [l['id'] for l in cat['layers'] if l['status'] == 'BLOCKED_HUMAN']
        nxt = next((l for l in cat['layers'] if l['status'] in ('PARTIAL', 'NOT_STARTED', 'BLOCKED_HUMAN')), None)
        rows.append((cat['id'], cat['name'], pct, done, counted, all_layers, blocked, nxt))
        total_got += pct * counted
        total_counted += counted
    overall = total_got / total_counted if total_counted else 0.0
    out = ['# Готовність за шарами — обраховано, не написано від руки', '',
           f"Джерело: `READINESS_DNA.json` ({DNA['created']}). Скрипт: `readiness_report.py`.", '',
           '| Категорія | Готовність | Шарів готово | Наступний шар | Блокує людина |', '|---|---|---|---|---|']
    for cid, name, pct, done, counted, all_layers, blocked, nxt in rows:
        bar = '█' * round(pct * 10) + '·' * (10 - round(pct * 10))
        out.append(f"| {cid} {name} | {bar} {pct*100:.0f}% | {done}/{counted}"
                   + (f" (+{all_layers - counted} парк)" if all_layers > counted else '')
                   + f" | {nxt['id'] + ' ' + nxt['name'] if nxt else '—'} | {', '.join(blocked) or '—'} |")
    out += ['', f"**Разом: {overall*100:.0f}%** ({total_counted} шарів у рахунку; парковані не рахуються).", '']
    blocked_all = [(c['id'], l['id'], l['name'], l.get('next', '')) for c in DNA['categories'] for l in c['layers'] if l['status'] == 'BLOCKED_HUMAN']
    if blocked_all:
        out += ['## Чекає рішення Андрія', '']
        out += [f"- `{lid}` {name} — {nxt}" for _, lid, name, nxt in blocked_all] + ['']
    partial = [(l['id'], l['name'], l.get('next', '')) for c in DNA['categories'] for l in c['layers'] if l['status'] == 'PARTIAL']
    if partial:
        out += ['## Напівзроблене (найдешевше довести до кінця)', '']
        out += [f"- `{lid}` {name} — {nxt}" for lid, name, nxt in partial] + ['']
    (HERE / 'READINESS_SCORE.md').write_text('\n'.join(out), encoding='utf-8')
    print('\n'.join(out))
    if problems:
        print('PROBLEMS:', *problems, sep='\n  ')
    if '--check' in sys.argv and problems:
        return 1
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
