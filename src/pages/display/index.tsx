import { Box, Typography } from '@mui/material';
import { formatDuration } from '../../utils/formatDuration';
import { useTimerSync } from '../../timer/useTimerSync';

const DisplayPage = () => {
  const { remainingSeconds, timerState } = useTimerSync();
  const formattedTime = formatDuration(remainingSeconds, timerState.timeFormat);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <Typography variant="h1">{formattedTime}</Typography>
    </Box>
  );
};

export default DisplayPage;
