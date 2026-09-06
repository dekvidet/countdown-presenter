import { useEffect, useRef, useState } from 'react';
import { formatDuration } from '../../../utils/formatDuration';
import type { AlertConfig, TimerMode } from '../../../timer/types';

type TimerHeroProps = {
  remainingSeconds: number;
  durationSeconds: number;
  endSeconds: number;
  mode: TimerMode;
  timeFormat: string;
  isPaused: boolean;
  isConnected: boolean;
  alerts: AlertConfig[];
  onToggle: () => void;
  onReset: () => void;
  onClear: () => void;
  onLogTime: () => void;
  onOpenDisplay: () => void;
};

export const TimerHero = ({
  remainingSeconds,
  durationSeconds,
  endSeconds,
  mode,
  timeFormat,
  isPaused,
  isConnected,
  alerts,
  onToggle,
  onReset,
  onClear,
  onLogTime,
  onOpenDisplay,
}: TimerHeroProps) => {
  const progressRef = useRef<HTMLDivElement>(null);
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    const progressElement = progressRef.current;
    if (!progressElement) return;
    const updateWidth = () => setProgressWidth(progressElement.getBoundingClientRect().width);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(progressElement);
    return () => observer.disconnect();
  }, []);

  const span = Math.max(0.001, Math.abs(durationSeconds - endSeconds));
  const rangeMinimum = Math.min(durationSeconds, endSeconds);
  const rangeMaximum = Math.max(durationSeconds, endSeconds);
  const elapsed = mode === 'countdown'
    ? durationSeconds - remainingSeconds
    : remainingSeconds - durationSeconds;
  const progress = Math.min(100, Math.max(0, (elapsed / span) * 100));
  const markerPosition = (time: number) => {
    const offset = mode === 'countdown' ? durationSeconds - time : time - durationSeconds;
    return Math.min(100, Math.max(0, (offset / span) * 100));
  };
  const primaryActionLabel = isPaused
    ? Math.abs(remainingSeconds - durationSeconds) < 0.001
      ? '▶ Start'
      : '▶ Continue'
    : 'Ⅱ Pause';
  const cueMarkers = alerts
    .filter((cue) => cue.enabled && cue.time >= rangeMinimum && cue.time <= rangeMaximum)
    .map((cue) => ({ cue, position: markerPosition(cue.time) }))
    .sort((first, second) => first.position - second.position);
  const clusterMarkers = (minimumDistancePx: number) => cueMarkers.reduce<Array<typeof cueMarkers>>((clusters, marker) => {
    const currentCluster = clusters.at(-1);
    const previousMarker = currentCluster?.at(-1);
    const markerDistancePx = previousMarker
      ? ((marker.position - previousMarker.position) / 100) * (progressWidth || 900)
      : Number.POSITIVE_INFINITY;
    if (currentCluster && previousMarker && markerDistancePx < minimumDistancePx) currentCluster.push(marker);
    else clusters.push([marker]);
    return clusters;
  }, []);
  const markerClusters = clusterMarkers(12);
  const labelClusters = clusterMarkers(42);

  return (
    <section className="timer-hero">
      <div className="timer-status-line">
        <span className={isPaused ? 'timer-state paused' : 'timer-state'}>{isPaused ? 'PAUSED' : 'LIVE'}</span>
        <span className={isConnected ? 'display-status connected' : 'display-status'}>
          <i />{isConnected ? 'Display connected' : 'Display disconnected'}
        </span>
      </div>
      <div className="hero-clock">{formatDuration(remainingSeconds, timeFormat)}</div>
      <div ref={progressRef} className="timer-progress" aria-label={`${Math.round(progress)}% elapsed`}>
        <span style={{ width: `${progress}%` }} />
        <b className="range-label range-start">{formatDuration(durationSeconds, timeFormat)}</b>
        <b className="range-label range-end">{formatDuration(endSeconds, timeFormat)}</b>
        {markerClusters.flatMap((cluster) => cluster.map(({ cue, position }) => (
          <div
            className={`cue-marker${position < 10 ? ' marker-left' : position > 90 ? ' marker-right' : ''}`}
            key={cue.id}
            style={{ left: `${position}%` }}
            aria-label={cluster.map((item) => `${item.cue.name}, ${formatDuration(item.cue.time, timeFormat)}`).join('; ')}
            tabIndex={0}
          >
            <div className="cue-tooltip" role="tooltip">
              {cluster.length > 1 ? <span>{cluster.length} close cues</span> : null}
              <ul>
                {cluster.map((item) => (
                  <li key={item.cue.id}>
                    <strong>{item.cue.name}</strong>
                    <time>{formatDuration(item.cue.time, timeFormat)}</time>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )))}
        {labelClusters.map((cluster) => {
          const position = cluster.reduce((total, marker) => total + marker.position, 0) / cluster.length;
          const averageTime = cluster.reduce((total, marker) => total + marker.cue.time, 0) / cluster.length;
          const label = cluster.length === 1
            ? formatDuration(cluster[0].cue.time, 'm:ss')
            : `≈${formatDuration(Math.round(averageTime / 5) * 5, 'm:ss')}`;
          return <small className="cue-time-label" key={cluster.map(({ cue }) => cue.id).join('-')} style={{ left: `${position}%` }}>{label}</small>;
        })}
      </div>
      <div className="hero-controls">
        <div className="hero-button-row">
          <button className="primary-button" onClick={onToggle}>{primaryActionLabel}</button>
          <button onClick={onReset}>↺ Reset</button>
          <button onClick={onClear}>× Clear</button>
          <button className="log-time-button" onClick={onLogTime}>＋ Log time</button>
          <button className="open-display-button" onClick={onOpenDisplay}>↗ Open display</button>
        </div>
        <div className="hero-shortcut-row" aria-label="Keyboard shortcuts">
          <kbd>Space</kbd><kbd>Enter</kbd><kbd>C</kbd><kbd>L</kbd><kbd>O</kbd>
        </div>
      </div>
    </section>
  );
};
