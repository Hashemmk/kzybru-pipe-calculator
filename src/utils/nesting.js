/**
 * Pipe Telescoping/Nesting Logic
 * Handles both full and partial telescoping of pipes
 */

/**
 * Determine which pipes can be telescoped (nested inside others)
 * @param {Array} pipes - Array of pipe objects
 * @param {number} allowance - Allowance for spacing between nested pipes
 * @returns {Object} - Telescoping relationships and updated pipes
 */
export function findTelescopingPossibilities(pipes, allowance = 0) {
  // Create a copy of pipes to avoid mutating the original
  const pipeMap = new Map();
  pipes.forEach(pipe => {
    pipeMap.set(pipe.id, { ...pipe, telescopedWith: [], telescopingType: 'none' });
  });

  // Sort pipes by external diameter (descending)
  const sortedPipes = [...pipes].sort((a, b) => b.externalDiameter - a.externalDiameter);

  // Find telescoping relationships
  for (let i = 0; i < sortedPipes.length; i++) {
    const outerPipe = sortedPipes[i];
    const outerPipeData = pipeMap.get(outerPipe.id);

    // Calculate available internal space
    const availableInternalDiameter = outerPipe.internalDiameter - (2 * allowance);

    if (availableInternalDiameter <= 0) continue;

    // Find smaller pipes that can fit inside
    for (let j = i + 1; j < sortedPipes.length; j++) {
      const innerPipe = sortedPipes[j];
      const innerPipeData = pipeMap.get(innerPipe.id);

      // Check if inner pipe can fit
      if (innerPipe.externalDiameter <= availableInternalDiameter) {
        // Determine telescoping type based on length
        let telescopingType;
        if (innerPipe.length <= outerPipe.length) {
          telescopingType = 'full';
        } else {
          telescopingType = 'partial';
        }

        // Update outer pipe
        outerPipeData.telescopedWith.push(innerPipe.id);
        outerPipeData.telescopingType = telescopingType;

        // Update inner pipe (it's nested)
        innerPipeData.telescopingType = 'nested';
        innerPipeData.telescopedIn = outerPipe.id;
      }
    }
  }

  // Calculate effective dimensions for each pipe
  const updatedPipes = Array.from(pipeMap.values()).map(pipe => {
    if (pipe.telescopingType === 'none' || pipe.telescopingType === 'nested') {
      return { ...pipe, effectiveDiameter: pipe.externalDiameter, effectiveLength: pipe.length };
    }

    // Calculate effective dimensions for outer pipes
    const innerPipes = pipe.telescopedWith.map(id => pipeMap.get(id));
    const maxInnerLength = Math.max(...innerPipes.map(p => p.length));
    const maxInnerDiameter = Math.max(...innerPipes.map(p => p.externalDiameter));

    let effectiveDiameter, effectiveLength;

    if (pipe.telescopingType === 'full') {
      // Full telescoping: only outer pipe dimensions matter
      effectiveDiameter = pipe.externalDiameter;
      effectiveLength = pipe.length;
    } else {
      // Partial telescoping: max of outer and inner dimensions
      effectiveDiameter = Math.max(pipe.externalDiameter, maxInnerDiameter);
      effectiveLength = Math.max(pipe.length, maxInnerLength);
    }

    return {
      ...pipe,
      effectiveDiameter,
      effectiveLength
    };
  });

  return {
    pipes: updatedPipes,
    relationships: buildTelescopingTree(updatedPipes)
  };
}

/**
 * Build a tree structure representing telescoping relationships
 * @param {Array} pipes - Array of pipe objects with telescoping info
 * @returns {Array} - Array of telescoping trees
 */
function buildTelescopingTree(pipes) {
  const pipeMap = new Map(pipes.map(p => [p.id, p]));
  const trees = [];

  // Find root pipes (not nested inside any other pipe)
  const rootPipes = pipes.filter(p => !p.telescopedIn);

  rootPipes.forEach(root => {
    trees.push(buildSubtree(root, pipeMap));
  });

  return trees;
}

/**
 * Build subtree for a pipe and its nested pipes
 * @param {Object} pipe - Pipe object
 * @param {Map} pipeMap - Map of all pipes
 * @returns {Object} - Tree node
 */
function buildSubtree(pipe, pipeMap) {
  const node = {
    ...pipe,
    children: []
  };

  if (pipe.telescopedWith && pipe.telescopedWith.length > 0) {
    pipe.telescopedWith.forEach(childId => {
      const child = pipeMap.get(childId);
      if (child) {
        node.children.push(buildSubtree(child, pipeMap));
      }
    });
  }

  return node;
}

/**
 * Calculate combined weight of a telescoped pipe group
 * @param {Object} tree - Telescoping tree node
 * @returns {number} - Combined weight
 */
export function calculateTelescopedWeight(tree) {
  let weight = tree.length * tree.weightPerMeter;

  if (tree.children && tree.children.length > 0) {
    tree.children.forEach(child => {
      weight += calculateTelescopedWeight(child);
    });
  }

  return weight;
}

/**
 * Calculate space saved by telescoping
 * @param {Array} pipes - Array of pipe objects
 * @param {Object} relationships - Telescoping relationships
 * @returns {Object} - Space saved information
 */
export function calculateSpaceSaved(pipes, relationships) {
  const pipeMap = new Map(pipes.map(p => [p.id, p]));
  
  let originalVolume = 0;
  let telescopedVolume = 0;

  pipes.forEach(pipe => {
    originalVolume += Math.PI * Math.pow(pipe.externalDiameter / 2, 2) * pipe.length;
  });

  relationships.forEach(tree => {
    const effectiveDiameter = tree.effectiveDiameter || tree.externalDiameter;
    const effectiveLength = tree.effectiveLength || tree.length;
    telescopedVolume += Math.PI * Math.pow(effectiveDiameter / 2, 2) * effectiveLength;
  });

  const spaceSaved = originalVolume - telescopedVolume;
  const percentageSaved = originalVolume > 0 ? (spaceSaved / originalVolume) * 100 : 0;

  return {
    originalVolume,
    telescopedVolume,
    spaceSaved,
    percentageSaved
  };
}

/**
 * Get telescoping suggestions for a set of pipes
 * @param {Array} pipes - Array of pipe objects
 * @param {number} allowance - Allowance for spacing
 * @returns {Array} - Array of suggestions
 */
export function getTelescopingSuggestions(pipes, allowance = 0) {
  const { pipes: updatedPipes } = findTelescopingPossibilities(pipes, allowance);
  const suggestions = [];

  updatedPipes.forEach(pipe => {
    if (pipe.telescopedWith && pipe.telescopedWith.length > 0) {
      const innerPipes = pipe.telescopedWith.map(id => 
        updatedPipes.find(p => p.id === id)
      ).filter(Boolean);

      suggestions.push({
        outerPipe: pipe,
        innerPipes,
        type: pipe.telescopingType,
        spaceSaved: calculateSpaceSavedForGroup(pipe, innerPipes)
      });
    }
  });

  return suggestions;
}

/**
 * Calculate space saved for a specific telescoping group
 * @param {Object} outerPipe - Outer pipe
 * @param {Array} innerPipes - Array of inner pipes
 * @returns {Object} - Space saved information
 */
function calculateSpaceSavedForGroup(outerPipe, innerPipes) {
  let originalVolume = 0;
  
  // Calculate original volume (all pipes separate)
  originalVolume += Math.PI * Math.pow(outerPipe.externalDiameter / 2, 2) * outerPipe.length;
  innerPipes.forEach(pipe => {
    originalVolume += Math.PI * Math.pow(pipe.externalDiameter / 2, 2) * pipe.length;
  });

  // Calculate telescoped volume
  const effectiveDiameter = outerPipe.effectiveDiameter || outerPipe.externalDiameter;
  const effectiveLength = outerPipe.effectiveLength || outerPipe.length;
  const telescopedVolume = Math.PI * Math.pow(effectiveDiameter / 2, 2) * effectiveLength;

  const spaceSaved = originalVolume - telescopedVolume;
  const percentageSaved = originalVolume > 0 ? (spaceSaved / originalVolume) * 100 : 0;

  return {
    originalVolume,
    telescopedVolume,
    spaceSaved,
    percentageSaved
  };
}

/**
 * Clear all telescoping relationships from pipes
 * @param {Array} pipes - Array of pipe objects
 * @returns {Array} - Pipes without telescoping
 */
export function clearTelescoping(pipes) {
  return pipes.map(pipe => ({
    ...pipe,
    telescopedWith: [],
    telescopingType: 'none',
    telescopedIn: null,
    effectiveDiameter: pipe.externalDiameter,
    effectiveLength: pipe.length
  }));
}
