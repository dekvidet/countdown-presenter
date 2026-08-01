import { DEFAULT_TIME_FORMAT } from './constants.js';

export const DEFAULT_TIMER_STATE = Object.freeze({
  durationSeconds: 600,
  remainingSeconds: 600,
  endSeconds: 0,
  mode: 'countdown',
  continueAfterEnd: true,
  displayStyle: {
    fontSizePx: 160,
    backgroundColor: '#0f1722',
    textColor: '#f3f7fb',
    flashBackgroundColor: '#ffffff',
    flashTextColor: '#000000',
  },
  isPaused: true,
  targetEpochMs: null,
  timeFormat: DEFAULT_TIME_FORMAT,
  alerts: [],
  updatedAt: 0,
});

const clampSeconds = (value) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
};

const normalizeMode = (value) => value === 'countup' ? 'countup' : 'countdown';

const normalizeDisplayStyle = (value) => ({
  fontSizePx: Number.isFinite(value?.fontSizePx)
    ? Math.min(1000, Math.max(12, Math.floor(value.fontSizePx)))
    : 160,
  backgroundColor: typeof value?.backgroundColor === 'string' ? value.backgroundColor : '#0f1722',
  textColor: typeof value?.textColor === 'string' ? value.textColor : '#f3f7fb',
  flashBackgroundColor: typeof value?.flashBackgroundColor === 'string' ? value.flashBackgroundColor : '#ffffff',
  flashTextColor: typeof value?.flashTextColor === 'string' ? value.flashTextColor : '#000000',
});

const normalizeAlert = (alert, index) => ({
  id: typeof alert?.id === 'string' && alert.id.length > 0 ? alert.id : `alert-${index + 1}`,
  time: clampSeconds(alert?.time),
  sound: typeof alert?.sound === 'string' ? alert.sound : '',
  soundEnabled: alert?.soundEnabled === true,
  flash: alert?.flash === true,
  flashDurationSeconds: Number.isFinite(alert?.flashDurationSeconds)
    ? Math.min(60, Math.max(0.1, alert.flashDurationSeconds))
    : 0.9,
});

export const normalizeTimerState = (value) => {
  const raw = value ?? {};

  return {
    durationSeconds: clampSeconds(raw.durationSeconds ?? 600),
    remainingSeconds: Number.isFinite(raw.remainingSeconds) ? Math.floor(raw.remainingSeconds) : clampSeconds(raw.durationSeconds ?? 600),
    endSeconds: clampSeconds(raw.endSeconds ?? 0),
    mode: normalizeMode(raw.mode),
    continueAfterEnd: raw.continueAfterEnd !== false,
    displayStyle: normalizeDisplayStyle(raw.displayStyle),
    isPaused: raw.isPaused !== false,
    targetEpochMs: Number.isFinite(raw.targetEpochMs) ? raw.targetEpochMs : null,
    timeFormat: typeof raw.timeFormat === 'string' && raw.timeFormat.length > 0 ? raw.timeFormat : DEFAULT_TIME_FORMAT,
    alerts: Array.isArray(raw.alerts) ? raw.alerts.map(normalizeAlert) : [],
    updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : 0,
  };
};

export const getRemainingSeconds = (value, now = Date.now()) => {
  const state = normalizeTimerState(value);

  if (state.isPaused || state.targetEpochMs === null) {
    return state.remainingSeconds;
  }

  const elapsedSeconds = Math.floor(Math.max(0, now - state.targetEpochMs) / 1000);
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
    case 'setEndSeconds':
      return normalizeTimerState({ ...state, endSeconds: clampSeconds(action.endSeconds), updatedAt: now });
    case 'setMode': {
      const mode = normalizeMode(action.mode);
      const durationSeconds = mode === state.mode ? state.durationSeconds : (mode === 'countup' ? 0 : 600);
      const endSeconds = mode === state.mode ? state.endSeconds : (mode === 'countup' ? 600 : 0);
      return normalizeTimerState({
        ...state,
        mode,
        durationSeconds,
        endSeconds,
        remainingSeconds: durationSeconds,
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
    case 'reset':
      return normalizeTimerState({
        ...state,
        remainingSeconds: state.durationSeconds,
        isPaused: true,
        targetEpochMs: null,
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
    default:
      return state;
  }
};
