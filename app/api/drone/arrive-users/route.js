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

  if (store.droneStatus.location === "Endnutzergebiet Nürnberg") {
    store.droneStatus.lastAction =
      "Drohne ist bereits bei den Endnutzern - kein neuer Datenaustausch";

    return Response.json({
      success: true,
      alreadyAtLocation: true,
      droneStatus: store.droneStatus,
    });
  }

  store.droneStatus.location = "Endnutzergebiet Nürnberg";
  store.droneStatus.state = "bei Endnutzern";
  store.droneStatus.lastAction = "Drohne bei Endnutzern angekommen";
  store.droneLastLeg = "users";

  const deliveredAlerts = [...store.droneCargo.controlCenterMessages];
  store.deliveredControlCenterMessages.push(...deliveredAlerts);
  store.droneCargo.controlCenterMessages = [];

  broadcast("drone-arrived-users", {
    timestamp: Date.now(),
    deliveredAlertCount: deliveredAlerts.length,
  });

  return Response.json({
    success: true,
    deliveredAlertCount: deliveredAlerts.length,
    droneCycleCount: store.droneCycleCount,
    droneStatus: store.droneStatus,
  });
}
