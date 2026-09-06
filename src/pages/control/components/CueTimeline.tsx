import type { AlertConfig, CueTimerAction, TimerMode } from '../../../timer/types';
import { formatDuration } from '../../../utils/formatDuration';
import type { SoundAsset } from '../types';
import { ChevronIcon, FieldLabel, Panel, TimecodeField, Toggle, VolumeSlider } from './ui';

const cueActions: Array<{ value: CueTimerAction; label: string }> = [
  { value: 'continue', label: 'Continue' },
  { value: 'pause', label: 'Pause' },
  { value: 'stop', label: 'Stop' },
  { value: 'restart', label: 'Restart' },
];

const flashPresets = [
  { value: 'custom', label: 'Custom' },
  { value: '0.2,0', label: 'Quick accent · 0.2s' },
  { value: '0.5,0', label: 'Short flash · 0.5s' },
  { value: '0.9,0', label: 'Single flash · 0.9s' },
  { value: '0.8,0.2', label: 'Double pulse · 0.8s / 0.2s' },
  { value: '1.2,0.2', label: 'Triple pulse · 1.2s / 0.2s' },
  { value: '1.5,0.1', label: 'Rapid strobe · 1.5s / 0.1s' },
  { value: '2,0.5', label: 'Slow pulse · 2.0s / 0.5s' },
  { value: '3,0.25', label: 'Warning strobe · 3.0s / 0.25s' },
  { value: '2,0', label: 'Hold · 2.0s' },
  { value: '5,0', label: 'Long hold · 5.0s' },
];

const getFlashPreset = (cue: AlertConfig) => flashPresets.find((preset) => {
  if (preset.value === 'custom') return false;
  const [duration, alternate] = preset.value.split(',').map(Number);
  return duration === cue.flashDurationSeconds && alternate === cue.flashAlternateTimeSeconds;
})?.value ?? 'custom';

const getCueDescription = (cue: AlertConfig) => {
  const effects = [cue.flash && 'Flash', cue.soundEnabled && 'sound'].filter(Boolean);
  if (effects.length === 0) return cue.timerAction === 'continue' ? 'No output actions' : `Timer ${cue.timerAction}s`;
  return effects.join(' and ');
};

const getCueCountdown = (cue: AlertConfig, remaining: number, mode: TimerMode) => {
  const difference = mode === 'countdown' ? remaining - cue.time : cue.time - remaining;
  if (difference < 0) return 'PASSED';
  if (difference === 0) return 'NOW';
  return `IN ${formatDuration(difference, 'mm:ss')}`;
};

const isCueOutOfRange = (cue: AlertConfig, startSeconds: number, endSeconds: number) => (
  cue.time < Math.min(startSeconds, endSeconds) || cue.time > Math.max(startSeconds, endSeconds)
);

const CueCard = ({
  cue,
  expanded,
  remainingSeconds,
  mode,
  timeFormat,
  startSeconds,
  endSeconds,
  sounds,
  onToggleExpanded,
  onChange,
  onDelete,
  onTestSound,
  onTestFlash,
}: {
  cue: AlertConfig;
  expanded: boolean;
  remainingSeconds: number;
  mode: TimerMode;
  timeFormat: string;
  startSeconds: number;
  endSeconds: number;
  sounds: SoundAsset[];
  onToggleExpanded: () => void;
  onChange: (changes: Partial<AlertConfig>) => void;
  onDelete: () => void;
  onTestSound: () => void;
  onTestFlash: (actualOutput: boolean) => void;
}) => (
  <article className={`cue-card${cue.enabled ? '' : ' cue-disabled'}${isCueOutOfRange(cue, startSeconds, endSeconds) ? ' cue-out-of-range' : ''}${expanded ? ' cue-open' : ''}`}>
    <div className="cue-summary">
      <time>{formatDuration(cue.time, timeFormat)}</time>
      <Toggle checked={cue.enabled} onChange={(enabled) => onChange({ enabled })} ariaLabel={`${cue.name} enabled`} />
      <div className="cue-name">
        <input
          value={cue.name}
          readOnly={!expanded}
          tabIndex={expanded ? 0 : -1}
          aria-label="Cue name"
          onChange={(event) => onChange({ name: event.target.value })}
        />
        <small>{getCueDescription(cue)}</small>
      </div>
      <span className="cue-countdown">
        {isCueOutOfRange(cue, startSeconds, endSeconds) ? 'OUT OF RANGE' : getCueCountdown(cue, remainingSeconds, mode)}
      </span>
      <button className="edit-cue-button" aria-expanded={expanded} onClick={onToggleExpanded}>
        <span>Edit</span><ChevronIcon />
      </button>
    </div>

    {expanded ? (
      <div className="cue-editor">
        <div className="cue-timer-row">
          <TimecodeField label="Trigger value" seconds={cue.time} format={timeFormat} onChange={(time) => onChange({ time })} />
          <div className="timer-action-field">
            <FieldLabel>Timer action</FieldLabel>
            <div className="segmented-control" role="group" aria-label="Timer action">
              {cueActions.map((action) => (
                <button
                  key={action.value}
                  className={cue.timerAction === action.value ? 'active' : ''}
                  onClick={() => onChange({ timerAction: action.value })}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="cue-effects">
          <section className={`cue-effect${cue.soundEnabled ? '' : ' effect-disabled'}`}>
            <header>
              <FieldLabel>Sound</FieldLabel>
              <Toggle checked={cue.soundEnabled} onChange={(soundEnabled) => onChange({ soundEnabled })} ariaLabel="Sound enabled" />
            </header>
            <div className="sound-file-field">
              <label>Sound audio file</label>
              <div className="selector-with-test">
                <select
                  value={cue.sound}
                  onChange={(event) => {
                    const sound = sounds.find((item) => item.name === event.target.value);
                    onChange({ sound: event.target.value, soundVolume: sound?.defaultVolume ?? 1 });
                  }}
                >
                  {sounds.map((sound) => <option key={sound.name} value={sound.name}>{sound.name}</option>)}
                </select>
                <button onClick={onTestSound} disabled={!cue.sound}>▶ Test</button>
              </div>
            </div>
            <label className="cue-volume-field">
              <span>Volume</span>
              <div>
                <VolumeSlider
                  value={cue.soundVolume}
                  ariaLabel={`Volume for ${cue.name}`}
                  onChange={(soundVolume) => onChange({ soundVolume })}
                />
                <output>{Math.round(cue.soundVolume * 100)}%</output>
              </div>
            </label>
          </section>

          <section className={`cue-effect${cue.flash ? '' : ' effect-disabled'}`}>
            <header>
              <FieldLabel>Screen flash timing</FieldLabel>
              <Toggle checked={cue.flash} onChange={(flash) => onChange({ flash })} ariaLabel="Screen flash enabled" />
            </header>
            <div className="flash-preset-field">
              <label>Flash preset</label>
              <div className="selector-with-test">
                <select
                  value={getFlashPreset(cue)}
                  onChange={(event) => {
                    if (event.target.value === 'custom') return;
                    const [flashDurationSeconds, flashAlternateTimeSeconds] = event.target.value.split(',').map(Number);
                    onChange({ flashDurationSeconds, flashAlternateTimeSeconds });
                  }}
                >
                  {flashPresets.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
                </select>
                <button
                  aria-label="Test flash in preview. Hold Shift to test the actual output."
                  onClick={(event) => onTestFlash(event.shiftKey)}
                >
                  ▶ Test
                </button>
              </div>
            </div>
            <div className="flash-time-fields">
              <label>
                Duration (seconds)
                <input
                  type="number"
                  min="0.1"
                  max="60"
                  step="0.05"
                  value={cue.flashDurationSeconds}
                  onChange={(event) => onChange({ flashDurationSeconds: Math.max(0.1, Number(event.target.value)) })}
                />
              </label>
              <label>
                Alternate time (seconds)
                <input
                  type="number"
                  min="0"
                  max="60"
                  step="0.05"
                  value={cue.flashAlternateTimeSeconds}
                  onChange={(event) => onChange({ flashAlternateTimeSeconds: Math.max(0, Number(event.target.value)) })}
                />
              </label>
            </div>
          </section>
        </div>
        <footer className="cue-editor-footer">
          <button className="danger-button" onClick={onDelete}>Delete cue</button>
        </footer>
      </div>
    ) : null}
  </article>
);

export const CueTimeline = ({
  cues,
  expandedIds,
  remainingSeconds,
  mode,
  timeFormat,
  startSeconds,
  endSeconds,
  sounds,
  onAdd,
  onOrder,
  onDeleteAll,
  onToggleExpanded,
  onChange,
  onDelete,
  onTestSound,
  onTestFlash,
}: {
  cues: AlertConfig[];
  expandedIds: Set<string>;
  remainingSeconds: number;
  mode: TimerMode;
  timeFormat: string;
  startSeconds: number;
  endSeconds: number;
  sounds: SoundAsset[];
  onAdd: () => void;
  onOrder: () => void;
  onDeleteAll: () => void;
  onToggleExpanded: (id: string) => void;
  onChange: (id: string, changes: Partial<AlertConfig>) => void;
  onDelete: (id: string) => void;
  onTestSound: (cue: AlertConfig) => void;
  onTestFlash: (cue: AlertConfig, actualOutput: boolean) => void;
}) => (
  <Panel
    title="Cue timeline"
    className="cue-timeline"
    action={(
      <div className="panel-actions">
        <button onClick={onOrder}>Order by time</button>
        <button className="danger-button" onClick={onDeleteAll} disabled={cues.length === 0}>Delete all cues</button>
        <button onClick={onAdd}>+ New cue</button>
      </div>
    )}
  >
    <div className="cue-list">
      {cues.length === 0 ? <p className="empty-message">No cues configured</p> : cues.map((cue) => (
        <CueCard
          key={cue.id}
          cue={cue}
          expanded={expandedIds.has(cue.id)}
          remainingSeconds={remainingSeconds}
          mode={mode}
          timeFormat={timeFormat}
          startSeconds={startSeconds}
          endSeconds={endSeconds}
          sounds={sounds}
          onToggleExpanded={() => onToggleExpanded(cue.id)}
          onChange={(changes) => onChange(cue.id, changes)}
          onDelete={() => onDelete(cue.id)}
          onTestSound={() => onTestSound(cue)}
          onTestFlash={(actualOutput) => onTestFlash(cue, actualOutput)}
        />
      ))}
    </div>
  </Panel>
);
