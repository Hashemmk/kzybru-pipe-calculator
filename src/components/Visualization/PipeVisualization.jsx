/**
 * Pipe Visualization Component
 * Renders 2D cross-section diagram of pipe arrangement using HTML5 Canvas
 *
 * Shows how pipes are arranged when viewed from the end (WIDTH x HEIGHT plane)
 * Pipes extend along the LENGTH direction (into the screen)
 */

import React, { useRef, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Alert
} from '@mui/material';
import { ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { CANVAS_SCALE, PIPE_COLORS } from '../../constants/defaults';
import { useCalculator } from '../../context/CalculatorContext';

export default function PipeVisualization() {
  // Get data from context
  const { results, volume, pipes } = useCalculator();

  // Generate arrangement from packing results
  const arrangement = useMemo(() => {
    if (!results || !results.pipeResults || results.pipeResults.length === 0) {
      return null;
    }

    // Build arrangement from packing calculation
    const items = [];
    let colorIndex = 0;

    for (const pipeResult of results.pipeResults) {
      if (pipeResult.numberOfPipes === 0) continue;

      const diameter = pipeResult.externalDiameter;
      const radius = diameter / 2;
      const pipesPerRow = pipeResult.pipesPerRow;
      const pipesPerColumn = pipeResult.pipesPerColumn;
      const pipesPerContainer = pipeResult.pipesPerCrossSection;

      // Place pipes in grid pattern (showing one container's worth)
      const pipesToShow = Math.min(pipeResult.numberOfPipes, pipesPerContainer);

      for (let i = 0; i < pipesToShow; i++) {
        const col = i % pipesPerRow;
        const row = Math.floor(i / pipesPerRow);

        if (row >= pipesPerColumn) break;

        items.push({
          x: radius + col * diameter,
          y: radius + row * diameter,
          radius: radius,
          diameter: diameter,
          pipeId: pipeResult.id,
          color: PIPE_COLORS[colorIndex % PIPE_COLORS.length]
        });
      }
      colorIndex++;
    }

    if (items.length === 0) return null;

    return {
      layers: [{ items }],
      pipeCounts: results.pipeResults.reduce((acc, p, idx) => {
        acc[p.id] = { count: Math.min(p.numberOfPipes, p.pipesPerCrossSection) };
        return acc;
      }, {})
    };
  }, [results]);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [zoom, setZoom] = React.useState(1);

  useEffect(() => {
    if (canvasRef.current && arrangement && arrangement.layers && arrangement.layers.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Calculate canvas size based on volume dimensions
      const scale = CANVAS_SCALE * zoom;
      const width = volume.width * scale;
      const height = volume.height * scale;

      canvas.width = width + 40; // Add padding
      canvas.height = height + 40;

      // Clear canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw container outline
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, width, height);

      // Draw grid lines every 10cm
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= volume.width; x += 10) {
        ctx.beginPath();
        ctx.moveTo(20 + x * scale, 20);
        ctx.lineTo(20 + x * scale, 20 + height);
        ctx.stroke();
      }
      for (let y = 0; y <= volume.height; y += 10) {
        ctx.beginPath();
        ctx.moveTo(20, 20 + y * scale);
        ctx.lineTo(20 + width, 20 + y * scale);
        ctx.stroke();
      }

      // Draw pipes
      const layer = arrangement.layers[0];
      if (layer && layer.items) {
        layer.items.forEach(item => {
          const x = 20 + item.x * scale;
          const y = 20 + item.y * scale;
          const r = item.radius * scale;

          // Draw pipe circle
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = item.color || '#2196f3';
          ctx.fill();
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Draw inner circle (hollow pipe)
          ctx.beginPath();
          ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#666';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        });
      }

      // Draw dimension labels
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${volume.width} cm`, 20 + width / 2, canvas.height - 5);

      ctx.save();
      ctx.translate(10, 20 + height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${volume.height} cm`, 0, 0);
      ctx.restore();
    }
  }, [arrangement, volume, zoom]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.25, 4));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.25, 0.25));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  // No arrangement yet
  if (!arrangement || !arrangement.layers || arrangement.layers.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
        <Typography variant="h6" gutterBottom>
          Cross-Section View
        </Typography>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          sx={{ height: 300, color: 'text.secondary', bgcolor: '#f5f5f5', borderRadius: 1 }}
        >
          <Typography variant="body1">
            No arrangement to display.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Enter pipe details and click Calculate to see the arrangement.
          </Typography>
        </Box>
      </Paper>
    );
  }

  const layer = arrangement.layers[0];
  const pipeCount = layer?.items?.length || 0;
  const nestedCount = layer?.items?.reduce((sum, item) =>
    sum + (item.nestedPipes?.length || 0), 0) || 0;

  return (
    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Cross-Section View
        </Typography>
        <Box display="flex" gap={1} alignItems="center">
          <Tooltip title="Zoom Out">
            <IconButton size="small" onClick={handleZoomOut}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Chip
            label={`${Math.round(zoom * 100)}%`}
            size="small"
            onClick={handleResetZoom}
            sx={{ cursor: 'pointer' }}
          />
          <Tooltip title="Zoom In">
            <IconButton size="small" onClick={handleZoomIn}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset Zoom">
            <IconButton size="small" onClick={handleResetZoom}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Summary info */}
      <Box display="flex" gap={2} mb={2}>
        <Chip
          label={`${pipeCount} pipe position${pipeCount !== 1 ? 's' : ''}`}
          color="primary"
          size="small"
        />
        {nestedCount > 0 && (
          <Chip
            label={`${nestedCount} nested pipe${nestedCount !== 1 ? 's' : ''}`}
            color="secondary"
            size="small"
          />
        )}
        <Chip
          label={`Total: ${pipeCount + nestedCount} pipes`}
          color="success"
          size="small"
        />
      </Box>

      {/* Canvas container */}
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          minHeight: 350,
          maxHeight: 500,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'auto',
          bgcolor: '#fafafa',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 1
        }}
      >
        <canvas ref={canvasRef} style={{ display: 'block' }} />
      </Box>

      {/* Scale info */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
        <Typography variant="body2" color="text.secondary">
          Scale: 1cm = {(CANVAS_SCALE * zoom).toFixed(1)}px | Grid: 10cm
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Volume: {volume.width}cm (W) × {volume.height}cm (H) × {volume.length}cm (L)
        </Typography>
      </Box>

      {/* Legend */}
      {results && results.pipeResults && results.pipeResults.length > 0 && (
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Pipe Types (showing pipes per container)
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {results.pipeResults.map((pipeResult, index) => {
              const color = PIPE_COLORS[index % PIPE_COLORS.length];
              const count = Math.min(pipeResult.numberOfPipes, pipeResult.pipesPerCrossSection);

              return (
                <Chip
                  key={pipeResult.id}
                  label={`Ø${pipeResult.externalDiameter}cm × ${pipeResult.standardLengthM}m (${count}/${pipeResult.numberOfPipes} shown)`}
                  sx={{
                    backgroundColor: count > 0 ? color : '#ccc',
                    color: 'white',
                    fontWeight: 'medium',
                    opacity: count > 0 ? 1 : 0.6
                  }}
                  size="small"
                />
              );
            })}
          </Box>
        </Box>
      )}

      {/* Warning if no pipes placed */}
      {pipeCount === 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          No pipes could be placed. The pipes may be too large for the volume dimensions.
        </Alert>
      )}
    </Paper>
  );
}
