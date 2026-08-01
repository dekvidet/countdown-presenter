export type AlertConfig = {
  id: string;
  time: number;
  sound: string;
  soundEnabled: boolean;
  flash: boolean;
  flashDurationSeconds: number;
};

export type TimerMode = 'countdown' | 'countup';

export type DisplayStyle = {
  fontSizePx: number;
  backgroundColor: string;
  textColor: string;
  flashBackgroundColor: string;
  flashTextColor: string;
};

export type TimerState = {
  durationSeconds: number;
  remainingSeconds: number;
  endSeconds: number;
  mode: TimerMode;
  continueAfterEnd: boolean;
  displayStyle: DisplayStyle;
  isPaused: boolean;
  targetEpochMs: number | null;
  timeFormat: string;
  alerts: AlertConfig[];
  updatedAt: number;
};

export type TimerAction =
  | { type: 'setDuration'; durationSeconds: number }
  | { type: 'setEndSeconds'; endSeconds: number }
  | { type: 'setMode'; mode: TimerMode }
  | { type: 'setContinueAfterEnd'; continueAfterEnd: boolean }
  | { type: 'setDisplayStyle'; style: Partial<DisplayStyle> }
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
