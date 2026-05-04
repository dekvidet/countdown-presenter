import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_TIMER_STATE,
  normalizeTimerState,
  reduceTimerState,
} from '../src/timer/state.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
};

const getContentType = (filePath) => mimeTypes[path.extname(filePath)] ?? 'application/octet-stream';

const getPrimaryLanAddress = () => {
  const interfaces = networkInterfaces();

  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses ?? []) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }

  return null;
};

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
};

const resolveAssetPath = (requestPathname) => {
  const normalizedPath = requestPathname === '/' ? '/index.html' : requestPathname;
  const candidatePath = path.normalize(path.join(distDir, normalizedPath));

  if (!candidatePath.startsWith(distDir)) {
    return null;
  }

  return candidatePath;
};

export const startDesktopServer = async ({ port = 0 } = {}) => {
  let timerState = normalizeTimerState(DEFAULT_TIMER_STATE);
  let localOrigin = '';
  let remoteOrigin = null;

  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');

    if (requestUrl.pathname === '/runtime-config.json') {
      sendJson(response, 200, {
        transport: 'websocket',
        localOrigin,
        remoteOrigin,
      });
      return;
    }

    const assetPath = resolveAssetPath(requestUrl.pathname);
    if (!assetPath) {
      response.writeHead(403).end('Forbidden');
      return;
    }

    let filePath = assetPath;
    let fileExists = existsSync(filePath);

    if (fileExists) {
      const fileStat = await stat(filePath);
      if (fileStat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
        fileExists = existsSync(filePath);
      }
    }

    if (!fileExists) {
      filePath = path.join(distDir, 'index.html');
    }

    response.writeHead(200, {
      'Content-Type': getContentType(filePath),
      'Cache-Control': filePath.endsWith('index.html') ? 'no-store' : 'public, max-age=31536000, immutable',
    });
    createReadStream(filePath).pipe(response);
  });

  const websocketServer = new WebSocketServer({
    noServer: true,
  });

  const broadcastState = (type = 'state') => {
    const payload = JSON.stringify({
      type,
      state: timerState,
    });

    for (const client of websocketServer.clients) {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    }
  };

  websocketServer.on('connection', (socket) => {
    socket.send(JSON.stringify({
      type: 'init',
      state: timerState,
    }));

    socket.on('message', (rawMessage) => {
      try {
        const payload = JSON.parse(rawMessage.toString());

        if (payload?.type !== 'action' || !payload.action) {
          return;
        }

        timerState = reduceTimerState(timerState, payload.action, Date.now());
        broadcastState('state');
      } catch {
        return;
      }
    });
  });

  server.on('upgrade', (request, socket, head) => {
    const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');

    if (requestUrl.pathname !== '/ws') {
      socket.destroy();
      return;
    }

    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit('connection', websocket, request);
    });
  });

  await new Promise((resolve) => {
    server.listen(port, '0.0.0.0', resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to start desktop server');
  }

  const lanAddress = getPrimaryLanAddress();
  localOrigin = `http://127.0.0.1:${address.port}`;
  remoteOrigin = lanAddress ? `http://${lanAddress}:${address.port}` : null;

  return {
    localOrigin,
    remoteOrigin,
    close: async () => {
      await new Promise((resolve) => websocketServer.close(resolve));
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(undefined);
        });
      });
    },
  };
};
