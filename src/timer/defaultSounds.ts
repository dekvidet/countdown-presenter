export type BuiltInSound = {
  id: string;
  name: string;
  file: string;
  url: string;
  category: string;
  source: string;
  license: string;
  author: string;
  durationMs: number;
  defaultVolume: number;
  builtIn: true;
};

const soundMetadata = [
  ['timer-complete', 'Timer complete', 'timer-complete.wav', 'timer', '916', 600],
  ['countdown-beep', 'Countdown beep', 'countdown-beep.wav', 'countdown', '2866', 220],
  ['countdown-final', 'Countdown final', 'countdown-final.wav', 'countdown', '2866', 750],
  ['ding', 'Ding', 'ding.wav', 'notification', '2867', 902],
  ['start', 'Start', 'start.wav', 'ui', '2521', 420],
  ['pause', 'Pause', 'pause.wav', 'ui', '2521', 420],
  ['lap', 'Lap', 'lap.wav', 'stopwatch', '1073', 180],
  ['interval-rest', 'Interval rest', 'interval-rest.wav', 'interval', '918', 1200],
  ['alarm-loop', 'Alarm loop', 'alarm-loop.wav', 'alarm', '988', 4000],
  ['interval-change', 'Interval change', 'interval-change.wav', 'interval', '918', 850],
  ['interval-work', 'Interval work', 'interval-work.wav', 'interval', '918', 1200],
  ['ready', 'Ready', 'ready.wav', 'workout', '916', 2200],
  ['go', 'Go', 'go.wav', 'workout', '1076', 950],
  ['warning', 'Warning', 'warning.wav', 'warning', '771', 1300],
  ['tick', 'Tick', 'tick.wav', 'clock', '1061', 23],
  ['tick-tock-loop', 'Tick-tock loop', 'tick-tock-loop.wav', 'clock', '1045', 8000],
  ['kitchen-timer-bell', 'Kitchen timer bell', 'kitchen-timer-bell.wav', 'timer', '1791', 1583],
  ['success-chime', 'Success chime', 'success-chime.wav', 'notification', '937', 3023],
  ['buzzer', 'Buzzer', 'buzzer.wav', 'alert', '2964', 800],
  ['reset', 'Reset', 'reset.wav', 'ui', '2521', 300],
] as const;

export const getDefaultSounds = (): BuiltInSound[] => soundMetadata.map(([
  id,
  name,
  file,
  category,
  sourceId,
  durationMs,
]) => ({
  id,
  name,
  file,
  url: new URL(`sounds/${file}`, window.location.href).href,
  category,
  source: `https://mixkit.co/free-sound-effects/download/${sourceId}/?context=item+grid`,
  license: 'Mixkit Sound Effects License',
  author: 'Mixkit',
  durationMs,
  defaultVolume: 1,
  builtIn: true,
}));
