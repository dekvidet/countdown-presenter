import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { createTimerSyncClient } from './sync/createClient';
import { getRemainingSeconds } from './state.js';
import { TimerSyncContext, type TimerContextValue } from './timerSyncContext';
import type { AlertConfig, RuntimeConfig } from './types';

export const TimerSyncProvider = ({
  children,
  runtimeConfig,
}: PropsWithChildren<{ runtimeConfig: RuntimeConfig | null }>) => {
  const clientRef = useRef(createTimerSyncClient(runtimeConfig));
  const [snapshot, setSnapshot] = useState(clientRef.current.getSnapshot());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const client = clientRef.current;
    const unsubscribe = client.subscribe(() => {
      setSnapshot(client.getSnapshot());
    });

    setSnapshot(client.getSnapshot());

    return () => {
      unsubscribe();
      client.destroy();
    };
  }, []);

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
    const isPaused = snapshot.timerState.isPaused || remainingSeconds === 0;

    return {
      timerState: snapshot.timerState,
      remainingSeconds,
      isPaused,
      connectionState: snapshot.connectionState,
      runtimeConfig,
      setDurationSeconds: (durationSeconds: number) => {
        clientRef.current.dispatch({ type: 'setDuration', durationSeconds });
      },
      start: () => {
        clientRef.current.dispatch({ type: 'start' });
      },
      pause: () => {
        clientRef.current.dispatch({ type: 'pause' });
      },
      reset: () => {
        clientRef.current.dispatch({ type: 'reset' });
      },
      clear: () => {
        clientRef.current.dispatch({ type: 'clear' });
      },
      setTimeFormat: (timeFormat: string) => {
        clientRef.current.dispatch({ type: 'setTimeFormat', timeFormat });
      },
      replaceAlerts: (alerts: AlertConfig[]) => {
        clientRef.current.dispatch({ type: 'replaceAlerts', alerts });
      },
    };
  }, [now, runtimeConfig, snapshot.connectionState, snapshot.timerState]);

  return (
    <TimerSyncContext.Provider value={value}>
      {children}
    </TimerSyncContext.Provider>
  );
};
