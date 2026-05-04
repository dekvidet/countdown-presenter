import {
  alpha,
  Box,
  Button,
  Chip,
  Container,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_TIME_FORMAT, formatDuration } from '../../utils/formatDuration';
import dayjs, { Dayjs } from 'dayjs';
import { getDefaultSounds } from '../../timer/defaultSounds';
import { useTimerSync } from '../../timer/useTimerSync';
import type { AlertConfig } from '../../timer/types';

const cardSx = {
  p: { xs: 2, md: 2.5 },
  borderRadius: 3,
  background: 'linear-gradient(180deg, rgba(24, 35, 49, 0.98) 0%, rgba(18, 28, 40, 0.98) 100%)',
};

const ControlPage = () => {
  const {
    clear,
    connectionState,
    isPaused,
    pause,
    remainingSeconds,
    replaceAlerts,
    reset,
    runtimeConfig,
    setDurationSeconds,
    setTimeFormat,
    start,
    timerState,
  } = useTimerSync();
  const [sounds, setSounds] = useState(() => getDefaultSounds());
  const previousRemainingRef = useRef(remainingSeconds);

  const startTime = useMemo(
    () => dayjs().startOf('day').add(timerState.durationSeconds, 'second'),
    [timerState.durationSeconds],
  );

  const alerts = timerState.alerts;
  const timeFormat = timerState.timeFormat;

  const handleAddAlert = () => {
    replaceAlerts([
      ...alerts,
      {
        id: crypto.randomUUID(),
        time: 0,
        sound: sounds[0]?.name ?? '',
      },
    ]);
  };

  const handleAlertChange = (index: number, time: Dayjs | null, sound: string) => {
    const nextAlerts: AlertConfig[] = alerts.map((alert, alertIndex) => {
      if (alertIndex !== index) {
        return alert;
      }

      return {
        ...alert,
        time: time ? time.hour() * 3600 + time.minute() * 60 + time.second() : 0,
        sound,
      };
    });

    replaceAlerts(nextAlerts);
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
    const previousRemaining = previousRemainingRef.current;
    previousRemainingRef.current = remainingSeconds;

    if (isPaused || previousRemaining <= remainingSeconds) {
      return;
    }

    const triggeredAlerts = alerts.filter((alert) => (
      alert.time <= previousRemaining && alert.time > remainingSeconds
    ));

    for (const alert of triggeredAlerts) {
      const soundUrl = sounds.find((sound) => sound.name === alert.sound)?.url;
      if (!soundUrl) {
        continue;
      }

      void new Audio(soundUrl).play().catch(() => undefined);
    }
  }, [alerts, isPaused, remainingSeconds, sounds]);

  const formattedTime = formatDuration(remainingSeconds, timeFormat);
  const startLabel = startTime.format('HH:mm:ss');
  const statusLabel = isPaused ? 'Paused' : 'Running';
  const accentColor = isPaused ? '#f59e0b' : '#14b8a6';
  const currentOrigin = window.location.origin;
  const displayUrl = `${currentOrigin}${window.location.pathname}#/display`;
  const remoteControlUrl = runtimeConfig?.remoteOrigin ? `${runtimeConfig.remoteOrigin}/#/control` : null;
  const remoteDisplayUrl = runtimeConfig?.remoteOrigin ? `${runtimeConfig.remoteOrigin}/#/display` : null;
  const localControlUrl = runtimeConfig?.localOrigin ? `${runtimeConfig.localOrigin}/#/control` : null;
  const transportLabel = runtimeConfig ? `Websocket ${connectionState}` : 'Browser local';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 2, md: 3 },
        }}
    >
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Paper sx={{ ...cardSx, p: { xs: 2.5, md: 3 } }}>
            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', lg: 'center' }}
            >
              <Box>
                <Typography variant="h4">Countdown control</Typography>
                <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
                  Manage the presenter timer and audience display.
                </Typography>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Chip
                  label={`Status: ${statusLabel}`}
                  sx={{
                    justifyContent: 'flex-start',
                    color: isPaused ? '#fcd34d' : '#99f6e4',
                    bgcolor: alpha(accentColor, 0.12),
                    borderColor: alpha(accentColor, 0.26),
                    borderRadius: 2,
                  }}
                  variant="outlined"
                />
                <Chip
                  label={`Sync: ${transportLabel}`}
                  sx={{
                    justifyContent: 'flex-start',
                    borderRadius: 2,
                  }}
                  variant="outlined"
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    window.open(displayUrl, '_blank');
                  }}
                >
                  Open display
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.45fr) minmax(360px, 0.95fr)' },
              gap: 3,
            }}
          >
            <Stack spacing={3}>
              <Paper
                sx={{
                  ...cardSx,
                  p: { xs: 2.5, md: 3 },
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 260px' },
                    gap: 2,
                    alignItems: 'start',
                  }}
                >
                  <Box>
                    <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.12em' }}>
                      Live timer
                    </Typography>
                    <Typography
                      variant="h1"
                      sx={{
                        mt: 1,
                        fontSize: { xs: '3.1rem', sm: '4.2rem', lg: '5.4rem' },
                        lineHeight: 0.96,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formattedTime}
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mt: 2.5 }}>
                      <Button
                        variant="contained"
                        color={isPaused ? 'secondary' : 'primary'}
                        onClick={isPaused ? start : pause}
                        sx={{ minWidth: 132 }}
                      >
                        {isPaused ? 'Start' : 'Pause'}
                      </Button>
                      <Button variant="outlined" onClick={reset} sx={{ minWidth: 100 }}>
                        Reset
                      </Button>
                      <Button variant="outlined" color="inherit" onClick={clear} sx={{ minWidth: 100 }}>
                        Clear
                      </Button>
                    </Stack>
                  </Box>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gap: 1,
                    }}
                  >
                    {[
                      { label: 'Status', value: statusLabel, tone: accentColor },
                      { label: 'Start time', value: startLabel },
                      { label: 'Alerts', value: `${alerts.length}` },
                      { label: 'Format', value: timeFormat },
                    ].map((item) => (
                      <Paper
                        key={item.label}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: alpha('#0b1420', 0.55),
                        }}
                      >
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{item.label}</Typography>
                        <Typography
                          variant="subtitle1"
                          sx={{ mt: 0.25, color: item.tone ?? 'text.primary', fontVariantNumeric: 'tabular-nums' }}
                        >
                      {item.value}
                    </Typography>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              </Paper>

              <Paper sx={cardSx}>
                <Typography variant="h4">Timer settings</Typography>
                <Box
                  sx={{
                    mt: 2,
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <TimePicker
                    label="Start time"
                    value={startTime}
                    onChange={(newTime) => {
                      const timeInSeconds = newTime
                        ? newTime.hour() * 3600 + newTime.minute() * 60 + newTime.second()
                        : 0;
                      setDurationSeconds(timeInSeconds);
                    }}
                    ampm={false}
                    views={['hours', 'minutes', 'seconds']}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        helperText: 'Countdown duration',
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Time format"
                    value={timeFormat}
                    onChange={(event) => setTimeFormat(event.target.value || DEFAULT_TIME_FORMAT)}
                    helperText="Example: HH:mm:ss or HH.mm.ss"
                  />
                </Box>
              </Paper>
            </Stack>

            <Stack spacing={3}>
              {runtimeConfig ? (
                <Paper sx={cardSx}>
                  <Typography variant="h4">Remote access</Typography>
                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    {localControlUrl ? (
                      <TextField
                        fullWidth
                        label="Local control URL"
                        value={localControlUrl}
                        slotProps={{ input: { readOnly: true } }}
                      />
                    ) : null}
                    {remoteControlUrl ? (
                      <TextField
                        fullWidth
                        label="Remote control URL"
                        value={remoteControlUrl}
                        slotProps={{ input: { readOnly: true } }}
                      />
                    ) : null}
                    {remoteDisplayUrl ? (
                      <TextField
                        fullWidth
                        label="Remote display URL"
                        value={remoteDisplayUrl}
                        slotProps={{ input: { readOnly: true } }}
                      />
                    ) : null}
                  </Stack>
                </Paper>
              ) : null}

              <Paper sx={cardSx}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                  <Typography variant="h4">Alerts</Typography>
                  <Button variant="contained" color="secondary" onClick={handleAddAlert}>
                    Add alert
                  </Button>
                </Stack>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {alerts.length === 0 ? (
                    <Paper
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        textAlign: 'center',
                        backgroundColor: alpha('#0b1420', 0.42),
                      }}
                    >
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        No alerts configured.
                      </Typography>
                    </Paper>
                  ) : (
                    alerts.map((alert, index) => (
                      <Paper
                        key={index}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: alpha('#0b1420', 0.42),
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
                          Alert {index + 1}
                        </Typography>
                        <Stack spacing={2}>
                          <TimePicker
                            label="Trigger time"
                            value={dayjs().startOf('day').add(alert.time, 'second')}
                            onChange={(newTime) => handleAlertChange(index, newTime, alert.sound)}
                            ampm={false}
                            views={['hours', 'minutes', 'seconds']}
                            slotProps={{ textField: { fullWidth: true } }}
                          />
                          <Select
                            fullWidth
                            value={alert.sound}
                            onChange={(e) => handleAlertChange(index, dayjs().startOf('day').add(alert.time, 'second'), e.target.value)}
                          >
                            {sounds.map(sound => (
                              <MenuItem key={sound.name} value={sound.name}>{sound.name}</MenuItem>
                            ))}
                          </Select>
                        </Stack>
                      </Paper>
                    ))
                  )}
                </Stack>
              </Paper>

              <Paper sx={cardSx}>
                <Typography variant="h4">Sound library</Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Button component="label" variant="outlined" color="inherit">
                    Upload custom sounds
                    <input hidden type="file" multiple onChange={handleCustomSound} />
                  </Button>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {sounds.map((sound) => (
                      <Chip
                        key={sound.name}
                        label={sound.name}
                        variant="outlined"
                        sx={{
                          bgcolor: alpha('#0f1f31', 0.6),
                          borderColor: alpha('#d7e7fb', 0.14),
                          borderRadius: 2,
                        }}
                      />
                    ))}
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default ControlPage;
