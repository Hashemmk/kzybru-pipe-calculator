/**
 * Box Row Component
 * Individual box input form
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

export default function BoxRow({ box, index }) {
  const { updateBox, removeBox, errors } = useCalculator();
  const [expanded, setExpanded] = React.useState(false);

  const handleChange = (field) => (event) => {
    const value = parseFloat(event.target.value) || 0;
    updateBox(box.id, { [field]: value });
  };

  const handleRemove = () => {
    removeBox(box.id);
  };

  const prefix = `box${index}`;

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
        <Typography variant="subtitle1" fontWeight="medium">
          Box {index + 1}
        </Typography>
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
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Length"
                type="number"
                value={box.length || ''}
                onChange={handleChange('length')}
                error={!!getError(errors, `${prefix}Length`)}
                helperText={getError(errors, `${prefix}Length`)}
                InputProps={{
                  endAdornment: <span style={{ marginLeft: 8 }}>cm</span>
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Width"
                type="number"
                value={box.width || ''}
                onChange={handleChange('width')}
                error={!!getError(errors, `${prefix}Width`)}
                helperText={getError(errors, `${prefix}Width`)}
                InputProps={{
                  endAdornment: <span style={{ marginLeft: 8 }}>cm</span>
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Height"
                type="number"
                value={box.height || ''}
                onChange={handleChange('height')}
                error={!!getError(errors, `${prefix}Height`)}
                helperText={getError(errors, `${prefix}Height`)}
                InputProps={{
                  endAdornment: <span style={{ marginLeft: 8 }}>cm</span>
                }}
                size="small"
              />
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
}
