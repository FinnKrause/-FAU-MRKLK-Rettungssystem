"use client";

import { useEffect, useState } from "react";

const s = {
  page: {
    minHeight: "100vh",
    background: "#e8edf3",
    color: "#0f172a",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    padding: 24,
  },
  shell: { maxWidth: 860, margin: "0 auto" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 18,
  },
  title: { fontSize: 24, fontWeight: 950, margin: 0 },
  sub: { fontSize: 13, color: "#64748b", marginTop: 4, lineHeight: 1.45 },
  link: {
    background: "#0f172a",
    color: "#fff",
    borderRadius: 9,
    padding: "10px 13px",
    fontSize: 13,
    fontWeight: 900,
  },
  panel: {
    background: "#fff",
    border: "1px solid #dbe3ee",
    borderRadius: 12,
    padding: 18,
    boxShadow: "0 1px 4px rgba(15,23,42,0.07)",
    marginBottom: 14,
  },
  panelTitle: { fontSize: 15, fontWeight: 950, marginBottom: 14 },
  rows: { display: "grid", gap: 8 },
  row: {
    display: "grid",
    gridTemplateColumns: "190px 1fr",
    gap: 12,
    padding: "9px 0",
    borderBottom: "1px solid #e2e8f0",
    fontSize: 13,
  },
  label: { color: "#64748b", fontWeight: 800 },
  value: { color: "#0f172a", fontWeight: 850 },
  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  btn: (primary) => ({
    border: primary ? 0 : "1px solid #0f172a",
    background: primary ? "#0f172a" : "#fff",
    color: primary ? "#fff" : "#0f172a",
    borderRadius: 10,
    padding: "14px 12px",
    fontSize: 14,
    fontWeight: 950,
    cursor: "pointer",
  }),
  disabled: { opacity: 0.55, cursor: "not-allowed" },
  log: {
    marginTop: 14,
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: "#334155",
  },
};

export default function FuehrungFake() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState("");
  const [lastLog, setLastLog] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/drone/status");
      setData(await res.json());
    } catch {}
  };

  useEffect(() => {
    const timeout = setTimeout(load, 0);
    const iv = setInterval(load, 5000);
    return () => {
      clearTimeout(timeout);
      clearInterval(iv);
    };
  }, []);

  const arriveUsers = async () => {
    setLoading("users");
    setLastLog("");
    try {
      const res = await fetch("/api/drone/arrive-users", { method: "POST" });
      const d = await res.json();
      setLastLog(
        d.alreadyAtLocation
          ? `Drohne ist bereits bei allen Nutzern. ${new Date().toLocaleTimeString("de-DE")}`
          : `Drohne bei allen Nutzern angekommen. ${d.deliveredAlertCount ?? 0} Leitstellenmeldung(en) bereitgestellt. ${new Date().toLocaleTimeString("de-DE")}`,
      );
      await load();
    } catch {
      setLastLog("Fehler beim Senden.");
    } finally {
      setLoading("");
    }
  };

  const arriveStation = async () => {
    setLoading("station");
    setLastLog("");
    try {
      const res = await fetch("/api/drone/arrive-station", { method: "POST" });
      const d = await res.json();
      setLastLog(
        d.alreadyAtLocation
          ? `Drohne ist bereits an der Leitstelle. ${new Date().toLocaleTimeString("de-DE")}`
          : `Drohne an der Leitstelle. ${d.deliveredCitizenMessages ?? 0} Bürgernachricht(en) übergeben, ${d.loadedControlCenterMessages ?? 0} Leitstellenmeldung(en) geladen. ${new Date().toLocaleTimeString("de-DE")}`,
      );
      await load();
    } catch {
      setLastLog("Fehler beim Senden.");
    } finally {
      setLoading("");
    }
  };

  const busy = loading !== "";

  return (
    <main style={s.page}>
      <div style={s.shell}>
        <header style={s.header}>
          <div>
            <h1 style={s.title}>Drohnensteuerung</h1>
            <div style={s.sub}>
              Die Drohne ist immer entweder bei allen Nutzern oder an der
              Leitstelle.
            </div>
          </div>
          <a href="/fuerhungskraefteansicht" style={s.link}>
            Zur Leitstelle
          </a>
        </header>

        <section style={s.panel}>
          <div style={s.panelTitle}>Aktueller Status</div>
          {data ? (
            <div style={s.rows}>
              <div style={s.row}>
                <span style={s.label}>Drohne</span>
                <span style={s.value}>{data.droneStatus?.id}</span>
              </div>
              <div style={s.row}>
                <span style={s.label}>Standort</span>
                <span style={s.value}>{data.droneStatus?.location}</span>
              </div>
              <div style={s.row}>
                <span style={s.label}>Zustand</span>
                <span style={s.value}>{data.droneStatus?.state}</span>
              </div>
              <div style={s.row}>
                <span style={s.label}>Fracht Bürgerdaten</span>
                <span style={s.value}>{data.droneCargoCount?.citizen ?? 0}</span>
              </div>
              <div style={{ ...s.row, borderBottom: 0 }}>
                <span style={s.label}>Fracht Leitstelle</span>
                <span style={s.value}>
                  {data.droneCargoCount?.controlCenter ?? 0}
                </span>
              </div>
            </div>
          ) : (
            <div style={s.sub}>Lade Status ...</div>
          )}
        </section>

        <section style={s.actions}>
          <button
            style={{ ...s.btn(true), ...(busy ? s.disabled : {}) }}
            onClick={arriveUsers}
            disabled={busy}
          >
            {loading === "users" ? "Wird gesendet ..." : "Zu allen Nutzern"}
          </button>
          <button
            style={{ ...s.btn(false), ...(busy ? s.disabled : {}) }}
            onClick={arriveStation}
            disabled={busy}
          >
            {loading === "station" ? "Wird gesendet ..." : "Zur Leitstelle"}
          </button>
        </section>

        {lastLog && <div style={s.log}>{lastLog}</div>}
      </div>
    </main>
  );
}
