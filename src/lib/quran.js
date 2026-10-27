export const TOTAL_PAGES = 604;
const BASE = "https://api.alquran.cloud/v1";
const REVALIDATE = 60 * 60 * 24 * 30;

export const TRANSLATIONS = [
  { id: "en.sahih", name: "Saheeh International", language: "en" },
  { id: "en.pickthall", name: "Pickthall", language: "en" },
  { id: "en.yusufali", name: "Yusuf Ali", language: "en" },
  { id: "en.hilali", name: "Hilali & Khan", language: "en" },
  { id: "ur.jalandhry", name: "Urdu · Jalandhry", language: "ur" },
];

export const RECITERS = [
  { id: "ar.alafasy", name: "Mishary Alafasy", bitrate: 128 },
  { id: "ar.abdulbasitmurattal", name: "Abdul Basit", bitrate: 192 },
  { id: "ar.abdurrahmaansudais", name: "Abdurrahmaan As-Sudais", bitrate: 192 },
  { id: "ar.husary", name: "Mahmoud Khalil Al-Husary", bitrate: 128 },
  { id: "ar.shaatree", name: "Abu Bakr Ash-Shaatree", bitrate: 128 },
];

export const TRANSLATION_AUDIO = [
  { id: "en.walk", name: "Ibrahim Walk · English", language: "en" },
  { id: "ur.khan", name: "Shamshad Ali Khan · Urdu", language: "ur" },
];

async function fetchEdition(page, edition) {
  const res = await fetch(`${BASE}/page/${page}/${edition}`, { next: { revalidate: REVALIDATE } });
  if (!res.ok) throw new Error(`Quran API error ${res.status} for page ${page} (${edition})`);
  const json = await res.json();
  return json.data.ayahs;
}

export async function getSurahs() {
  const res = await fetch(`${BASE}/surah`, { next: { revalidate: REVALIDATE } });
  if (!res.ok) throw new Error(`Quran API error ${res.status} while loading surahs`);
  const json = await res.json();
  return json.data.map((surah) => ({
    number: surah.number,
    name: surah.name,
    english: surah.englishName,
  }));
}

export async function getSurahStartPage(number) {
  const res = await fetch(`${BASE}/surah/${number}/quran-uthmani`, { next: { revalidate: REVALIDATE } });
  if (!res.ok) throw new Error(`Quran API error ${res.status} for surah ${number}`);
  const json = await res.json();
  return json.data.ayahs[0].page;
}

export async function getPage(n, translation = "en.sahih") {
  const [ar, en] = await Promise.all([
    fetchEdition(n, "quran-uthmani"),
    fetchEdition(n, translation),
  ]);
  const translationsByAyah = new Map(en.map((ayah) => [ayah.number, ayah.text]));
  return ar.map((a) => ({
    id: a.number,
    num: a.numberInSurah,
    text: a.text,
    tr: translationsByAyah.get(a.number) ?? "",
    juz: a.juz,
    surah: {
      number: a.surah.number,
      name: a.surah.name,
      english: a.surah.englishName,
      count: a.surah.numberOfAyahs,
      type: a.surah.revelationType,
    },
  }));
}