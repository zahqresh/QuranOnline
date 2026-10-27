"use client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const BISMILLAH_WORDS = 4;

// Group ayahs into blocks: surah headers, bismillah lines, and runs of verses.
function buildBlocks(ayahs) {
  const blocks = [];
  let run = null;
  for (const a of ayahs) {
    let text = a.text;
    if (a.num === 1) {
      blocks.push({ type: "header", surah: a.surah });
      if (a.surah.number !== 1 && a.surah.number !== 9) {
        const words = text.split(" ");
        blocks.push({ type: "bismillah", text: words.slice(0, BISMILLAH_WORDS).join(" ") });
        text = words.slice(BISMILLAH_WORDS).join(" ");
      }
      run = null;
    }
    if (!run) { run = { type: "verses", items: [] }; blocks.push(run); }
    run.items.push({ ...a, text });
  }
  return blocks;
}

export default function Reader({ page, total, ayahs, surahs, translations, translation, reciters }) {
  const router = useRouter();
  const readerRef = useRef(null);
  const audioRef = useRef(null);
  const [flow, setFlow] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [fs, setFs] = useState(1.6);
  const [bm, setBm] = useState(() => new Set());
  const [cur, setCur] = useState(null);
  const [immersive, setImmersive] = useState(false);
  const [surahLoading, setSurahLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [voices, setVoices] = useState([]);
  const [voiceChoice, setVoiceChoice] = useState("");
  const [reciter, setReciter] = useState("ar.alafasy");
  const [audioPlaying, setAudioPlaying] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [isNavigating, startTransition] = useTransition();
  const blocks = buildBlocks(ayahs);
  const first = ayahs[0];
  const translationLanguage = translations.find((edition) => edition.id === translation)?.language || "en";
  const isUrdu = translationLanguage === "ur";

  const pageUrl = useCallback((p, edition = translation) => {
    const query = edition === "en.sahih" ? "" : `?translation=${encodeURIComponent(edition)}`;
    return `/page/${p}${query}`;
  }, [translation]);
  const prefetchPage = useCallback((p) => {
    if (p >= 1 && p <= total) router.prefetch(pageUrl(p));
  }, [pageUrl, router, total]);

  useEffect(() => {
    try {
      setBm(new Set(JSON.parse(localStorage.getItem("bm") || "[]")));
      const t = localStorage.getItem("theme");
      if (t) document.documentElement.dataset.theme = t;
      const f = Number(localStorage.getItem("fs"));
      if (f) setFs(f);
    } catch {}
  }, []);

  const go = useCallback((p) => {
    if (p >= 1 && p <= total) {
      audioRef.current?.pause();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      setAudioPlaying(null);
      setSpeaking(false);
      setCur(null);
      startTransition(() => router.push(pageUrl(p)));
    }
  }, [pageUrl, router, startTransition, total]);
  useEffect(() => {
    prefetchPage(page + 1);
    prefetchPage(page - 1);
  }, [page, prefetchPage]);

  useEffect(() => {
    const onFullscreenChange = () => setImmersive(document.fullscreenElement === readerRef.current);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    audioRef.current?.pause();
    setAudioPlaying(null);
    setCur(null);
    setSpeaking(false);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, [page, translation]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const updateVoices = () => setVoices(window.speechSynthesis.getVoices());
    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
  }, []);

  useEffect(() => () => {
    audioRef.current?.pause();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") go(page + 1); // right-to-left: left means forward
      if (e.key === "ArrowRight") go(page - 1);
      if (e.key === "Escape") {
        audioRef.current?.pause();
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        setAudioPlaying(null);
        setSpeaking(false);
        setCur(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, page]);

  const toggleBm = (id) => {
    const next = new Set(bm);
    next.has(id) ? next.delete(id) : next.add(id);
    setBm(next);
    try { localStorage.setItem("bm", JSON.stringify([...next])); } catch {}
  };
  const size = (d) => {
    const v = Math.min(2.2, Math.max(1.2, fs + d));
    setFs(v);
    try { localStorage.setItem("fs", v); } catch {}
  };
  const theme = () => {
    const el = document.documentElement;
    const dark = el.dataset.theme ? el.dataset.theme === "dark" : matchMedia("(prefers-color-scheme:dark)").matches;
    el.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", el.dataset.theme); } catch {}
  };
  const changeSurah = async (event) => {
    const number = event.target.value;
    if (!number) return;
    setSurahLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/surah/${number}`);
      if (!response.ok) throw new Error(`Could not load surah (HTTP ${response.status})`);
      const data = await response.json();
      startTransition(() => router.push(pageUrl(data.page)));
    } catch (error) {
      setMessage(error.message || "Could not open that surah.");
    } finally {
      setSurahLoading(false);
    }
  };
  const toggleImmersive = async () => {
    setMessage("");
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (readerRef.current?.requestFullscreen) {
        await readerRef.current.requestFullscreen();
      } else {
        setMessage("Full-screen mode is not available in this browser.");
      }
    } catch (error) {
      setMessage(error.message || "Could not change full-screen mode.");
    }
  };
  const playRecitation = async (ayah) => {
    setMessage("");
    audioRef.current?.pause();
    const selectedReciter = reciters.find((item) => item.id === reciter);
    if (!selectedReciter) {
      setMessage("Please select a supported reciter.");
      return;
    }
    const audio = new Audio(
      `https://cdn.islamic.network/quran/audio/${selectedReciter.bitrate}/${reciter}/${ayah.id}.mp3`,
    );
    audioRef.current = audio;
    audio.onended = () => setAudioPlaying(null);
    audio.onerror = () => {
      setAudioPlaying(null);
      setMessage("Could not load this recitation. Please try another reciter.");
    };
    try {
      await audio.play();
      setAudioPlaying(ayah.id);
    } catch (error) {
      setAudioPlaying(null);
      setMessage(error.message || "Could not play recitation.");
    }
  };
  const stopRecitation = () => {
    audioRef.current?.pause();
    setAudioPlaying(null);
  };
  const readTranslation = (ayah) => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setMessage("Translation read-aloud is not supported by this browser.");
      return;
    }
    if (!ayah.tr) {
      setMessage("There is no translation available for this verse.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(ayah.tr);
    const voice = voices.find((item) => item.voiceURI === voiceChoice);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || (isUrdu ? "ur-PK" : "en-US");
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => {
      setSpeaking(false);
      setMessage("Could not read the translation aloud.");
    };
    setMessage("");
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };
  const stopTranslation = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  };
  const selectAyah = (ayah) => {
    audioRef.current?.pause();
    setAudioPlaying(null);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
    setCur(ayah);
  };
  const closeVerse = () => {
    stopRecitation();
    stopTranslation();
    setCur(null);
  };
  const copy = async (a) => {
    try {
      await navigator.clipboard.writeText(`${a.text}\n${a.tr}\n(${a.surah.english} ${a.surah.number}:${a.num})`);
      setMessage("Verse copied.");
    } catch {
      setMessage("Could not copy the verse. Check clipboard permissions.");
    }
  };

  return (
    <main
      ref={readerRef}
      className={`reader${flow ? " flow" : ""}`}
      style={{ "--fs": `${fs}rem` }}
      aria-busy={isNavigating}
    >
      <div className="reader-options" aria-label="Reader options">
        <label>
          <span>Surah</span>
          <select value={first.surah.number} onChange={changeSurah} disabled={surahLoading}>
            {surahs.map((surah) => (
              <option key={surah.number} value={surah.number}>{surah.number}. {surah.english}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Translation</span>
          <select
            value={translation}
            onChange={(event) => router.push(pageUrl(page, event.target.value))}
          >
            {translations.map((edition) => (
              <option key={edition.id} value={edition.id}>{edition.name}</option>
            ))}
          </select>
        </label>
        <button
          className="seg"
          aria-pressed={showTranslation}
          onClick={() => setShowTranslation(!showTranslation)}
        >
          {showTranslation ? "Hide translation" : "Show translation"}
        </button>
      </div>
      {isNavigating && <p className="navigation-status" role="status">Loading page…</p>}
      {message && <p className="reader-message" role="status">{message}</p>}
      <div className="stack">
        <article className="page">
          <div className="frame">
            <div className="run">
              <span>Juz {first.juz}</span>
              <span>{first.surah.english}</span>
            </div>

            {blocks.map((b, i) => {
              if (b.type === "header")
                return (
                  <div className="cart" key={i}>
                    <h1 lang="ar" dir="rtl">{b.surah.name}</h1>
                    <p>{b.surah.english} · {b.surah.count} verses · {b.surah.type}</p>
                  </div>
                );
              if (b.type === "bismillah")
                return <p className="open" lang="ar" dir="rtl" key={i}>{b.text}</p>;
              return (
                <p className="text" lang="ar" dir="rtl" key={i}>
                  {b.items.map((a) => (
                    <span
                      key={a.id}
                      className={`ay${bm.has(a.id) ? " bm" : ""}${cur?.id === a.id ? " on" : ""}${showTranslation ? " has-tr" : ""}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectAyah(a)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectAyah(a); } }}
                    >
                      {a.text} <span className="m" aria-label={`Verse ${a.num}`}>{a.num}</span>{" "}
                      {showTranslation && (
                        <span className={`tr${isUrdu ? " urdu" : ""}`} dir={isUrdu ? "rtl" : "ltr"} lang={translationLanguage}>
                          {a.tr}
                        </span>
                      )}
                    </span>
                  ))}
                </p>
              );
            })}

            <div className="foot"><b>{page}</b></div>
          </div>
        </article>
      </div>

      <p className="credit">
        Text: <a href="https://tanzil.net" target="_blank" rel="noreferrer">Tanzil Project</a> (CC BY 3.0) · Translation: {translations.find((edition) => edition.id === translation)?.name} · Recitation audio: <a href="https://alquran.cloud" target="_blank" rel="noreferrer">AlQuran Cloud</a>
      </p>

      <div className="bar" role="toolbar" aria-label="Reader controls">
        <button
          onClick={() => go(page - 1)}
          onPointerEnter={() => prefetchPage(page - 1)}
          onFocus={() => prefetchPage(page - 1)}
          onPointerDown={() => prefetchPage(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >‹ Prev</button>
        <span className="pos">{page} / {total}</span>
        <button
          onClick={() => go(page + 1)}
          onPointerEnter={() => prefetchPage(page + 1)}
          onFocus={() => prefetchPage(page + 1)}
          onPointerDown={() => prefetchPage(page + 1)}
          disabled={page === total}
          aria-label="Next page"
        >Next ›</button>
        <span className="sep" />
        <button className="seg" aria-pressed={flow} onClick={() => setFlow(!flow)}>{flow ? "Page" : "Flow"}</button>
        <button onClick={() => size(-0.1)} aria-label="Smaller text">A−</button>
        <button onClick={() => size(0.1)} aria-label="Larger text">A+</button>
        <button onClick={theme} aria-label="Toggle theme">◐</button>
        <button onClick={toggleImmersive} aria-pressed={immersive}>
          {immersive ? "Exit full screen" : "Full screen"}
        </button>
      </div>

      <section className={`sheet${cur ? " open" : ""}`} aria-live="polite">
        {cur && (
          <>
            <h2>{cur.surah.english} · Verse {cur.num}</h2>
            <blockquote lang="ar" dir="rtl">{cur.text}</blockquote>
            <small className={isUrdu ? "urdu" : ""} dir={isUrdu ? "rtl" : "ltr"} lang={translationLanguage}>{cur.tr}</small>
            <div className="verse-audio">
              <label>
                <span>Reciter</span>
                <select value={reciter} onChange={(event) => setReciter(event.target.value)}>
                  {reciters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label>
                <span>Translation voice</span>
                <select value={voiceChoice} onChange={(event) => setVoiceChoice(event.target.value)}>
                  <option value="">Browser default</option>
                  {voices
                    .filter((voice) => voice.lang.toLowerCase().startsWith(isUrdu ? "ur" : "en"))
                    .map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} · {voice.lang}
                      </option>
                    ))}
                </select>
              </label>
              <div className="acts">
                <button onClick={() => audioPlaying === cur.id ? stopRecitation() : playRecitation(cur)}>
                  {audioPlaying === cur.id ? "Stop recitation" : "▶ Play recitation"}
                </button>
                <button onClick={() => speaking ? stopTranslation() : readTranslation(cur)}>
                  {speaking ? "Stop reading" : "🔊 Read translation"}
                </button>
              </div>
            </div>
            <div className="acts">
              <button onClick={() => toggleBm(cur.id)}>{bm.has(cur.id) ? "★ Bookmarked" : "☆ Bookmark"}</button>
              <button onClick={() => copy(cur)}>Copy</button>
              <button onClick={closeVerse}>Close</button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
