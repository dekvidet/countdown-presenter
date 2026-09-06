import { createContext } from 'react';
import type { ConnectionState } from './sync/types';
import type { AlertConfig, DisplayStyle, RuntimeConfig, TimerMode, TimerState } from './types';

export type TimerContextValue = {
  timerState: TimerState;
  remainingSeconds: number;
  isPaused: boolean;
  connectionState: ConnectionState;
  displayConnected: boolean;
  runtimeConfig: RuntimeConfig | null;
  setDurationSeconds: (durationSeconds: number) => void;
  setCurrentSeconds: (currentSeconds: number) => void;
  setEndSeconds: (endSeconds: number) => void;
  setMode: (mode: TimerMode) => void;
  setContinueAfterEnd: (continueAfterEnd: boolean) => void;
  setDisplayStyle: (style: Partial<DisplayStyle>) => void;
  start: () => void;
  pause: () => void;
  restart: () => void;
  reset: () => void;
  resetFactory: () => void;
  clear: () => void;
  setTimeFormat: (timeFormat: string) => void;
  replaceAlerts: (alerts: AlertConfig[]) => void;
  triggerCue: (cueId: string) => void;
  testFlash: (durationSeconds: number, alternateTimeSeconds: number) => void;
};

export const TimerSyncContext = createContext<TimerContextValue | null>(null);
