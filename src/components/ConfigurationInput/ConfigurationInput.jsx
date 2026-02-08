/**
 * Configuration Input Component
 * Sets spacing and nesting parameters
 */

import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Grid,
  Tooltip
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { useCalculator } from '../../context/CalculatorContext';
import { getError } from '../../utils/validation';

export default function ConfigurationInput() {
  const { config, updateConfig, errors } = useCalculator();

  const handleChange = (field) => (event) => {
    const value = parseFloat(event.target.value) || 0;
    updateConfig({ [field]: value });
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Configuration
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Box display="flex" alignItems="center" mb={1}>
            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
              Minimum Space Between Pipes
            </Typography>
            <Tooltip title="Minimum space required between adjacent pipes for handling and safety">
              <InfoIcon fontSize="small" color="action" />
            </Tooltip>
          </Box>
          <TextField
            fullWidth
            type="number"
            inputProps={{ step: '0.1', min: '0' }}
            value={config.minSpace !== undefined ? config.minSpace : ''}
            onChange={handleChange('minSpace')}
            error={!!getError(errors, 'minSpace')}
            helperText={getError(errors, 'minSpace')}
            InputProps={{
              endAdornment: <span style={{ marginLeft: 8 }}>cm</span>
            }}
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Box display="flex" alignItems="center" mb={1}>
            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
              Allowance for Telescoping
            </Typography>
            <Tooltip title="Space between nested pipes to allow for easy removal and handling">
              <InfoIcon fontSize="small" color="action" />
            </Tooltip>
          </Box>
          <TextField
            fullWidth
            type="number"
            inputProps={{ step: '0.1', min: '0' }}
            value={config.allowance !== undefined ? config.allowance : ''}
            onChange={handleChange('allowance')}
            error={!!getError(errors, 'allowance')}
            helperText={getError(errors, 'allowance')}
            InputProps={{
              endAdornment: <span style={{ marginLeft: 8 }}>cm</span>
            }}
            size="small"
          />
        </Grid>
      </Grid>
    </Paper>
  );
}
