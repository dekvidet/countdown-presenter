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
    }, 250);

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
      runtimeConfig,
      setDurationSeconds: (durationSeconds: number) => {
        client.dispatch({ type: 'setDuration', durationSeconds });
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
      reset: () => {
        client.dispatch({ type: 'reset' });
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
    };
  }, [client, now, runtimeConfig, snapshot.connectionState, snapshot.timerState]);

  return (
    <TimerSyncContext.Provider value={value}>
      {children}
    </TimerSyncContext.Provider>
  );
};
