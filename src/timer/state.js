import { DEFAULT_TIME_FORMAT } from './constants.js';

const DEFAULT_ALERTS = [
  {
    id: 'alert-1',
    name: 'Alert 1',
    enabled: true,
    time: 480,
    timerAction: 'continue',
    sound: 'Timer complete',
    soundVolume: 1,
    soundEnabled: true,
    flash: true,
    flashDurationSeconds: 0.9,
    flashAlternateTimeSeconds: 0,
  },
  {
    id: 'alert-2',
    name: 'Alert 2',
    enabled: true,
    time: 60,
    timerAction: 'continue',
    sound: 'Countdown beep',
    soundVolume: 1,
    soundEnabled: true,
    flash: false,
    flashDurationSeconds: 0.9,
    flashAlternateTimeSeconds: 0,
  },
  {
    id: 'end-value',
    name: 'End value',
    enabled: true,
    time: 0,
    timerAction: 'stop',
    sound: 'Timer complete',
    soundVolume: 1,
    soundEnabled: false,
    flash: false,
    flashDurationSeconds: 0.9,
    flashAlternateTimeSeconds: 0,
  },
];

export const DEFAULT_TIMER_STATE = Object.freeze({
  schemaVersion: 2,
  durationSeconds: 600,
  remainingSeconds: 600,
  endSeconds: 0,
  mode: 'countdown',
  continueAfterEnd: true,
  displayStyle: {
    fontSizePx: 160,
    fontFamily: 'Roboto Mono',
    backgroundColor: '#0f1722',
    textColor: '#f3f7fb',
    flashBackgroundColor: '#ffffff',
    flashTextColor: '#000000',
  },
  isPaused: true,
  targetEpochMs: null,
  timeFormat: DEFAULT_TIME_FORMAT,
  alerts: DEFAULT_ALERTS,
  flashTest: null,
  updatedAt: 0,
});

const clampSeconds = (value) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value * 1000) / 1000);
};

const normalizeMode = (value) => value === 'countup' ? 'countup' : 'countdown';

const normalizeDisplayStyle = (value) => ({
  fontSizePx: Number.isFinite(value?.fontSizePx)
    ? Math.min(500, Math.max(20, Math.floor(value.fontSizePx)))
    : 160,
  fontFamily: typeof value?.fontFamily === 'string' && value.fontFamily.length > 0
    ? value.fontFamily
    : 'Roboto Mono',
  backgroundColor: typeof value?.backgroundColor === 'string' ? value.backgroundColor : '#0f1722',
  textColor: typeof value?.textColor === 'string' ? value.textColor : '#f3f7fb',
  flashBackgroundColor: typeof value?.flashBackgroundColor === 'string' ? value.flashBackgroundColor : '#ffffff',
  flashTextColor: typeof value?.flashTextColor === 'string' ? value.flashTextColor : '#000000',
});

const legacySoundNames = {
  '2_1bell.mp3': 'Timer complete',
  '2bell.mp3': 'Success chime',
  'bell.mp3': 'Ding',
  'bike_bell_long.mp3': 'Kitchen timer bell',
  'bike_bell_short.mp3': 'Countdown beep',
  'medium_bike_bell.mp3': 'Timer complete',
};

const normalizeAlert = (alert, index) => ({
  id: typeof alert?.id === 'string' && alert.id.length > 0 ? alert.id : `alert-${index + 1}`,
  name: typeof alert?.name === 'string' && alert.name.length > 0 ? alert.name : `Alert ${index + 1}`,
  enabled: alert?.enabled !== false,
  time: clampSeconds(alert?.time),
  timerAction: ['continue', 'pause', 'stop', 'restart'].includes(alert?.timerAction)
    ? alert.timerAction
    : 'continue',
  sound: typeof alert?.sound === 'string' ? (legacySoundNames[alert.sound] ?? alert.sound) : '',
  soundVolume: Number.isFinite(alert?.soundVolume)
    ? Math.min(1, Math.max(0, alert.soundVolume))
    : 1,
  soundEnabled: alert?.soundEnabled === true,
  flash: alert?.flash === true,
  flashDurationSeconds: Number.isFinite(alert?.flashDurationSeconds)
    ? Math.min(60, Math.max(0.1, alert.flashDurationSeconds))
    : 0.9,
  flashAlternateTimeSeconds: Number.isFinite(alert?.flashAlternateTimeSeconds)
    ? Math.min(60, Math.max(0, alert.flashAlternateTimeSeconds))
    : 0,
});

const normalizeFlashTest = (value) => Number.isFinite(value?.startedAt)
  ? {
      startedAt: value.startedAt,
      durationSeconds: Number.isFinite(value?.durationSeconds) ? Math.max(0.1, value.durationSeconds) : 0.9,
      alternateTimeSeconds: Number.isFinite(value?.alternateTimeSeconds) ? Math.max(0, value.alternateTimeSeconds) : 0,
    }
  : null;

export const normalizeTimerState = (value) => {
  const raw = value ?? {};
  const alerts = raw.schemaVersion === 2 && Array.isArray(raw.alerts)
    ? raw.alerts.map(normalizeAlert)
    : Array.isArray(raw.alerts) && raw.alerts.length > 0
      ? raw.alerts.map(normalizeAlert)
      : DEFAULT_ALERTS.map(normalizeAlert);

  return {
    schemaVersion: 2,
    durationSeconds: clampSeconds(raw.durationSeconds ?? 600),
    remainingSeconds: Number.isFinite(raw.remainingSeconds) ? raw.remainingSeconds : clampSeconds(raw.durationSeconds ?? 600),
    endSeconds: clampSeconds(raw.endSeconds ?? 0),
    mode: normalizeMode(raw.mode),
    continueAfterEnd: raw.continueAfterEnd !== false,
    displayStyle: normalizeDisplayStyle(raw.displayStyle),
    isPaused: raw.isPaused !== false,
    targetEpochMs: Number.isFinite(raw.targetEpochMs) ? raw.targetEpochMs : null,
    timeFormat: typeof raw.timeFormat === 'string' && raw.timeFormat.length > 0 ? raw.timeFormat : DEFAULT_TIME_FORMAT,
    alerts,
    flashTest: normalizeFlashTest(raw.flashTest),
    updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : 0,
  };
};

export const getRemainingSeconds = (value, now = Date.now()) => {
  const state = normalizeTimerState(value);

  if (state.isPaused || state.targetEpochMs === null) {
    return state.remainingSeconds;
  }

  const elapsedSeconds = Math.max(0, now - state.targetEpochMs) / 1000;
  const currentSeconds = state.mode === 'countdown'
    ? state.remainingSeconds - elapsedSeconds
    : state.remainingSeconds + elapsedSeconds;

  if (state.continueAfterEnd) {
    return currentSeconds;
  }

  return state.mode === 'countdown'
    ? Math.max(state.endSeconds, currentSeconds)
    : Math.min(state.endSeconds, currentSeconds);
};

export const hasReachedEnd = (value, now = Date.now()) => {
  const state = normalizeTimerState(value);
  const seconds = getRemainingSeconds(state, now);
  return state.mode === 'countdown' ? seconds <= state.endSeconds : seconds >= state.endSeconds;
};

export const reduceTimerState = (value, action, now = Date.now()) => {
  const state = normalizeTimerState(value);
  const remainingSeconds = getRemainingSeconds(state, now);

  switch (action.type) {
    case 'setDuration': {
      const durationSeconds = clampSeconds(action.durationSeconds);

      return normalizeTimerState({
        ...state,
        durationSeconds,
        remainingSeconds: durationSeconds,
        targetEpochMs: state.isPaused ? null : now,
        updatedAt: now,
      });
    }
    case 'setCurrentSeconds':
      return normalizeTimerState({
        ...state,
        remainingSeconds: clampSeconds(action.currentSeconds),
        targetEpochMs: state.isPaused ? null : now,
        updatedAt: now,
      });
    case 'setEndSeconds':
      return normalizeTimerState({ ...state, endSeconds: clampSeconds(action.endSeconds), updatedAt: now });
    case 'setMode': {
      const mode = normalizeMode(action.mode);
      if (mode === state.mode) {
        return state;
      }
      const durationSeconds = state.endSeconds;
      const endSeconds = state.durationSeconds;
      return normalizeTimerState({
        ...state,
        mode,
        durationSeconds,
        endSeconds,
        remainingSeconds: state.isPaused ? durationSeconds : remainingSeconds,
        isPaused: state.isPaused,
        targetEpochMs: state.isPaused ? null : now,
        updatedAt: now,
      });
    }
    case 'setContinueAfterEnd':
      return normalizeTimerState({ ...state, continueAfterEnd: action.continueAfterEnd === true, updatedAt: now });
    case 'setDisplayStyle':
      return normalizeTimerState({
        ...state,
        displayStyle: { ...state.displayStyle, ...action.style },
        updatedAt: now,
      });
    case 'start': {
      const atOrPastEnd = state.mode === 'countdown'
        ? remainingSeconds <= state.endSeconds
        : remainingSeconds >= state.endSeconds;
      if (!state.continueAfterEnd && atOrPastEnd) {
        return normalizeTimerState({
          ...state,
          remainingSeconds: 0,
          isPaused: true,
          targetEpochMs: null,
          updatedAt: now,
        });
      }

      return normalizeTimerState({
        ...state,
        remainingSeconds,
        isPaused: false,
        targetEpochMs: now,
        updatedAt: now,
      });
    }
    case 'pause':
      return normalizeTimerState({
        ...state,
        remainingSeconds,
        isPaused: true,
        targetEpochMs: null,
        updatedAt: now,
      });
    case 'restart':
      return normalizeTimerState({
        ...state,
        remainingSeconds: state.durationSeconds,
        isPaused: false,
        targetEpochMs: now,
        updatedAt: now,
      });
    case 'reset':
      return normalizeTimerState({
        ...state,
        remainingSeconds: state.durationSeconds,
        isPaused: true,
        targetEpochMs: null,
        updatedAt: now,
      });
    case 'resetFactory':
      return normalizeTimerState({
        ...DEFAULT_TIMER_STATE,
        updatedAt: now,
      });
    case 'clear':
      return normalizeTimerState({
        ...state,
        remainingSeconds: state.mode === 'countdown' ? state.endSeconds : 0,
        isPaused: true,
        targetEpochMs: null,
        updatedAt: now,
      });
    case 'setTimeFormat':
      return normalizeTimerState({
        ...state,
        timeFormat: action.timeFormat || DEFAULT_TIME_FORMAT,
        updatedAt: now,
      });
    case 'replaceAlerts':
      return normalizeTimerState({
        ...state,
        alerts: Array.isArray(action.alerts) ? action.alerts : [],
        updatedAt: now,
      });
    case 'triggerCue': {
      const cue = state.alerts.find((alert) => alert.id === action.cueId && alert.enabled);
      if (!cue || cue.timerAction === 'continue') {
        return state;
      }
      if (cue.timerAction === 'restart') {
        return normalizeTimerState({
          ...state,
          remainingSeconds: state.durationSeconds,
          isPaused: false,
          targetEpochMs: now,
          updatedAt: now,
        });
      }
      if (cue.timerAction === 'stop') {
        return normalizeTimerState({
          ...state,
          remainingSeconds: 0,
          isPaused: true,
          targetEpochMs: null,
          updatedAt: now,
        });
      }
      return normalizeTimerState({
        ...state,
        remainingSeconds: cue.time,
        isPaused: true,
        targetEpochMs: null,
        updatedAt: now,
      });
    }
    case 'testFlash':
      return normalizeTimerState({
        ...state,
        flashTest: {
          startedAt: now,
          durationSeconds: action.durationSeconds,
          alternateTimeSeconds: action.alternateTimeSeconds,
        },
        updatedAt: now,
      });
    default:
      return state;
  }
};
