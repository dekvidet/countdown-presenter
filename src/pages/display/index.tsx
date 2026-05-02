import { Box, Typography } from '@mui/material';
import { useState, useEffect, useMemo } from 'react';

const DisplayPage = () => {
  const [formattedTime, setFormattedTime] = useState('00:00:00');

  const worker = useMemo(() => new SharedWorker(new URL('../../workers/timer.worker.ts', import.meta.url)), []);

  useEffect(() => {
    worker.port.onmessage = (event) => {
      const { formattedTime: nextFormattedTime } = event.data;
      setFormattedTime(nextFormattedTime);
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
      <Typography variant="h1">{formattedTime}</Typography>
    </Box>
  );
};

export default DisplayPage;
