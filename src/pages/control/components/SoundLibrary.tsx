import { useState, type ChangeEvent } from 'react';
import type { SoundAsset } from '../types';
import { Panel, VolumeSlider } from './ui';

const formatSoundDuration = (durationMs?: number) => {
  if (!Number.isFinite(durationMs)) return 'Duration unavailable';
  const totalMilliseconds = Math.max(0, Math.round(durationMs ?? 0));
  const minutes = Math.floor(totalMilliseconds / 60_000);
  const seconds = Math.floor((totalMilliseconds % 60_000) / 1000);
  const milliseconds = totalMilliseconds % 1000;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
};

export const SoundLibrary = ({
  sounds,
  onImport,
  onPlay,
  onVolumeChange,
}: {
  sounds: SoundAsset[];
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
  onPlay: (sound: SoundAsset) => void;
  onVolumeChange: (sound: SoundAsset, volume: number) => void;
}) => {
  const [openInfo, setOpenInfo] = useState<string | null>(null);

  return (
    <Panel
      title="Sound library"
      className="sound-library"
      action={(
        <label className="file-button">
          + Add sound
          <input type="file" accept="audio/*" multiple onChange={onImport} />
        </label>
      )}
    >
      <ul>
        {sounds.map((sound, index) => {
          const soundKey = sound.id ?? `${sound.name}-${index}`;
          const infoIsOpen = openInfo === soundKey;
          return (
            <li key={soundKey}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <button aria-label={`Play ${sound.name}`} onClick={() => onPlay(sound)}>▶</button>
              <div className="sound-details">
                <b>{sound.name}</b>
                <small>{formatSoundDuration(sound.durationMs)} · {sound.builtIn === false ? 'IMPORTED' : 'BUILT IN'}</small>
              </div>
              <label className="sound-default-volume" title="Default volume">
                <VolumeSlider
                  value={sound.defaultVolume ?? 1}
                  ariaLabel={`Default volume for ${sound.name}`}
                  onChange={(volume) => onVolumeChange(sound, volume)}
                />
                <output>{Math.round((sound.defaultVolume ?? 1) * 100)}%</output>
              </label>
              <button
                className="sound-info-button"
                aria-label={`License information for ${sound.name}`}
                aria-expanded={infoIsOpen}
                onClick={() => setOpenInfo(infoIsOpen ? null : soundKey)}
              >
                i
              </button>
              {infoIsOpen ? (
                <div className="sound-license-popover">
                  <strong>{sound.name}</strong>
                  <dl>
                    <div><dt>Duration</dt><dd>{formatSoundDuration(sound.durationMs)}</dd></div>
                    <div><dt>Category</dt><dd>{sound.category ?? 'Imported'}</dd></div>
                    <div><dt>Author</dt><dd>{sound.author ?? 'User supplied'}</dd></div>
                    <div><dt>License</dt><dd>{sound.license ?? 'License metadata unavailable'}</dd></div>
                    <div><dt>Attribution</dt><dd>{sound.builtIn === false ? 'Check source file' : 'Not required'}</dd></div>
                  </dl>
                  {sound.source ? <a href={sound.source} target="_blank" rel="noreferrer">View source and license ↗</a> : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
};
