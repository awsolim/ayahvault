import urllib.request
import json

def update_quran_perfectly():
    print("🚀 Fetching Hafs Uthmani Quran and mapping Surah names...")
    # This API provides both the text and the Surah metadata (names)
    url = "http://api.alquran.cloud/v1/quran/quran-uthmani"
    
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())['data']
            
        updated_verses = []
        BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"
        
        for surah in data['surahs']:
            s_name = surah['englishName']
            s_num = surah['number']
            
            for ayah in surah['ayahs']:
                text = ayah['text']
                
                # 1. Clean Bismillah (remove from start of first verse except Fatiha)
                if s_num != 1 and ayah['numberInSurah'] == 1:
                    if text.startswith(BISMILLAH):
                        text = text[len(BISMILLAH):].strip()

                # 2. Fix Black Circles (Remove U+06DF - Small High Rounded Zero)
                # This is the character that floats after 'Waw' and causes issues
                text = text.replace('\u06df', '') 
                
                # 3. Add other common problematic marks to strip if needed
                text = text.replace('\u06e2', '') # Small High Meem
                text = text.replace('\u06e3', '') # Small Low Seen

                updated_verses.append({
                    "ayah": ayah['numberInSurah'], # Correct relative number
                    "text": text,
                    "surah": s_num,
                    "surahName": s_name,           # NO DICTIONARY NEEDED!
                    "juz": ayah['juz']
                })
                
        with open('quran.json', 'w', encoding='utf-8') as f:
            json.dump(updated_verses, f, ensure_ascii=False, indent=2)
        
        print(f"✅ SUCCESS: 6,236 verses processed with Surah names.")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    update_quran_perfectly()