import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react';
import { createTimerSyncClient } from './sync/createClient';
import { getRemainingSeconds, hasReachedEnd } from './state.js';
import { TimerSyncContext, type TimerContextValue } from './timerSyncContext';
import type { AlertConfig, RuntimeConfig } from './types';

export const TimerSyncProvider = ({
  children,
  runtimeConfig,
}: PropsWithChildren<{ runtimeConfig: RuntimeConfig | null }>) => {
  const [client] = useState(() => createTimerSyncClient(runtimeConfig));
  const snapshot = useSyncExternalStore(
    client.subscribe,
    client.getSnapshot,
    client.getSnapshot,
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (snapshot.timerState.isPaused) {
      setNow(Date.now());
      return;
    }

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 50);

    return () => {
      window.clearInterval(interval);
    };
  }, [snapshot.timerState.isPaused]);

  const value = useMemo<TimerContextValue>(() => {
    const remainingSeconds = getRemainingSeconds(snapshot.timerState, now);
    const isPaused = snapshot.timerState.isPaused || (!snapshot.timerState.continueAfterEnd && hasReachedEnd(snapshot.timerState, now));

    return {
      timerState: snapshot.timerState,
      remainingSeconds,
      isPaused,
      connectionState: snapshot.connectionState,
      displayConnected: snapshot.displayConnected,
      runtimeConfig,
      setDurationSeconds: (durationSeconds: number) => {
        client.dispatch({ type: 'setDuration', durationSeconds });
      },
      setCurrentSeconds: (currentSeconds: number) => {
        client.dispatch({ type: 'setCurrentSeconds', currentSeconds });
      },
      setEndSeconds: (endSeconds: number) => client.dispatch({ type: 'setEndSeconds', endSeconds }),
      setMode: (mode) => client.dispatch({ type: 'setMode', mode }),
      setContinueAfterEnd: (continueAfterEnd) => client.dispatch({ type: 'setContinueAfterEnd', continueAfterEnd }),
      setDisplayStyle: (style) => client.dispatch({ type: 'setDisplayStyle', style }),
      start: () => {
        client.dispatch({ type: 'start' });
      },
      pause: () => {
        client.dispatch({ type: 'pause' });
      },
      restart: () => {
        client.dispatch({ type: 'restart' });
      },
      reset: () => {
        client.dispatch({ type: 'reset' });
      },
      resetFactory: () => {
        client.dispatch({ type: 'resetFactory' });
      },
      clear: () => {
        client.dispatch({ type: 'clear' });
      },
      setTimeFormat: (timeFormat: string) => {
        client.dispatch({ type: 'setTimeFormat', timeFormat });
      },
      replaceAlerts: (alerts: AlertConfig[]) => {
        client.dispatch({ type: 'replaceAlerts', alerts });
      },
      triggerCue: (cueId: string) => {
        client.dispatch({ type: 'triggerCue', cueId });
      },
      testFlash: (durationSeconds: number, alternateTimeSeconds: number) => {
        client.dispatch({ type: 'testFlash', durationSeconds, alternateTimeSeconds });
      },
    };
  }, [client, now, runtimeConfig, snapshot.connectionState, snapshot.displayConnected, snapshot.timerState]);

  return (
    <TimerSyncContext.Provider value={value}>
      {children}
    </TimerSyncContext.Provider>
  );
};
