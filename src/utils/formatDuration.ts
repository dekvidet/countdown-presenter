export const DEFAULT_TIME_FORMAT = 'HH:mm:ss';

export const formatDuration = (totalSeconds: number, timeFormat = DEFAULT_TIME_FORMAT) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const format = (num: number) => num.toString().padStart(2, '0');

  return timeFormat
    .replaceAll('HH', format(hours))
    .replaceAll('MM', format(minutes))
    .replaceAll('SS', format(seconds))
    .replaceAll('mm', format(minutes))
    .replaceAll('ss', format(seconds));
};
