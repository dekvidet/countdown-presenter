export type AlertConfig = {
  id: string;
  time: number;
  sound: string;
};

export type TimerState = {
  durationSeconds: number;
  remainingSeconds: number;
  isPaused: boolean;
  targetEpochMs: number | null;
  timeFormat: string;
  alerts: AlertConfig[];
  updatedAt: number;
};

export type TimerAction =
  | { type: 'setDuration'; durationSeconds: number }
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'reset' }
  | { type: 'clear' }
  | { type: 'setTimeFormat'; timeFormat: string }
  | { type: 'replaceAlerts'; alerts: AlertConfig[] };

export type RuntimeConfig = {
  transport: 'websocket';
  localOrigin: string;
  remoteOrigin: string | null;
};
