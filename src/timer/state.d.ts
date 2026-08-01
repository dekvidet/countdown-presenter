import type { TimerAction, TimerState } from './types';

export declare const DEFAULT_TIMER_STATE: Readonly<TimerState>;
export declare const normalizeTimerState: (value: unknown) => TimerState;
export declare const getRemainingSeconds: (value: TimerState, now?: number) => number;
export declare const hasReachedEnd: (value: TimerState, now?: number) => boolean;
export declare const reduceTimerState: (value: TimerState, action: TimerAction, now?: number) => TimerState;
