import { Box, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { formatDuration } from '../../utils/formatDuration';
import { useTimerSync } from '../../timer/useTimerSync';

const DisplayPage = () => {
  const { remainingSeconds, timerState } = useTimerSync();
  const formattedTime = formatDuration(remainingSeconds, timerState.timeFormat);
  const previousSeconds = useRef(remainingSeconds);
  const [flashSequence, setFlashSequence] = useState<{
    startedAt: number;
    durationSeconds: number;
    alternateTimeSeconds: number;
  } | null>(null);
  const [animationNow, setAnimationNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timerState.flashTest) return;
    setFlashSequence(timerState.flashTest);
    setAnimationNow(Date.now());
  }, [timerState.flashTest]);

  useEffect(() => {
    const previous = previousSeconds.current;
    previousSeconds.current = remainingSeconds;

    if (timerState.isPaused || previous === remainingSeconds) {
      return;
    }

    const crossed = (time: number) => timerState.mode === 'countdown'
      ? previous > time && remainingSeconds <= time
      : previous < time && remainingSeconds >= time;
    const triggeredFlashAlerts = timerState.alerts.filter((alert) => alert.enabled && alert.flash && crossed(alert.time));

    if (triggeredFlashAlerts.length === 0) {
      return;
    }

    const longest = triggeredFlashAlerts.reduce((current, alert) => (
      alert.flashDurationSeconds > current.flashDurationSeconds ? alert : current
    ));
    setFlashSequence({
      startedAt: Date.now(),
      durationSeconds: longest.flashDurationSeconds,
      alternateTimeSeconds: longest.flashAlternateTimeSeconds,
    });
    setAnimationNow(Date.now());
  }, [remainingSeconds, timerState.alerts, timerState.isPaused, timerState.mode]);

  useEffect(() => {
    if (!flashSequence) return;
    const interval = window.setInterval(() => setAnimationNow(Date.now()), 50);
    return () => window.clearInterval(interval);
  }, [flashSequence]);

  const elapsedSeconds = flashSequence ? (animationNow - flashSequence.startedAt) / 1000 : 0;
  const flashIsActive = Boolean(flashSequence && elapsedSeconds < flashSequence.durationSeconds);
  const isFlashing = flashIsActive && (
    !flashSequence?.alternateTimeSeconds
    || Math.floor(elapsedSeconds / flashSequence.alternateTimeSeconds) % 2 === 0
  );

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: isFlashing ? timerState.displayStyle.flashBackgroundColor : timerState.displayStyle.backgroundColor,
        color: isFlashing ? timerState.displayStyle.flashTextColor : timerState.displayStyle.textColor,
        transition: 'background-color 90ms ease, color 90ms ease',
      }}
    >
      <Typography
        component="div"
        sx={{
          fontSize: `${timerState.displayStyle.fontSizePx}px`,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          fontFamily: timerState.displayStyle.fontFamily,
          whiteSpace: 'nowrap',
        }}
      >
        {formattedTime}
      </Typography>
    </Box>
  );
};

export default DisplayPage;
