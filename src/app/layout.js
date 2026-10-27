import { Amiri_Quran, Instrument_Sans, Noto_Nastaliq_Urdu, Noto_Sans, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

const quran = Amiri_Quran({ subsets: ["arabic", "latin"], weight: "400", variable: "--font-quran", display: "swap" });
const ui = Instrument_Sans({ subsets: ["latin"], variable: "--font-ui", display: "swap" });
const urdu = Noto_Nastaliq_Urdu({ subsets: ["arabic", "latin"], weight: "400", variable: "--font-urdu", display: "swap" });
const arabic = Noto_Sans_Arabic({ subsets: ["arabic", "latin"], weight: "400", variable: "--font-arabic", display: "swap" });
const translation = Noto_Sans({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-translation", display: "swap" });

export const metadata = { title: "Mushaf Reader", description: "Read the Quran page by page." };
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${quran.variable} ${ui.variable} ${urdu.variable} ${arabic.variable} ${translation.variable}`}>
      <body>{children}</body>
    </html>
  );
}
