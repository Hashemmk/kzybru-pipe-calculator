/**
 * Validate all inputs for the pipe calculator
 * @param {Object} volume - Volume dimensions
 * @param {Array} pipes - Array of pipe objects
 * @param {Array} boxes - Array of box objects
 * @param {Object} config - Configuration parameters
 * @returns {Object} - Validation errors object
 */
export function validateInputs(volume, pipes, boxes, config) {
  const errors = {};

  // Validate volume
  if (!volume || typeof volume !== 'object') {
    errors.volume = 'Volume is required';
  } else {
    if (!volume.length || volume.length <= 0) {
      errors.volumeLength = 'Length must be a positive number';
    }
    if (!volume.width || volume.width <= 0) {
      errors.volumeWidth = 'Width must be a positive number';
    }
    if (!volume.height || volume.height <= 0) {
      errors.volumeHeight = 'Height must be a positive number';
    }
    if (volume.weightCapacity !== undefined && volume.weightCapacity < 0) {
      errors.volumeWeightCapacity = 'Weight capacity must be non-negative';
    }
  }

  // Validate pipes
  if (!Array.isArray(pipes)) {
    errors.pipes = 'Pipes must be an array';
  } else if (pipes.length === 0) {
    errors.pipes = 'At least one pipe is required';
  } else {
    pipes.forEach((pipe, index) => {
      const prefix = `pipe${index}`;

      if (!pipe.externalDiameter || pipe.externalDiameter <= 0) {
        errors[`${prefix}ExternalDiameter`] = `Pipe ${index + 1}: External diameter must be a positive number`;
      }
      if (!pipe.internalDiameter || pipe.internalDiameter <= 0) {
        errors[`${prefix}InternalDiameter`] = `Pipe ${index + 1}: Internal diameter must be a positive number`;
      }
      if (pipe.externalDiameter && pipe.internalDiameter &&
          pipe.externalDiameter <= pipe.internalDiameter) {
        errors[`${prefix}Diameter`] = `Pipe ${index + 1}: External diameter must be greater than internal diameter`;
      }
      // Standard Length validation (single pipe length in cm)
      if (!pipe.standardLength || pipe.standardLength <= 0) {
        errors[`${prefix}StandardLength`] = `Pipe ${index + 1}: Standard length must be a positive number`;
      }
      // Quantity in Meters validation (total length required)
      if (!pipe.quantityInMeters || pipe.quantityInMeters <= 0) {
        errors[`${prefix}QuantityInMeters`] = `Pipe ${index + 1}: Quantity must be a positive number`;
      }
      if (!pipe.weightPerMeter || pipe.weightPerMeter <= 0) {
        errors[`${prefix}WeightPerMeter`] = `Pipe ${index + 1}: Weight per meter must be a positive number`;
      }
    });
  }

  // Validate boxes
  if (boxes && boxes.length > 0) {
    if (!Array.isArray(boxes)) {
      errors.boxes = 'Boxes must be an array';
    } else {
      boxes.forEach((box, index) => {
        const prefix = `box${index}`;
        
        if (!box.length || box.length <= 0) {
          errors[`${prefix}Length`] = `Box ${index + 1}: Length must be a positive number`;
        }
        if (!box.width || box.width <= 0) {
          errors[`${prefix}Width`] = `Box ${index + 1}: Width must be a positive number`;
        }
        if (!box.height || box.height <= 0) {
          errors[`${prefix}Height`] = `Box ${index + 1}: Height must be a positive number`;
        }
      });
    }
  }

  // Validate configuration
  if (!config || typeof config !== 'object') {
    errors.config = 'Configuration is required';
  } else {
    // minSpace and allowance should have default values, but validate if they exist
    const minSpace = config.minSpace !== undefined ? config.minSpace : 0;
    const allowance = config.allowance !== undefined ? config.allowance : 0;
    
    if (minSpace < 0) {
      errors.minSpace = 'Minimum space must be non-negative';
    }
    if (allowance < 0) {
      errors.allowance = 'Allowance must be non-negative';
    }
  }

  // Check if volume height is sufficient for largest pipe
  // Pipe diameter is in mm, volume height is in cm
  if (pipes.length > 0 && volume.height) {
    const maxDiameterMm = Math.max(...pipes.map(p => p.externalDiameter || 0));
    const maxDiameterCm = maxDiameterMm / 10;
    if (maxDiameterCm > volume.height) {
      errors.volumeHeight = `Volume height (${volume.height}cm) must be at least as large as the largest pipe diameter (${maxDiameterMm}mm = ${maxDiameterCm}cm)`;
    }
  }

  return errors;
}

/**
 * Check if there are any validation errors
 * @param {Object} errors - Validation errors object
 * @returns {boolean} - True if there are errors
 */
export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

/**
 * Get error message for a specific field
 * @param {Object} errors - Validation errors object
 * @param {string} fieldName - Name of the field
 * @returns {string|null} - Error message or null
 */
export function getError(errors, fieldName) {
  return errors[fieldName] || null;
}
