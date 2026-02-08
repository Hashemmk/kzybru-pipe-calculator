/**
 * Pipes Input Component
 * Manages multiple pipe entries
 */

import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Stack 
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useCalculator } from '../../context/CalculatorContext';
import PipeRow from './PipeRow';

export default function PipesInput() {
  const { pipes, addPipe } = useCalculator();

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Pipes
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={addPipe}
          color="primary"
        >
          Add Pipe
        </Button>
      </Box>

      {pipes.length === 0 ? (
        <Box 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            border: '2px dashed',
            borderColor: 'grey.300',
            borderRadius: 1
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No pipes added yet. Click "Add Pipe" to get started.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {pipes.map((pipe, index) => (
            <PipeRow 
              key={pipe.id} 
              pipe={pipe} 
              index={index}
            />
          ))}
        </Stack>
      )}
    </Paper>
  );
}
