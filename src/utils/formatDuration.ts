import { DEFAULT_TIME_FORMAT } from '../timer/constants.js';

export { DEFAULT_TIME_FORMAT };

export const formatDuration = (totalSeconds: number, timeFormat = DEFAULT_TIME_FORMAT) => {
  const sign = totalSeconds < 0 ? '-' : '';
  const absoluteSeconds = Math.abs(totalSeconds);
  const totalMilliseconds = Math.round(absoluteSeconds * 1000);
  const hours = Math.floor(totalMilliseconds / 3_600_000);
  const minutes = Math.floor((totalMilliseconds % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMilliseconds % 60_000) / 1000);
  const totalMinutes = Math.floor(totalMilliseconds / 60_000);
  const totalWholeSeconds = Math.floor(totalMilliseconds / 1000);
  const milliseconds = totalMilliseconds % 1000;

  const twoDigits = (num: number) => num.toString().padStart(2, '0');
  const threeDigits = (num: number) => num.toString().padStart(3, '0');

  return sign + timeFormat.replace(/HH|H|mm|m|ss|SSS/g, (token) => {
    switch (token) {
      case 'HH': return twoDigits(hours);
      case 'H': return String(hours);
      case 'mm': return timeFormat.includes('H') ? twoDigits(minutes) : twoDigits(totalMinutes);
      case 'm': return timeFormat.includes('H') ? String(minutes) : String(totalMinutes);
      case 'ss': return timeFormat.includes('m') || timeFormat.includes('H') ? twoDigits(seconds) : twoDigits(totalWholeSeconds);
      case 'SSS': return threeDigits(milliseconds);
      default: return token;
    }
  });
};

const timeFormatTokenPattern = /HH|SSS|mm|ss|H|m/g;

const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getFormatParts = (timeFormat: string) => {
  const parts: Array<{ type: 'token' | 'literal'; value: string }> = [];
  let lastIndex = 0;
  for (const match of timeFormat.matchAll(timeFormatTokenPattern)) {
    if (match.index > lastIndex) parts.push({ type: 'literal', value: timeFormat.slice(lastIndex, match.index) });
    parts.push({ type: 'token', value: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < timeFormat.length) parts.push({ type: 'literal', value: timeFormat.slice(lastIndex) });
  return parts;
};

export const isDurationInputAllowed = (value: string, timeFormat: string) => {
  const literalCharacters = new Set(getFormatParts(timeFormat)
    .filter((part) => part.type === 'literal')
    .flatMap((part) => [...part.value]));
  if ([...value].some((character) => !/\d/.test(character) && !literalCharacters.has(character))) return false;
  return [...literalCharacters].every((literal) => (
    value.split(literal).length - 1 <= timeFormat.split(literal).length - 1
  ));
};

export const parseDuration = (value: string, timeFormat?: string) => {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;

  if (timeFormat) {
    const parts = getFormatParts(timeFormat);
    const hasHours = parts.some((part) => part.type === 'token' && (part.value === 'H' || part.value === 'HH'));
    const hasMinutes = parts.some((part) => part.type === 'token' && (part.value === 'm' || part.value === 'mm'));
    const captures: string[] = [];
    const pattern = parts.map((part) => {
      if (part.type === 'literal') return escapePattern(part.value);
      captures.push(part.value);
      if (part.value === 'SSS') return '(\\d{3})';
      if (part.value === 'H' || part.value === 'm') return '(\\d+)';
      if (part.value === 'HH') return '(\\d{2,})';
      if (part.value === 'mm') return hasHours ? '(\\d{2})' : '(\\d{2,})';
      return hasHours || hasMinutes ? '(\\d{2})' : '(\\d{2,})';
    }).join('');
    const match = normalized.match(new RegExp(`^${pattern}$`));
    if (!match) return null;

    let totalSeconds = 0;
    for (const [index, token] of captures.entries()) {
      const part = Number(match[index + 1]);
      if ((token === 'm' || token === 'mm') && hasHours && part > 59) return null;
      if (token === 'ss' && (hasHours || hasMinutes) && part > 59) return null;
      if (token === 'H' || token === 'HH') totalSeconds += part * 3600;
      if (token === 'm' || token === 'mm') totalSeconds += part * 60;
      if (token === 'ss') totalSeconds += part;
      if (token === 'SSS') totalSeconds += part / 1000;
    }
    return totalSeconds;
  }

  const parts = normalized.split(':');
  if (parts.length > 3 || parts.some((part) => part.trim() === '')) return null;
  const numbers = parts.map(Number);
  if (!numbers.every(Number.isFinite) || numbers.some((part) => part < 0)) return null;
  if (parts.length === 3) return numbers[0] * 3600 + numbers[1] * 60 + numbers[2];
  if (parts.length === 2) return numbers[0] * 60 + numbers[1];
  return numbers[0];
};
