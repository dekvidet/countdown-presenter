import type { RuntimeConfig } from './types';

const runtimeConfigUrl = () => new URL('runtime-config.json', `${window.location.origin}${window.location.pathname}`);

export const loadRuntimeConfig = async (): Promise<RuntimeConfig | null> => {
  try {
    const response = await fetch(runtimeConfigUrl(), {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();

    if (payload?.transport !== 'websocket' || typeof payload?.localOrigin !== 'string') {
      return null;
    }

    return {
      transport: 'websocket',
      localOrigin: payload.localOrigin,
      remoteOrigin: typeof payload.remoteOrigin === 'string' ? payload.remoteOrigin : null,
    };
  } catch {
    return null;
  }
};
