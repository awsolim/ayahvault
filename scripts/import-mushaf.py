"""Import a matched Dar al-Marefa image/coordinate archive for local hosting.

Usage: python scripts/import-mushaf.py path/to/images_1280.zip
Then run scripts/mushaf-marker-bounds.py and scripts/mushaf-banner-bounds.py.
The publisher's data terms apply separately from this application's code.
"""
import json
from pathlib import Path
import sqlite3
import struct
import sys
import subprocess
import tempfile
import zipfile

root = Path(__file__).resolve().parents[1]
destination = root / 'public/mushaf/dar-al-marefa'
destination.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(sys.argv[1]) as archive, tempfile.TemporaryDirectory() as temporary:
    # The standalone coordinate download differs by 30px; use this bundled DB.
    database = Path(temporary) / 'ayahinfo.db'
    database.write_bytes(archive.read('databases/ayahinfo_1280.db'))
    connection = sqlite3.connect(database)
    ayah_pages = {}
    for page in range(1, 605):
        png = archive.read(f'width_1280/page{page:03}.png')
        width, height = struct.unpack('>II', png[16:24])
        rows = connection.execute('''select sura_number, ayah_number, line_number,
            min(min_x), min(min_y), max(max_x), max(max_y) from glyphs
            where page_number=? group by sura_number, ayah_number, line_number
            order by line_number, min(min_x) desc''', (page,)).fetchall()
        assert rows
        endings = connection.execute('''select sura_number, ayah_number, min_x, min_y, max_x, max_y from glyphs g
            where page_number=? and position=(select max(position) from glyphs e
            where e.sura_number=g.sura_number and e.ayah_number=g.ayah_number)''', (page,)).fetchall()
        for surah, ayah, line, x1, y1, x2, y2 in rows:
            assert 0 <= x1 < x2 <= width and 0 <= y1 < y2 <= height
            ayah_pages.setdefault(f'{surah}:{ayah}', page)
        (destination / f'{page}.png').write_bytes(png)
        (destination / f'{page}.json').write_text(json.dumps(
            dict(width=width, height=height, regions=rows, endings=endings), separators=(',', ':')))
    chapters = json.loads((root / 'src/assets/chapters.json').read_text(encoding='utf-8'))
    index = [[ayah_pages[f'{c["id"]}:{ayah}'] for ayah in range(1, c['verses'] + 1)] for c in chapters]
    (root / 'src/assets/mushaf-pages.json').write_text(json.dumps(index, separators=(',', ':')))
    connection.close()
print('Imported 604 pages, matched regions, and all 6,236 ayah page references.')
subprocess.run([sys.executable, str(root/'scripts/mushaf-practice-words.py'), sys.argv[1]], check=True)
