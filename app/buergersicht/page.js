"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CATEGORIES = [
  "Hilfebedarf",
  "Medizinischer Hinweis",
  "Blockierte Strasse",
  "Brand / Rauchentwicklung",
  "Stromausfall",
  "Wasserversorgung",
  "Beschadigte Infrastruktur",
  "Sonstige Beobachtung",
];

const USERS = [
  { id: "user-anna", name: "Anna Keller", location: "Nurnberg Sudstadt", lat: 49.4359, lng: 11.0832 },
  { id: "user-ben", name: "Ben Yilmaz", location: "Gostenhof", lat: 49.4528, lng: 11.0498 },
  { id: "user-clara", name: "Clara Schmitt", location: "Langwasser", lat: 49.4058, lng: 11.1344 },
];

const PLACES = [
  { name: "Hauptmarkt", type: "Leuchtturm", lat: 49.4544, lng: 11.0776 },
  { name: "Hauptbahnhof", type: "Anlaufstelle", lat: 49.4456, lng: 11.0824 },
  { name: "Feuerwache 1", type: "Leuchtturm", lat: 49.4376, lng: 11.0668 },
  { name: "Klinikum Nord", type: "Medizin", lat: 49.4717, lng: 11.0644 },
  { name: "Messe", type: "Anlaufstelle", lat: 49.4188, lng: 11.1147 },
];

const FAQ_ITEMS = [
  ["Ist die App ein Notruf?", "Nein. Bei unmittelbarer Lebensgefahr weiterhin den offiziellen Notruf nutzen, sobald eine Verbindung möglich ist."],
  ["Wann wird meine Meldung übertragen?", "Wenn die Drohne im Endnutzergebiet ist, werden wartende Meldungen automatisch aufgenommen."],
  ["Warum sehe ich einen Status an jeder Nachricht?", "Der Status zeigt, ob die Meldung gespeichert, auf der Drohne oder bei der Leitstelle angekommen ist."],
  ["Wer sieht globale Nachrichten?", "Globale Nachrichten der Leitstelle werden allen ausgewählten Nutzern zugestellt, sobald die Drohne zurückkommt."],
];

const FIRST_AID_ITEMS = [
  ["Ruhe bewahren", "Gefahrenstelle prüfen, Eigenschutz beachten und betroffene Personen ansprechen."],
  ["Atmung prüfen", "Wenn keine normale Atmung vorhanden ist, Wiederbelebung beginnen und Hilfe organisieren."],
  ["Starke Blutung", "Druck auf die Wunde ausüben, wenn möglich Verband anlegen und Person hinlegen lassen."],
  ["Unterkühlung", "Person warm halten, nasse Kleidung entfernen, Bewegung vermeiden."],
];

const DRONE_POSITION = { lat: 49.4436, lng: 11.0948 };
const MAP_START = { lat: 49.445, lng: 11.085 };
const TILE_SIZE = 256;
const MIN_ZOOM = 12;
const MAX_ZOOM = 17;

const project = (lat, lng, zoom) => {
  const scale = TILE_SIZE * 2 ** zoom;
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
};

const s = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    color: "#172033",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  phone: {
    maxWidth: 430,
    minHeight: "100vh",
    margin: "0 auto",
    background: "#f9fafb",
    position: "relative",
    paddingBottom: 102,
    boxShadow: "0 0 0 1px #e5e7eb",
  },
  top: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    background: "#ffffff",
    borderBottom: "3px solid #b91c1c",
    padding: "16px 16px 14px",
  },
  topRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  brand: { fontSize: 12, color: "#991b1b", fontWeight: 900, textTransform: "uppercase", letterSpacing: 0 },
  title: { fontSize: 20, fontWeight: 950 },
  plainBtn: { border: "1px solid #cbd5e1", background: "#fff", color: "#172033", borderRadius: 9, padding: "8px 10px", fontWeight: 800 },
  pill: (active) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    padding: "7px 10px",
    background: active ? "#fee2e2" : "#f3f4f6",
    color: active ? "#991b1b" : "#4b5563",
    fontSize: 12,
    fontWeight: 800,
  }),
  dot: (active) => ({ width: 8, height: 8, borderRadius: "50%", background: active ? "#dc2626" : "#6b7280" }),
  content: { padding: 14 },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
  },
  section: { fontSize: 12, color: "#64748b", fontWeight: 800, marginBottom: 10, textTransform: "uppercase" },
  h2: { fontSize: 18, fontWeight: 900, marginBottom: 6 },
  small: { fontSize: 12, color: "#64748b", lineHeight: 1.45 },
  alertCard: { background: "#991b1b", borderRadius: 12, padding: 14, color: "#fff", marginBottom: 12, boxShadow: "0 10px 22px rgba(153,27,27,0.18)" },
  alertTitle: { fontSize: 14, fontWeight: 900, marginBottom: 5 },
  alertText: { fontSize: 13, lineHeight: 1.45, color: "#fee2e2" },
  userGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 },
  userBtn: (active) => ({
    border: `1px solid ${active ? "#b91c1c" : "#d1d5db"}`,
    background: active ? "#fee2e2" : "#fff",
    color: active ? "#991b1b" : "#334155",
    borderRadius: 10,
    padding: "10px 7px",
    fontSize: 12,
    fontWeight: 850,
  }),
  statusGrid: { display: "grid", gap: 9 },
  statusItem: { display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 10, padding: 11 },
  map: { position: "relative", height: 420, overflow: "hidden", borderRadius: 12, border: "1px solid #cbd5e1", background: "#dbeafe", touchAction: "none" },
  tile: (left, top) => ({
    position: "absolute",
    left,
    top,
    width: TILE_SIZE,
    height: TILE_SIZE,
    userSelect: "none",
    pointerEvents: "none",
  }),
  marker: (color, left, top) => ({
    position: "absolute",
    left,
    top,
    transform: "translate(-50%, -50%)",
    width: 32,
    height: 32,
    borderRadius: 999,
    border: "2px solid #fff",
    background: color,
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontSize: 11,
    fontWeight: 900,
    boxShadow: "0 8px 18px rgba(15,23,42,0.25)",
  }),
  markerLabel: {
    position: "absolute",
    top: 34,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#172033",
    color: "#fff",
    borderRadius: 6,
    padding: "3px 6px",
    fontSize: 10,
    whiteSpace: "nowrap",
  },
  mapControls: { position: "absolute", right: 10, bottom: 10, display: "grid", gap: 8, zIndex: 10 },
  mapControl: { width: 38, height: 38, borderRadius: 999, border: "1px solid #cbd5e1", background: "#fff", color: "#172033", fontSize: 18, fontWeight: 900 },
  listItem: { padding: "12px 0", borderBottom: "1px solid #e2e8f0" },
  itemTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 5 },
  itemTitle: { fontSize: 14, fontWeight: 850, color: "#172033" },
  badge: (tone) => ({
    borderRadius: 999,
    padding: "3px 8px",
    background: tone === "reply" ? "#fee2e2" : tone === "An Leitstelle zugestellt" ? "#dcfce7" : tone === "An Drohne übertragen" ? "#fef3c7" : "#f3f4f6",
    color: tone === "reply" ? "#991b1b" : tone === "An Leitstelle zugestellt" ? "#166534" : tone === "An Drohne übertragen" ? "#92400e" : "#4b5563",
    fontSize: 10,
    fontWeight: 850,
    whiteSpace: "nowrap",
  }),
  chat: { display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 10, minHeight: 430 },
  bubble: (mine, urgent) => ({ maxWidth: "86%", alignSelf: mine ? "flex-end" : "flex-start", background: mine ? "#b91c1c" : urgent ? "#fff1f2" : "#fff", color: "#172033", border: `1px solid ${mine ? "#991b1b" : urgent ? "#fecdd3" : "#e5e7eb"}`, borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "10px 12px", fontSize: 13, lineHeight: 1.45, boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }),
  mineText: { color: "#fff" },
  quote: { borderLeft: "3px solid #b91c1c", paddingLeft: 8, marginBottom: 7, color: "#64748b", fontSize: 12 },
  statusLine: (mine) => ({ marginTop: 7, fontSize: 11, color: mine ? "#fee2e2" : "#64748b", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }),
  bubbleAction: (mine) => ({ border: 0, background: "transparent", color: mine ? "#fee2e2" : "#991b1b", padding: 0, fontSize: 11, fontWeight: 850, cursor: "pointer" }),
  field: { width: "100%", border: "1px solid #d1d5db", background: "#fff", color: "#172033", borderRadius: 10, padding: "12px 13px", fontSize: 14, marginBottom: 10, outlineColor: "#b91c1c" },
  textarea: { width: "100%", minHeight: 104, border: "1px solid #d1d5db", background: "#fff", color: "#172033", borderRadius: 10, padding: "12px 13px", fontSize: 14, marginBottom: 10, resize: "vertical", fontFamily: "inherit", outlineColor: "#b91c1c" },
  btn: { width: "100%", border: 0, borderRadius: 10, background: "#b91c1c", color: "#fff", padding: "14px 14px", fontSize: 15, fontWeight: 900 },
  chatHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 },
  chatScroll: { overflowY: "auto", maxHeight: "calc(100vh - 350px)", minHeight: 430, padding: "6px 3px 10px", marginBottom: 12 },
  composer: { borderTop: "1px solid #e2e8f0", paddingTop: 12 },
  helpGrid: { display: "grid", gap: 10 },
  helpItem: { border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fff" },
  nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, display: "grid", gridTemplateColumns: "repeat(4,1fr)", background: "#fff", borderTop: "1px solid #e5e7eb", padding: "10px 10px 14px", zIndex: 30 },
  navBtn: (active) => ({ border: 0, borderRadius: 12, background: active ? "#fee2e2" : "transparent", color: active ? "#991b1b" : "#4b5563", fontSize: 14, fontWeight: 900, padding: "14px 8px", minHeight: 54 }),
};

function MapView({ activeUser, droneConnected, zoom, setZoom, center, setCenter }) {
  const mapRef = useRef(null);
  const drag = useRef(null);
  const [size, setSize] = useState({ width: 380, height: 420 });
  const centerPx = project(center.lat, center.lng, zoom);
  const origin = {
    x: centerPx.x - size.width / 2,
    y: centerPx.y - size.height / 2,
  };

  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  const unproject = (point, nextZoom) => {
    const scale = TILE_SIZE * 2 ** nextZoom;
    const lng = (point.x / scale) * 360 - 180;
    const n = Math.PI - (2 * Math.PI * point.y) / scale;
    const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
    return { lat, lng };
  };

  const adjustZoom = (delta) => {
    setZoom((current) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current + delta)));
  };

  const tiles = [];
  const firstX = Math.floor(origin.x / TILE_SIZE) - 1;
  const lastX = Math.floor((origin.x + size.width) / TILE_SIZE) + 1;
  const firstY = Math.floor(origin.y / TILE_SIZE) - 1;
  const lastY = Math.floor((origin.y + size.height) / TILE_SIZE) + 1;
  const maxTile = 2 ** zoom;
  for (let x = firstX; x <= lastX; x += 1) {
    for (let y = firstY; y <= lastY; y += 1) {
      if (y < 0 || y >= maxTile) continue;
      const wrappedX = ((x % maxTile) + maxTile) % maxTile;
      tiles.push({
        key: `${zoom}-${x}-${y}`,
        url: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`,
        left: x * TILE_SIZE - origin.x,
        top: y * TILE_SIZE - origin.y,
      });
    }
  }

  const markerPoint = (item) => {
    const point = project(item.lat, item.lng, zoom);
    return { left: point.x - origin.x, top: point.y - origin.y };
  };

  return (
    <div
      ref={mapRef}
      style={s.map}
      onPointerDown={(event) => {
        drag.current = { x: event.clientX, y: event.clientY, centerPx };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        const nextCenter = {
          x: drag.current.centerPx.x - (event.clientX - drag.current.x),
          y: drag.current.centerPx.y - (event.clientY - drag.current.y),
        };
        setCenter(unproject(nextCenter, zoom));
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onWheel={(event) => {
        event.preventDefault();
        adjustZoom(event.deltaY < 0 ? 1 : -1);
      }}
    >
      {tiles.map((tile) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={tile.key} src={tile.url} alt="" style={s.tile(tile.left, tile.top)} draggable={false} />
      ))}
      {PLACES.map((place) => {
        const point = markerPoint(place);
        return (
          <div key={place.name} title={place.name} style={s.marker("#2563eb", point.left, point.top)}>
            L
            <span style={s.markerLabel}>{place.name}</span>
          </div>
        );
      })}
      {(() => {
        const point = markerPoint(activeUser);
        return (
          <div title={activeUser.location} style={s.marker("#16a34a", point.left, point.top)}>
            Ich
            <span style={s.markerLabel}>{activeUser.location}</span>
          </div>
        );
      })()}
      {droneConnected && (() => {
        const point = markerPoint(DRONE_POSITION);
        return (
          <div title="Drohne in Reichweite" style={s.marker("#f59e0b", point.left, point.top)}>
            D
            <span style={s.markerLabel}>Drohne</span>
          </div>
        );
      })()}
      <div style={s.mapControls}>
        <button style={s.mapControl} onClick={() => adjustZoom(1)}>+</button>
        <button style={s.mapControl} onClick={() => adjustZoom(-1)}>-</button>
        <button style={s.mapControl} onClick={() => setCenter(MAP_START)}>0</button>
      </div>
    </div>
  );
}

export default function BuergerSicht() {
  const [tab, setTab] = useState("home");
  const [activeUserId, setActiveUserId] = useState(USERS[0].id);
  const [msgs, setMsgs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [lastContact, setLastContact] = useState(null);
  const [droneStatus, setDroneStatus] = useState(null);
  const [zoom, setZoom] = useState(13);
  const [center, setCenter] = useState(MAP_START);
  const [form, setForm] = useState({ category: CATEGORIES[0], location: USERS[0].location, text: "" });
  const [saved, setSaved] = useState(false);
  const chatRef = useRef(null);

  const activeUser = USERS.find((user) => user.id === activeUserId) || USERS[0];

  const applyRuntimeState = useCallback((data) => {
    const ownMessages = [
      ...(data.waitingCitizenMessages || []),
      ...(data.droneCitizenMessages || []),
      ...(data.receivedCitizenMessages || []),
    ]
      .filter((message) => message.userId === activeUserId)
      .sort((a, b) => a.id - b.id);
    const delivered = (data.deliveredControlCenterMessages || [])
      .filter((message) => message.scope === "global" || message.recipientUserId === activeUserId)
      .sort((a, b) => a.id - b.id);
    setMsgs(ownMessages);
    setAlerts(delivered);
    setDroneStatus(data.droneStatus);
  }, [activeUserId]);

  const loadRuntimeState = useCallback(async () => {
    try {
      const res = await fetch("/api/drone/status");
      const data = await res.json();
      applyRuntimeState(data);
      return data.droneStatus;
    } catch {
      return null;
    }
  }, [applyRuntimeState]);

  const syncWithDrone = useCallback(
    async () => {
      await fetch("/api/drone/pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: activeUserId }),
      });
      const time = new Date().toLocaleTimeString("de-DE");
      setLastContact(time);
      await loadRuntimeState();
    },
    [activeUserId, loadRuntimeState],
  );

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const status = await loadRuntimeState();
      if (status?.location === "Endnutzergebiet Nürnberg") await syncWithDrone();
    }, 0);
    const interval = setInterval(loadRuntimeState, 5000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [loadRuntimeState, syncWithDrone]);

  useEffect(() => {
    const es = new EventSource("/api/events");
    es.addEventListener("drone-arrived-users", async () => {
      try { await syncWithDrone(); } catch {}
    });
    es.addEventListener("drone-delivered-to-station", () => {
      loadRuntimeState();
    });
    es.addEventListener("new-control-center-message", loadRuntimeState);
    es.addEventListener("message-deleted", loadRuntimeState);
    return () => es.close();
  }, [loadRuntimeState, syncWithDrone]);

  useEffect(() => {
    if (!chatRef.current) return;
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs, alerts, tab]);

  const saveMsg = async () => {
    if (!form.text.trim()) return;
    await fetch("/api/messages/citizen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: activeUser.id,
        userName: activeUser.name,
        category: form.category,
        location: form.location,
        text: form.text.trim(),
        createdAt: new Date().toLocaleTimeString("de-DE"),
      }),
    });
    setForm({ ...form, text: "" });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
    await loadRuntimeState();
  };

  const deleteMessage = async (id) => {
    await fetch("/api/messages/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadRuntimeState();
  };

  const droneConnected = droneStatus?.location === "Endnutzergebiet Nürnberg";
  const localCount = msgs.filter((m) => m.status === "Gespeichert").length;
  const globalAlerts = alerts.filter((message) => message.scope === "global");
  const latestGlobal = globalAlerts.at(-1);
  const chatItems = [
    ...msgs.map((message) => ({ ...message, direction: "out", body: message.text, time: message.createdAt })),
    ...alerts.map((message) => ({ ...message, direction: "in", body: message.message || message.text, time: message.createdAt })),
  ].sort((a, b) => a.id - b.id);

  return (
    <main style={s.page}>
      <div style={s.phone}>
        <header style={s.top}>
          <div style={s.topRow}>
            <div>
              <div style={s.brand}>mrklk system</div>
              <div style={s.title}>{tab === "home" ? "Ubersicht" : tab === "map" ? "Karte" : tab === "chat" ? "Nachrichten" : "Hilfe"}</div>
            </div>
            <div style={s.pill(droneConnected)}>
              <span style={s.dot(droneConnected)} />
              {droneConnected ? "Verbunden" : "Offline"}
            </div>
          </div>
        </header>

        <section style={s.content}>
          {tab === "home" && (
            <>
              <div style={s.card}>
                <div style={s.section}>Status</div>
                <div style={s.h2}>{droneConnected ? "Drohne in Reichweite" : "Offline betriebsbereit"}</div>
                <div style={s.small}>Nachrichten liegen nur im laufenden Server-Speicher und werden per Drohne synchronisiert.</div>
              </div>
              {latestGlobal && (
                <div style={s.alertCard}>
                  <div style={s.alertTitle}>{latestGlobal.category || "Leitstellenmeldung"}</div>
                  <div style={s.alertText}>{latestGlobal.message}</div>
                </div>
              )}
              <div style={s.card}>
                <div style={s.section}>Nutzer</div>
                <div style={s.userGrid}>
                  {USERS.map((user) => (
                    <button key={user.id} style={s.userBtn(user.id === activeUserId)} onClick={() => {
                      setActiveUserId(user.id);
                      setForm((current) => ({ ...current, location: user.location }));
                    }}>{user.name.split(" ")[0]}</button>
                  ))}
                </div>
              </div>
              <div style={s.card}>
                <div style={s.section}>Verbindungen</div>
                <div style={s.statusGrid}>
                  <div style={s.statusItem}><span>Wartend</span><strong>{localCount} offen</strong></div>
                  <div style={s.statusItem}><span>Letzter Drohnenkontakt</span><strong>{lastContact || "-"}</strong></div>
                </div>
              </div>
            </>
          )}

          {tab === "map" && (
            <>
              <MapView activeUser={activeUser} droneConnected={droneConnected} zoom={zoom} setZoom={setZoom} center={center} setCenter={setCenter} />
              <div style={s.card}>
                <div style={s.section}>Anlaufstellen</div>
                {PLACES.map((place) => <div key={place.name} style={s.listItem}><div style={s.itemTop}><div style={s.itemTitle}>{place.name}</div><span style={s.badge("reply")}>{place.type}</span></div></div>)}
              </div>
            </>
          )}

          {tab === "chat" && (
            <div style={s.card}>
              <div style={s.chatHeader}>
                <div>
                  <div style={s.section}>Leitstelle</div>
                  <div style={s.small}>Meldungen und Antworten in einem Verlauf.</div>
                </div>
                <span style={s.badge(droneConnected ? "reply" : "An Drohne übertragen")}>{droneConnected ? "Drohne nah" : "Offline"}</span>
              </div>
              <div ref={chatRef} style={s.chatScroll}>
                <div style={s.chat}>
                  {chatItems.map((item) => {
                    const mine = item.direction === "out";
                    return (
                      <div key={`${item.direction}-${item.id}`} style={s.bubble(mine, item.scope === "global")}>
                        {item.replyToText && <div style={s.quote}>Antwort auf: {item.replyToText}</div>}
                        <div style={mine ? s.mineText : undefined}><strong>{item.category || "Leitstelle"}</strong><br />{item.body}</div>
                        <div style={s.statusLine(mine)}>
                          <span>{item.location ? `Standort: ${item.location}` : item.scope === "global" ? "Global" : "Leitstelle"}</span>
                          <span>{mine ? item.status : item.time}</span>
                          <button style={s.bubbleAction(mine)} onClick={() => deleteMessage(item.id)}>Löschen</button>
                        </div>
                      </div>
                    );
                  })}
                  {chatItems.length === 0 && <div style={s.small}>Noch keine Nachrichten vorhanden.</div>}
                </div>
              </div>
              <div style={s.composer}>
                <select style={s.field} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                </select>
                <select style={s.field} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
                  {USERS.map((user) => <option key={user.location}>{user.location}</option>)}
                  {PLACES.map((place) => <option key={place.name}>{place.name}</option>)}
                </select>
                <textarea style={{ ...s.textarea, minHeight: 92 }} placeholder="Nachricht an die Leitstelle" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
                <button style={s.btn} onClick={saveMsg}>{saved ? "Gespeichert" : "Meldung senden"}</button>
              </div>
            </div>
          )}

          {tab === "help" && (
            <>
              <div style={s.card}>
                <div style={s.section}>FAQ</div>
                <div style={s.helpGrid}>
                  {FAQ_ITEMS.map(([question, answer]) => (
                    <div key={question} style={s.helpItem}>
                      <div style={s.itemTitle}>{question}</div>
                      <div style={s.small}>{answer}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={s.card}>
                <div style={s.section}>Erste Hilfe</div>
                <div style={s.helpGrid}>
                  {FIRST_AID_ITEMS.map(([title, text]) => (
                    <div key={title} style={s.helpItem}>
                      <div style={s.itemTitle}>{title}</div>
                      <div style={s.small}>{text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>

        <nav style={s.nav}>
          {[["home", "Ubersicht"], ["map", "Karte"], ["chat", "Chat"], ["help", "Hilfe"]].map(([id, label]) => (
            <button key={id} style={s.navBtn(tab === id)} onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>
      </div>
    </main>
  );
}
