/**
 * Volume Input Component
 * Collects transportation type, volume dimensions and weight capacity
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useCalculator } from '../../context/CalculatorContext';
import { TRANSPORTATION_TYPES } from '../../constants/defaults';

export default function VolumeInput() {
  const { volume, updateVolume } = useCalculator();

  const handleTransportationChange = (event) => {
    const typeId = event.target.value;
    const selectedType = TRANSPORTATION_TYPES[typeId];

    if (selectedType) {
      updateVolume({
        transportationType: typeId,
        length: selectedType.length,
        width: selectedType.width,
        height: selectedType.height,
        weightCapacity: selectedType.weightCapacity
      });
    }
  };

  const handleChange = (field) => (event) => {
    const value = parseFloat(event.target.value) || 0;
    updateVolume({ [field]: value });
  };

  const isPreset = volume.transportationType && volume.transportationType !== 'custom';

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Volume / Transportation
      </Typography>
      <Grid container spacing={2}>
        {/* Transportation Type Dropdown */}
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="transportation-type-label">Transportation Type</InputLabel>
            <Select
              labelId="transportation-type-label"
              value={volume.transportationType || 'custom'}
              label="Transportation Type"
              onChange={handleTransportationChange}
            >
              {Object.entries(TRANSPORTATION_TYPES).map(([key, type]) => (
                <MenuItem key={key} value={key}>
                  {type.label}
                  {key !== 'custom' && ` (${type.length}x${type.width}x${type.height} cm)`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Dimension Fields */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Length"
            type="number"
            value={volume.length || ''}
            onChange={handleChange('length')}
            InputProps={{
              readOnly: isPreset,
              endAdornment: <span style={{ marginLeft: 8 }}>cm</span>
            }}
            sx={isPreset ? {
              '& .MuiInputBase-root': {
                backgroundColor: 'action.disabledBackground'
              }
            } : {}}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Width"
            type="number"
            value={volume.width || ''}
            onChange={handleChange('width')}
            InputProps={{
              readOnly: isPreset,
              endAdornment: <span style={{ marginLeft: 8 }}>cm</span>
            }}
            sx={isPreset ? {
              '& .MuiInputBase-root': {
                backgroundColor: 'action.disabledBackground'
              }
            } : {}}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Height"
            type="number"
            value={volume.height || ''}
            onChange={handleChange('height')}
            InputProps={{
              readOnly: isPreset,
              endAdornment: <span style={{ marginLeft: 8 }}>cm</span>
            }}
            sx={isPreset ? {
              '& .MuiInputBase-root': {
                backgroundColor: 'action.disabledBackground'
              }
            } : {}}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Max Weight Capacity"
            type="number"
            value={volume.weightCapacity || ''}
            onChange={handleChange('weightCapacity')}
            InputProps={{
              readOnly: isPreset,
              endAdornment: <span style={{ marginLeft: 8 }}>kg</span>
            }}
            sx={isPreset ? {
              '& .MuiInputBase-root': {
                backgroundColor: 'action.disabledBackground'
              }
            } : {}}
          />
        </Grid>
      </Grid>

      {/* Volume info */}
      {volume.length > 0 && volume.width > 0 && volume.height > 0 && (
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            Container Volume: {((volume.length * volume.width * volume.height) / 1000000).toFixed(2)} m³
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
