import { getSurahStartPage } from "@/lib/quran";

export async function GET(_request, { params }) {
  const { n } = await params;
  const number = Number(n);
  if (!Number.isInteger(number) || number < 1 || number > 114) {
    return Response.json({ error: "Invalid surah number" }, { status: 400 });
  }
  const page = await getSurahStartPage(number);
  return Response.json({ page });
}
