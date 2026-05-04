import { DEFAULT_TIME_FORMAT } from './constants.js';

export const DEFAULT_TIMER_STATE = Object.freeze({
  durationSeconds: 0,
  remainingSeconds: 0,
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

const normalizeAlert = (alert, index) => ({
  id: typeof alert?.id === 'string' && alert.id.length > 0 ? alert.id : `alert-${index + 1}`,
  time: clampSeconds(alert?.time),
  sound: typeof alert?.sound === 'string' ? alert.sound : '',
});

export const normalizeTimerState = (value) => {
  const raw = value ?? {};

  return {
    durationSeconds: clampSeconds(raw.durationSeconds),
    remainingSeconds: clampSeconds(raw.remainingSeconds),
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

  return Math.max(0, Math.ceil((state.targetEpochMs - now) / 1000));
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
        targetEpochMs: state.isPaused ? null : now + durationSeconds * 1000,
        updatedAt: now,
      });
    }
    case 'start': {
      if (remainingSeconds <= 0) {
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
        targetEpochMs: now + remainingSeconds * 1000,
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
        remainingSeconds: 0,
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
