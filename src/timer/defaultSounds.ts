const soundFiles = [
  '2_1bell.mp3',
  '2bell.mp3',
  'bell.mp3',
  'bike_bell_long.mp3',
  'bike_bell_short.mp3',
  'medium_bike_bell.mp3',
];

export const getDefaultSounds = () =>
  soundFiles.map((file) => ({
    name: file,
    url: new URL(`sounds/${file}`, window.location.href).href,
  }));
