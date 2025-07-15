/// <reference lib="webworker" />

declare const self: SharedWorkerGlobalScope;

const ports = new Set<MessagePort>();

const broadcast = (data: { rawTime: number; formattedTime: string }) => {
  for (const port of ports) {
    port.postMessage(data);
  }
};

self.onconnect = (e: MessageEvent) => {
  const port = e.ports[0];
  ports.add(port);

  port.onmessage = (event: MessageEvent) => {
    const { type, payload } = event.data;

    if (type === 'update') {
      broadcast(payload);
    }
  };

  port.start();
};