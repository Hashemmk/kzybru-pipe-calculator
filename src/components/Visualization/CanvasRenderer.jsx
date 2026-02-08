/**
 * Canvas Renderer
 * Handles HTML5 Canvas rendering for pipe visualization
 *
 * The visualization shows a cross-section view (WIDTH x HEIGHT plane)
 * Pipes are laid horizontally along the LENGTH direction
 */

import { CANVAS_SCALE, PIPE_COLORS, BOX_COLOR } from '../../constants/defaults';

export default class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = CANVAS_SCALE;
  }

  /**
   * Render the arrangement on canvas
   * @param {Object} arrangement - Arrangement object
   * @param {Object} volume - Volume dimensions (width = cross-section width, height = cross-section height)
   * @param {Array} pipes - Array of pipe objects for color mapping
   * @param {number} layerIndex - Current layer index (usually 0 for cross-section view)
   * @param {number} zoom - Zoom level
   */
  render(arrangement, volume, pipes, layerIndex, zoom) {
    const layer = arrangement.layers[layerIndex];
    if (!layer) return;

    const effectiveScale = this.scale * zoom;

    // Cross-section: width is horizontal, height is vertical
    const canvasWidth = volume.width * effectiveScale + 60; // Add padding
    const canvasHeight = volume.height * effectiveScale + 60;

    // Set canvas size
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;

    // Clear canvas
    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    this.ctx.fillStyle = '#f5f5f5';
    this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw volume boundary (cross-section rectangle)
    this.drawVolumeBoundary(volume, effectiveScale);

    // Draw grid for reference
    this.drawGrid(volume, effectiveScale);

    // Draw items in layer
    if (layer.items) {
      layer.items.forEach((item, index) => {
        if (item.type === 'pipe') {
          this.drawPipe(item, pipes, effectiveScale, index);
        } else if (item.type === 'box') {
          this.drawBox(item, effectiveScale);
        }
      });
    }

    // Draw legend
    this.drawLegend(layer.items, pipes, canvasWidth, canvasHeight);
  }

  /**
   * Draw volume boundary (cross-section view)
   * @param {Object} volume - Volume dimensions
   * @param {number} scale - Scale factor
   */
  drawVolumeBoundary(volume, scale) {
    const padding = 30;
    const x = padding;
    const y = padding;
    const width = volume.width * scale;
    const height = volume.height * scale;

    // Draw floor/ground line
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(x - 5, y + height, width + 10, 5);

    // Draw container boundary
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);

    // Draw dimension labels
    this.ctx.fillStyle = '#333333';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';

    // Width label (bottom)
    this.ctx.fillText(`Width: ${volume.width} cm`, x + width / 2, y + height + 20);

    // Height label (left side, rotated)
    this.ctx.save();
    this.ctx.translate(x - 15, y + height / 2);
    this.ctx.rotate(-Math.PI / 2);
    this.ctx.fillText(`Height: ${volume.height} cm`, 0, 0);
    this.ctx.restore();

    // Title
    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillText('Cross-Section View', x + width / 2, y - 10);
  }

  /**
   * Draw a pipe circle with optional nested pipes inside
   * @param {Object} item - Pipe item from arrangement
   * @param {Array} pipes - Array of pipe objects for color lookup
   * @param {number} scale - Scale factor
   * @param {number} itemIndex - Index for default color
   */
  drawPipe(item, pipes, scale, itemIndex) {
    const padding = 30;
    // In cross-section: x maps to width, y maps to height
    // Canvas y is inverted (0 at top), so we flip
    const x = padding + item.x * scale;
    const y = padding + (item.y) * scale; // y from bottom
    const radius = (item.diameter / 2) * scale;

    // Find pipe color based on pipe id
    let colorIndex = itemIndex;
    if (item.pipe && pipes) {
      const foundIndex = pipes.findIndex(p => p.id === item.pipe.id);
      if (foundIndex >= 0) colorIndex = foundIndex;
    }
    const color = PIPE_COLORS[colorIndex % PIPE_COLORS.length];

    // Draw outer pipe circle
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Draw nested pipes if any
    if (item.nestedPipes && item.nestedPipes.length > 0) {
      this.drawNestedPipesNew(item.nestedPipes, pipes, x, y, scale, colorIndex + 1);
    }

    // Draw pipe label (diameter)
    const labelSize = Math.max(8, Math.min(12, radius / 2));
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = `bold ${labelSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Show diameter
    const diameterText = `Ø${item.diameter.toFixed(0)}`;
    this.ctx.fillText(diameterText, x, y);
  }

  /**
   * Draw nested pipes (concentric circles inside the outer pipe)
   * @param {Array} nestedPipes - Array of nested pipe objects
   * @param {Array} allPipes - All pipes for color lookup
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} scale - Scale factor
   * @param {number} startColorIndex - Starting color index
   */
  drawNestedPipesNew(nestedPipes, allPipes, x, y, scale, startColorIndex) {
    nestedPipes.forEach((nestedPipe, index) => {
      const nestedRadius = (nestedPipe.externalDiameter / 2) * scale;

      // Find color for this nested pipe
      let colorIndex = startColorIndex + index;
      if (allPipes) {
        const foundIndex = allPipes.findIndex(p => p.id === nestedPipe.id);
        if (foundIndex >= 0) colorIndex = foundIndex;
      }
      const color = PIPE_COLORS[colorIndex % PIPE_COLORS.length];

      // Draw nested pipe circle with slight transparency
      this.ctx.beginPath();
      this.ctx.arc(x, y, nestedRadius, 0, 2 * Math.PI);
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = 0.8;
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // Label for nested pipe
      const labelSize = Math.max(6, Math.min(10, nestedRadius / 2));
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = `${labelSize}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(`Ø${nestedPipe.externalDiameter.toFixed(0)}`, x, y);
    });
  }

  /**
   * Draw a box
   * @param {Object} item - Box item from arrangement
   * @param {number} scale - Scale factor
   */
  drawBox(item, scale) {
    const padding = 30;
    const x = padding + item.x * scale;
    const y = padding + item.y * scale;
    const width = item.width * scale;
    const height = item.height * scale;

    // Draw box rectangle
    this.ctx.fillStyle = BOX_COLOR;
    this.ctx.fillRect(x, y, width, height);
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);

    // Draw box label
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Box', x + width / 2, y + height / 2);
  }

  /**
   * Draw grid lines for reference
   * @param {Object} volume - Volume dimensions
   * @param {number} scale - Scale factor
   */
  drawGrid(volume, scale) {
    const padding = 30;
    const gridSize = 10 * scale; // 10cm grid
    const width = volume.width * scale;
    const height = volume.height * scale;

    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 0.5;

    // Vertical lines
    for (let xPos = padding; xPos <= padding + width; xPos += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(xPos, padding);
      this.ctx.lineTo(xPos, padding + height);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let yPos = padding; yPos <= padding + height; yPos += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(padding, yPos);
      this.ctx.lineTo(padding + width, yPos);
      this.ctx.stroke();
    }
  }

  /**
   * Draw legend showing pipe types and colors
   * @param {Array} items - Layer items
   * @param {Array} pipes - All pipe specifications
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  drawLegend(items, pipes, _canvasWidth, canvasHeight) {
    if (!items || items.length === 0) return;

    // Collect unique pipe types
    const pipeTypes = new Map();
    items.forEach((item, index) => {
      if (item.type === 'pipe' && item.pipe) {
        const key = `${item.pipe.externalDiameter}-${item.pipe.internalDiameter}`;
        if (!pipeTypes.has(key)) {
          let colorIndex = index;
          if (pipes) {
            const foundIndex = pipes.findIndex(p => p.id === item.pipe.id);
            if (foundIndex >= 0) colorIndex = foundIndex;
          }
          pipeTypes.set(key, {
            diameter: item.pipe.externalDiameter,
            color: PIPE_COLORS[colorIndex % PIPE_COLORS.length],
            count: 1
          });
        } else {
          pipeTypes.get(key).count++;
        }

        // Count nested pipes too
        if (item.nestedPipes) {
          item.nestedPipes.forEach((nested, nIndex) => {
            const nestedKey = `${nested.externalDiameter}-${nested.internalDiameter}`;
            if (!pipeTypes.has(nestedKey)) {
              let nestedColorIndex = index + nIndex + 1;
              if (pipes) {
                const foundIndex = pipes.findIndex(p => p.id === nested.id);
                if (foundIndex >= 0) nestedColorIndex = foundIndex;
              }
              pipeTypes.set(nestedKey, {
                diameter: nested.externalDiameter,
                color: PIPE_COLORS[nestedColorIndex % PIPE_COLORS.length],
                count: 1,
                nested: true
              });
            } else {
              pipeTypes.get(nestedKey).count++;
            }
          });
        }
      }
    });

    // Don't draw legend if no pipes
    if (pipeTypes.size === 0) return;

    // Draw legend box at bottom
    const legendX = 10;
    const legendY = canvasHeight - 25;

    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';

    let xOffset = legendX;
    pipeTypes.forEach((info, _key) => {
      // Color swatch
      this.ctx.fillStyle = info.color;
      this.ctx.fillRect(xOffset, legendY - 6, 12, 12);
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(xOffset, legendY - 6, 12, 12);

      // Label
      this.ctx.fillStyle = '#333';
      const label = `Ø${info.diameter}cm${info.nested ? ' (nested)' : ''}: ${info.count}`;
      this.ctx.fillText(label, xOffset + 16, legendY);

      xOffset += this.ctx.measureText(label).width + 30;
    });
  }
}
