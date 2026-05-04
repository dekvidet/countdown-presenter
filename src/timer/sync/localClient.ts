import { LOCAL_SYNC_CHANNEL_NAME, LOCAL_SYNC_STORAGE_KEY } from '../constants.js';
import { DEFAULT_TIMER_STATE, normalizeTimerState, reduceTimerState } from '../state.js';
import type { TimerAction } from '../types';
import type { TimerSyncClient, TimerSyncSnapshot } from './types';

const readStoredState = () => {
  const rawValue = window.localStorage.getItem(LOCAL_SYNC_STORAGE_KEY);

  if (!rawValue) {
    return DEFAULT_TIMER_STATE;
  }

  try {
    return normalizeTimerState(JSON.parse(rawValue));
  } catch {
    return DEFAULT_TIMER_STATE;
  }
};

export const createLocalTimerSyncClient = (): TimerSyncClient => {
  const channel = typeof BroadcastChannel === 'undefined'
    ? null
    : new BroadcastChannel(LOCAL_SYNC_CHANNEL_NAME);
  const listeners = new Set<() => void>();

  let snapshot: TimerSyncSnapshot = {
    timerState: readStoredState(),
    connectionState: 'local',
  };

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const publishState = (timerState: TimerSyncSnapshot['timerState']) => {
    snapshot = {
      ...snapshot,
      timerState,
    };

    window.localStorage.setItem(LOCAL_SYNC_STORAGE_KEY, JSON.stringify(timerState));
    channel?.postMessage(timerState);
    notify();
  };

  const applyIncomingState = (value: unknown) => {
    const incomingState = normalizeTimerState(value);

    if (incomingState.updatedAt < snapshot.timerState.updatedAt) {
      return;
    }

    snapshot = {
      ...snapshot,
      timerState: incomingState,
    };
    notify();
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== LOCAL_SYNC_STORAGE_KEY || !event.newValue) {
      return;
    }

    try {
      applyIncomingState(JSON.parse(event.newValue));
    } catch {
      return;
    }
  };

  const handleChannelMessage = (event: MessageEvent) => {
    applyIncomingState(event.data);
  };

  window.addEventListener('storage', handleStorage);
  channel?.addEventListener('message', handleChannelMessage);

  if (snapshot.timerState.updatedAt === 0) {
    publishState(DEFAULT_TIMER_STATE);
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    dispatch: (action: TimerAction) => {
      const timerState = reduceTimerState(snapshot.timerState, action, Date.now());
      publishState(timerState);
    },
    destroy: () => {
      window.removeEventListener('storage', handleStorage);
      channel?.removeEventListener('message', handleChannelMessage);
      channel?.close();
      listeners.clear();
    },
  };
};
