import { createContext } from 'react';
import type { ConnectionState } from './sync/types';
import type { AlertConfig, RuntimeConfig, TimerState } from './types';

export type TimerContextValue = {
  timerState: TimerState;
  remainingSeconds: number;
  isPaused: boolean;
  connectionState: ConnectionState;
  runtimeConfig: RuntimeConfig | null;
  setDurationSeconds: (durationSeconds: number) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  clear: () => void;
  setTimeFormat: (timeFormat: string) => void;
  replaceAlerts: (alerts: AlertConfig[]) => void;
};

export const TimerSyncContext = createContext<TimerContextValue | null>(null);
