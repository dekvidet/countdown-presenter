import { useCallback, useEffect, useState } from 'react';
import type { StopwatchMark } from '../types';

const storageKey = 'countdown-presenter.stopwatch-log.v1';

const readMarks = (): StopwatchMark[] => {
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

export const useStopwatchLog = () => {
  const [marks, setMarks] = useState<StopwatchMark[]>(readMarks);

  useEffect(() => {
    if (marks.length === 0) window.localStorage.removeItem(storageKey);
    else window.localStorage.setItem(storageKey, JSON.stringify(marks));
  }, [marks]);

  const addMark = useCallback((time: number) => setMarks((current) => [{
    id: crypto.randomUUID(),
    time,
    name: `Time mark ${String(current.length + 1).padStart(2, '0')}`,
    loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  }, ...current]), []);
  const renameMark = useCallback((id: string, name: string) => setMarks((current) => current.map((mark) => (
    mark.id === id ? { ...mark, name } : mark
  ))), []);
  const deleteMark = useCallback((id: string) => setMarks((current) => current.filter((mark) => mark.id !== id)), []);
  const clearMarks = useCallback(() => setMarks([]), []);

  return {
    marks,
    addMark,
    renameMark,
    deleteMark,
    clearMarks,
  };
};
