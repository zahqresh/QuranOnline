# Mushaf Reader
Next.js (App Router, JS) Quran reader with a page-by-page mushaf UI.

    npm install
    npm run dev   # http://localhost:3000  → redirects to /page/1

Data: Tanzil Uthmani text and selectable translations via api.alquran.cloud (604-page Madinah layout). Adjacent pages are prefetched, with a reader-shaped loading state for page changes. Urdu and Arabic translations use Noto Nastaliq Urdu and Noto Sans Arabic; selected verses can be read with browser text-to-speech or played as recitation audio from AlQuran Cloud.
Tanzil terms: keep the text unaltered and credit tanzil.net (footer credit included).
