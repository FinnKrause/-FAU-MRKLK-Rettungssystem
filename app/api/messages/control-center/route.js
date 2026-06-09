function initStore() {
  if (!globalThis.mrklsStore) {
    globalThis.mrklsStore = {
      waitingCitizenMessages: [],
      receivedCitizenMessages: [],
      waitingControlCenterMessages: [],
      deliveredControlCenterMessages: [],
      droneCargo: { citizenMessages: [], controlCenterMessages: [] },
      droneCycleCount: 0,
      droneLastLeg: "station",
      droneStatus: {
        id: "D-01",
        location: "Wache Nürnberg",
        state: "wartet",
        lastAction: "Keine Aktion",
      },
    };
  }
  if (!globalThis.mrklsClients) globalThis.mrklsClients = new Set();
  globalThis.mrklsStore.waitingCitizenMessages ||= [];
  globalThis.mrklsStore.deliveredControlCenterMessages ||= [];
  globalThis.mrklsStore.droneCycleCount ||= 0;
  globalThis.mrklsStore.droneLastLeg ||= "station";
}

function broadcast(eventName, data) {
  if (!globalThis.mrklsClients) return;
  const encoder = new TextEncoder();
  const msg = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  const dead = [];
  for (const ctrl of globalThis.mrklsClients) {
    try {
      ctrl.enqueue(encoder.encode(msg));
    } catch {
      dead.push(ctrl);
    }
  }
  dead.forEach((c) => globalThis.mrklsClients.delete(c));
}

export async function POST(request) {
  initStore();
  const store = globalThis.mrklsStore;

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const entry = {
    id: Date.now(),
    category: body.category || "Allgemeine Information",
    message: body.message || "",
    createdAt: body.createdAt || new Date().toLocaleTimeString("de-DE"),
    scope: body.scope === "reply" ? "reply" : "global",
    recipientUserId: body.recipientUserId || null,
    recipientUserName: body.recipientUserName || null,
    replyToMessageId: body.replyToMessageId || null,
    replyToText: body.replyToText || null,
  };

  const loadedToDrone = store.droneStatus.location === "Wache Nürnberg";

  if (loadedToDrone) {
    store.droneCargo.controlCenterMessages.push(entry);
    store.droneStatus.lastAction =
      "Wache-Nachricht direkt auf Drohne geladen";
    broadcast("drone-loaded-station-data", { loadedCount: 1 });
  } else {
    store.waitingControlCenterMessages.push(entry);
  }

  broadcast("new-control-center-message", { id: entry.id });

  return Response.json({ success: true, message: entry, loadedToDrone });
}
