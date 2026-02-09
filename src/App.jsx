/**
 * Main App Component
 * Orchestrates all components and manages overall layout
 * KuzeyBoru Pipe Calculator
 */

import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  ThemeProvider,
  CssBaseline,
  createTheme
} from '@mui/material';
import { Calculate as CalculateIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { CalculatorProvider, useCalculator } from './context/CalculatorContext';
import VolumeInput from './components/VolumeInput/VolumeInput';
import PipesInput from './components/PipesInput/PipesInput';
import BoxesInput from './components/BoxesInput/BoxesInput';
import ConfigurationInput from './components/ConfigurationInput/ConfigurationInput';
import ResultsDisplay from './components/ResultsDisplay/ResultsDisplay';
import PipeVisualization from './components/Visualization/PipeVisualization';

// KuzeyBoru brand colors
const KUZEYBORU_COLORS = {
  primary: '#4C5C65',      // Dark Blue-Gray
  accent: '#F10826',       // Red/Crimson
  background: '#F5F7F8',   // Light Gray-White
  paper: '#FFFFFF',        // White
  lightGray: '#E7EBED',    // Secondary background
  text: '#4C5C65',         // Dark Gray text
  textSecondary: '#7E7E7E' // Secondary text
};

// Create custom theme with KuzeyBoru branding
const theme = createTheme({
  palette: {
    primary: {
      main: KUZEYBORU_COLORS.primary,
      light: '#6B7B84',
      dark: '#3a474e',
      contrastText: '#ffffff',
    },
    secondary: {
      main: KUZEYBORU_COLORS.accent,
      light: '#ff3d4d',
      dark: '#c00620',
      contrastText: '#ffffff',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    error: {
      main: KUZEYBORU_COLORS.accent,
    },
    info: {
      main: KUZEYBORU_COLORS.primary,
    },
    background: {
      default: KUZEYBORU_COLORS.background,
      paper: KUZEYBORU_COLORS.paper,
    },
    text: {
      primary: KUZEYBORU_COLORS.text,
      secondary: KUZEYBORU_COLORS.textSecondary,
    },
  },
  typography: {
    fontFamily: [
      'Montserrat',
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(76, 92, 101, 0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
        },
        containedSecondary: {
          '&:hover': {
            backgroundColor: '#c00620',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

// Calculator Layout Component
function CalculatorLayout() {
  const { calculate, reset, isValid, isCalculating } = useCalculator();

  const handleCalculate = async () => {
    await calculate();
  };

  const handleReset = () => {
    reset();
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: KUZEYBORU_COLORS.primary,
          color: 'white',
          py: 2,
          px: 3,
          mb: 3,
          boxShadow: '0 2px 8px rgba(76, 92, 101, 0.15)',
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Logo placeholder - replace with actual logo */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: KUZEYBORU_COLORS.primary,
                  fontSize: '14px',
                }}
              >
                KB
              </Box>
              <Typography
                variant="h5"
                component="h1"
                sx={{ fontWeight: 700, letterSpacing: '-0.5px' }}
              >
                KUZEYBORU
              </Typography>
            </Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 500, opacity: 0.9 }}
            >
              Pipe Calculator
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ pb: 4 }}>
        <Grid container spacing={3}>
          {/* Left Column - Inputs */}
          <Grid item xs={12} lg={6}>
            <VolumeInput />
            <PipesInput />
            <BoxesInput />
            <ConfigurationInput />

            {/* Action Buttons */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                mt: 3,
                justifyContent: 'center',
              }}
            >
              <Button
                variant="contained"
                color="secondary"
                size="large"
                startIcon={<CalculateIcon />}
                onClick={handleCalculate}
                disabled={!isValid || isCalculating}
                sx={{
                  minWidth: 200,
                  py: 1.5,
                  fontSize: '1rem',
                  boxShadow: '0 4px 12px rgba(241, 8, 38, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(241, 8, 38, 0.4)',
                  },
                }}
              >
                {isCalculating ? 'Calculating...' : 'Calculate'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<RefreshIcon />}
                onClick={handleReset}
                disabled={isCalculating}
                sx={{
                  minWidth: 150,
                  py: 1.5,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                  },
                }}
              >
                Reset
              </Button>
            </Box>
          </Grid>

          {/* Right Column - Results & Visualization */}
          <Grid item xs={12} lg={6}>
            <ResultsDisplay />
            <Box sx={{ mt: 3 }}>
              <PipeVisualization />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

// Main App Component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CalculatorProvider>
        <CalculatorLayout />
      </CalculatorProvider>
    </ThemeProvider>
  );
}

export default App;
