import { AyahSizeControl, DEFAULT_AYAH_SIZE, usePreferences } from '../preferences/Preferences';
import Seo from '../lib/Seo';
export default function Settings() {
 const { ayahSize, setAyahSize } = usePreferences();
 return <div className="settings-page"><Seo title="Settings" /><h1>Settings</h1><section className="settings-section"><h2>MemoBuddy</h2><div className="preference-row"><div><h3>Ayah text size</h3><p>Saved on this device. You can also change this below an ayah.</p></div><AyahSizeControl /></div><p className="settings-ayah-sample" dir="rtl" lang="ar" style={{ fontSize: ayahSize }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p><button type="button" className="reset-preference" disabled={ayahSize === DEFAULT_AYAH_SIZE} onClick={() => setAyahSize(DEFAULT_AYAH_SIZE)}>Reset text size</button></section></div>;
}
