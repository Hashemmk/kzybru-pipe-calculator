/**
 * Calculation Logic
 * All units:
 * - Pipe Dimensions (diameter, wall thickness, standard length): millimeters (mm)
 * - Container Dimensions (length, width, height): centimeters (cm)
 * - Quantity in Meters: meters (m)
 * - Weight per meter: kg/m
 * - Total weight: kg
 * - Volume: cm³ for calculations, m³ for display
 */

import { TRANSPORTATION_TYPES } from '../constants/defaults.js';

/**
 * Calculate comprehensive results for pipe arrangement
 * @param {Object} _arrangement - Not used in new calculation
 * @param {Array} pipes - Array of pipe specifications
 * @param {Array} _boxes - Not used
 * @param {Object} volume - Volume dimensions
 * @returns {Object} - Calculation results
 */
export function calculateResults(_arrangement, pipes, _boxes, volume) {
  // Calculate per-pipe results with container dimensions for packing calculation
  const pipeResults = pipes.map(pipe => calculatePipeResult(pipe, volume));

  // Calculate totals
  const totalVolume = pipeResults.reduce((sum, p) => sum + p.volumeM3, 0);
  const totalWeight = pipeResults.reduce((sum, p) => sum + p.totalWeight, 0);
  const totalPipes = pipeResults.reduce((sum, p) => sum + p.numberOfPipes, 0);
  const totalLength = pipeResults.reduce((sum, p) => sum + p.quantityInMeters, 0);

  // Calculate container volume
  const containerVolumeM3 = (volume.length * volume.width * volume.height) / 1000000;

  // Calculate volumes needed using cross-section packing
  const volumesNeeded = calculateVolumesNeededByPacking(
    pipeResults,
    totalWeight,
    volume
  );

  // Get transportation type label
  const transportationType = TRANSPORTATION_TYPES[volume.transportationType] || TRANSPORTATION_TYPES.custom;

  return {
    pipeResults,
    totalVolume,
    totalWeight,
    totalPipes,
    totalLength,
    containerVolumeM3,
    volumesNeeded,
    transportationType: transportationType.label,
    weightCapacity: volume.weightCapacity,
    valid: true
  };
}

/**
 * Calculate results for a single pipe type
 * @param {Object} pipe - Pipe specification (dimensions in mm)
 * @param {Object} volume - Container dimensions (in cm)
 * @returns {Object} - Pipe calculation results
 */
function calculatePipeResult(pipe, volume) {
  // Pipe dimensions are in mm
  const externalDiameterMm = pipe.externalDiameter || 0;
  const wallThicknessMm = pipe.wallThickness || 0;
  // Internal diameter is calculated from external diameter and wall thickness
  const internalDiameterMm = externalDiameterMm - (2 * wallThicknessMm);
  const standardLengthMm = pipe.standardLength || 0;
  const quantityInMeters = pipe.quantityInMeters || 0;
  const weightPerMeter = pipe.weightPerMeter || 0;

  // Convert mm to cm for calculations with container (which is in cm)
  const externalDiameterCm = externalDiameterMm / 10;
  const standardLengthCm = standardLengthMm / 10;

  // Standard length in meters
  const standardLengthM = standardLengthMm / 1000;

  // Number of pipes = total length / single pipe length
  const numberOfPipes = standardLengthM > 0
    ? Math.ceil(quantityInMeters / standardLengthM)
    : 0;

  // Total weight = quantity in meters × weight per meter
  const totalWeight = quantityInMeters * weightPerMeter;

  // Volume calculation (bounding cylinder)
  // Volume = π × r² × total length (in cm)
  const radiusCm = externalDiameterCm / 2;
  const totalLengthCm = quantityInMeters * 100; // Convert m to cm
  const volumeCm3 = Math.PI * radiusCm * radiusCm * totalLengthCm;
  const volumeM3 = volumeCm3 / 1000000;

  // Cross-section packing calculation
  // How many pipes fit in the container's width × height cross-section
  // Container dimensions are in cm, pipe diameter converted to cm
  const containerWidth = volume.width || 0;
  const containerHeight = volume.height || 0;
  const containerLength = volume.length || 0;

  let pipesPerRow = 0;
  let pipesPerColumn = 0;
  let pipesPerCrossSection = 0;
  let pipesAlongLength = 0;
  let pipesPerContainer = 0;
  let pipeFitsInLength = false;

  if (externalDiameterCm > 0 && standardLengthCm > 0) {
    pipesPerRow = Math.floor(containerWidth / externalDiameterCm);
    pipesPerColumn = Math.floor(containerHeight / externalDiameterCm);
    pipesPerCrossSection = pipesPerRow * pipesPerColumn;
    pipeFitsInLength = standardLengthCm <= containerLength;

    // Calculate how many pipes can be stacked along the container length
    // Pipes are placed horizontally along the length
    pipesAlongLength = pipeFitsInLength ? Math.floor(containerLength / standardLengthCm) : 0;

    // Total pipes per container = cross-section pipes × pipes along length
    pipesPerContainer = pipesPerCrossSection * pipesAlongLength;
  }

  return {
    id: pipe.id,
    // Store in mm for display
    externalDiameterMm,
    internalDiameterMm,
    wallThicknessMm,
    // Also store in cm for backward compatibility
    externalDiameter: externalDiameterCm,
    internalDiameter: internalDiameterMm / 10,
    wallThickness: wallThicknessMm / 10,
    standardLengthCm,
    standardLengthM,
    quantityInMeters,
    numberOfPipes,
    weightPerMeter,
    totalWeight,
    volumeCm3,
    volumeM3,
    // Packing info
    pipesPerRow,
    pipesPerColumn,
    pipesPerCrossSection,
    pipesAlongLength,
    pipesPerContainer,
    pipeFitsInLength
  };
}

/**
 * Calculate how many volumes/containers are needed based on cross-section packing
 * This accounts for physical pipe arrangement, not just volume ratio
 * @param {Array} pipeResults - Array of pipe calculation results
 * @param {number} totalWeight - Total weight in kg
 * @param {Object} volume - Container dimensions and capacity
 * @returns {Object} - Volumes needed info
 */
function calculateVolumesNeededByPacking(pipeResults, totalWeight, volume) {
  const containerWidth = volume.width || 0;
  const containerHeight = volume.height || 0;
  const containerLength = volume.length || 0;
  const weightCapacity = volume.weightCapacity || 0;
  const containerVolumeM3 = (containerWidth * containerHeight * containerLength) / 1000000;

  if (containerVolumeM3 <= 0) {
    return {
      total: 0,
      byPacking: 0,
      byWeight: 0,
      limitingFactor: 'none',
      volumeRatio: 0,
      weightRatio: 0,
      packingDetails: []
    };
  }

  // For each pipe type, calculate how many containers needed based on packing
  let maxContainersByPacking = 0;
  const packingDetails = [];

  for (const pipe of pipeResults) {
    if (pipe.numberOfPipes === 0) continue;

    const { externalDiameterMm, standardLengthCm, numberOfPipes, pipesPerCrossSection, pipesAlongLength, pipesPerContainer } = pipe;

    // Check if pipe length fits in container
    if (standardLengthCm > containerLength) {
      // Pipe is too long for container - cannot fit
      packingDetails.push({
        diameterMm: externalDiameterMm,
        error: 'Pipe length exceeds container length',
        pipesNeeded: numberOfPipes,
        pipesPerContainer: 0,
        containersNeeded: Infinity
      });
      maxContainersByPacking = Infinity;
      continue;
    }

    if (pipesPerContainer <= 0) {
      // Pipe diameter is too large for container cross-section
      packingDetails.push({
        diameterMm: externalDiameterMm,
        error: 'Pipe diameter exceeds container dimensions',
        pipesNeeded: numberOfPipes,
        pipesPerContainer: 0,
        containersNeeded: Infinity
      });
      maxContainersByPacking = Infinity;
      continue;
    }

    // Containers needed for this pipe type
    const containersNeeded = Math.ceil(numberOfPipes / pipesPerContainer);

    packingDetails.push({
      diameterMm: externalDiameterMm,
      pipesPerRow: pipe.pipesPerRow,
      pipesPerColumn: pipe.pipesPerColumn,
      pipesAlongLength,
      pipesPerCrossSection,
      pipesPerContainer,
      pipesNeeded: numberOfPipes,
      containersNeeded
    });

    // Track maximum containers needed across all pipe types
    // Note: This assumes each pipe type is shipped separately
    // For mixed loading, more complex bin-packing would be needed
    maxContainersByPacking = Math.max(maxContainersByPacking, containersNeeded);
  }

  // Calculate weight ratio
  const weightRatio = weightCapacity > 0 ? totalWeight / weightCapacity : 0;
  const byWeight = weightCapacity > 0 ? Math.ceil(weightRatio) : 0;

  // Calculate total pipe volume for reference
  const totalPipeVolume = pipeResults.reduce((sum, p) => sum + p.volumeM3, 0);
  const volumeRatio = totalPipeVolume / containerVolumeM3;

  // Handle infinite case (pipes don't fit)
  if (!isFinite(maxContainersByPacking)) {
    return {
      total: Infinity,
      byPacking: Infinity,
      byWeight,
      limitingFactor: 'packing',
      volumeRatio,
      weightRatio,
      packingDetails,
      error: 'Some pipes cannot fit in the container'
    };
  }

  // Take the maximum of packing and weight constraints
  const total = Math.max(maxContainersByPacking, byWeight, 1);

  // Determine limiting factor
  let limitingFactor = 'none';
  if (maxContainersByPacking > byWeight) {
    limitingFactor = 'packing';
  } else if (byWeight > maxContainersByPacking) {
    limitingFactor = 'weight';
  } else if (maxContainersByPacking > 0 && maxContainersByPacking === byWeight) {
    limitingFactor = 'both';
  }

  return {
    total,
    byPacking: maxContainersByPacking,
    byWeight,
    limitingFactor,
    volumeRatio,
    weightRatio,
    packingDetails
  };
}

/**
 * Calculate wall thickness from external and internal diameter
 */
export function calculateWallThickness(externalDiameter, internalDiameter) {
  return (externalDiameter - internalDiameter) / 2;
}

/**
 * Calculate internal diameter from external diameter and wall thickness
 */
export function calculateInternalDiameter(externalDiameter, wallThickness) {
  return externalDiameter - (2 * wallThickness);
}

/**
 * Format number for display
 */
export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  return value.toFixed(decimals);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with commas
 */
export function formatNumberWithCommas(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/**
 * Get recommendations based on results
 */
export function getRecommendations(results) {
  const recommendations = [];

  if (!results) {
    return recommendations;
  }

  // No pipes
  if (results.totalPipes === 0) {
    recommendations.push({
      type: 'warning',
      message: 'No pipes added. Add pipe specifications to calculate.'
    });
    return recommendations;
  }

  // Multiple volumes needed
  if (results.volumesNeeded && results.volumesNeeded.total > 1) {
    const { total, limitingFactor } = results.volumesNeeded;
    let reason = '';
    if (limitingFactor === 'packing') {
      reason = ' (limited by cross-section packing)';
    } else if (limitingFactor === 'weight') {
      reason = ' (limited by weight)';
    } else if (limitingFactor === 'both') {
      reason = ' (limited by both packing and weight)';
    }
    recommendations.push({
      type: 'info',
      message: `${total} ${results.transportationType || 'containers'} needed to transport all pipes${reason}`
    });
  }

  // Volume usage info
  if (results.volumesNeeded && results.containerVolumeM3 > 0) {
    const usagePercent = (results.totalVolume / results.containerVolumeM3) * 100;
    recommendations.push({
      type: 'info',
      message: `Total pipe volume: ${formatNumber(results.totalVolume)} m³ (${formatNumber(usagePercent)}% of single container)`
    });
  }

  return recommendations;
}
