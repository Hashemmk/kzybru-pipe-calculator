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
      main: KUZEYBORU_COLORS.accent,  // Red as primary
      light: '#ff3d4d',
      dark: '#c00620',
      contrastText: '#ffffff',
    },
    secondary: {
      main: KUZEYBORU_COLORS.primary,  // Dark gray as secondary
      light: '#6B7B84',
      dark: '#3a474e',
      contrastText: '#ffffff',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: KUZEYBORU_COLORS.accent,  // Red for warning cards
      contrastText: '#ffffff',
    },
    error: {
      main: KUZEYBORU_COLORS.accent,
    },
    info: {
      main: KUZEYBORU_COLORS.accent,  // Red for info cards
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
        containedPrimary: {
          backgroundColor: KUZEYBORU_COLORS.accent,
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: '#ffffff',
          py: 1.5,
          px: 3,
          mb: 3,
          boxShadow: '0 2px 8px rgba(76, 92, 101, 0.1)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* KuzeyBoru Logo - Red background with white text + Export Department */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  bgcolor: KUZEYBORU_COLORS.accent,
                  borderRadius: '6px',
                  px: 2,
                  py: 0.8,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Typography
                  sx={{
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '1.5rem',
                    letterSpacing: '-0.5px',
                    fontFamily: 'Montserrat, sans-serif',
                    textTransform: 'lowercase',
                  }}
                >
                  kuzeyboru
                </Typography>
              </Box>
              {/* Export Department Box */}
              <Box
                sx={{
                  border: '2px solid',
                  borderColor: KUZEYBORU_COLORS.accent,
                  borderRadius: '6px',
                  px: 1.5,
                  py: 0.5,
                }}
              >
                <Typography
                  sx={{
                    color: KUZEYBORU_COLORS.accent,
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    fontFamily: 'Montserrat, sans-serif',
                  }}
                >
                  Export Department
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: KUZEYBORU_COLORS.primary,
                }}
              >
                Pipe Calculator
              </Typography>
              <Typography
                sx={{
                  color: KUZEYBORU_COLORS.accent,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                }}
              >
                Beta
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ pb: 4, flex: 1 }}>
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
                color="primary"
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

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: KUZEYBORU_COLORS.primary,
          color: 'white',
          py: 3,
          mt: 4,
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="body1" fontWeight="600">
                KuzeyBoru
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Export Department - Pipe Calculator
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              © {new Date().getFullYear()} KuzeyBoru. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
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
