import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Router } from './router';
import { theme } from './theme';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimerSyncProvider } from './timer/TimerSyncContext';
import type { RuntimeConfig } from './timer/types';

function App({ runtimeConfig }: { runtimeConfig: RuntimeConfig | null }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <TimerSyncProvider runtimeConfig={runtimeConfig}>
          <Router />
        </TimerSyncProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
