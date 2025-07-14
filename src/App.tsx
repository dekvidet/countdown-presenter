import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Router } from './router';
import { theme } from './theme';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
       <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Router />
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;