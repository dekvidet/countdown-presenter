import type { TimerMode } from '../../../timer/types';
import { FieldLabel, Panel, StageSelect, TimecodeField } from './ui';

const timeFormats = [
  'HH:mm:ss',
  'HH:mm:ss.SSS',
  'H:mm:ss',
  'mm:ss',
  'mm:ss.SSS',
  'm:ss',
  'ss.SSS',
];

const hasInvalidRange = (mode: TimerMode, startSeconds: number, endSeconds: number) => (
  mode === 'countdown' ? startSeconds <= endSeconds : startSeconds >= endSeconds
);

export const TimerSetup = ({
  mode,
  format,
  startSeconds,
  endSeconds,
  currentSeconds,
  isPaused,
  onModeChange,
  onFormatChange,
  onStartChange,
  onEndChange,
  onCurrentChange,
  onResetFactory,
}: {
  mode: TimerMode;
  format: string;
  startSeconds: number;
  endSeconds: number;
  currentSeconds: number;
  isPaused: boolean;
  onModeChange: (mode: TimerMode) => void;
  onFormatChange: (format: string) => void;
  onStartChange: (seconds: number) => void;
  onEndChange: (seconds: number) => void;
  onCurrentChange: (seconds: number) => void;
  onResetFactory: () => void;
}) => (
  <Panel title="Timer setup" action={<em className="live-note">Changes are live</em>}>
    <div className="mode-selector" role="group" aria-label="Timer mode">
      <button className={mode === 'countup' ? 'active' : ''} onClick={() => onModeChange('countup')}>Count up</button>
      <button className={mode === 'countdown' ? 'active' : ''} onClick={() => onModeChange('countdown')}>Countdown</button>
    </div>
    <StageSelect label="Display format" value={format} onChange={onFormatChange} className="format-field">
      {timeFormats.map((item) => <option key={item} value={item}>{item}</option>)}
    </StageSelect>
    <div className="timer-range-fields">
      <TimecodeField
        label="Start"
        seconds={startSeconds}
        format={format}
        invalid={hasInvalidRange(mode, startSeconds, endSeconds)}
        onChange={onStartChange}
      />
      <span className="range-arrow">→</span>
      <TimecodeField
        label="End"
        seconds={endSeconds}
        format={format}
        invalid={hasInvalidRange(mode, startSeconds, endSeconds)}
        onChange={onEndChange}
      />
    </div>
    <TimecodeField
      label="Current time"
      seconds={currentSeconds}
      format={format}
      disabled={!isPaused}
      onChange={onCurrentChange}
      className="current-time-field"
    />
    <div className="factory-reset-section">
      <FieldLabel>Reset to Factory Settings</FieldLabel>
      <div className="factory-reset-control">
        <button onClick={onResetFactory}>Delete all data</button>
      </div>
    </div>
  </Panel>
);
