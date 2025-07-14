export const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const format = (num: number) => num.toString().padStart(2, '0');

  return `${hours.toString().padStart(2, '0')}:${format(minutes)}:${format(seconds)}`;
};
