import type { RuntimeConfig } from '../types';
import { createLocalTimerSyncClient } from './localClient';
import { createWebsocketTimerSyncClient } from './websocketClient';

export const createTimerSyncClient = (runtimeConfig: RuntimeConfig | null) => {
  if (runtimeConfig?.transport === 'websocket') {
    return createWebsocketTimerSyncClient(runtimeConfig);
  }

  return createLocalTimerSyncClient();
};
