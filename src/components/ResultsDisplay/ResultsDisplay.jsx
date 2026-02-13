/**
 * Results Display Component
 * Displays calculation results including summary cards and pipe details table
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { useCalculator } from '../../context/CalculatorContext';
import { formatNumber, formatNumberWithCommas } from '../../utils/calculations';
import PipeResultsTable from './PipeResultsTable';
import ContainerTable from './ContainerTable';

export default function ResultsDisplay() {
  const { results, isCalculating, volume } = useCalculator();

  if (isCalculating) {
    return (
      <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          sx={{ height: 400 }}
        >
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Calculating...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (!results) {
    return (
      <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          sx={{ height: 400, color: 'text.secondary' }}
        >
          <Typography variant="body1">
            Enter inputs and click Calculate to see results.
          </Typography>
        </Box>
      </Paper>
    );
  }

  const { volumesNeeded } = results;

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Total Volume */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              textAlign: 'center',
              bgcolor: 'primary.main',
              color: 'primary.contrastText'
            }}
          >
            <Typography variant="body2" gutterBottom sx={{ opacity: 0.9 }}>
              Total Pipe Volume
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {formatNumber(results.totalVolume)} m³
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Space pipes occupy
            </Typography>
          </Paper>
        </Grid>

        {/* Total Weight */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              textAlign: 'center',
              bgcolor: 'info.main',
              color: 'info.contrastText'
            }}
          >
            <Typography variant="body2" gutterBottom sx={{ opacity: 0.9 }}>
              Total Weight
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {formatNumberWithCommas(results.totalWeight)} kg
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              All pipes combined
            </Typography>
          </Paper>
        </Grid>

        {/* Volumes Needed */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              textAlign: 'center',
              bgcolor: volumesNeeded?.total > 1 ? 'warning.main' : 'success.main',
              color: volumesNeeded?.total > 1 ? 'warning.contrastText' : 'success.contrastText'
            }}
          >
            <Typography variant="body2" gutterBottom sx={{ opacity: 0.9 }}>
              {results.transportationType || 'Containers'} Needed
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {volumesNeeded?.total || 1}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {volumesNeeded?.limitingFactor === 'packing' && 'Limited by packing'}
              {volumesNeeded?.limitingFactor === 'weight' && 'Limited by weight'}
              {volumesNeeded?.limitingFactor === 'both' && 'Limited by both'}
              {volumesNeeded?.limitingFactor === 'none' && 'Within capacity'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Additional Info Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total Pipes
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {formatNumberWithCommas(results.totalPipes)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total Length
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {formatNumberWithCommas(results.totalLength)} m
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Container Volume
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {formatNumber(results.containerVolumeM3)} m³
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Weight Capacity
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {formatNumberWithCommas(results.weightCapacity)} kg
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Pipe Results Table */}
      <PipeResultsTable pipeResults={results.pipeResults} />

      {/* Container Details Table */}
      <ContainerTable
        pipeResults={results.pipeResults}
        volumesNeeded={volumesNeeded}
        volume={volume}
      />
    </Box>
  );
}
