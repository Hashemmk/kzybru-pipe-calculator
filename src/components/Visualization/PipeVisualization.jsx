/**
 * Pipe Visualization Component
 * Renders 2D cross-section diagram of pipe arrangement using HTML5 Canvas
 *
 * Shows how pipes are arranged when viewed from the end (WIDTH x HEIGHT plane)
 * Pipes extend along the LENGTH direction (into the screen)
 * Pipes are stacked from BOTTOM-LEFT going UP (gaps appear at top)
 */

import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { PIPE_COLORS, BRAND_COLORS } from '../../constants/defaults';
import { useCalculator } from '../../context/CalculatorContext';

// Padding around the visualization
const PADDING = 40;
const MIN_SCALE = 0.5;
const MAX_SCALE = 5;

export default function PipeVisualization() {
  const { results, volume } = useCalculator();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 400, height: 350 });
  const [activeContainer, setActiveContainer] = useState(0);

  // Calculate total containers needed and pipes per container
  const containerInfo = useMemo(() => {
    if (!results || !results.pipeResults || results.pipeResults.length === 0) {
      return { totalContainers: 0, pipesPerContainer: 0, totalPipes: 0 };
    }

    // Find max pipesPerCrossSection and total pipes
    let totalPipesNeeded = 0;
    let maxPipesPerContainer = 0;

    for (const pipeResult of results.pipeResults) {
      totalPipesNeeded += pipeResult.numberOfPipes;
      maxPipesPerContainer = Math.max(maxPipesPerContainer, pipeResult.pipesPerCrossSection);
    }

    // Calculate total containers needed (use the volumesNeeded from results)
    const totalContainers = results.volumesNeeded?.total ||
      Math.ceil(totalPipesNeeded / Math.max(1, maxPipesPerContainer));

    return {
      totalContainers: Math.max(1, totalContainers),
      pipesPerContainer: maxPipesPerContainer,
      totalPipes: totalPipesNeeded
    };
  }, [results]);

  // Generate arrangement for the active container
  const arrangement = useMemo(() => {
    if (!results || !results.pipeResults || results.pipeResults.length === 0) {
      return null;
    }

    const items = [];
    let colorIndex = 0;

    for (const pipeResult of results.pipeResults) {
      if (pipeResult.numberOfPipes === 0) continue;

      const diameter = pipeResult.externalDiameter;
      const radius = diameter / 2;
      const pipesPerRow = pipeResult.pipesPerRow;
      const pipesPerColumn = pipeResult.pipesPerColumn;
      const pipesPerContainer = pipeResult.pipesPerCrossSection;

      // Calculate which pipes to show for this container
      const startPipeIndex = activeContainer * pipesPerContainer;
      const endPipeIndex = Math.min(startPipeIndex + pipesPerContainer, pipeResult.numberOfPipes);
      const pipesToShow = Math.max(0, endPipeIndex - startPipeIndex);

      for (let i = 0; i < pipesToShow; i++) {
        const col = i % pipesPerRow;
        const row = Math.floor(i / pipesPerRow);

        if (row >= pipesPerColumn) break;

        // Position from bottom-left: x increases right, y increases up from bottom
        items.push({
          x: radius + col * diameter,
          y: radius + row * diameter, // This is distance from BOTTOM
          radius: radius,
          diameter: diameter,
          pipeId: pipeResult.id,
          pipeType: pipeResult,
          color: PIPE_COLORS[colorIndex % PIPE_COLORS.length]
        });
      }
      colorIndex++;
    }

    if (items.length === 0) return null;

    return {
      items,
      pipeCounts: results.pipeResults.reduce((acc, p) => {
        const perContainer = p.pipesPerCrossSection;
        const startIdx = activeContainer * perContainer;
        const endIdx = Math.min(startIdx + perContainer, p.numberOfPipes);
        acc[p.id] = { count: Math.max(0, endIdx - startIdx) };
        return acc;
      }, {})
    };
  }, [results, activeContainer]);

  // Calculate auto-fit scale
  const scale = useMemo(() => {
    if (!volume || !volume.width || !volume.height) return 1;

    const availableWidth = containerSize.width - PADDING * 2;
    const availableHeight = containerSize.height - PADDING * 2;

    const scaleX = availableWidth / volume.width;
    const scaleY = availableHeight / volume.height;

    // Use the smaller scale to fit both dimensions
    const autoScale = Math.min(scaleX, scaleY);

    // Clamp between min and max
    return Math.max(MIN_SCALE, Math.min(MAX_SCALE, autoScale));
  }, [volume, containerSize]);

  // Observe container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    if (!canvasRef.current || !arrangement || !volume) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const width = volume.width * scale;
    const height = volume.height * scale;

    // Set canvas size
    canvas.width = width + PADDING * 2;
    canvas.height = height + PADDING * 2;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw container outline
    ctx.strokeStyle = BRAND_COLORS?.primary || '#4C5C65';
    ctx.lineWidth = 2;
    ctx.strokeRect(PADDING, PADDING, width, height);

    // Draw floor (bottom of container)
    ctx.fillStyle = BRAND_COLORS?.primary || '#4C5C65';
    ctx.fillRect(PADDING - 3, PADDING + height, width + 6, 4);

    // Draw grid lines every 10cm
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 0.5;

    // Vertical grid lines
    for (let x = 0; x <= volume.width; x += 10) {
      ctx.beginPath();
      ctx.moveTo(PADDING + x * scale, PADDING);
      ctx.lineTo(PADDING + x * scale, PADDING + height);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let y = 0; y <= volume.height; y += 10) {
      ctx.beginPath();
      ctx.moveTo(PADDING, PADDING + height - y * scale);
      ctx.lineTo(PADDING + width, PADDING + height - y * scale);
      ctx.stroke();
    }

    // Draw pipes - FLIPPED Y axis (bottom-up)
    if (arrangement.items) {
      arrangement.items.forEach(item => {
        // Convert logical Y (from bottom) to canvas Y (from top)
        const canvasX = PADDING + item.x * scale;
        const canvasY = PADDING + height - item.y * scale; // FLIP Y here
        const r = item.radius * scale;

        // Draw outer pipe circle
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, r, 0, Math.PI * 2);
        ctx.fillStyle = item.color || '#2196f3';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = Math.max(1, scale * 0.15);
        ctx.stroke();

        // Draw inner circle (hollow pipe) - proportional to actual wall thickness
        const innerRatio = item.pipeType?.internalDiameter
          ? item.pipeType.internalDiameter / item.pipeType.externalDiameter
          : 0.7;
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, r * innerRatio, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#999';
        ctx.lineWidth = Math.max(0.5, scale * 0.08);
        ctx.stroke();
      });
    }

    // Draw dimension labels
    ctx.fillStyle = BRAND_COLORS?.primary || '#4C5C65';
    ctx.font = `bold ${Math.max(11, Math.min(14, scale * 1.5))}px Montserrat, Arial`;
    ctx.textAlign = 'center';

    // Width label (bottom)
    ctx.fillText(`${volume.width} cm`, PADDING + width / 2, canvas.height - 8);

    // Height label (left side, rotated)
    ctx.save();
    ctx.translate(12, PADDING + height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${volume.height} cm`, 0, 0);
    ctx.restore();

  }, [arrangement, volume, scale]);

  // Redraw when dependencies change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Handle container tab change
  const handleContainerChange = (_event, newValue) => {
    setActiveContainer(newValue);
  };

  // No results yet
  if (!results || !results.pipeResults || results.pipeResults.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
          Cross-Section View
        </Typography>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          sx={{
            height: 300,
            color: 'text.secondary',
            bgcolor: '#f8f9fa',
            borderRadius: 2,
            border: '2px dashed',
            borderColor: 'divider'
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            No arrangement to display.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            Enter pipe details and click Calculate to see the arrangement.
          </Typography>
        </Box>
      </Paper>
    );
  }

  // No arrangement for current container
  if (!arrangement || arrangement.items.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
          Cross-Section View
        </Typography>

        {/* Container Tabs */}
        {containerInfo.totalContainers > 1 && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs
              value={activeContainer}
              onChange={handleContainerChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 500,
                  textTransform: 'none',
                  minWidth: 120
                }
              }}
            >
              {Array.from({ length: containerInfo.totalContainers }, (_, i) => (
                <Tab
                  key={i}
                  label={`Container ${i + 1}`}
                />
              ))}
            </Tabs>
          </Box>
        )}

        <Alert severity="info">
          No pipes in this container. This container may be empty or used for overflow.
        </Alert>
      </Paper>
    );
  }

  const pipeCount = arrangement.items.length;

  return (
    <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
          Cross-Section View
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Auto-fit | Scale: {scale.toFixed(2)}x
        </Typography>
      </Box>

      {/* Container Tabs */}
      {containerInfo.totalContainers > 1 && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={activeContainer}
            onChange={handleContainerChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 500,
                textTransform: 'none',
                minWidth: 'auto',
                px: 2
              },
              '& .Mui-selected': {
                color: 'secondary.main',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: 'secondary.main',
              }
            }}
          >
            {Array.from({ length: containerInfo.totalContainers }, (_, i) => {
              // Calculate pipes for each container
              let containerPipes = 0;
              for (const pipeResult of results.pipeResults) {
                const perContainer = pipeResult.pipesPerCrossSection;
                const startIdx = i * perContainer;
                const endIdx = Math.min(startIdx + perContainer, pipeResult.numberOfPipes);
                containerPipes += Math.max(0, endIdx - startIdx);
              }
              return (
                <Tab
                  key={i}
                  label={`Container ${i + 1} (${containerPipes})`}
                />
              );
            })}
          </Tabs>
        </Box>
      )}

      {/* Summary info */}
      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
        <Chip
          label={`${pipeCount} pipe${pipeCount !== 1 ? 's' : ''} in view`}
          size="small"
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            fontWeight: 500
          }}
        />
        <Chip
          label={`Total: ${containerInfo.totalPipes} pipes`}
          size="small"
          sx={{
            bgcolor: 'success.main',
            color: 'white',
            fontWeight: 500
          }}
        />
        {containerInfo.totalContainers > 1 && (
          <Chip
            label={`${containerInfo.totalContainers} containers`}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
        )}
      </Box>

      {/* Canvas container - auto-fit */}
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height: 400,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: '#fafafa',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <canvas ref={canvasRef} style={{ display: 'block' }} />
      </Box>

      {/* Volume info */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
        <Typography variant="body2" color="text.secondary">
          Grid: 10cm
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Volume: {volume.width}cm (W) × {volume.height}cm (H) × {volume.length}cm (L)
        </Typography>
      </Box>

      {/* Legend */}
      {results.pipeResults.length > 0 && (
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
            Pipe Types
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {results.pipeResults.map((pipeResult, index) => {
              const color = PIPE_COLORS[index % PIPE_COLORS.length];
              const inContainer = arrangement.pipeCounts[pipeResult.id]?.count || 0;

              return (
                <Chip
                  key={pipeResult.id}
                  label={`Ø${pipeResult.externalDiameter}cm × ${pipeResult.standardLengthM}m (${inContainer} in view)`}
                  sx={{
                    backgroundColor: inContainer > 0 ? color : '#ccc',
                    color: 'white',
                    fontWeight: 500,
                    opacity: inContainer > 0 ? 1 : 0.6,
                    '& .MuiChip-label': {
                      fontSize: '0.75rem'
                    }
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
