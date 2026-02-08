/**
 * Volume Optimization Algorithm
 * Optimizes pipe arrangement within a specified volume
 *
 * Key concepts:
 * - Pipes are cylindrical and laid horizontally along the volume LENGTH
 * - Cross-section view shows circles arranged in WIDTH x HEIGHT plane
 * - Pipes can be stacked vertically and arranged side by side
 * - Smaller pipes can nest (telescope) inside larger pipes
 * - Goal: Maximize the number of pipes that fit in the volume
 */

/**
 * Main optimization function
 * @param {Object} volume - Volume dimensions {length, width, height, weightCapacity}
 * @param {Array} pipeTypes - Array of pipe type specifications with quantities
 * @param {Array} boxes - Array of box objects
 * @param {number} minSpace - Minimum space between pipes (mm converted to cm)
 * @param {number} allowance - Nesting allowance (space between nested pipes)
 * @returns {Object} - Optimal arrangement with quantities and positions
 */
export function optimizeArrangement(volume, pipeTypes, boxes = [], minSpace = 0, allowance = 0) {
  console.log('optimizeArrangement called with:', { volume, pipeTypes, minSpace, allowance });

  // Validate inputs
  if (!volume || !volume.length || !volume.width || !volume.height) {
    console.log('Invalid volume dimensions');
    return { error: 'Invalid volume dimensions', layers: [], pipeCounts: {} };
  }

  if (!pipeTypes || pipeTypes.length === 0) {
    console.log('No pipes specified');
    return { error: 'No pipes specified', layers: [], pipeCounts: {} };
  }

  // Filter out pipes with invalid dimensions
  const validPipes = pipeTypes.filter(p => p.externalDiameter > 0 && p.length > 0);
  console.log('Valid pipes:', validPipes);

  if (validPipes.length === 0) {
    console.log('No valid pipes after filtering');
    return { error: 'No valid pipes', layers: [], pipeCounts: {} };
  }

  // Convert minSpace from input units to cm if needed
  const spacing = minSpace;

  // First, determine nesting relationships and create pipe groups
  const { nestedGroups, standalonePipes } = createNestedGroups(validPipes, allowance);
  console.log('Nesting result:', { nestedGroups: nestedGroups.length, standalonePipes: standalonePipes.length });

  // Calculate how many of each pipe/group can fit in the cross-section
  const crossSection = {
    width: volume.width,
    height: volume.height
  };

  // Arrange pipes in cross-section (WIDTH x HEIGHT plane)
  // Pipes extend along the LENGTH direction
  const arrangement = arrangePipesInCrossSection(
    crossSection,
    nestedGroups,
    standalonePipes,
    spacing,
    volume.length,
    volume.weightCapacity
  );

  // Add box placement if any
  if (boxes && boxes.length > 0) {
    arrangeBoxes(arrangement, boxes, volume, spacing);
  }

  return arrangement;
}

/**
 * Create nested pipe groups based on telescoping possibilities
 * @param {Array} pipeTypes - Array of pipe specifications
 * @param {number} allowance - Nesting allowance
 * @returns {Object} - Nested groups and standalone pipes
 */
function createNestedGroups(pipeTypes, allowance) {
  // Sort pipes by external diameter (descending)
  const sortedPipes = [...pipeTypes].sort((a, b) => b.externalDiameter - a.externalDiameter);

  const nestedGroups = [];
  const usedPipes = new Set();

  // Find which pipes can nest inside others
  for (const outerPipe of sortedPipes) {
    if (usedPipes.has(outerPipe.id)) continue;

    const group = {
      outerPipe: outerPipe,
      nestedPipes: [],
      effectiveDiameter: outerPipe.externalDiameter,
      effectiveLength: outerPipe.length,
      totalWeight: (outerPipe.length / 100) * outerPipe.weightPerMeter // length in cm, convert to m
    };

    // Available internal space for nesting
    let availableInternalDiameter = outerPipe.internalDiameter - (2 * allowance);

    // Find pipes that can nest inside this one
    for (const innerPipe of sortedPipes) {
      if (usedPipes.has(innerPipe.id) || innerPipe.id === outerPipe.id) continue;

      // Check if inner pipe can fit inside
      if (innerPipe.externalDiameter <= availableInternalDiameter) {
        group.nestedPipes.push(innerPipe);
        group.totalWeight += (innerPipe.length / 100) * innerPipe.weightPerMeter; // length in cm, convert to m

        // Update effective length if inner is longer (partial telescoping)
        if (innerPipe.length > group.effectiveLength) {
          group.effectiveLength = innerPipe.length;
        }

        // Reduce available space for further nesting
        availableInternalDiameter = innerPipe.internalDiameter - (2 * allowance);
        usedPipes.add(innerPipe.id);
      }
    }

    if (group.nestedPipes.length > 0) {
      usedPipes.add(outerPipe.id);
      nestedGroups.push(group);
    }
  }

  // Standalone pipes (not part of any nesting group)
  const standalonePipes = sortedPipes.filter(p => !usedPipes.has(p.id));

  return { nestedGroups, standalonePipes };
}

/**
 * Arrange pipes in the cross-section (WIDTH x HEIGHT plane)
 * Uses a greedy algorithm with hexagonal-like packing
 * @param {Object} crossSection - {width, height}
 * @param {Array} nestedGroups - Array of nested pipe groups
 * @param {Array} standalonePipes - Array of standalone pipes
 * @param {number} spacing - Minimum space between pipes
 * @param {number} volumeLength - Length of the volume (pipe direction)
 * @param {number} weightCapacity - Maximum weight capacity
 * @returns {Object} - Arrangement with positions and counts
 */
function arrangePipesInCrossSection(crossSection, nestedGroups, standalonePipes, spacing, volumeLength, weightCapacity) {
  const arrangement = {
    layers: [],
    pipeCounts: {},
    totalPipes: 0,
    totalWeight: 0,
    volumeUsed: 0,
    positions: [],
    weightCapacityExceeded: false
  };

  // Create pipe templates (items that can be placed multiple times)
  const pipeTemplates = [];

  // Add nested groups as templates
  for (const group of nestedGroups) {
    // Recalculate weight with proper unit conversion (length in cm, weight in kg/m)
    let groupWeight = 0;
    groupWeight += (group.outerPipe.length / 100) * group.outerPipe.weightPerMeter;
    for (const nested of group.nestedPipes) {
      groupWeight += (nested.length / 100) * nested.weightPerMeter;
    }
    pipeTemplates.push({
      type: 'nestedGroup',
      group: group,
      diameter: group.effectiveDiameter,
      length: group.effectiveLength,
      weight: groupWeight,
      pipes: [group.outerPipe, ...group.nestedPipes]
    });
  }

  // Add standalone pipes as templates
  for (const pipe of standalonePipes) {
    // Convert length from cm to meters for weight calculation
    const lengthInMeters = pipe.length / 100;
    pipeTemplates.push({
      type: 'standalone',
      pipe: pipe,
      diameter: pipe.externalDiameter,
      length: pipe.length,
      weight: lengthInMeters * pipe.weightPerMeter,
      pipes: [pipe]
    });
  }

  // Sort by diameter (descending) - place larger pipes first
  pipeTemplates.sort((a, b) => b.diameter - a.diameter);

  // Track placed positions to avoid overlaps
  const placedCircles = [];

  console.log('Pipe templates:', pipeTemplates);
  console.log('Cross section:', crossSection);

  // Keep placing pipes until no more fit
  // Try each pipe type in order, keep placing until it doesn't fit, then move to next
  let placedAny = true;
  const maxIterations = 10000; // Safety limit
  let iterations = 0;

  while (placedAny && iterations < maxIterations) {
    placedAny = false;
    iterations++;

    // Try to place one of each pipe type (largest first)
    for (const template of pipeTemplates) {
      const radius = template.diameter / 2;
      const effectiveRadius = radius + spacing / 2;

      // Find best position for this pipe
      const position = findBestPosition(
        placedCircles,
        effectiveRadius,
        crossSection.width,
        crossSection.height,
        spacing
      );

      if (position) {
        // Check weight capacity
        const newTotalWeight = arrangement.totalWeight + template.weight;
        console.log('Found position for pipe:', {
          diameter: template.diameter,
          position,
          pipeWeight: template.weight,
          newTotalWeight,
          weightCapacity,
          withinCapacity: !weightCapacity || newTotalWeight <= weightCapacity
        });
        if (!weightCapacity || newTotalWeight <= weightCapacity) {
          placedCircles.push({
            x: position.x,
            y: position.y,
            radius: radius,
            effectiveRadius: effectiveRadius,
            item: template
          });

          // Update counts
          for (const pipe of template.pipes) {
            if (!arrangement.pipeCounts[pipe.id]) {
              arrangement.pipeCounts[pipe.id] = {
                pipe: pipe,
                count: 0,
                totalLength: 0,
                totalWeight: 0
              };
            }
            const pipeLengthMeters = pipe.length / 100; // Convert cm to m
            arrangement.pipeCounts[pipe.id].count += 1;
            arrangement.pipeCounts[pipe.id].totalLength += pipe.length; // Keep in cm
            arrangement.pipeCounts[pipe.id].totalWeight += pipeLengthMeters * pipe.weightPerMeter;
          }

          arrangement.totalPipes += template.pipes.length;
          arrangement.totalWeight = newTotalWeight;

          // Track if pipes extend beyond volume length
          if (template.length > volumeLength) {
            arrangement.pipesExtendBeyondVolume = true;
            arrangement.maxPipeLength = Math.max(arrangement.maxPipeLength || 0, template.length);
          }

          placedAny = true;
        } else {
          arrangement.weightCapacityExceeded = true;
        }
      }
    }
  }

  // Convert placed circles to layer format for visualization
  arrangement.layers = [{
    height: crossSection.height,
    yOffset: 0,
    items: placedCircles.map(circle => ({
      type: 'pipe',
      id: circle.item.type === 'nestedGroup' ? circle.item.group.outerPipe.id : circle.item.pipe.id,
      pipe: circle.item.type === 'nestedGroup' ? circle.item.group.outerPipe : circle.item.pipe,
      x: circle.x,
      y: circle.y,
      diameter: circle.radius * 2,
      radius: circle.radius,
      nestedPipes: circle.item.type === 'nestedGroup' ? circle.item.group.nestedPipes : []
    }))
  }];

  arrangement.positions = placedCircles;

  return arrangement;
}

/**
 * Find the best position for a circle using bottom-left heuristic
 * @param {Array} placedCircles - Already placed circles
 * @param {number} radius - Radius of circle to place (including spacing)
 * @param {number} maxWidth - Maximum width of container
 * @param {number} maxHeight - Maximum height of container
 * @param {number} spacing - Minimum spacing between pipes
 * @returns {Object|null} - Best position {x, y} or null if doesn't fit
 */
function findBestPosition(placedCircles, radius, maxWidth, maxHeight, spacing) {
  console.log('findBestPosition:', { placedCount: placedCircles.length, radius, maxWidth, maxHeight, spacing });

  // If no circles placed yet, start at bottom-left
  if (placedCircles.length === 0) {
    const fits = radius * 2 <= maxWidth && radius * 2 <= maxHeight;
    console.log('First pipe check:', { diameter: radius * 2, maxWidth, maxHeight, fits });
    if (fits) {
      return { x: radius, y: radius };
    }
    return null;
  }

  // Generate candidate positions
  const candidates = [];

  // Try positions on the floor (y = radius)
  for (let x = radius; x <= maxWidth - radius; x += radius / 2) {
    if (canPlaceCircle(x, radius, radius, placedCircles, maxWidth, maxHeight)) {
      candidates.push({ x: x, y: radius, score: x + radius });
    }
  }

  // Try positions resting on top of or beside existing circles
  for (const placed of placedCircles) {
    // Position on top of this circle
    const topY = placed.y + placed.effectiveRadius + radius;
    if (topY + radius <= maxHeight) {
      const topPositions = findTangentPositions(placed, radius, placedCircles, maxWidth, maxHeight);
      candidates.push(...topPositions);
    }

    // Position to the right of this circle
    const rightX = placed.x + placed.effectiveRadius + radius;
    if (rightX + radius <= maxWidth) {
      if (canPlaceCircle(rightX, placed.y, radius, placedCircles, maxWidth, maxHeight)) {
        candidates.push({ x: rightX, y: placed.y, score: placed.y + rightX / 1000 });
      }
    }
  }

  // Try hexagonal packing positions (between two circles)
  for (let i = 0; i < placedCircles.length; i++) {
    for (let j = i + 1; j < placedCircles.length; j++) {
      const nestingPositions = findNestingPositions(
        placedCircles[i],
        placedCircles[j],
        radius,
        placedCircles,
        maxWidth,
        maxHeight
      );
      candidates.push(...nestingPositions);
    }
  }

  // Filter valid candidates and sort by score (bottom-left preference)
  const validCandidates = candidates.filter(c =>
    c.x - radius >= 0 &&
    c.x + radius <= maxWidth &&
    c.y - radius >= 0 &&
    c.y + radius <= maxHeight &&
    canPlaceCircle(c.x, c.y, radius, placedCircles, maxWidth, maxHeight)
  );

  if (validCandidates.length === 0) {
    return null;
  }

  // Sort by y first (bottom), then by x (left)
  validCandidates.sort((a, b) => {
    if (Math.abs(a.y - b.y) < 0.01) {
      return a.x - b.x;
    }
    return a.y - b.y;
  });

  return validCandidates[0];
}

/**
 * Find positions tangent to a placed circle
 */
function findTangentPositions(placed, radius, allPlaced, maxWidth, maxHeight) {
  const positions = [];
  const combinedRadius = placed.effectiveRadius + radius;

  // Try positions in an arc above the placed circle
  for (let angle = 0; angle <= Math.PI; angle += Math.PI / 8) {
    const x = placed.x + combinedRadius * Math.cos(angle);
    const y = placed.y + combinedRadius * Math.sin(angle);

    if (x - radius >= 0 && x + radius <= maxWidth &&
        y - radius >= 0 && y + radius <= maxHeight &&
        canPlaceCircle(x, y, radius, allPlaced, maxWidth, maxHeight)) {
      positions.push({ x: x, y: y, score: y + x / 1000 });
    }
  }

  return positions;
}

/**
 * Find nesting positions between two circles (hexagonal packing)
 */
function findNestingPositions(circle1, circle2, radius, allPlaced, maxWidth, maxHeight) {
  const positions = [];

  // Distance between circle centers
  const dx = circle2.x - circle1.x;
  const dy = circle2.y - circle1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Check if new circle can fit between them
  const r1 = circle1.effectiveRadius + radius;
  const r2 = circle2.effectiveRadius + radius;

  if (distance < r1 + r2 && distance > Math.abs(r1 - r2)) {
    // Calculate intersection points of circles with radius r1 and r2
    const a = (r1 * r1 - r2 * r2 + distance * distance) / (2 * distance);
    const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));

    const px = circle1.x + a * dx / distance;
    const py = circle1.y + a * dy / distance;

    // Two possible positions
    const pos1 = { x: px + h * dy / distance, y: py - h * dx / distance };
    const pos2 = { x: px - h * dy / distance, y: py + h * dx / distance };

    for (const pos of [pos1, pos2]) {
      if (pos.x - radius >= 0 && pos.x + radius <= maxWidth &&
          pos.y - radius >= 0 && pos.y + radius <= maxHeight &&
          canPlaceCircle(pos.x, pos.y, radius, allPlaced, maxWidth, maxHeight)) {
        positions.push({ ...pos, score: pos.y + pos.x / 1000 });
      }
    }
  }

  return positions;
}

/**
 * Check if a circle can be placed at the given position
 */
function canPlaceCircle(x, y, radius, placedCircles, maxWidth, maxHeight) {
  // Check bounds
  if (x - radius < 0 || x + radius > maxWidth || y - radius < 0 || y + radius > maxHeight) {
    return false;
  }

  // Check for overlap with existing circles
  for (const placed of placedCircles) {
    const dx = x - placed.x;
    const dy = y - placed.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = radius + placed.effectiveRadius;

    if (distance < minDistance - 0.001) { // Small tolerance for floating point
      return false;
    }
  }

  return true;
}

/**
 * Arrange boxes in remaining space
 */
function arrangeBoxes(arrangement, boxes, volume, spacing) {
  // TODO: Implement box arrangement in remaining space
  // For now, boxes are handled separately
}

/**
 * Calculate volume usage
 * @param {Object} volume - Volume dimensions
 * @param {Array} pipes - Array of pipes with counts
 * @param {Array} boxes - Array of boxes
 * @returns {Object} - Volume usage information
 */
export function calculateVolumeUsage(volume, pipes, boxes = []) {
  const totalVolume = volume.length * volume.width * volume.height;

  let usedVolume = 0;

  // Calculate pipe volumes (cylindrical space they occupy)
  pipes.forEach(pipe => {
    const diameter = pipe.effectiveDiameter || pipe.externalDiameter;
    const length = pipe.effectiveLength || pipe.length;
    // Volume of the bounding cylinder
    const pipeVolume = Math.PI * Math.pow(diameter / 2, 2) * length;
    usedVolume += pipeVolume;
  });

  // Calculate box volumes
  boxes.forEach(box => {
    const boxVolume = box.length * box.width * box.height;
    usedVolume += boxVolume;
  });

  const percentageUsed = totalVolume > 0 ? (usedVolume / totalVolume) * 100 : 0;
  const remainingVolume = totalVolume - usedVolume;

  return {
    totalVolume,
    usedVolume,
    remainingVolume,
    percentageUsed
  };
}

/**
 * Calculate total weight
 * @param {Array} pipes - Array of pipes
 * @param {Array} boxes - Array of boxes (with weight if available)
 * @returns {number} - Total weight
 */
export function calculateTotalWeight(pipes, boxes = []) {
  let totalWeight = 0;

  pipes.forEach(pipe => {
    const lengthCm = pipe.effectiveLength || pipe.length;
    const lengthM = lengthCm / 100; // Convert cm to m
    totalWeight += lengthM * pipe.weightPerMeter;
  });

  boxes.forEach(box => {
    if (box.weight) {
      totalWeight += box.weight;
    }
  });

  return totalWeight;
}

/**
 * Calculate how many pipes of each type can fit
 * This is the main calculation for the offer preparation
 * @param {Object} volume - Volume dimensions
 * @param {Array} pipeTypes - Array of pipe type specifications
 * @param {number} minSpace - Minimum space between pipes
 * @param {number} allowance - Nesting allowance
 * @returns {Object} - Quantities and arrangement details
 */
export function calculateMaxPipeQuantities(volume, pipeTypes, minSpace = 0, allowance = 0) {
  // First, determine nesting possibilities
  const { nestedGroups, standalonePipes } = createNestedGroups(pipeTypes, allowance);

  const results = {
    pipeQuantities: {},
    nestedGroups: [],
    totalWeight: 0,
    totalPipes: 0,
    volumeEfficiency: 0
  };

  // Calculate cross-section arrangement
  const crossSection = {
    width: volume.width,
    height: volume.height
  };

  // For each unique diameter (considering nesting), calculate how many fit
  const allItems = [];

  // Process nested groups
  for (const group of nestedGroups) {
    allItems.push({
      type: 'nestedGroup',
      group: group,
      diameter: group.effectiveDiameter,
      length: group.effectiveLength,
      pipes: [group.outerPipe, ...group.nestedPipes]
    });
  }

  // Process standalone pipes
  for (const pipe of standalonePipes) {
    allItems.push({
      type: 'standalone',
      pipe: pipe,
      diameter: pipe.externalDiameter,
      length: pipe.length,
      pipes: [pipe]
    });
  }

  // Calculate how many of each item fit
  const arrangement = arrangePipesInCrossSection(
    crossSection,
    nestedGroups,
    standalonePipes,
    minSpace,
    volume.length,
    volume.weightCapacity
  );

  return arrangement;
}

/**
 * Validate arrangement fits within volume
 */
export function validateArrangement(arrangement, volume) {
  if (!arrangement || !arrangement.layers) {
    return false;
  }

  // Check that all items are within bounds
  for (const layer of arrangement.layers) {
    if (!layer.items) continue;

    for (const item of layer.items) {
      if (item.type === 'pipe') {
        const maxX = item.x + item.radius;
        const maxY = item.y + item.radius;
        if (maxX > volume.width || maxY > volume.height) {
          return false;
        }
        if (item.x - item.radius < 0 || item.y - item.radius < 0) {
          return false;
        }
      }
    }
  }

  return true;
}
