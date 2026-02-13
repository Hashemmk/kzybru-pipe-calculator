/**
 * Container Table Component
 * Table showing breakdown of pipes per container with weights
 */

import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { formatNumberWithCommas } from '../../utils/calculations';

export default function ContainerTable({ pipeResults, volumesNeeded, volume }) {
  // Calculate container breakdown
  const containerBreakdown = useMemo(() => {
    if (!pipeResults || pipeResults.length === 0 || !volumesNeeded) {
      return [];
    }

    const totalContainers = volumesNeeded.total || 1;
    const containers = [];

    // Sort pipes by external diameter (largest first) for nesting logic
    const sortedPipes = [...pipeResults]
      .filter(p => p.numberOfPipes > 0)
      .sort((a, b) => b.externalDiameter - a.externalDiameter);

    if (sortedPipes.length === 0) return [];

    const largestPipe = sortedPipes[0];

    // Check which smaller pipes can nest inside the largest
    const nestingCandidates = sortedPipes.slice(1).filter(
      p => p.externalDiameter <= largestPipe.internalDiameter
    );

    // Track remaining pipes to distribute
    const remainingPipes = {};
    sortedPipes.forEach(p => {
      remainingPipes[p.id] = p.numberOfPipes;
    });

    for (let i = 0; i < totalContainers; i++) {
      const containerPipes = [];
      let containerWeight = 0;
      let totalPipesInContainer = 0;

      // Calculate large pipes for this container
      const largePipesPerContainer = largestPipe.pipesPerContainer || 0;
      const largePipesInThis = Math.min(remainingPipes[largestPipe.id] || 0, largePipesPerContainer);

      if (largePipesInThis > 0) {
        const weightForLarge = largePipesInThis * largestPipe.standardLengthM * largestPipe.weightPerMeter;
        containerPipes.push({
          diameterMm: largestPipe.externalDiameterMm,
          count: largePipesInThis,
          weight: weightForLarge,
          nested: false
        });
        containerWeight += weightForLarge;
        totalPipesInContainer += largePipesInThis;
        remainingPipes[largestPipe.id] -= largePipesInThis;
      }

      // Calculate nested pipes (one per large pipe)
      for (const smallPipe of nestingCandidates) {
        const nestedCount = Math.min(remainingPipes[smallPipe.id] || 0, largePipesInThis);
        if (nestedCount > 0) {
          const weightForNested = nestedCount * smallPipe.standardLengthM * smallPipe.weightPerMeter;
          containerPipes.push({
            diameterMm: smallPipe.externalDiameterMm,
            count: nestedCount,
            weight: weightForNested,
            nested: true
          });
          containerWeight += weightForNested;
          totalPipesInContainer += nestedCount;
          remainingPipes[smallPipe.id] -= nestedCount;
        }
      }

      // Calculate standalone small pipes (in remaining space)
      // These go beside/above large pipes, or fill the entire container if no large pipes
      for (const smallPipe of sortedPipes.slice(1)) {
        if ((remainingPipes[smallPipe.id] || 0) <= 0) continue;

        const smallDiameter = smallPipe.externalDiameter;
        let standaloneCapacity = 0;

        if (largePipesInThis > 0) {
          // Calculate space around large pipes
          const usedRows = Math.ceil(largePipesInThis / (largestPipe.pipesPerRow || 1));
          const usedHeightByLarge = usedRows * largestPipe.externalDiameter;
          const usedWidthByLarge = Math.min(largePipesInThis, largestPipe.pipesPerRow || 1) * largestPipe.externalDiameter;
          const remainingWidthOnSide = (volume?.width || 0) - usedWidthByLarge;
          const remainingHeightOnTop = (volume?.height || 0) - usedHeightByLarge;

          // Side space capacity (right of large pipes, full height)
          const sideColumns = Math.floor(remainingWidthOnSide / smallDiameter);
          const sideRows = Math.floor((volume?.height || 0) / smallDiameter);
          const sideCapacity = Math.max(0, sideColumns * sideRows);

          // Top space capacity (above large pipes, only in the width used by large pipes)
          const topColumns = Math.floor(usedWidthByLarge / smallDiameter);
          const topRows = Math.floor(remainingHeightOnTop / smallDiameter);
          const topCapacity = Math.max(0, topColumns * topRows);

          standaloneCapacity = (sideCapacity + topCapacity) * (largestPipe.pipesAlongLength || 1);
        } else {
          // No large pipes in this container - small pipes can use entire container
          const smallPipesPerRow = Math.floor((volume?.width || 0) / smallDiameter);
          const smallPipesPerColumn = Math.floor((volume?.height || 0) / smallDiameter);
          const smallPipesAlongLength = Math.floor((volume?.length || 0) / (smallPipe.standardLengthCm || 1));
          standaloneCapacity = smallPipesPerRow * smallPipesPerColumn * smallPipesAlongLength;
        }

        const standaloneCount = Math.min(remainingPipes[smallPipe.id] || 0, standaloneCapacity);

        if (standaloneCount > 0) {
          // Check if we already have this pipe type (from nesting)
          const existingEntry = containerPipes.find(p => p.diameterMm === smallPipe.externalDiameterMm && !p.nested);
          const weightForStandalone = standaloneCount * smallPipe.standardLengthM * smallPipe.weightPerMeter;

          if (existingEntry) {
            existingEntry.count += standaloneCount;
            existingEntry.weight += weightForStandalone;
          } else {
            containerPipes.push({
              diameterMm: smallPipe.externalDiameterMm,
              count: standaloneCount,
              weight: weightForStandalone,
              nested: false,
              standalone: true
            });
          }
          containerWeight += weightForStandalone;
          totalPipesInContainer += standaloneCount;
          remainingPipes[smallPipe.id] -= standaloneCount;
        }
      }

      containers.push({
        containerNumber: i + 1,
        pipes: containerPipes,
        totalPipes: totalPipesInContainer,
        totalWeight: containerWeight
      });
    }

    return containers;
  }, [pipeResults, volumesNeeded, volume]);

  if (!containerBreakdown || containerBreakdown.length === 0) {
    return null;
  }

  // Calculate grand totals
  const grandTotals = containerBreakdown.reduce((acc, container) => ({
    totalPipes: acc.totalPipes + container.totalPipes,
    totalWeight: acc.totalWeight + container.totalWeight
  }), { totalPipes: 0, totalWeight: 0 });

  return (
    <Paper elevation={1} sx={{ mt: 2 }}>
      <Box p={2}>
        <Typography variant="h6">
          Container Details
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Container</strong></TableCell>
              <TableCell><strong>Pipe Breakdown</strong></TableCell>
              <TableCell align="right"><strong>Total Pipes</strong></TableCell>
              <TableCell align="right"><strong>Total Weight</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {containerBreakdown.map((container) => (
              <TableRow key={container.containerNumber} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    Container {container.containerNumber}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {container.pipes.map((pipe, idx) => (
                      <Typography key={idx} variant="caption" color="text.secondary">
                        {pipe.nested ? '↳ ' : ''}{pipe.count}× Ø{pipe.diameterMm}mm
                        {pipe.nested ? ' (nested)' : pipe.standalone ? ' (beside)' : ''}
                      </Typography>
                    ))}
                    {container.pipes.length === 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Empty
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {formatNumberWithCommas(container.totalPipes)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {formatNumberWithCommas(Math.round(container.totalWeight))} kg
                  </Typography>
                </TableCell>
              </TableRow>
            ))}

            {/* Totals Row */}
            <TableRow sx={{ bgcolor: 'primary.light' }}>
              <TableCell>
                <Typography variant="body2" fontWeight="bold" color="primary.contrastText">
                  TOTAL
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight="bold" color="primary.contrastText">
                  {containerBreakdown.length} container(s)
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight="bold" color="primary.contrastText">
                  {formatNumberWithCommas(grandTotals.totalPipes)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight="bold" color="primary.contrastText">
                  {formatNumberWithCommas(Math.round(grandTotals.totalWeight))} kg
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
