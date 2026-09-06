export type CueTimerAction = 'continue' | 'pause' | 'stop' | 'restart';

export type AlertConfig = {
  id: string;
  name: string;
  enabled: boolean;
  time: number;
  timerAction: CueTimerAction;
  sound: string;
  soundVolume: number;
  soundEnabled: boolean;
  flash: boolean;
  flashDurationSeconds: number;
  flashAlternateTimeSeconds: number;
};

export type TimerMode = 'countdown' | 'countup';

export type DisplayStyle = {
  fontSizePx: number;
  fontFamily: string;
  backgroundColor: string;
  textColor: string;
  flashBackgroundColor: string;
  flashTextColor: string;
};

export type FlashTest = {
  startedAt: number;
  durationSeconds: number;
  alternateTimeSeconds: number;
};

export type TimerState = {
  schemaVersion: 2;
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
  flashTest: FlashTest | null;
  updatedAt: number;
};

export type TimerAction =
  | { type: 'setDuration'; durationSeconds: number }
  | { type: 'setCurrentSeconds'; currentSeconds: number }
  | { type: 'setEndSeconds'; endSeconds: number }
  | { type: 'setMode'; mode: TimerMode }
  | { type: 'setContinueAfterEnd'; continueAfterEnd: boolean }
  | { type: 'setDisplayStyle'; style: Partial<DisplayStyle> }
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'restart' }
  | { type: 'reset' }
  | { type: 'resetFactory' }
  | { type: 'clear' }
  | { type: 'setTimeFormat'; timeFormat: string }
  | { type: 'replaceAlerts'; alerts: AlertConfig[] }
  | { type: 'triggerCue'; cueId: string }
  | { type: 'testFlash'; durationSeconds: number; alternateTimeSeconds: number };

export type RuntimeConfig = {
  transport: 'websocket';
  localOrigin: string;
  remoteOrigin: string | null;
};
