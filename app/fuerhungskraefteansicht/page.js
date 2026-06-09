"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CC_CATEGORIES = [
  "Allgemeine Information",
  "Evakuierungshinweis",
  "Versorgungshinweis",
  "Sicherheitshinweis",
  "Medizinischer Hinweis",
  "Infrastruktur",
  "Mobilisierungsaufruf",
];

const LOCATION_MARKERS = {
  "Nürnberg Südstadt": { lat: 49.4359, lng: 11.0832 },
  "Nurnberg Sudstadt": { lat: 49.4359, lng: 11.0832 },
  Gostenhof: { lat: 49.4528, lng: 11.0498 },
  Langwasser: { lat: 49.4058, lng: 11.1344 },
  Hauptmarkt: { lat: 49.4544, lng: 11.0776 },
  Hauptbahnhof: { lat: 49.4456, lng: 11.0824 },
  "Feuerwache 1": { lat: 49.4376, lng: 11.0668 },
  "Klinikum Nord": { lat: 49.4717, lng: 11.0644 },
  Messe: { lat: 49.4188, lng: 11.1147 },
};

const BASE_FIRE_UNITS = [
  { id: "T-01", name: "Trupp 1", status: "Brandnachschau", place: "Altstadt", lat: 49.4552, lng: 11.0712 },
  { id: "T-02", name: "Trupp 2", status: "Evakuierung", place: "Südstadt", lat: 49.4342, lng: 11.0778 },
  { id: "T-03", name: "Trupp 3", status: "Straße sichern", place: "Langwasser", lat: 49.4074, lng: 11.1282 },
  { id: "T-04", name: "Trupp 4", status: "Erkundung", place: "Gostenhof", lat: 49.4519, lng: 11.0521 },
  { id: "T-05", name: "Trupp 5", status: "Versorgungspunkt", place: "Hauptbahnhof", lat: 49.4458, lng: 11.0828 },
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
  page: { minHeight: "100vh", background: "#f3f4f6", color: "#172033", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" },
  shell: { minHeight: "100vh", display: "grid", gridTemplateRows: "auto 1fr", padding: 18, gap: 14 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, background: "#fff", border: "1px solid #e5e7eb", borderTop: "4px solid #b91c1c", borderRadius: 14, padding: "14px 16px", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" },
  title: { fontSize: 22, fontWeight: 900, margin: 0 },
  hint: { fontSize: 13, color: "#64748b", marginTop: 4 },
  topActions: { display: "flex", alignItems: "center", gap: 10 },
  link: { background: "#991b1b", color: "#fff", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontWeight: 850, textDecoration: "none" },
  pill: (active) => ({ display: "inline-flex", alignItems: "center", gap: 7, borderRadius: 999, padding: "8px 11px", background: active ? "#fee2e2" : "#f3f4f6", color: active ? "#991b1b" : "#4b5563", fontSize: 12, fontWeight: 850 }),
  dot: (active) => ({ width: 8, height: 8, borderRadius: "50%", background: active ? "#dc2626" : "#6b7280" }),
  work: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 390px", gap: 14, minHeight: 0 },
  panel: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, boxShadow: "0 1px 4px rgba(15,23,42,0.06)", minHeight: 0 },
  panelTitle: { fontSize: 15, fontWeight: 900, marginBottom: 12 },
  map: { position: "relative", height: "calc(100vh - 124px)", minHeight: 620, overflow: "hidden", borderRadius: 12, border: "1px solid #cbd5e1", background: "#dbeafe", touchAction: "none" },
  tile: (left, top) => ({ position: "absolute", left, top, width: TILE_SIZE, height: TILE_SIZE, userSelect: "none", pointerEvents: "none" }),
  marker: (color, left, top, active) => ({ position: "absolute", left, top, transform: "translate(-50%, -50%)", width: active ? 22 : 10, height: active ? 22 : 10, borderRadius: 999, border: active ? "3px solid #fff" : "1px solid #fff", background: color, color: "#fff", display: "grid", placeItems: "center", fontSize: 8, fontWeight: 900, boxShadow: active ? "0 0 0 6px rgba(220,38,38,0.18), 0 10px 22px rgba(15,23,42,0.28)" : "0 2px 7px rgba(15,23,42,0.24)", zIndex: active ? 9 : 4, cursor: "pointer" }),
  unitMarker: (color, left, top) => ({ position: "absolute", left, top, transform: "translate(-50%, -50%)", width: 24, height: 24, borderRadius: 999, border: "2px solid #fff", background: color, color: "#fff", display: "grid", placeItems: "center", fontSize: 9, fontWeight: 900, boxShadow: "0 7px 16px rgba(15,23,42,0.24)", zIndex: 5 }),
  label: { position: "absolute", left: "50%", top: 38, transform: "translateX(-50%)", background: "#172033", color: "#fff", borderRadius: 7, padding: "4px 7px", fontSize: 10, whiteSpace: "nowrap" },
  unitLabel: { position: "absolute", left: "50%", top: 28, transform: "translateX(-50%)", background: "#172033", color: "#fff", borderRadius: 7, padding: "5px 7px", fontSize: 10, whiteSpace: "nowrap", lineHeight: 1.25, textAlign: "left" },
  controls: { position: "absolute", right: 12, bottom: 12, display: "grid", gap: 8, zIndex: 15 },
  control: { width: 40, height: 40, borderRadius: 999, border: "1px solid #cbd5e1", background: "#fff", color: "#172033", fontSize: 18, fontWeight: 900 },
  legend: { position: "absolute", left: 12, bottom: 12, zIndex: 15, display: "flex", gap: 10, flexWrap: "wrap", background: "rgba(255,255,255,0.95)", border: "1px solid #dbe3ee", borderRadius: 10, padding: 10, color: "#334155", fontSize: 11 },
  side: { display: "grid", gridTemplateRows: "auto minmax(0, 1fr) auto", gap: 12, minHeight: 0 },
  summary: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 },
  summaryCell: { border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, background: "#fff" },
  summaryValue: { fontSize: 18, fontWeight: 900, color: "#991b1b" },
  list: { display: "grid", alignContent: "start", gap: 6, overflowY: "auto", maxHeight: "calc(100vh - 305px)", paddingRight: 3 },
  item: (active) => ({ border: `1px solid ${active ? "#b91c1c" : "#e5e7eb"}`, background: active ? "#fff1f2" : "#fff", borderRadius: 9, padding: "9px 10px", cursor: "pointer" }),
  itemTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 4 },
  itemActions: { display: "flex", gap: 6, alignItems: "center" },
  itemTitle: { fontSize: 14, color: "#172033", fontWeight: 850 },
  meta: { fontSize: 12, color: "#64748b", lineHeight: 1.45 },
  badge: (tone) => ({ borderRadius: 999, padding: "3px 8px", background: tone === "reply" ? "#e0f2fe" : tone === "high" ? "#fee2e2" : "#dcfce7", color: tone === "reply" ? "#075985" : tone === "high" ? "#991b1b" : "#166534", fontSize: 10, fontWeight: 850, whiteSpace: "nowrap" }),
  chatPanel: { border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#f8fafc" },
  bubble: (mine) => ({ maxWidth: "92%", marginLeft: mine ? "auto" : 0, background: mine ? "#b91c1c" : "#fff", color: mine ? "#fff" : "#172033", border: `1px solid ${mine ? "#991b1b" : "#e5e7eb"}`, borderRadius: mine ? "14px 14px 3px 14px" : "14px 14px 14px 3px", padding: "10px 12px", fontSize: 13, lineHeight: 1.45, marginBottom: 8 }),
  field: { width: "100%", border: "1px solid #d1d5db", background: "#fff", color: "#172033", borderRadius: 10, padding: "11px 12px", fontSize: 13, marginBottom: 10, outlineColor: "#b91c1c" },
  textarea: { width: "100%", minHeight: 82, border: "1px solid #d1d5db", background: "#fff", color: "#172033", borderRadius: 10, padding: "11px 12px", fontSize: 13, marginBottom: 10, resize: "vertical", fontFamily: "inherit", outlineColor: "#b91c1c" },
  btn: { border: 0, borderRadius: 10, background: "#b91c1c", color: "#fff", padding: "12px 13px", fontSize: 13, fontWeight: 850, cursor: "pointer" },
  ghostBtn: { border: "1px solid #cbd5e1", borderRadius: 9, background: "#fff", color: "#172033", padding: "8px 10px", fontSize: 12, fontWeight: 850, cursor: "pointer" },
  dangerBtn: { border: "1px solid #fecaca", borderRadius: 9, background: "#fff1f2", color: "#991b1b", padding: "8px 10px", fontSize: 12, fontWeight: 850, cursor: "pointer" },
  composerTop: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 10 },
  selectedBox: { border: "1px solid #fecdd3", borderRadius: 10, padding: 10, background: "#fff1f2", marginBottom: 10 },
  unitRoster: { position: "absolute", left: 12, top: 12, zIndex: 15, width: 230, display: "grid", gap: 6 },
  unitCard: { background: "rgba(255,255,255,0.96)", border: "1px solid #e5e7eb", borderRadius: 9, padding: "8px 9px", boxShadow: "0 2px 8px rgba(15,23,42,0.08)" },
  outgoingList: { display: "grid", gap: 6, maxHeight: 132, overflowY: "auto", marginBottom: 10 },
  outgoingItem: { border: "1px solid #e5e7eb", borderRadius: 9, padding: 9, background: "#fff" },
};

const getMarker = (message, index) => LOCATION_MARKERS[message.location] || { lat: 49.445 + index * 0.004, lng: 11.075 + index * 0.006 };
const shiftedFireUnits = (cycleCount) =>
  cycleCount <= 0 ? [] : BASE_FIRE_UNITS.map((unit, index) => ({
    ...unit,
    lat: unit.lat + ((cycleCount + index) % 4) * 0.0014,
    lng: unit.lng + ((cycleCount + index * 2) % 3) * 0.0018,
  }));

function OpsMap({ messages, selectedId, setSelectedId, droneAtStation, cycleCount, zoom, setZoom, center, setCenter }) {
  const mapRef = useRef(null);
  const drag = useRef(null);
  const [size, setSize] = useState({ width: 900, height: 620 });
  const centerPx = project(center.lat, center.lng, zoom);
  const origin = { x: centerPx.x - size.width / 2, y: centerPx.y - size.height / 2 };
  const adjustZoom = (delta) => setZoom((current) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current + delta)));
  const fireUnits = shiftedFireUnits(cycleCount);

  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
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
      tiles.push({ key: `${zoom}-${x}-${y}`, url: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`, left: x * TILE_SIZE - origin.x, top: y * TILE_SIZE - origin.y });
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
        const nextCenter = { x: drag.current.centerPx.x - (event.clientX - drag.current.x), y: drag.current.centerPx.y - (event.clientY - drag.current.y) };
        setCenter(unproject(nextCenter, zoom));
      }}
      onPointerUp={() => { drag.current = null; }}
      onWheel={(event) => {
        event.preventDefault();
        adjustZoom(event.deltaY < 0 ? 1 : -1);
      }}
    >
      {tiles.map((tile) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={tile.key} src={tile.url} alt="" style={s.tile(tile.left, tile.top)} draggable={false} />
      ))}
      {messages.map((message, index) => {
        const marker = getMarker(message, index);
        const point = markerPoint(marker);
        const active = selectedId === message.id;
        return (
          <button key={message.id || index} style={s.marker("#dc2626", point.left, point.top, active)} onClick={() => setSelectedId(message.id)} title={`${message.category}: ${message.location}`}>
            {active ? "" : ""}
          </button>
        );
      })}
      {fireUnits.map((unit) => {
        const point = markerPoint(unit);
        return (
          <div key={unit.id} className="unit-discovery" style={s.unitMarker("#2563eb", point.left, point.top)} title={`${unit.name}: ${unit.status} in ${unit.place}`}>
            {unit.id.replace("T-", "")}
            <span style={s.unitLabel}>
              <strong>{unit.name}</strong><br />
              {unit.status}<br />
              {unit.place}
            </span>
          </div>
        );
      })}
      {(() => {
        const point = markerPoint(DRONE_POSITION);
        return (
        <div style={s.unitMarker(droneAtStation ? "#16a34a" : "#f59e0b", point.left, point.top)}>
          D
          <span style={s.label}>{droneAtStation ? "Drohne an Leitstelle" : "Drohne bei Nutzern"}</span>
        </div>
        );
      })()}
      <div style={s.controls}>
        <button style={s.control} onClick={() => adjustZoom(1)}>+</button>
        <button style={s.control} onClick={() => adjustZoom(-1)}>-</button>
        <button style={s.control} onClick={() => setCenter(MAP_START)}>0</button>
      </div>
      <div style={s.legend}>
        <span>Rot: Meldung</span>
        <span>Blau: Feuerwehrtrupp</span>
        <span>Grun/Gelb: Drohne</span>
      </div>
      {fireUnits.length > 0 && (
        <div style={s.unitRoster}>
          {fireUnits.map((unit) => (
            <div key={`card-${unit.id}`} style={s.unitCard}>
              <div style={s.itemTitle}>{unit.name}</div>
              <div style={s.meta}>{unit.status} · {unit.place}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FuehrungskraefteAnsicht() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ category: CC_CATEGORIES[0], message: "" });
  const [replyTargetId, setReplyTargetId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [zoom, setZoom] = useState(13);
  const [center, setCenter] = useState(MAP_START);
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/drone/status");
      const json = await res.json();
      setData(json);
      if (!selectedId && json.receivedCitizenMessages?.[0]) setSelectedId(json.receivedCitizenMessages[0].id);
    } catch {}
  }, [selectedId]);

  useEffect(() => {
    const timeout = setTimeout(load, 0);
    const es = new EventSource("/api/events");
    es.addEventListener("drone-delivered-to-station", load);
    es.addEventListener("drone-loaded-station-data", load);
    es.addEventListener("new-control-center-message", load);
    es.addEventListener("new-citizen-message", load);
    es.addEventListener("message-deleted", load);
    return () => {
      clearTimeout(timeout);
      es.close();
    };
  }, [load]);

  const sendMessage = async () => {
    if (!form.message.trim()) return;
    const messages = data?.receivedCitizenMessages || [];
    const replyTarget = messages.find((message) => message.id === replyTargetId);
    setSaving(true);
    try {
      await fetch("/api/messages/control-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(replyTarget ? {
          scope: "reply",
          category: "Antwort der Leitstelle",
          message: form.message.trim(),
          recipientUserId: replyTarget.userId,
          recipientUserName: replyTarget.userName,
          replyToMessageId: replyTarget.id,
          replyToText: replyTarget.text,
          createdAt: new Date().toLocaleTimeString("de-DE"),
        } : {
          category: form.category,
          message: form.message.trim(),
          createdAt: new Date().toLocaleTimeString("de-DE"),
        }),
      });
      setForm({ ...form, message: "" });
      setReplyTargetId(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const deleteMessage = async (id) => {
    await fetch("/api/messages/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (selectedId === id) setSelectedId(null);
    if (replyTargetId === id) setReplyTargetId(null);
    await load();
  };

  const droneAtStation = data?.droneStatus?.location === "Wache Nürnberg";
  const cycleCount = data?.droneCycleCount || 0;
  const messages = data?.receivedCitizenMessages || [];
  const waiting = data?.waitingControlCenterMessages || [];
  const selectedMessage = messages.find((message) => message.id === selectedId) || messages[0];
  const replyTarget = messages.find((message) => message.id === replyTargetId);

  return (
    <main style={s.page}>
      <div style={s.shell}>
        <header style={s.header}>
          <div>
            <h1 style={s.title}>mrklk system Leitstelle</h1>
            <div style={s.hint}>Runtime-Lagebild, Meldungen und Antworten.</div>
          </div>
          <div style={s.topActions}>
            <div style={s.pill(droneAtStation)}><span style={s.dot(droneAtStation)} />{droneAtStation ? "Drohne an Leitstelle" : "Drohne bei Nutzern"}</div>
            <a href="/fuehrungfake" style={s.link}>Drohnensteuerung</a>
          </div>
        </header>

        <section style={s.work}>
          <div style={s.panel}>
            <div style={s.panelTitle}>Lagekarte</div>
            <OpsMap messages={messages} selectedId={selectedMessage?.id} setSelectedId={setSelectedId} droneAtStation={droneAtStation} cycleCount={cycleCount} zoom={zoom} setZoom={setZoom} center={center} setCenter={setCenter} />
          </div>

          <aside style={s.side}>
            <section style={s.panel}>
              <div style={s.summary}>
                <div style={s.summaryCell}>
                  <div style={s.summaryValue}>{messages.length}</div>
                  <div style={s.meta}>Meldungen</div>
                </div>
                <div style={s.summaryCell}>
                  <div style={s.summaryValue}>{waiting.length}</div>
                  <div style={s.meta}>Ausgehend</div>
                </div>
                <div style={s.summaryCell}>
                  <div style={s.summaryValue}>{cycleCount}</div>
                  <div style={s.meta}>Zyklen</div>
                </div>
              </div>
            </section>

            <section style={s.panel}>
              <div style={s.panelTitle}>Meldungen</div>
              <div style={s.list}>
                {messages.length === 0 ? <div style={s.meta}>Noch keine Meldungen eingegangen.</div> : [...messages].reverse().map((message, index) => (
                  <article key={message.id || index} style={s.item(selectedMessage?.id === message.id)} onClick={() => setSelectedId(message.id)}>
                    <div style={s.itemTop}>
                      <div>
                        <div style={s.itemTitle}>{message.category || "Bürgerhinweis"}</div>
                        <div style={s.meta}>{message.userName || "Unbekannt"} · {message.location} · {message.createdAt || ""}</div>
                      </div>
                      <div style={s.itemActions}>
                        <button
                          style={s.ghostBtn}
                          disabled={!message.userId}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedId(message.id);
                            setReplyTargetId(message.id);
                          }}
                        >
                          Antworten
                        </button>
                        <button
                          style={s.dangerBtn}
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteMessage(message.id);
                          }}
                        >
                          Löschen
                        </button>
                      </div>
                    </div>
                    <div style={s.meta}>{message.text}</div>
                  </article>
                ))}
              </div>
            </section>

            <section style={s.panel}>
              <div style={s.composerTop}>
                <div style={s.panelTitle}>{replyTarget ? "Antwort" : "Globale Nachricht"}</div>
                {replyTarget ? <button style={s.ghostBtn} onClick={() => setReplyTargetId(null)}>Global senden</button> : null}
              </div>
              {replyTarget && (
                <div style={s.bubble(false)}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5 }}>Antwort auf: {replyTarget.location}</div>
                  {replyTarget.text}
                </div>
              )}
              {waiting.length > 0 && (
                <div style={s.outgoingList}>
                  {waiting.map((message) => (
                    <div key={message.id} style={s.outgoingItem}>
                      <div style={s.itemTop}>
                        <div>
                          <div style={s.itemTitle}>{message.category}</div>
                          <div style={s.meta}>{message.scope === "reply" ? `Antwort an ${message.recipientUserName || "Nutzer"}` : "Global"} · {message.createdAt}</div>
                        </div>
                        <button style={s.dangerBtn} onClick={() => deleteMessage(message.id)}>Löschen</button>
                      </div>
                      <div style={s.meta}>{message.message}</div>
                    </div>
                  ))}
                </div>
              )}
              {!replyTarget && (
                <select style={s.field} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CC_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                </select>
              )}
              <textarea style={s.textarea} placeholder={replyTarget ? "Antwort an Nutzer schreiben" : "Nachricht an alle Nutzer"} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              <button style={s.btn} disabled={saving || (replyTarget && !replyTarget.userId)} onClick={sendMessage}>{saved ? "Gespeichert" : replyTarget ? "Antwort senden" : "Global senden"}</button>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
