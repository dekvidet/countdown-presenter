import { useContext } from 'react';
import { TimerSyncContext } from './timerSyncContext';

export const useTimerSync = () => {
  const context = useContext(TimerSyncContext);

  if (!context) {
    throw new Error('useTimerSync must be used inside TimerSyncProvider');
  }

  return context;
};
