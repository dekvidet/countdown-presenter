import { Box, Typography } from '@mui/material';
import { useState, useEffect, useMemo } from 'react';
import { formatDuration } from '../../utils/formatDuration';

const DisplayPage = () => {
  const [time, setTime] = useState(0);

  const worker = useMemo(() => new SharedWorker(new URL('../../workers/timer.worker.ts', import.meta.url)), []);

  useEffect(() => {
    worker.port.onmessage = (event) => {
      const { rawTime } = event.data;
      setTime(rawTime);
    };

    worker.port.start();
  }, [worker]);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <Typography variant="h1">{formatDuration(time)}</Typography>
    </Box>
  );
};

export default DisplayPage;