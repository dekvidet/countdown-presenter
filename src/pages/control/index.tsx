import { Box, Button, Container, Typography, Select, MenuItem } from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { useState, useEffect, useMemo, useRef } from 'react';
import { formatDuration } from '../../utils/formatDuration';
import dayjs, { Dayjs } from 'dayjs';

const soundFiles = [
  '2_1bell.mp3',
  '2bell.mp3',
  'bell.mp3',
  'bike_bell_long.mp3',
  'bike_bell_short.mp3',
  'medium_bike_bell.mp3',
];

const initialSounds = soundFiles.map(file => ({
  name: file,
  url: new URL(`sounds/${file}`, window.location.href).href,
}));

const ControlPage = () => {
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState<Dayjs | null>(dayjs().startOf('day'));
  const [isPaused, setIsPaused] = useState(true);
  const [alerts, setAlerts] = useState<{ time: number; sound: string }[]>([]);
  const [sounds, setSounds] = useState<{ name: string; url: string }[]>(initialSounds);

  const worker = useMemo(() => new SharedWorker(new URL('../../workers/timer.worker.ts', import.meta.url)), []);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    worker.port.postMessage({ type: 'update', payload: { rawTime: time, formattedTime: formatDuration(time) } });
  }, [time, worker]);

  useEffect(() => {
    if (startTime) {
      const newTime = startTime.hour() * 3600 + startTime.minute() * 60 + startTime.second();
      setTime(newTime);
    }
  }, [startTime]);

  const handleStart = () => {
    if (timerRef.current) return;
    setIsPaused(false);
    timerRef.current = setInterval(() => {
      setTime((prevTime) => {
        const newTime = prevTime - 1;
        if (newTime <= 0) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setIsPaused(true);
          return 0;
        }
        return newTime;
      });
    }, 1000);
  };

  const handlePause = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsPaused(true);
    }
  };

  const handleReset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const newTime = startTime ? startTime.hour() * 3600 + startTime.minute() * 60 + startTime.second() : 0;
    setTime(newTime);
    setIsPaused(true);
  };

  const handleClear = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTime(0);
    setIsPaused(true);
  };

  const handleAddAlert = () => {
    setAlerts([...alerts, { time: 0, sound: sounds[0].name }]);
  };

  const handleAlertChange = (index: number, time: Dayjs | null, sound: string) => {
    const newAlerts = [...alerts];
    newAlerts[index] = { time: time ? time.hour() * 3600 + time.minute() * 60 + time.second() : 0, sound };
    setAlerts(newAlerts);
  };

  const handleCustomSound = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newSounds = [...sounds];
      for (const file of e.target.files) {
        newSounds.push({ name: file.name, url: URL.createObjectURL(file) });
      }
      setSounds(newSounds);
    }
  };

  useEffect(() => {
    alerts.forEach(alert => {
      if (Math.floor(time) === alert.time) {
        const audio = new Audio(sounds.find(s => s.name === alert.sound)?.url);
        audio.play();
      }
    });
  }, [time, alerts, sounds]);

  return (
    <Container>
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h1">{formatDuration(time)}</Typography>
      </Box>
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Button variant="contained" sx={{ mr: 1 }} onClick={isPaused ? handleStart : handlePause}>
          {isPaused ? 'Start' : 'Pause'}
        </Button>
        <Button variant="contained" sx={{ mr: 1 }} onClick={handleReset}>
          Reset
        </Button>
        <Button variant="contained" onClick={handleClear}>Clear</Button>
      </Box>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4">Settings</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
          <TimePicker
            label="Start time"
            value={startTime}
            onChange={(newTime) => {
              setStartTime(newTime);
              if (newTime) {
                const timeInSeconds = newTime.hour() * 3600 + newTime.minute() * 60 + newTime.second();
                setTime(timeInSeconds);
              }
            }}
            ampm={false}
            views={['hours', 'minutes', 'seconds']}
          />
          <Button
            variant="contained"
            onClick={() => {
              window.open(window.location.origin + window.location.pathname + '#/display', '_blank');
            }}
          >
            Open display
          </Button>
        </Box>
      </Box>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4">Alerts</Typography>
        <Button variant="contained" onClick={handleAddAlert}>Add alert</Button>
        {alerts.map((alert, index) => (
          <Box key={index} sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TimePicker
              label="Trigger time"
              value={dayjs().startOf('day').add(alert.time, 'second')}
              onChange={(newTime) => handleAlertChange(index, newTime, alert.sound)}
              ampm={false}
              views={['hours', 'minutes', 'seconds']}
            />
            <Select
              label="Sound file"
              value={alert.sound}
              onChange={(e) => handleAlertChange(index, dayjs().startOf('day').add(alert.time, 'second'), e.target.value)}
            >
              {sounds.map(sound => (
                <MenuItem key={sound.name} value={sound.name}>{sound.name}</MenuItem>
              ))}
            </Select>
          </Box>
        ))}
      </Box>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4">Custom sounds</Typography>
        <input type="file" multiple onChange={handleCustomSound} />
      </Box>
    </Container>
  );
};

export default ControlPage;
