function initStore() {
  if (!globalThis.mrklsStore) {
    globalThis.mrklsStore = {
      waitingCitizenMessages: [],
      receivedCitizenMessages: [],
      waitingControlCenterMessages: [],
      deliveredControlCenterMessages: [],
      droneCargo: {
        citizenMessages: [],
        controlCenterMessages: [],
      },
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
  if (!globalThis.mrklsClients) {
    globalThis.mrklsClients = new Set();
  }
  globalThis.mrklsStore.waitingCitizenMessages ||= [];
  globalThis.mrklsStore.deliveredControlCenterMessages ||= [];
  globalThis.mrklsStore.droneCycleCount ||= 0;
  globalThis.mrklsStore.droneLastLeg ||= "station";
}

export async function GET(request) {
  initStore();

  const encoder = new TextEncoder();
  let clientController;

  const stream = new ReadableStream({
    start(controller) {
      clientController = controller;
      globalThis.mrklsClients.add(controller);
      controller.enqueue(encoder.encode("event: connected\ndata: {}\n\n"));

      request.signal.addEventListener("abort", () => {
        globalThis.mrklsClients.delete(controller);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
