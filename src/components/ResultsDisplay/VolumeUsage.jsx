/**
 * Volume Usage Component
 * Progress bar showing volume utilization percentage
 */

import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  LinearProgress,
  Grid
} from '@mui/material';
import { formatNumber, formatPercentage } from '../../utils/calculations';

export default function VolumeUsage({ volumeUsage }) {
  const getColor = (percentage) => {
    if (percentage < 50) return 'success';
    if (percentage < 80) return 'info';
    if (percentage < 95) return 'warning';
    return 'error';
  };

  const color = getColor(volumeUsage.percentageUsed);

  return (
    <Paper elevation={1} sx={{ mt: 2 }}>
      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          Volume Usage
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box mb={1}>
              <Typography variant="body2" color="text.secondary">
                Total Volume
              </Typography>
              <Typography variant="h6">
                {formatNumber(volumeUsage.totalVolume)} cm³
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box mb={1}>
              <Typography variant="body2" color="text.secondary">
                Used Volume
              </Typography>
              <Typography variant="h6" color={color}>
                {formatNumber(volumeUsage.usedVolume)} cm³
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box mb={1}>
              <Typography variant="body2" color="text.secondary">
                Remaining Volume
              </Typography>
              <Typography variant="h6">
                {formatNumber(volumeUsage.remainingVolume)} cm³
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box mb={1}>
              <Typography variant="body2" color="text.secondary">
                Utilization
              </Typography>
              <Typography variant="h6" color={color}>
                {formatPercentage(volumeUsage.percentageUsed)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2}>
          <LinearProgress 
            variant="determinate" 
            value={volumeUsage.percentageUsed} 
            color={color}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
      </Box>
    </Paper>
  );
}
