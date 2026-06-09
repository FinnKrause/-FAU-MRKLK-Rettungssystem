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

  const loadedToDrone = store.droneStatus.location === "Endnutzergebiet Nürnberg";
  const entry = {
    id: Date.now(),
    userId: body.userId || null,
    userName: body.userName || "Unbekannt",
    category: body.category || "Hilfebedarf",
    location: body.location || "",
    text: body.text || "",
    createdAt: body.createdAt || new Date().toLocaleTimeString("de-DE"),
    status: loadedToDrone ? "An Drohne übertragen" : "Gespeichert",
  };

  if (loadedToDrone) {
    store.droneCargo.citizenMessages.push(entry);
    store.droneStatus.lastAction = "Nutzermeldung direkt auf Drohne geladen";
    broadcast("drone-picked-up-user-data", { pickedUpCount: 1 });
  } else {
    store.waitingCitizenMessages.push(entry);
  }

  broadcast("new-citizen-message", { id: entry.id });

  return Response.json({ success: true, message: entry, loadedToDrone });
}
