"""Convert the bundled public-domain MIDI to dependency-free browser note data.

Run from the project root: python3 scripts/build_score.py
Times are quarter-note beats, not guessed recording timestamps.
"""
import struct
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
raw = (ROOT / 'assets/Symphony5_1.mid').read_bytes()
assert raw[:4] == b'MThd'
fmt, count, ppq = struct.unpack('>HHH', raw[8:14])
pos = 8 + int.from_bytes(raw[4:8], 'big')
tracks, metadata = [], []

for ti in range(count):
    assert raw[pos:pos+4] == b'MTrk'
    size = int.from_bytes(raw[pos+4:pos+8], 'big')
    data = raw[pos+8:pos+8+size]
    pos += 8 + size
    i, tick, running, name = 0, 0, None, ''
    active, notes, programs = {}, [], {}

    def vlq():
        global i
        value = 0
        while True:
            b = data[i]
            i += 1
            value = (value << 7) | (b & 127)
            if not b & 128:
                return value

    while i < len(data):
        tick += vlq()
        status = data[i]
        if status & 128:
            i += 1
            if status < 240:
                running = status
        else:
            status = running
        if status == 255:
            kind = data[i]
            i += 1
            n = vlq()
            value = data[i:i+n]
            i += n
            if kind == 3:
                name = value.decode('utf-8', errors='replace')
            if kind in (81, 88, 89):
                metadata.append([ti, tick/ppq, kind, list(value)])
        elif status in (240, 247):
            i += vlq()
        else:
            op, ch = status >> 4, status & 15
            a = data[i]
            i += 1
            b = None
            if op not in (12, 13):
                b = data[i]
                i += 1
            if op == 12:
                programs[ch] = a
            elif op == 9 and b:
                active.setdefault((ch, a), []).append((tick, b))
            elif op == 8 or (op == 9 and b == 0):
                queue = active.get((ch, a), [])
                if queue:
                    start, vel = queue.pop(0)
                    notes.append([round(start/ppq, 6), round((tick-start)/ppq, 6), a, vel])
    assert not any(active.values()), f'Unclosed notes in track {ti}'
    if notes:
        tracks.append({'name': name, 'programs': programs, 'notes': sorted(notes)})

score = {'source': 'Mutopia-2017/11/05-941', 'ppq': ppq,
         'metadata': metadata, 'tracks': tracks,
         'endBeat': max(n[0]+n[1] for t in tracks for n in t['notes'])}
(ROOT / 'score-data.js').write_text('window.SCORE = '+json.dumps(score, separators=(',', ':'))+';\n')
print(json.dumps({'format': fmt, 'ppq': ppq, 'metadata': metadata, 'endBeat': score['endBeat'],
 'tracks': [{**{k:v for k,v in t.items() if k != 'notes'}, 'count':len(t['notes']), 'first':t['notes'][:6]} for t in tracks]}, indent=2))
