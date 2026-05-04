import type { TimerAction, TimerState } from '../types';

export type ConnectionState = 'local' | 'connecting' | 'connected' | 'disconnected';

export type TimerSyncSnapshot = {
  timerState: TimerState;
  connectionState: ConnectionState;
};

export type TimerSyncClient = {
  getSnapshot: () => TimerSyncSnapshot;
  subscribe: (listener: () => void) => () => void;
  dispatch: (action: TimerAction) => void;
  destroy: () => void;
};
