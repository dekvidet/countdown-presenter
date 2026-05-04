import { DEFAULT_TIMER_STATE, normalizeTimerState } from '../state.js';
import type { RuntimeConfig, TimerAction } from '../types';
import type { ConnectionState, TimerSyncClient, TimerSyncSnapshot } from './types';

const reconnectDelayMs = 1500;

const createWebsocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
};

export const createWebsocketTimerSyncClient = (runtimeConfig: RuntimeConfig): TimerSyncClient => {
  const listeners = new Set<() => void>();
  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let destroyed = false;

  let snapshot: TimerSyncSnapshot = {
    timerState: DEFAULT_TIMER_STATE,
    connectionState: 'connecting',
  };

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const updateConnectionState = (connectionState: ConnectionState) => {
    snapshot = {
      ...snapshot,
      connectionState,
    };
    notify();
  };

  const connect = () => {
    if (destroyed) {
      return;
    }

    updateConnectionState('connecting');
    socket = new WebSocket(createWebsocketUrl());

    socket.addEventListener('open', () => {
      updateConnectionState('connected');
    });

    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data) as { type: string; state?: unknown };

        if (payload.type !== 'state' && payload.type !== 'init') {
          return;
        }

        snapshot = {
          ...snapshot,
          timerState: normalizeTimerState(payload.state ?? DEFAULT_TIMER_STATE),
          connectionState: 'connected',
        };
        notify();
      } catch {
        return;
      }
    });

    socket.addEventListener('close', () => {
      socket = null;
      if (destroyed) {
        return;
      }

      updateConnectionState('disconnected');
      reconnectTimer = window.setTimeout(connect, reconnectDelayMs);
    });

    socket.addEventListener('error', () => {
      socket?.close();
    });
  };

  connect();

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    dispatch: (action: TimerAction) => {
      if (socket?.readyState !== WebSocket.OPEN) {
        return;
      }

      socket.send(JSON.stringify({
        type: 'action',
        action,
        source: runtimeConfig.localOrigin,
      }));
    },
    destroy: () => {
      destroyed = true;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close();
      listeners.clear();
    },
  };
};
