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
import { getError } from '../../utils/validation';
import { calculateWallThickness } from '../../utils/calculations';

export default function PipeRow({ pipe, index }) {
  const { updatePipe, removePipe, errors } = useCalculator();
  const [expanded, setExpanded] = React.useState(true);

  const handleChange = (field) => (event) => {
    const value = parseFloat(event.target.value) || 0;
    const updates = { [field]: value };

    // Auto-calculate wall thickness when external or internal diameter changes
    if (field === 'externalDiameter' || field === 'internalDiameter') {
      const externalDiameter = field === 'externalDiameter' ? value : pipe.externalDiameter;
      const internalDiameter = field === 'internalDiameter' ? value : pipe.internalDiameter;
      if (externalDiameter && internalDiameter) {
        updates.wallThickness = calculateWallThickness(externalDiameter, internalDiameter);
      }
    }

    updatePipe(pipe.id, updates);
  };

  const handleRemove = () => {
    removePipe(pipe.id);
  };

  const prefix = `pipe${index}`;

  // Calculate number of pipes from quantity and standard length
  const numberOfPipes = pipe.standardLength > 0 && pipe.quantityInMeters > 0
    ? Math.ceil(pipe.quantityInMeters / (pipe.standardLength / 100))
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
              ({pipe.externalDiameter} cm)
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
                error={!!getError(errors, `${prefix}ExternalDiameter`)}
                helperText={getError(errors, `${prefix}ExternalDiameter`)}
                InputProps={{
                  endAdornment: <span style={{ marginLeft: 8 }}>cm</span>
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
                error={!!getError(errors, `${prefix}InternalDiameter`)}
                helperText={getError(errors, `${prefix}InternalDiameter`)}
                InputProps={{
                  endAdornment: <span style={{ marginLeft: 8 }}>cm</span>
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Wall Thickness"
                type="number"
                value={pipe.wallThickness || ''}
                onChange={handleChange('wallThickness')}
                InputProps={{
                  readOnly: true,
                  endAdornment: <span style={{ marginLeft: 8 }}>cm (auto)</span>
                }}
                size="small"
                sx={{
                  '& .MuiInputBase-root': {
                    backgroundColor: 'action.disabledBackground'
                  }
                }}
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
                error={!!getError(errors, `${prefix}StandardLength`)}
                helperText={getError(errors, `${prefix}StandardLength`) || 'Single pipe length'}
                InputProps={{
                  endAdornment: <span style={{ marginLeft: 8 }}>cm</span>
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
                error={!!getError(errors, `${prefix}QuantityInMeters`)}
                helperText={getError(errors, `${prefix}QuantityInMeters`) || 'Total length required'}
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
                error={!!getError(errors, `${prefix}WeightPerMeter`)}
                helperText={getError(errors, `${prefix}WeightPerMeter`)}
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
                <strong>{(pipe.standardLength / 100).toFixed(1)}m</strong> ={' '}
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
