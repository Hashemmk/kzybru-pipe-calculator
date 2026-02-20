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
  const { results, volume, config } = useCalculator();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 400, height: 350 });
  const [activeContainer, setActiveContainer] = useState(0);

  // Calculate total containers needed and pipes per container
  // Uses the actual volumesNeeded from results for accuracy
  const containerInfo = useMemo(() => {
    if (!results || !results.pipeResults || results.pipeResults.length === 0 || !volume) {
      return { totalContainers: 0, pipesPerContainer: 0, totalPipes: 0 };
    }

    // Sort pipes by external diameter (largest first)
    const sortedPipes = [...results.pipeResults]
      .filter(p => p.numberOfPipes > 0)
      .sort((a, b) => b.externalDiameter - a.externalDiameter);

    if (sortedPipes.length === 0) {
      return { totalContainers: 0, pipesPerContainer: 0, totalPipes: 0 };
    }

    // Total pipes count
    const totalPipesNeeded = sortedPipes.reduce((sum, p) => sum + p.numberOfPipes, 0);

    // Get largest pipe info for pipesPerContainer
    const largestPipe = sortedPipes[0];
    const largePipesPerContainer = largestPipe.pipesPerContainer;

    // Use the actual volumesNeeded from results (calculated by the calculation engine)
    // This ensures consistency between the visualization and the results display
    const totalContainers = results.volumesNeeded?.total || 1;

    return {
      totalContainers,
      pipesPerContainer: largePipesPerContainer,
      totalPipes: totalPipesNeeded
    };
  }, [results, volume]);

  // Calculate actual pipes per container (for tab labels)
  const getPipesForContainer = useCallback((containerIndex) => {
    if (!results || !results.pipeResults || results.pipeResults.length === 0 || !volume) {
      return 0;
    }

    const sortedPipes = [...results.pipeResults]
      .filter(p => p.numberOfPipes > 0)
      .sort((a, b) => b.externalDiameter - a.externalDiameter);

    if (sortedPipes.length === 0) return 0;

    const largestPipe = sortedPipes[0];
    const largePipesPerContainer = largestPipe.pipesPerContainer || 0;

    // Nesting candidates
    const nestingCandidates = sortedPipes.slice(1).filter(
      p => p.externalDiameter <= largestPipe.internalDiameter
    );

    // Track remaining pipes
    const remainingPipes = {};
    sortedPipes.forEach(p => {
      remainingPipes[p.id] = p.numberOfPipes;
    });

    // Calculate standalone capacity helper
    const getStandaloneCapacity = (smallPipe, largePipesInContainer) => {
      const smallDiameter = smallPipe.externalDiameter;

      if (largePipesInContainer > 0) {
        const usedRows = Math.ceil(largePipesInContainer / (largestPipe.pipesPerRow || 1));
        const usedHeightByLarge = usedRows * largestPipe.externalDiameter;
        const usedWidthByLarge = Math.min(largePipesInContainer, largestPipe.pipesPerRow || 1) * largestPipe.externalDiameter;
        const remainingWidthOnSide = (volume?.width || 0) - usedWidthByLarge;
        const remainingHeightOnTop = (volume?.height || 0) - usedHeightByLarge;

        const sideColumns = Math.floor(remainingWidthOnSide / smallDiameter);
        const sideRows = Math.floor((volume?.height || 0) / smallDiameter);
        const sideCapacity = Math.max(0, sideColumns * sideRows);

        const topColumns = Math.floor(usedWidthByLarge / smallDiameter);
        const topRows = Math.floor(remainingHeightOnTop / smallDiameter);
        const topCapacity = Math.max(0, topColumns * topRows);

        return (sideCapacity + topCapacity) * (largestPipe.pipesAlongLength || 1);
      } else {
        // No large pipes - small pipes use entire container
        const smallPipesPerRow = Math.floor((volume?.width || 0) / smallDiameter);
        const smallPipesPerColumn = Math.floor((volume?.height || 0) / smallDiameter);
        const smallPipesAlongLength = Math.floor((volume?.length || 0) / (smallPipe.standardLengthCm || 1));
        return smallPipesPerRow * smallPipesPerColumn * smallPipesAlongLength;
      }
    };

    // Skip to the requested container
    for (let i = 0; i < containerIndex; i++) {
      const largePipesInPrev = Math.min(remainingPipes[largestPipe.id] || 0, largePipesPerContainer);
      remainingPipes[largestPipe.id] -= largePipesInPrev;

      // Nested pipes
      for (const smallPipe of nestingCandidates) {
        const nestedCount = Math.min(remainingPipes[smallPipe.id] || 0, largePipesInPrev);
        remainingPipes[smallPipe.id] -= nestedCount;
      }

      // Standalone small pipes
      for (const smallPipe of sortedPipes.slice(1)) {
        const standaloneCapacity = getStandaloneCapacity(smallPipe, largePipesInPrev);
        const standaloneCount = Math.min(remainingPipes[smallPipe.id] || 0, standaloneCapacity);
        remainingPipes[smallPipe.id] -= standaloneCount;
      }
    }

    // Calculate pipes for the requested container
    let totalPipes = 0;
    const largePipesInThis = Math.min(remainingPipes[largestPipe.id] || 0, largePipesPerContainer);
    totalPipes += largePipesInThis;

    // Nested pipes
    for (const smallPipe of nestingCandidates) {
      const nestedCount = Math.min(remainingPipes[smallPipe.id] || 0, largePipesInThis);
      totalPipes += nestedCount;
      remainingPipes[smallPipe.id] -= nestedCount;
    }

    // Standalone small pipes
    for (const smallPipe of sortedPipes.slice(1)) {
      const standaloneCapacity = getStandaloneCapacity(smallPipe, largePipesInThis);
      const standaloneCount = Math.min(remainingPipes[smallPipe.id] || 0, standaloneCapacity);
      totalPipes += standaloneCount;
    }

    return totalPipes;
  }, [results, volume]);

  // Generate arrangement for the active container with NESTING support
  // Properly distributes pipes across containers, nesting where possible
  const arrangement = useMemo(() => {
    if (!results || !results.pipeResults || results.pipeResults.length === 0) {
      return null;
    }

    // Get minimum space between pipes (in cm)
    const minSpace = config?.minSpace || 0;

    // Sort pipes by external diameter (largest first)
    const sortedPipes = [...results.pipeResults]
      .filter(p => p.numberOfPipes > 0)
      .sort((a, b) => b.externalDiameter - a.externalDiameter);

    if (sortedPipes.length === 0) return null;

    // Assign color indices based on sorted order
    const colorIndices = {};
    sortedPipes.forEach((p, idx) => {
      colorIndices[p.id] = idx;
    });

    // Track how many of each pipe we've placed in THIS container
    const pipeCounts = {};
    sortedPipes.forEach(p => {
      pipeCounts[p.id] = { count: 0, colorIndex: colorIndices[p.id] };
    });

    const items = [];

    // Get the largest pipe type
    const largestPipe = sortedPipes[0];
    const outerDiameter = largestPipe.externalDiameter;
    const outerRadius = outerDiameter / 2;
    // Effective diameter includes spacing
    const effectiveLargeDiameter = outerDiameter + minSpace;
    const largePipesPerRow = largestPipe.pipesPerRow;
    const largePipesPerColumn = largestPipe.pipesPerColumn;
    const largePipesPerCrossSection = largePipesPerRow * largePipesPerColumn;
    // Use the full pipesPerContainer which includes pipes along length
    const largePipesPerContainer = largestPipe.pipesPerContainer || largePipesPerCrossSection;

    // Find smaller pipes that can nest inside the largest pipe
    const nestingCandidates = sortedPipes.slice(1).filter(
      p => p.externalDiameter <= largestPipe.internalDiameter
    );

    // Calculate how many large pipes go in this container
    const largeStartIdx = activeContainer * largePipesPerContainer;
    const largeEndIdx = Math.min(largeStartIdx + largePipesPerContainer, largestPipe.numberOfPipes);
    const largePipesInThisContainer = Math.max(0, largeEndIdx - largeStartIdx);

    // Calculate how many large pipes were placed in previous containers
    const totalLargePipesBefore = Math.min(activeContainer * largePipesPerContainer, largestPipe.numberOfPipes);

    // For each nesting candidate, calculate how many should be nested in this container
    const nestedPipesForThisContainer = {};
    for (const candidate of nestingCandidates) {
      // Total small pipes that can be nested = min(total small pipes, total large pipes)
      const totalNestable = Math.min(candidate.numberOfPipes, largestPipe.numberOfPipes);

      // How many were nested in previous containers
      const nestedBefore = Math.min(totalNestable, totalLargePipesBefore);

      // How many can be nested in this container
      const nestableInThis = Math.min(totalNestable - nestedBefore, largePipesInThisContainer);

      nestedPipesForThisContainer[candidate.id] = nestableInThis;
    }

    // Place large pipes in grid and nest smaller pipes inside
    // For visualization, we only show the cross-section (pipes per row × pipes per column)
    // The actual count includes pipes along the length, but we visualize only cross-section
    let nestedCounters = {};
    nestingCandidates.forEach(c => { nestedCounters[c.id] = 0; });

    // For visualization, show only cross-section pipes (max = pipesPerCrossSection)
    const pipesToVisualize = Math.min(largePipesInThisContainer, largePipesPerCrossSection);

    for (let i = 0; i < pipesToVisualize; i++) {
      const col = i % largePipesPerRow;
      const row = Math.floor(i / largePipesPerRow);

      // Position pipes with spacing between them
      const x = outerRadius + col * effectiveLargeDiameter;
      const y = outerRadius + row * effectiveLargeDiameter;

      // Create outer pipe item
      const outerItem = {
        x,
        y,
        radius: outerRadius,
        diameter: outerDiameter,
        pipeId: largestPipe.id,
        pipeType: largestPipe,
        color: PIPE_COLORS[colorIndices[largestPipe.id] % PIPE_COLORS.length],
        nestedPipes: []
      };

      // Nest smaller pipes inside (one of each type that fits, if available)
      let availableInternalDiameter = largestPipe.internalDiameter;

      for (const candidate of nestingCandidates) {
        if (nestedCounters[candidate.id] < nestedPipesForThisContainer[candidate.id] &&
            candidate.externalDiameter <= availableInternalDiameter) {

          outerItem.nestedPipes.push({
            pipeId: candidate.id,
            pipeType: candidate,
            externalDiameter: candidate.externalDiameter,
            internalDiameter: candidate.internalDiameter,
            color: PIPE_COLORS[colorIndices[candidate.id] % PIPE_COLORS.length]
          });

          pipeCounts[candidate.id].count++;
          nestedCounters[candidate.id]++;

          // Reduce available space for further nesting (concentric)
          availableInternalDiameter = candidate.internalDiameter;
        }
      }

      items.push(outerItem);
      pipeCounts[largestPipe.id].count++;
    }

    // Calculate remaining spaces for standalone small pipes
    // Space 1: Side space (remaining width beside large pipes)
    // Space 2: Top space (remaining height above large pipes)
    const visualizedLargeRows = Math.ceil(pipesToVisualize / largePipesPerRow);
    // Account for spacing when calculating used space
    const usedHeightByLarge = visualizedLargeRows * effectiveLargeDiameter - minSpace;
    const usedWidthByLarge = Math.min(pipesToVisualize, largePipesPerRow) * effectiveLargeDiameter - minSpace;

    const remainingWidthOnSide = volume.width - usedWidthByLarge - minSpace;
    const remainingHeightOnTop = volume.height - usedHeightByLarge - minSpace;

    // Calculate how many small pipes were nested/standalone in previous containers
    // Track remaining small pipes for this container
    const smallPipeRemaining = {};
    for (const smallPipe of sortedPipes.slice(1)) {
      let remaining = smallPipe.numberOfPipes;

      // Subtract nested pipes from previous containers
      const canNest = smallPipe.externalDiameter <= largestPipe.internalDiameter;
      if (canNest) {
        const nestedBefore = Math.min(remaining, totalLargePipesBefore);
        remaining -= nestedBefore;
        // Also subtract nested in this container
        const nestedInThis = nestedPipesForThisContainer[smallPipe.id] || 0;
        remaining -= nestedInThis;
      }

      // Subtract standalone pipes from previous containers
      for (let prevContainer = 0; prevContainer < activeContainer; prevContainer++) {
        const prevLargeStart = prevContainer * largePipesPerContainer;
        const prevLargeEnd = Math.min(prevLargeStart + largePipesPerContainer, largestPipe.numberOfPipes);
        const prevLargePipes = Math.max(0, prevLargeEnd - prevLargeStart);

        // Calculate standalone capacity for previous container
        const prevRows = Math.ceil(Math.min(prevLargePipes, largePipesPerCrossSection) / largePipesPerRow);
        const prevUsedHeight = prevRows * outerDiameter;
        const prevUsedWidth = Math.min(Math.min(prevLargePipes, largePipesPerCrossSection), largePipesPerRow) * outerDiameter;

        const prevSideCols = Math.floor((volume.width - prevUsedWidth) / smallPipe.externalDiameter);
        const prevSideRows = Math.floor(volume.height / smallPipe.externalDiameter);
        const prevTopCols = Math.floor(prevUsedWidth / smallPipe.externalDiameter);
        const prevTopRows = Math.floor((volume.height - prevUsedHeight) / smallPipe.externalDiameter);

        const prevStandaloneCapacity = (prevSideCols * prevSideRows + prevTopCols * prevTopRows);
        remaining -= Math.min(remaining, prevStandaloneCapacity);
      }

      smallPipeRemaining[smallPipe.id] = Math.max(0, remaining);
    }

    // Place standalone small pipes for this container
    for (const smallPipe of sortedPipes.slice(1)) {
      const smallDiameter = smallPipe.externalDiameter;
      const smallRadius = smallDiameter / 2;
      // Effective diameter for small pipes includes spacing
      const effectiveSmallDiameter = smallDiameter + minSpace;

      const standalonePipesAvailable = smallPipeRemaining[smallPipe.id] || 0;
      if (standalonePipesAvailable <= 0) continue;

      // Calculate capacity in side space (columns beside large pipes, full height)
      const sideColumns = Math.floor((remainingWidthOnSide + minSpace) / effectiveSmallDiameter);
      const sideRows = Math.floor((volume.height + minSpace) / effectiveSmallDiameter);
      const sideCapacity = sideColumns * sideRows;

      // Calculate capacity in top space (above large pipes, only in the width used by large)
      const topColumns = Math.floor((usedWidthByLarge + minSpace) / effectiveSmallDiameter);
      const topRows = Math.floor((remainingHeightOnTop + minSpace) / effectiveSmallDiameter);
      const topCapacity = topColumns * topRows;

      // Total standalone capacity for cross-section view
      const standaloneCapacityInView = sideCapacity + topCapacity;

      if (standaloneCapacityInView <= 0) continue;

      // How many to place in this view (limited by capacity and available)
      const standalonePipesInThis = Math.min(standalonePipesAvailable, standaloneCapacityInView);

      let placed = 0;

      // First, fill the side space (right of large pipes)
      if (sideColumns > 0 && sideRows > 0) {
        for (let row = 0; row < sideRows && placed < standalonePipesInThis; row++) {
          for (let col = 0; col < sideColumns && placed < standalonePipesInThis; col++) {
            // Add spacing from large pipes area and between small pipes
            const x = usedWidthByLarge + minSpace + smallRadius + col * effectiveSmallDiameter;
            const y = smallRadius + row * effectiveSmallDiameter;

            if (x + smallRadius > volume.width || y + smallRadius > volume.height) continue;

            items.push({
              x: x,
              y: y,
              radius: smallRadius,
              diameter: smallDiameter,
              pipeId: smallPipe.id,
              pipeType: smallPipe,
              color: PIPE_COLORS[colorIndices[smallPipe.id] % PIPE_COLORS.length],
              nestedPipes: []
            });

            pipeCounts[smallPipe.id].count++;
            placed++;
          }
        }
      }

      // Then, fill the top space (above large pipes, full width)
      if (topColumns > 0 && topRows > 0 && placed < standalonePipesInThis) {
        for (let row = 0; row < topRows && placed < standalonePipesInThis; row++) {
          for (let col = 0; col < topColumns && placed < standalonePipesInThis; col++) {
            // Add spacing from large pipes area and between small pipes
            const x = smallRadius + col * effectiveSmallDiameter;
            const y = usedHeightByLarge + minSpace + smallRadius + row * effectiveSmallDiameter;

            if (x + smallRadius > volume.width || y + smallRadius > volume.height) continue;

            // Skip if this position overlaps with the side space we already filled
            if (x >= usedWidthByLarge + minSpace) continue;

            items.push({
              x: x,
              y: y,
              radius: smallRadius,
              diameter: smallDiameter,
              pipeId: smallPipe.id,
              pipeType: smallPipe,
              color: PIPE_COLORS[colorIndices[smallPipe.id] % PIPE_COLORS.length],
              nestedPipes: []
            });

            pipeCounts[smallPipe.id].count++;
            placed++;
          }
        }
      }
    }

    if (items.length === 0) return null;

    return {
      items,
      pipeCounts: Object.fromEntries(
        Object.entries(pipeCounts).map(([id, data]) => [id, { count: data.count }])
      ),
      minSpace // Include minSpace so we can display it in the legend
    };
  }, [results, activeContainer, volume, config]);

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
    // Using realistic wall thickness representation (colored rings)
    if (arrangement.items) {
      arrangement.items.forEach(item => {
        // Convert logical Y (from bottom) to canvas Y (from top)
        const canvasX = PADDING + item.x * scale;
        const canvasY = PADDING + height - item.y * scale; // FLIP Y here

        const outerR = item.radius * scale;
        const innerR = item.pipeType?.internalDiameter
          ? (item.pipeType.internalDiameter / 2) * scale
          : outerR * 0.9;
        const wallThickness = outerR - innerR;

        // Draw outer pipe as a colored ring (not filled circle)
        // First fill the entire area with white
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, outerR, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Draw the pipe wall as a thick colored stroke
        const midRadius = (outerR + innerR) / 2;
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, midRadius, 0, Math.PI * 2);
        ctx.strokeStyle = item.color || '#2196f3';
        ctx.lineWidth = Math.max(2, wallThickness);
        ctx.stroke();

        // Draw outer edge
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, outerR, 0, Math.PI * 2);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = Math.max(1, scale * 0.1);
        ctx.stroke();

        // Draw inner edge
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, innerR, 0, Math.PI * 2);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = Math.max(0.5, scale * 0.08);
        ctx.stroke();

        // Draw nested pipes (as colored rings inside)
        if (item.nestedPipes && item.nestedPipes.length > 0) {
          item.nestedPipes.forEach(nestedPipe => {
            const nestedOuterR = (nestedPipe.externalDiameter / 2) * scale;
            const nestedInnerR = (nestedPipe.internalDiameter / 2) * scale;
            const nestedWallThickness = nestedOuterR - nestedInnerR;
            const nestedMidRadius = (nestedOuterR + nestedInnerR) / 2;

            // Draw nested pipe wall as colored ring
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, nestedMidRadius, 0, Math.PI * 2);
            ctx.strokeStyle = nestedPipe.color || '#4caf50';
            ctx.lineWidth = Math.max(2, nestedWallThickness);
            ctx.stroke();

            // Draw nested pipe outer edge
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, nestedOuterR, 0, Math.PI * 2);
            ctx.strokeStyle = '#555';
            ctx.lineWidth = Math.max(0.5, scale * 0.06);
            ctx.stroke();

            // Draw nested pipe inner edge
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, nestedInnerR, 0, Math.PI * 2);
            ctx.strokeStyle = '#555';
            ctx.lineWidth = Math.max(0.5, scale * 0.06);
            ctx.stroke();
          });
        }
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
      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
          Cross-Section View
        </Typography>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          sx={{
            flex: 1,
            minHeight: 300,
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
      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
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
    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
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
            {Array.from({ length: containerInfo.totalContainers }, (_, i) => (
              <Tab
                key={i}
                label={`Container ${i + 1} (${getPipesForContainer(i)})`}
              />
            ))}
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} flexWrap="wrap" gap={1}>
        <Typography variant="body2" color="text.secondary">
          Grid: 10cm
        </Typography>
        {arrangement?.minSpace > 0 && (
          <Chip
            label={`Spacing: ${arrangement.minSpace} cm`}
            size="small"
            color="secondary"
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
        )}
        <Typography variant="body2" color="text.secondary">
          Volume: {volume.width}cm (W) × {volume.height}cm (H) × {volume.length}cm (L)
        </Typography>
      </Box>

      {/* Legend */}
      {results.pipeResults.length > 0 && (
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
            Pipe Types {arrangement.items.some(i => i.nestedPipes?.length > 0) && '(with nesting)'}
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {[...results.pipeResults]
              .sort((a, b) => b.externalDiameter - a.externalDiameter)
              .map((pipeResult, index) => {
                const color = PIPE_COLORS[index % PIPE_COLORS.length];
                const inContainer = arrangement.pipeCounts[pipeResult.id]?.count || 0;

                // Check if any of this pipe type is nested in this container
                const nestedCount = arrangement.items.reduce((count, item) => {
                  return count + (item.nestedPipes?.filter(np => np.pipeId === pipeResult.id).length || 0);
                }, 0);

                let label = `Ø${pipeResult.externalDiameter}cm × ${pipeResult.standardLengthM}m`;
                if (nestedCount > 0 && index > 0) {
                  label += ` (${nestedCount} nested)`;
                } else if (inContainer > 0) {
                  label += ` (${inContainer})`;
                }

                return (
                  <Chip
                    key={pipeResult.id}
                    label={label}
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
