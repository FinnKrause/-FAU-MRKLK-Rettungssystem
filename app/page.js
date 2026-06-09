const s = {
  page: {
    minHeight: "100vh",
    background: "#e8edf3",
    color: "#0f172a",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    display: "grid",
    placeItems: "center",
    padding: 24,
  },
  shell: {
    width: "100%",
    maxWidth: 860,
    background: "#fff",
    border: "1px solid #dbe3ee",
    borderRadius: 14,
    padding: 24,
    boxShadow: "0 12px 32px rgba(15,23,42,0.09)",
  },
  title: { fontSize: 26, fontWeight: 950, marginBottom: 8 },
  sub: { fontSize: 14, color: "#64748b", lineHeight: 1.5, marginBottom: 22 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 14,
  },
  card: {
    border: "1px solid #dbe3ee",
    borderRadius: 12,
    padding: 18,
    background: "#f8fafc",
    minHeight: 150,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  cardTitle: { fontSize: 16, fontWeight: 900, marginBottom: 8 },
  text: { fontSize: 13, color: "#475569", lineHeight: 1.45 },
  btn: {
    display: "inline-block",
    marginTop: 18,
    background: "#0f172a",
    color: "#fff",
    borderRadius: 9,
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 900,
    textAlign: "center",
  },
};

export default function Home() {
  return (
    <main style={s.page}>
      <section style={s.shell}>
        <h1 style={s.title}>MRKLS Krisenkommunikation</h1>
        <p style={s.sub}>
          Rollenbasierte Oberfläche für Bevölkerung, Leitstelle und
          Drohnentransfer im Ausfallfall.
        </p>
        <div style={s.grid}>
          <article style={s.card}>
            <div>
              <div style={s.cardTitle}>Bürgeransicht</div>
              <p style={s.text}>
                Native Handy-App mit Karte, Meldungserfassung, Warnungen und
                Handlungshilfen.
              </p>
            </div>
            <a href="/buergersicht" style={s.btn}>
              Öffnen
            </a>
          </article>
          <article style={s.card}>
            <div>
              <div style={s.cardTitle}>Führungskräfte</div>
              <p style={s.text}>
                Professionelle Lagekarte, Bürgerhinweise, Antworten und
                globale Leitstellenmeldungen.
              </p>
            </div>
            <a href="/fuerhungskraefteansicht" style={s.btn}>
              Öffnen
            </a>
          </article>
          <article style={s.card}>
            <div>
              <div style={s.cardTitle}>Drohnensteuerung</div>
              <p style={s.text}>
                Simuliert, ob die Drohne bei allen Nutzern oder bei der
                Leitstelle ist.
              </p>
            </div>
            <a href="/fuehrungfake" style={s.btn}>
              Öffnen
            </a>
          </article>
        </div>
      </section>
    </main>
  );
}
