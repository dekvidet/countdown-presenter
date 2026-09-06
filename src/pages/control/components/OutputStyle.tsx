import { useEffect, useState } from 'react';
import type { DisplayStyle, FlashTest } from '../../../timer/types';
import { formatDuration } from '../../../utils/formatDuration';
import { Panel, StageSelect } from './ui';

const fonts = ['Roboto Mono', 'IBM Plex Mono', 'DIN Condensed', 'Inter', 'Helvetica Neue', 'Arial'];

export const OutputStyle = ({
  style,
  timeFormat,
  previewFlash,
  onChange,
}: {
  style: DisplayStyle;
  timeFormat: string;
  previewFlash: FlashTest | null;
  onChange: (changes: Partial<DisplayStyle>) => void;
}) => {
  const [channel, setChannel] = useState<'program' | 'flash'>('program');
  const [previewNow, setPreviewNow] = useState(() => Date.now());
  const isFlash = channel === 'flash';

  useEffect(() => {
    if (!previewFlash) return;
    setPreviewNow(Date.now());
    const interval = window.setInterval(() => setPreviewNow(Date.now()), 25);
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      setPreviewNow(previewFlash.startedAt + previewFlash.durationSeconds * 1000);
    }, previewFlash.durationSeconds * 1000 + 25);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [previewFlash]);

  const previewElapsed = previewFlash ? (previewNow - previewFlash.startedAt) / 1000 : 0;
  const previewIsRunning = Boolean(previewFlash && previewElapsed < previewFlash.durationSeconds);
  const previewIsFlashing = previewIsRunning && (
    !previewFlash?.alternateTimeSeconds
    || Math.floor(previewElapsed / previewFlash.alternateTimeSeconds) % 2 === 0
  );
  const displayedChannelIsFlash = previewIsRunning ? previewIsFlashing : isFlash;
  const backgroundColor = displayedChannelIsFlash ? style.flashBackgroundColor : style.backgroundColor;
  const textColor = displayedChannelIsFlash ? style.flashTextColor : style.textColor;

  return (
    <Panel title="Output style" className="output-style-panel">
      <div className="channel-tabs">
        <button className={!isFlash ? 'active' : ''} onClick={() => setChannel('program')}>Program</button>
        <button className={isFlash ? 'active' : ''} onClick={() => setChannel('flash')}>Flash</button>
      </div>
      <div className="output-preview" style={{ backgroundColor, color: textColor, fontFamily: style.fontFamily }}>
        <span className="preview-resolution">1920x1080 example preview</span>
        <b style={{ fontSize: `${style.fontSizePx / 19.2}cqw` }}>{formatDuration(522.345, timeFormat)}</b>
      </div>
      <div className="video-controls">
        <div className="video-control-row">
          <span>FONT FAMILY</span>
          <StageSelect value={style.fontFamily} onChange={(fontFamily) => onChange({ fontFamily })}>
            {fonts.map((font) => <option key={font} value={font}>{font}</option>)}
          </StageSelect>
        </div>
        <label className="video-control-row">
          <span>TYPE SIZE</span>
          <div>
            <input type="range" min="20" max="500" value={style.fontSizePx} onChange={(event) => onChange({ fontSizePx: Number(event.target.value) })} />
            <output>{style.fontSizePx} PX</output>
          </div>
        </label>
        <label className="video-control-row">
          <span>BACKGROUND</span>
          <div>
            <input
              type="color"
              value={backgroundColor}
              onChange={(event) => onChange(isFlash ? { flashBackgroundColor: event.target.value } : { backgroundColor: event.target.value })}
            />
            <output>{backgroundColor.toUpperCase()}</output>
          </div>
        </label>
        <label className="video-control-row">
          <span>FOREGROUND</span>
          <div>
            <input
              type="color"
              value={textColor}
              onChange={(event) => onChange(isFlash ? { flashTextColor: event.target.value } : { textColor: event.target.value })}
            />
            <output>{textColor.toUpperCase()}</output>
          </div>
        </label>
      </div>
    </Panel>
  );
};
