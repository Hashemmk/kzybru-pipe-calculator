/**
 * Pipe Results Table Component
 * Table showing each pipe's details with totals row
 */

import React from 'react';
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
import { formatNumber, formatNumberWithCommas } from '../../utils/calculations';

export default function PipeResultsTable({ pipeResults }) {
  if (!pipeResults || pipeResults.length === 0) {
    return null;
  }

  // Calculate totals
  const totals = pipeResults.reduce((acc, pipe) => ({
    numberOfPipes: acc.numberOfPipes + pipe.numberOfPipes,
    quantityInMeters: acc.quantityInMeters + pipe.quantityInMeters,
    totalWeight: acc.totalWeight + pipe.totalWeight,
    volumeM3: acc.volumeM3 + pipe.volumeM3
  }), { numberOfPipes: 0, quantityInMeters: 0, totalWeight: 0, volumeM3: 0 });

  return (
    <Paper elevation={1} sx={{ mt: 2 }}>
      <Box p={2}>
        <Typography variant="h6">
          Pipe Details
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell align="right"><strong>Std. Length</strong></TableCell>
              <TableCell align="right"><strong>Qty (pcs)</strong></TableCell>
              <TableCell align="right"><strong>Total Length</strong></TableCell>
              <TableCell align="right"><strong>Weight</strong></TableCell>
              <TableCell align="right"><strong>Volume</strong></TableCell>
              <TableCell align="center"><strong>Packing</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pipeResults.map((result, index) => (
              <TableRow key={index} hover>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {result.externalDiameterMm} mm
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Int: {result.internalDiameterMm} mm
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {formatNumber(result.standardLengthM, 1)} m
                </TableCell>
                <TableCell align="right">
                  {formatNumberWithCommas(result.numberOfPipes)}
                </TableCell>
                <TableCell align="right">
                  {formatNumberWithCommas(result.quantityInMeters)} m
                </TableCell>
                <TableCell align="right">
                  {formatNumberWithCommas(result.totalWeight)} kg
                </TableCell>
                <TableCell align="right">
                  {formatNumber(result.volumeM3)} m³
                </TableCell>
                <TableCell align="center">
                  <Box>
                    <Typography variant="body2">
                      ({result.pipesPerRow}×{result.pipesPerColumn})×{result.pipesAlongLength}={result.pipesPerContainer}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      per container
                    </Typography>
                  </Box>
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
              <TableCell align="right">
                <Typography variant="body2" fontWeight="bold" color="primary.contrastText">
                  -
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight="bold" color="primary.contrastText">
                  {formatNumberWithCommas(totals.numberOfPipes)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight="bold" color="primary.contrastText">
                  {formatNumberWithCommas(totals.quantityInMeters)} m
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight="bold" color="primary.contrastText">
                  {formatNumberWithCommas(totals.totalWeight)} kg
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight="bold" color="primary.contrastText">
                  {formatNumber(totals.volumeM3)} m³
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" fontWeight="bold" color="primary.contrastText">
                  -
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
