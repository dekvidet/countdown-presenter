import { formatDuration } from '../../../utils/formatDuration';
import type { StopwatchMark } from '../types';
import { Panel } from './ui';

export const StopwatchLog = ({
  marks,
  timeFormat,
  onRename,
  onDelete,
  onClear,
}: {
  marks: StopwatchMark[];
  timeFormat: string;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) => (
  <Panel
    title="Stopwatch log"
    className="stopwatch-panel"
    action={<button onClick={onClear} disabled={marks.length === 0}>Clear log</button>}
  >
    <div className="stopwatch-list">
      {marks.length === 0 ? <p className="empty-message">No times logged yet</p> : marks.map((mark, index) => (
        <div className="stopwatch-entry" key={mark.id}>
          <span>{String(marks.length - index).padStart(2, '0')}</span>
          <time>{formatDuration(mark.time, timeFormat)}</time>
          <label className="mark-name">
            <input value={mark.name} aria-label="Time mark name" onChange={(event) => onRename(mark.id, event.target.value)} />
            <small>Logged at {mark.loggedAt}</small>
          </label>
          <button className="danger-button" onClick={() => onDelete(mark.id)}>Delete</button>
        </div>
      ))}
    </div>
  </Panel>
);
