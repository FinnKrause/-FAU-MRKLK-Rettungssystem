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
    body = { messages: [] };
  }

  const userId = body.userId || "";
  const toPickUp = store.waitingCitizenMessages
    .filter((m) => !userId || m.userId === userId)
    .map((m) => ({ ...m, status: "An Drohne übertragen" }));

  store.droneCargo.citizenMessages.push(...toPickUp);
  store.waitingCitizenMessages = store.waitingCitizenMessages.filter(
    (m) => userId && m.userId !== userId,
  );

  const deliveredAlerts = store.deliveredControlCenterMessages.filter(
    (m) => m.scope === "global" || m.recipientUserId === userId,
  );

  broadcast("drone-picked-up-user-data", { pickedUpCount: toPickUp.length });

  return Response.json({
    success: true,
    pickedUpCount: toPickUp.length,
    deliveredAlerts,
  });
}
