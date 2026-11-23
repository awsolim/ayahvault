export function getMinshawiMurattalUrl(surah: number, ayah: number) {
  const file = String(surah).padStart(3, "0") + String(ayah).padStart(3, "0");
  return "https://everyayah.com/data/Minshawy_Murattal_128kbps/" + file + ".mp3";
}
