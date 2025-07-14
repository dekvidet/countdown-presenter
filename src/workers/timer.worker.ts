const ports = new Set<MessagePort>();

const broadcast = (data: { rawTime: number; formattedTime: string }) => {
  for (const port of ports) {
    port.postMessage(data);
  }
};

onconnect = (e) => {
  const port = e.ports[0];
  ports.add(port);

  port.onmessage = (event) => {
    const { type, payload } = event.data;

    if (type === 'update') {
      broadcast(payload);
    }
  };

  port.start();
};
