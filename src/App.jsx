/**
 * Main App Component
 * Orchestrates all components and manages overall layout
 */

import React from 'react';
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

// Create custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#ff9800',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    error: {
      main: '#f44336',
    },
    info: {
      main: '#2196f3',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="xl">
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          align="center"
          sx={{ mb: 4, fontWeight: 'bold', color: 'primary.main' }}
        >
          Pipe Calculator
        </Typography>

        <Grid container spacing={3}>
          {/* Left Column - Inputs */}
          <Grid item xs={12} lg={6}>
            <VolumeInput />
            <PipesInput />
            <BoxesInput />
            <ConfigurationInput />
            
            <Box 
              sx={{ 
                display: 'flex', 
                gap: 2, 
                mt: 2,
                justifyContent: 'center'
              }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<CalculateIcon />}
                onClick={handleCalculate}
                disabled={!isValid || isCalculating}
                sx={{ minWidth: 200 }}
              >
                {isCalculating ? 'Calculating...' : 'Calculate'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<RefreshIcon />}
                onClick={handleReset}
                disabled={isCalculating}
                sx={{ minWidth: 150 }}
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
