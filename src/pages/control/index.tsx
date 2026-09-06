import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { getDefaultSounds } from '../../timer/defaultSounds';
import type { AlertConfig, FlashTest } from '../../timer/types';
import { useTimerSync } from '../../timer/useTimerSync';
import { CueTimeline } from './components/CueTimeline';
import { OutputStyle } from './components/OutputStyle';
import { SoundLibrary } from './components/SoundLibrary';
import { StopwatchLog } from './components/StopwatchLog';
import { TimerHero } from './components/TimerHero';
import { TimerSetup } from './components/TimerSetup';
import { useStopwatchLog } from './hooks/useStopwatchLog';
import type { SoundAsset } from './types';
import './control.css';

const soundVolumesStorageKey = 'countdown-presenter.sound-volumes.v1';

const clampVolume = (volume: number) => Math.min(1, Math.max(0, volume));

const getStoredSoundVolumes = () => {
  try {
    const value = JSON.parse(window.localStorage.getItem(soundVolumesStorageKey) ?? '{}');
    return value && typeof value === 'object' ? value as Record<string, number> : {};
  } catch {
    return {};
  }
};

const getInitialSounds = (): SoundAsset[] => {
  const storedVolumes = getStoredSoundVolumes();
  return getDefaultSounds().map((sound) => ({
    ...sound,
    defaultVolume: Number.isFinite(storedVolumes[sound.id])
      ? clampVolume(storedVolumes[sound.id])
      : sound.defaultVolume,
  }));
};

const ControlPage = () => {
  const {
    clear,
    displayConnected,
    isPaused,
    pause,
    remainingSeconds,
    replaceAlerts,
    reset,
    resetFactory,
    setDisplayStyle,
    setCurrentSeconds,
    setDurationSeconds,
    setEndSeconds,
    setMode,
    setTimeFormat,
    start,
    testFlash,
    timerState,
    triggerCue,
  } = useTimerSync();
  const [sounds, setSounds] = useState<SoundAsset[]>(getInitialSounds);
  const [expandedCueIds, setExpandedCueIds] = useState<Set<string>>(() => new Set());
  const [previewFlash, setPreviewFlash] = useState<FlashTest | null>(null);
  const previousRemainingRef = useRef(remainingSeconds);
  const { marks, addMark, renameMark, deleteMark, clearMarks } = useStopwatchLog();

  const displayUrl = `${window.location.origin}${window.location.pathname}#/display`;
  const playSound = useCallback((soundName: string, volume = 1) => {
    const sound = sounds.find((item) => item.name === soundName);
    if (!sound) return;
    const audio = new Audio(sound.url);
    audio.volume = clampVolume(volume);
    void audio.play().catch(() => undefined);
  }, [sounds]);

  useEffect(() => {
    const changedVolumes = Object.fromEntries(sounds
      .filter((sound) => sound.id && (sound.defaultVolume ?? 1) !== 1)
      .map((sound) => [sound.id as string, clampVolume(sound.defaultVolume ?? 1)]));
    if (Object.keys(changedVolumes).length === 0) {
      window.localStorage.removeItem(soundVolumesStorageKey);
      return;
    }
    window.localStorage.setItem(soundVolumesStorageKey, JSON.stringify(changedVolumes));
  }, [sounds]);

  useEffect(() => {
    const previousRemaining = previousRemainingRef.current;
    previousRemainingRef.current = remainingSeconds;
    if (timerState.isPaused || previousRemaining === remainingSeconds) return;

    const crossedCues = timerState.alerts.filter((cue) => cue.enabled && (
      timerState.mode === 'countdown'
        ? cue.time < previousRemaining && cue.time >= remainingSeconds
        : cue.time > previousRemaining && cue.time <= remainingSeconds
    ));

    crossedCues.filter((cue) => cue.soundEnabled).forEach((cue) => playSound(cue.sound, cue.soundVolume));

    const timerCue = crossedCues.find((cue) => cue.timerAction !== 'continue');
    if (!timerCue) return;
    triggerCue(timerCue.id);
  }, [playSound, remainingSeconds, timerState.alerts, timerState.isPaused, timerState.mode, triggerCue]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditing = target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target?.tagName ?? '');
      if (isEditing || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.code === 'Space') {
        event.preventDefault();
        if (isPaused) start();
        else pause();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        reset();
      } else if (event.key.toLowerCase() === 'c') {
        event.preventDefault();
        clear();
      } else if (event.key.toLowerCase() === 'l') {
        event.preventDefault();
        addMark(remainingSeconds);
      } else if (event.key.toLowerCase() === 'o') {
        event.preventDefault();
        window.open(displayUrl, '_blank', 'noopener,noreferrer');
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [addMark, clear, displayUrl, isPaused, pause, remainingSeconds, reset, start]);

  const updateCue = (id: string, changes: Partial<AlertConfig>) => {
    replaceAlerts(timerState.alerts.map((cue) => cue.id === id ? { ...cue, ...changes } : cue));
  };

  const addCue = () => {
    const id = crypto.randomUUID();
    replaceAlerts([{
      id,
      name: `Cue ${timerState.alerts.length + 1}`,
      enabled: true,
      time: 0,
      timerAction: 'continue',
      sound: sounds[0]?.name ?? '',
      soundVolume: sounds[0]?.defaultVolume ?? 1,
      soundEnabled: false,
      flash: false,
      flashDurationSeconds: 0.9,
      flashAlternateTimeSeconds: 0,
    }, ...timerState.alerts]);
    setExpandedCueIds((current) => new Set(current).add(id));
  };

  const deleteCue = (id: string) => {
    replaceAlerts(timerState.alerts.filter((cue) => cue.id !== id));
    setExpandedCueIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  const orderCuesByTime = () => {
    const direction = timerState.mode === 'countdown' ? -1 : 1;
    replaceAlerts([...timerState.alerts].sort((first, second) => direction * (first.time - second.time)));
  };

  const deleteAllCues = () => {
    const confirmed = window.confirm(
      'Delete all cues?\n\nThis will permanently delete every cue and cannot be undone.',
    );
    if (!confirmed) return;
    replaceAlerts([]);
    setExpandedCueIds(new Set());
  };

  const toggleCue = (id: string) => setExpandedCueIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const importSounds = (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    if (files.length === 0) return;
    event.target.value = '';
    const importedSounds = files.map((file) => {
      const url = URL.createObjectURL(file);
      return {
        id: crypto.randomUUID(),
        name: file.name,
        file: file.name,
        url,
        builtIn: false,
        defaultVolume: 1,
      } satisfies SoundAsset;
    });
    setSounds((current) => [...current, ...importedSounds]);
  };

  const updateSoundVolume = (sound: SoundAsset, volume: number) => {
    setSounds((current) => current.map((item) => (
      item.id === sound.id ? { ...item, defaultVolume: clampVolume(volume) } : item
    )));
  };

  const handleResetFactory = () => {
    const confirmed = window.confirm(
      'Reset to Factory Settings?\n\nThis will permanently delete every timer setting, cue, output style, stopwatch mark, and imported sound. This cannot be undone.',
    );
    if (!confirmed) return;

    setSounds((current) => {
      current.filter((sound) => sound.builtIn === false).forEach((sound) => URL.revokeObjectURL(sound.url));
      return getDefaultSounds().map((sound) => ({ ...sound, builtIn: true }));
    });
    setExpandedCueIds(new Set());
    clearMarks();
    resetFactory();
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith('countdown-presenter.'))
      .forEach((key) => window.localStorage.removeItem(key));
  };

  return (
    <div className="stage-console">
      <main className="stage-layout">
        <TimerHero
          remainingSeconds={remainingSeconds}
          durationSeconds={timerState.durationSeconds}
          endSeconds={timerState.endSeconds}
          mode={timerState.mode}
          timeFormat={timerState.timeFormat}
          isPaused={isPaused}
          isConnected={displayConnected}
          alerts={timerState.alerts}
          onToggle={isPaused ? start : pause}
          onReset={reset}
          onClear={clear}
          onLogTime={() => addMark(remainingSeconds)}
          onOpenDisplay={() => window.open(displayUrl, '_blank', 'noopener,noreferrer')}
        />

        <div className="stage-left-column">
          <CueTimeline
            cues={timerState.alerts}
            expandedIds={expandedCueIds}
            remainingSeconds={remainingSeconds}
            mode={timerState.mode}
            timeFormat={timerState.timeFormat}
            startSeconds={timerState.durationSeconds}
            endSeconds={timerState.endSeconds}
            sounds={sounds}
            onAdd={addCue}
            onOrder={orderCuesByTime}
            onDeleteAll={deleteAllCues}
            onToggleExpanded={toggleCue}
            onChange={updateCue}
            onDelete={deleteCue}
            onTestSound={(cue) => playSound(cue.sound, cue.soundVolume)}
            onTestFlash={(cue, actualOutput) => {
              if (actualOutput) {
                testFlash(cue.flashDurationSeconds, cue.flashAlternateTimeSeconds);
                return;
              }
              setPreviewFlash({
                startedAt: Date.now(),
                durationSeconds: cue.flashDurationSeconds,
                alternateTimeSeconds: cue.flashAlternateTimeSeconds,
              });
            }}
          />
          <StopwatchLog
            marks={marks}
            timeFormat={timerState.timeFormat}
            onRename={renameMark}
            onDelete={deleteMark}
            onClear={clearMarks}
          />
        </div>

        <aside className="stage-right-column">
          <TimerSetup
            mode={timerState.mode}
            format={timerState.timeFormat}
            startSeconds={timerState.durationSeconds}
            endSeconds={timerState.endSeconds}
            currentSeconds={remainingSeconds}
            isPaused={isPaused}
            onModeChange={setMode}
            onFormatChange={setTimeFormat}
            onStartChange={setDurationSeconds}
            onEndChange={setEndSeconds}
            onCurrentChange={setCurrentSeconds}
            onResetFactory={handleResetFactory}
          />
          <OutputStyle
            style={timerState.displayStyle}
            timeFormat={timerState.timeFormat}
            previewFlash={previewFlash}
            onChange={setDisplayStyle}
          />
          <SoundLibrary
            sounds={sounds}
            onImport={importSounds}
            onPlay={(sound) => playSound(sound.name, sound.defaultVolume)}
            onVolumeChange={updateSoundVolume}
          />
        </aside>
      </main>
    </div>
  );
};

export default ControlPage;
