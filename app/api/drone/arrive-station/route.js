function initStore() {
  if (!globalThis.mrklsStore) {
    globalThis.mrklsStore = {
      waitingCitizenMessages: [],
      receivedCitizenMessages: [],
      waitingControlCenterMessages: [],
      deliveredControlCenterMessages: [],
      droneCycleCount: 0,
      droneLastLeg: "station",
      droneCargo: { citizenMessages: [], controlCenterMessages: [] },
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

export async function POST() {
  initStore();
  const store = globalThis.mrklsStore;

  if (store.droneStatus.location === "Wache Nürnberg") {
    store.droneStatus.lastAction =
      "Drohne ist bereits bei der Wache - kein neuer Datenaustausch";

    return Response.json({
      success: true,
      alreadyAtLocation: true,
      deliveredCitizenMessages: 0,
      loadedControlCenterMessages: 0,
      droneStatus: store.droneStatus,
    });
  }

  store.droneStatus.location = "Wache Nürnberg";
  store.droneStatus.state = "bei Wache";
  store.droneStatus.lastAction = "Drohne bei Wache angekommen";
  if (store.droneLastLeg === "users") {
    store.droneCycleCount += 1;
  }
  store.droneLastLeg = "station";

  const deliveredCount = store.droneCargo.citizenMessages.length;
  store.receivedCitizenMessages.push(
    ...store.droneCargo.citizenMessages.map((message) => ({
      ...message,
      status: "An Leitstelle zugestellt",
    })),
  );
  store.droneCargo.citizenMessages = [];

  broadcast("drone-delivered-to-station", { deliveredCount });

  const loadedCount = store.waitingControlCenterMessages.length;
  store.droneCargo.controlCenterMessages.push(
    ...store.waitingControlCenterMessages,
  );
  store.waitingControlCenterMessages = [];

  broadcast("drone-loaded-station-data", { loadedCount });

  return Response.json({
    success: true,
    deliveredCitizenMessages: deliveredCount,
    loadedControlCenterMessages: loadedCount,
    droneCycleCount: store.droneCycleCount,
    droneStatus: store.droneStatus,
  });
}
