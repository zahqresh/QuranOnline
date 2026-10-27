import { notFound } from "next/navigation";
import Reader from "@/components/Reader";
import { getPage, getSurahs, RECITERS, TOTAL_PAGES, TRANSLATIONS, TRANSLATION_AUDIO } from "@/lib/quran";

export default async function PageRoute({ params, searchParams }) {
  const { n } = await params;
  const { translation: requestedTranslation } = await searchParams;
  const page = Number(n);
  if (!Number.isInteger(page) || page < 1 || page > TOTAL_PAGES) notFound();
  const translation = TRANSLATIONS.some((edition) => edition.id === requestedTranslation)
    ? requestedTranslation
    : "en.sahih";
  const [ayahs, surahs] = await Promise.all([getPage(page, translation), getSurahs()]);
  return (
    <Reader
      page={page}
      total={TOTAL_PAGES}
      ayahs={ayahs}
      surahs={surahs}
      translations={TRANSLATIONS}
      reciters={RECITERS}
      translationAudio={TRANSLATION_AUDIO}
      translation={translation}
    />
  );
}
