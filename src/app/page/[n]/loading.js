export default function LoadingPage() {
  return (
    <main className="reader loading-reader" aria-busy="true" aria-label="Loading Quran page">
      <div className="reader-options loading-options" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="stack">
        <article className="page">
          <div className="frame loading-frame">
            <div className="run"><span>Loading page…</span></div>
            <div className="loading-title" />
            <div className="loading-lines">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
