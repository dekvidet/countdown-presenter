import {
  alpha,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { DEFAULT_TIME_FORMAT, formatDuration } from '../../utils/formatDuration';
import { getDefaultSounds } from '../../timer/defaultSounds';
import { useTimerSync } from '../../timer/useTimerSync';
import type { AlertConfig } from '../../timer/types';

const cardSx = {
  p: { xs: 2, md: 2.5 },
  borderRadius: 3,
  background: 'linear-gradient(180deg, rgba(24, 35, 49, 0.98) 0%, rgba(18, 28, 40, 0.98) 100%)',
};

const getDurationParts = (totalSeconds: number) => ({
  hours: String(Math.floor(totalSeconds / 3600)),
  minutes: String(Math.floor((totalSeconds % 3600) / 60)),
  seconds: String(totalSeconds % 60),
});

const DurationInput = ({
  label,
  totalSeconds,
  onChange,
}: {
  label: string;
  totalSeconds: number;
  onChange: (seconds: number) => void;
}) => {
  const [parts, setParts] = useState(() => getDurationParts(totalSeconds));

  useEffect(() => {
    setParts(getDurationParts(totalSeconds));
  }, [totalSeconds]);

  const updatePart = (part: keyof typeof parts, value: string) => {
    const nextParts = { ...parts, [part]: value };
    setParts(nextParts);

    if (value === '') {
      return;
    }

    const hours = Math.max(0, Number(nextParts.hours || 0));
    const minutes = Math.min(59, Math.max(0, Number(nextParts.minutes || 0)));
    const seconds = Math.min(59, Math.max(0, Number(nextParts.seconds || 0)));
    if ([hours, minutes, seconds].every(Number.isFinite)) {
      onChange(Math.floor(hours) * 3600 + Math.floor(minutes) * 60 + Math.floor(seconds));
    }
  };

  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Box sx={{ mt: 0.75, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
        {(['hours', 'minutes', 'seconds'] as const).map((part) => (
          <TextField
            key={part}
            size="small"
            type="number"
            label={part[0].toUpperCase() + part.slice(1)}
            value={parts[part]}
            onChange={(event) => updatePart(part, event.target.value)}
            slotProps={{
              htmlInput: {
                min: 0,
                ...(part === 'hours' ? {} : { max: 59 }),
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

const ColorControl = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <Paper
    sx={{
      p: 1.25,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 1.5,
      borderRadius: 2,
      bgcolor: alpha('#0b1420', 0.42),
    }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="subtitle2">{label}</Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
        {value.toUpperCase()}
      </Typography>
    </Box>
    <TextField
      type="color"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      sx={{
        width: 58,
        flexShrink: 0,
        '& input': { height: 34, p: 0.5, cursor: 'pointer' },
      }}
    />
  </Paper>
);

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
    setContinueAfterEnd,
    setDisplayStyle,
    setDurationSeconds,
    setEndSeconds: setTimerEndSeconds,
    setMode,
    setTimeFormat,
    start,
    timerState,
  } = useTimerSync();
  const [sounds, setSounds] = useState(() => getDefaultSounds());
  const [startSeconds, setStartSeconds] = useState(timerState.durationSeconds);
  const [endSeconds, setEndSeconds] = useState(timerState.endSeconds);
  const [timerMode, setTimerMode] = useState(timerState.mode);
  const [fontSizeInput, setFontSizeInput] = useState(() => String(timerState.displayStyle.fontSizePx));
  const [expandedAlertIds, setExpandedAlertIds] = useState<Set<string>>(() => new Set());
  const previousRemainingRef = useRef(remainingSeconds);

  // Keep form controls responsive while a synchronized update is in flight.
  useEffect(() => {
    setStartSeconds(timerState.durationSeconds);
    setEndSeconds(timerState.endSeconds);
    setTimerMode(timerState.mode);
  }, [timerState.durationSeconds, timerState.endSeconds, timerState.mode]);

  useEffect(() => {
    setFontSizeInput(String(timerState.displayStyle.fontSizePx));
  }, [timerState.displayStyle.fontSizePx]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditing = target?.isContentEditable
        || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target?.tagName ?? '');

      if (isEditing || event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        if (isPaused) {
          start();
        } else {
          pause();
        }
        return;
      }

      if (event.key === 'Enter' || event.key.toLowerCase() === 's') {
        event.preventDefault();
        reset();
        return;
      }

      if (event.key.toLowerCase() === 'c') {
        event.preventDefault();
        clear();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [clear, isPaused, pause, reset, start]);

  const alerts = timerState.alerts;
  const timeFormat = timerState.timeFormat;

  const handleAddAlert = () => {
    const id = crypto.randomUUID();
    replaceAlerts([
      ...alerts,
      {
        id,
        time: 0,
        sound: sounds[0]?.name ?? '',
        soundEnabled: false,
        flash: false,
        flashDurationSeconds: 0.9,
      },
    ]);
    setExpandedAlertIds((current) => new Set(current).add(id));
  };

  const toggleAlert = (id: string) => {
    setExpandedAlertIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getAlertSummary = (alert: AlertConfig) => {
    const action = alert.soundEnabled && alert.flash
      ? 'flash and sound'
      : alert.flash
        ? 'flash'
        : alert.soundEnabled
          ? 'sound'
          : 'nothing';
    return `Triggers ${action} at ${formatDuration(alert.time)}`;
  };

  const handleAlertChange = (index: number, changes: Partial<AlertConfig>) => {
    const nextAlerts: AlertConfig[] = alerts.map((alert, alertIndex) => {
      if (alertIndex !== index) {
        return alert;
      }

      return {
        ...alert,
        ...changes,
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

    if (timerState.isPaused || previousRemaining === remainingSeconds) {
      return;
    }

    const triggeredAlerts = alerts.filter((alert) => timerState.mode === 'countdown'
      ? alert.time <= previousRemaining && alert.time >= remainingSeconds
      : alert.time > previousRemaining && alert.time <= remainingSeconds);

    for (const alert of triggeredAlerts.filter((alert) => alert.soundEnabled)) {
      const soundUrl = sounds.find((sound) => sound.name === alert.sound)?.url;
      if (!soundUrl) {
        continue;
      }

      void new Audio(soundUrl).play().catch(() => undefined);
    }
  }, [alerts, remainingSeconds, sounds, timerState.isPaused, timerState.mode]);

  const formattedTime = formatDuration(remainingSeconds, timeFormat);
  const startLabel = formatDuration(startSeconds);
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
                    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(320px, 0.82fr)' },
                    gap: { xs: 2.5, md: 3 },
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.12em' }}>
                      Live timer
                    </Typography>
                    <Typography
                      variant="h1"
                      sx={{
                        mt: 0.75,
                        fontSize: { xs: '3.7rem', sm: '5.2rem', md: '5.8rem', lg: '6.4rem' },
                        lineHeight: 0.92,
                        whiteSpace: 'nowrap',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formattedTime}
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mt: 2.25 }}>
                      <Button
                        variant="contained"
                        color={isPaused ? 'secondary' : 'primary'}
                        onClick={isPaused ? start : pause}
                        sx={{ minWidth: 132 }}
                      >
                        {isPaused ? 'Play' : 'Pause'}
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
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: 1.25,
                    }}
                  >
                    {[
                      { label: 'Status', value: statusLabel, tone: accentColor },
                      { label: 'Start time', value: startLabel },
                      { label: 'End time', value: formatDuration(endSeconds) },
                      { label: 'Mode', value: timerState.mode === 'countdown' ? 'Countdown' : 'Countup' },
                      { label: 'Sound/flash alerts', value: `${alerts.length}` },
                      { label: 'Format', value: timeFormat },
                    ].map((item) => (
                      <Paper
                        key={item.label}
                        sx={{
                          p: 1.25,
                          minHeight: 70,
                          borderRadius: 2,
                          backgroundColor: alpha('#0b1420', 0.55),
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
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
                  <FormControl fullWidth size="small">
                    <InputLabel>Timer mode</InputLabel>
                    <Select
                      label="Timer mode"
                      value={timerMode}
                      onChange={(event) => {
                        const mode = event.target.value as 'countdown' | 'countup';
                        setTimerMode(mode);
                        setStartSeconds(mode === 'countup' ? 0 : 600);
                        setEndSeconds(mode === 'countup' ? 600 : 0);
                        setMode(mode);
                      }}
                    >
                      <MenuItem value="countdown">Countdown</MenuItem>
                      <MenuItem value="countup">Countup</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    size="small"
                    label="Time format"
                    value={timeFormat}
                    onChange={(event) => setTimeFormat(event.target.value || DEFAULT_TIME_FORMAT)}
                    placeholder="HH:mm:ss"
                  />
                </Box>
                <Box
                  sx={{
                    mt: 2,
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <DurationInput
                    label="Start value"
                    totalSeconds={startSeconds}
                    onChange={(timeInSeconds) => {
                      setStartSeconds(timeInSeconds);
                      setDurationSeconds(timeInSeconds);
                    }}
                  />
                  <DurationInput
                    label="End value"
                    totalSeconds={endSeconds}
                    onChange={(timeInSeconds) => {
                      setEndSeconds(timeInSeconds);
                      setTimerEndSeconds(timeInSeconds);
                    }}
                  />
                </Box>
                <Paper sx={{ mt: 2, px: 1.5, py: 0.5, borderRadius: 2, bgcolor: alpha('#0b1420', 0.42) }}>
                  <FormControlLabel
                    control={<Checkbox checked={timerState.continueAfterEnd} onChange={(event) => setContinueAfterEnd(event.target.checked)} />}
                    label="Continue timer after end time"
                  />
                </Paper>
              </Paper>

            </Stack>

            <Stack spacing={3}>
              <Paper sx={cardSx}>
                <Typography variant="h4">Style</Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#0b1420', 0.42) }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                      <Box>
                        <Typography variant="subtitle2">Timer text size</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Size in pixels</Typography>
                      </Box>
                      <TextField
                        size="small"
                        type="number"
                        value={fontSizeInput}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setFontSizeInput(nextValue);
                          const fontSizePx = Number(nextValue);
                          if (Number.isFinite(fontSizePx) && fontSizePx >= 12) {
                            setDisplayStyle({ fontSizePx });
                          }
                        }}
                        slotProps={{ htmlInput: { min: 12, max: 1000, 'aria-label': 'Timer font size' } }}
                        sx={{ width: 110, flexShrink: 0 }}
                      />
                    </Stack>
                  </Paper>

                  <Box>
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>Display colors</Typography>
                    <Box sx={{ mt: 0.75, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', xl: '1fr' }, gap: 1 }}>
                      <ColorControl label="Background" value={timerState.displayStyle.backgroundColor} onChange={(backgroundColor) => setDisplayStyle({ backgroundColor })} />
                      <ColorControl label="Text" value={timerState.displayStyle.textColor} onChange={(textColor) => setDisplayStyle({ textColor })} />
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>Flash colors</Typography>
                    <Box sx={{ mt: 0.75, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', xl: '1fr' }, gap: 1 }}>
                      <ColorControl label="Background" value={timerState.displayStyle.flashBackgroundColor} onChange={(flashBackgroundColor) => setDisplayStyle({ flashBackgroundColor })} />
                      <ColorControl label="Text" value={timerState.displayStyle.flashTextColor} onChange={(flashTextColor) => setDisplayStyle({ flashTextColor })} />
                    </Box>
                  </Box>
                </Stack>
              </Paper>

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
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  spacing={2}
                >
                  <Box>
                    <Typography variant="h4">Sound and flash alerts</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                      Trigger a sound, screen flash, or both at a timer value.
                    </Typography>
                  </Box>
                  <Button variant="contained" color="secondary" onClick={handleAddAlert}>
                    Add alert
                  </Button>
                </Stack>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {alerts.length === 0 ? (
                    <Paper
                      sx={{
                        p: 2.25,
                        borderRadius: 2,
                        textAlign: 'center',
                        backgroundColor: alpha('#0b1420', 0.42),
                      }}
                    >
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        No sound or flash alerts configured.
                      </Typography>
                    </Paper>
                  ) : (
                    alerts.map((alert, index) => (
                      <Paper
                        key={alert.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: alpha('#0b1420', 0.42),
                        borderColor: alert.soundEnabled || alert.flash
                          ? alpha('#14b8a6', 0.34)
                          : alpha('#d7e7fb', 0.08),
                      }}
                    >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          spacing={2}
                          role="button"
                          tabIndex={0}
                          aria-expanded={expandedAlertIds.has(alert.id)}
                          title={expandedAlertIds.has(alert.id) ? 'Collapse alert' : 'Edit alert'}
                          onClick={() => toggleAlert(alert.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.code === 'Space') {
                              event.preventDefault();
                              event.stopPropagation();
                              toggleAlert(alert.id);
                            }
                          }}
                          sx={{ cursor: 'pointer' }}
                        >
                          <Box>
                            <Typography variant="subtitle1">Alert {index + 1}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                              {getAlertSummary(alert)}
                            </Typography>
                          </Box>
                          {expandedAlertIds.has(alert.id) ? (
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={(event) => {
                                event.stopPropagation();
                                replaceAlerts(alerts.filter((item) => item.id !== alert.id));
                                setExpandedAlertIds((current) => {
                                  const next = new Set(current);
                                  next.delete(alert.id);
                                  return next;
                                });
                              }}
                            >
                              Delete
                            </Button>
                          ) : null}
                        </Stack>
                        <Collapse in={expandedAlertIds.has(alert.id)} timeout="auto" unmountOnExit>
                        <Stack spacing={2} sx={{ mt: 2 }}>
                          <DurationInput
                            label="Trigger at timer value"
                            totalSeconds={alert.time}
                            onChange={(time) => handleAlertChange(index, { time })}
                          />

                          <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#0f1f31', 0.62) }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                              <Box>
                                <Typography variant="subtitle2">Sound</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  Play the selected sound at the trigger value.
                                </Typography>
                              </Box>
                              <FormControlLabel
                                control={<Switch checked={alert.soundEnabled} onChange={(event) => handleAlertChange(index, { soundEnabled: event.target.checked })} />}
                                label={alert.soundEnabled ? 'On' : 'Off'}
                                labelPlacement="start"
                                sx={{ m: 0 }}
                              />
                            </Stack>
                            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                              <Select
                                fullWidth
                                size="small"
                                value={alert.sound}
                                onChange={(event) => handleAlertChange(index, { sound: event.target.value })}
                              >
                                {sounds.map(sound => (
                                  <MenuItem key={sound.name} value={sound.name}>{sound.name}</MenuItem>
                                ))}
                              </Select>
                              <Button
                                variant="outlined"
                                color="inherit"
                                disabled={!sounds.some((sound) => sound.name === alert.sound)}
                                onClick={() => {
                                  const soundUrl = sounds.find((sound) => sound.name === alert.sound)?.url;
                                  if (soundUrl) {
                                    void new Audio(soundUrl).play().catch(() => undefined);
                                  }
                                }}
                                sx={{ flexShrink: 0 }}
                              >
                                Test
                              </Button>
                            </Stack>
                          </Paper>

                          <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#0f1f31', 0.62) }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                              <Box>
                                <Typography variant="subtitle2">Screen flash</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  Flash colors are configured in the Style panel.
                                </Typography>
                              </Box>
                              <FormControlLabel
                                control={<Switch checked={alert.flash} onChange={(event) => handleAlertChange(index, { flash: event.target.checked })} />}
                                label={alert.flash ? 'On' : 'Off'}
                                labelPlacement="start"
                                sx={{ m: 0 }}
                              />
                            </Stack>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              label="Duration in seconds"
                              value={alert.flashDurationSeconds}
                              onChange={(event) => {
                                const flashDurationSeconds = Number(event.target.value);
                                if (Number.isFinite(flashDurationSeconds) && flashDurationSeconds >= 0.1) {
                                  handleAlertChange(index, { flashDurationSeconds });
                                }
                              }}
                              slotProps={{ htmlInput: { min: 0.1, max: 60, step: 0.1 } }}
                              sx={{ mt: 1.5 }}
                            />
                          </Paper>
                        </Stack>
                        </Collapse>
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
