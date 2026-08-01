import { DEFAULT_TIME_FORMAT } from '../timer/constants.js';

export { DEFAULT_TIME_FORMAT };

export const formatDuration = (totalSeconds: number, timeFormat = DEFAULT_TIME_FORMAT) => {
  const sign = totalSeconds < 0 ? '-' : '';
  const absoluteSeconds = Math.abs(totalSeconds);
  const hours = Math.floor(absoluteSeconds / 3600);
  const minutes = Math.floor((absoluteSeconds % 3600) / 60);
  const seconds = absoluteSeconds % 60;

  const format = (num: number) => num.toString().padStart(2, '0');

  return sign + timeFormat
    .replaceAll('HH', format(hours))
    .replaceAll('MM', format(minutes))
    .replaceAll('SS', format(seconds))
    .replaceAll('mm', format(minutes))
    .replaceAll('ss', format(seconds));
};
