"""Add native glyph bounds for conservative partial-word practice masking.
Usage: python scripts/mushaf-practice-words.py path/to/images_1280.zip
Never assumes a prefix alignment when the printed token count differs.
"""
import json
import pathlib
import re
import sqlite3
import sys
import tempfile
import unicodedata
import zipfile

root=pathlib.Path(__file__).resolve().parents[1]
verses=json.loads((root/'src/assets/quran.json').read_text(encoding='utf-8'))
with zipfile.ZipFile(sys.argv[1]) as archive, tempfile.TemporaryDirectory() as temporary:
    path=pathlib.Path(temporary)/'positions.db'
    path.write_bytes(archive.read('databases/ayahinfo_1280.db'))
    connection=sqlite3.connect(path)
    counts={(s,a):(n,count) for s,a,n,count in connection.execute('select sura_number,ayah_number,max(position),count(distinct position) from glyphs group by sura_number,ayah_number')}
    mapping={}; unsupported=[]
    for verse in verses:
        s,a,text=verse['surah'],verse['ayah'],verse['text']
        tokens=re.split(r'\s+|[\u06d6-\u06de\u06e9]',text)
        words=[word for word in tokens if any(unicodedata.category(char).startswith('L') for char in word)]
        leading_rub=int(text.lstrip().startswith('\u06de'))
        trailing_sajda=text.count('\u06e9')
        maximum,position_count=counts[(s,a)]
        supported=maximum==position_count and maximum==len(words)+leading_rub+trailing_sajda+1
        mapping[(s,a)]=(len(words),leading_rub,supported)
        if not supported: unsupported.append(f'{s}:{a}')
    for page in range(1,605):
        path=root/f'public/mushaf/dar-al-marefa/{page}.json'
        data=json.loads(path.read_text())
        rows=connection.execute('select sura_number,ayah_number,position,line_number,min_x,min_y,max_x,max_y from glyphs where page_number=? order by glyph_id',(page,)).fetchall()
        glyphs=[]
        for s,a,position,line,x1,y1,x2,y2 in rows:
            word_count,rub,supported=mapping[(s,a)]
            word=position-rub if supported and 1<=position-rub<=word_count else 0
            glyphs.append([s,a,word,line,x1,y1,x2,y2])
        data['glyphs']=glyphs
        path.write_text(json.dumps(data,separators=(',',':')))
    (root/'src/assets/mushaf-partial-unsupported.json').write_text(json.dumps(unsupported,separators=(',',':')))
    connection.close()
print(f'Added word masks. {6236-len(unsupported)} matched ayahs; {len(unsupported)} use an explicitly revealed prompt instead of guessing word boundaries.')
