# Mushaf Reader
Next.js (App Router, JS) Quran reader with a page-by-page mushaf UI.

    npm install
    npm run dev   # http://localhost:3000  → redirects to /page/1

Data: Tanzil Uthmani text and selectable translations via api.alquran.cloud (604-page Madinah layout). Adjacent pages are prefetched, with a reader-shaped loading state for page changes. Urdu and Arabic translations use Noto Nastaliq Urdu and Noto Sans Arabic. Selected verses can play remotely hosted Quran recitation or verse-by-verse English/Urdu translation audio from AlQuran Cloud; translation audio is a separate recording and may not match the displayed text edition.
Tanzil terms: keep the text unaltered and credit tanzil.net (footer credit included).
