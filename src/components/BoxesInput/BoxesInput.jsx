/**
 * Boxes Input Component
 * Manages optional box entries
 */

import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Stack,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useCalculator } from '../../context/CalculatorContext';
import BoxRow from './BoxRow';

export default function BoxesInput() {
  const { boxes, addBox } = useCalculator();
  const [showBoxes, setShowBoxes] = React.useState(false);

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Boxes (Optional)
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showBoxes}
              onChange={(e) => setShowBoxes(e.target.checked)}
              color="primary"
            />
          }
          label="Enable"
        />
      </Box>

      {showBoxes && (
        <>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />}
            onClick={addBox}
            sx={{ mb: 2 }}
            fullWidth
          >
            Add Box
          </Button>

          {boxes.length === 0 ? (
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
                No boxes added yet. Click "Add Box" to include boxes in the volume.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {boxes.map((box, index) => (
                <BoxRow 
                  key={box.id} 
                  box={box} 
                  index={index}
                />
              ))}
            </Stack>
          )}
        </>
      )}
    </Paper>
  );
}
