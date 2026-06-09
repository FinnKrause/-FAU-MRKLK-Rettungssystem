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

const removeById = (items, id) => {
  const before = items.length;
  const next = items.filter((item) => String(item.id) !== String(id));
  return { next, removed: before - next.length };
};

export async function DELETE(request) {
  initStore();
  const store = globalThis.mrklsStore;

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const id = body.id;
  if (!id) {
    return Response.json({ success: false, error: "Missing id" }, { status: 400 });
  }

  let removed = 0;
  let result = removeById(store.waitingCitizenMessages, id);
  store.waitingCitizenMessages = result.next;
  removed += result.removed;

  result = removeById(store.receivedCitizenMessages, id);
  store.receivedCitizenMessages = result.next;
  removed += result.removed;

  result = removeById(store.droneCargo.citizenMessages, id);
  store.droneCargo.citizenMessages = result.next;
  removed += result.removed;

  result = removeById(store.waitingControlCenterMessages, id);
  store.waitingControlCenterMessages = result.next;
  removed += result.removed;

  result = removeById(store.deliveredControlCenterMessages, id);
  store.deliveredControlCenterMessages = result.next;
  removed += result.removed;

  result = removeById(store.droneCargo.controlCenterMessages, id);
  store.droneCargo.controlCenterMessages = result.next;
  removed += result.removed;

  if (removed > 0) {
    broadcast("message-deleted", { id });
  }

  return Response.json({ success: true, removed });
}
