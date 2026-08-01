import { Box, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { formatDuration } from '../../utils/formatDuration';
import { useTimerSync } from '../../timer/useTimerSync';

const DisplayPage = () => {
  const { remainingSeconds, timerState } = useTimerSync();
  const formattedTime = formatDuration(remainingSeconds, timerState.timeFormat);
  const previousSeconds = useRef(remainingSeconds);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    const previous = previousSeconds.current;
    previousSeconds.current = remainingSeconds;

    if (timerState.isPaused || previous === remainingSeconds) {
      return;
    }

    const crossed = (time: number) => timerState.mode === 'countdown'
      ? previous > time && remainingSeconds <= time
      : previous < time && remainingSeconds >= time;
    const triggeredFlashAlerts = timerState.alerts.filter((alert) => alert.flash && crossed(alert.time));

    if (triggeredFlashAlerts.length === 0) {
      return;
    }

    setIsFlashing(true);
    const flashDurationSeconds = Math.max(
      ...triggeredFlashAlerts.map((alert) => alert.flashDurationSeconds),
    );
    const timeout = window.setTimeout(
      () => setIsFlashing(false),
      flashDurationSeconds * 1000,
    );
    return () => window.clearTimeout(timeout);
  }, [remainingSeconds, timerState.alerts, timerState.isPaused, timerState.mode]);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
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
        }}
      >
        {formattedTime}
      </Typography>
    </Box>
  );
};

export default DisplayPage;
