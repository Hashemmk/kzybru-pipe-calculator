/**
 * Pipe Row Component
 * Individual pipe input form
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  IconButton,
  Collapse
} from '@mui/material';
import { Delete as DeleteIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { useCalculator } from '../../context/CalculatorContext';

export default function PipeRow({ pipe, index }) {
  const { updatePipe, removePipe } = useCalculator();
  const [expanded, setExpanded] = React.useState(true);

  const handleChange = (field) => (event) => {
    const value = parseFloat(event.target.value) || 0;
    updatePipe(pipe.id, { [field]: value });
  };

  const handleRemove = () => {
    removePipe(pipe.id);
  };

  // Calculate number of pipes from quantity and standard length
  // standardLength is in mm, convert to meters for calculation
  const numberOfPipes = pipe.standardLength > 0 && pipe.quantityInMeters > 0
    ? Math.ceil(pipe.quantityInMeters / (pipe.standardLength / 1000))
    : 0;

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="subtitle1" fontWeight="medium">
            Pipe {index + 1}
          </Typography>
          {pipe.externalDiameter > 0 && (
            <Typography variant="body2" color="text.secondary">
              ({pipe.externalDiameter} mm)
            </Typography>
          )}
          {numberOfPipes > 0 && (
            <Typography variant="body2" color="primary">
              {numberOfPipes} pieces
            </Typography>
          )}
        </Box>
        <Box>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={handleRemove}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box mt={2}>
          <Grid container spacing={2}>
            {/* Row 1: Diameters */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="External Diameter"
                type="number"
                value={pipe.externalDiameter || ''}
                onChange={handleChange('externalDiameter')}
                InputProps={{
                  endAdornment: <span style={{ marginLeft: 8 }}>mm</span>
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Internal Diameter"
                type="number"
                value={pipe.internalDiameter || ''}
                onChange={handleChange('internalDiameter')}
                InputProps={{
                  endAdornment: <span style={{ marginLeft: 8 }}>mm</span>
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Wall Thickness/Et Kalınlığı"
                type="number"
                value={pipe.wallThickness || ''}
                onChange={handleChange('wallThickness')}
                InputProps={{
                  endAdornment: <span style={{ marginLeft: 8 }}>mm</span>
                }}
                size="small"
              />
            </Grid>

            {/* Row 2: Lengths and Weight */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Standard Length"
                type="number"
                value={pipe.standardLength || ''}
                onChange={handleChange('standardLength')}
                helperText="Single pipe length"
                InputProps={{
                  endAdornment: <span style={{ marginLeft: 8 }}>mm</span>
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Quantity (Total Length)"
                type="number"
                value={pipe.quantityInMeters || ''}
                onChange={handleChange('quantityInMeters')}
                helperText="Total length required"
                InputProps={{
                  endAdornment: <span style={{ marginLeft: 8 }}>m</span>
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Weight per Meter"
                type="number"
                value={pipe.weightPerMeter || ''}
                onChange={handleChange('weightPerMeter')}
                InputProps={{
                  endAdornment: <span style={{ marginLeft: 8 }}>kg/m</span>
                }}
                size="small"
              />
            </Grid>
          </Grid>

          {/* Summary info */}
          {numberOfPipes > 0 && (
            <Box mt={2} p={1} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="body2">
                <strong>{numberOfPipes}</strong> pipes x{' '}
                <strong>{(pipe.standardLength / 1000).toFixed(1)}m</strong> ={' '}
                <strong>{pipe.quantityInMeters}m</strong> total |{' '}
                Weight: <strong>{(pipe.quantityInMeters * pipe.weightPerMeter).toFixed(1)} kg</strong>
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}
