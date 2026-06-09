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
  globalThis.mrklsStore.waitingCitizenMessages ||= [];
  globalThis.mrklsStore.deliveredControlCenterMessages ||= [];
  globalThis.mrklsStore.droneCycleCount ||= 0;
  globalThis.mrklsStore.droneLastLeg ||= "station";
}

export async function GET() {
  initStore();
  const store = globalThis.mrklsStore;

  return Response.json({
    droneStatus: store.droneStatus,
    droneCargoCount: {
      citizen: store.droneCargo.citizenMessages.length,
      controlCenter: store.droneCargo.controlCenterMessages.length,
    },
    receivedCitizenCount: store.receivedCitizenMessages.length,
    waitingControlCenterCount: store.waitingControlCenterMessages.length,
    receivedCitizenMessages: store.receivedCitizenMessages,
    waitingCitizenMessages: store.waitingCitizenMessages,
    droneCitizenMessages: store.droneCargo.citizenMessages,
    waitingControlCenterMessages: store.waitingControlCenterMessages,
    deliveredControlCenterMessages: store.deliveredControlCenterMessages,
    droneCycleCount: store.droneCycleCount,
  });
}
