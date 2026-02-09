export const DEFAULT_CONFIG = {
  minSpace: 0,
  allowance: 0
};

// KuzeyBoru Brand Colors
export const BRAND_COLORS = {
  primary: '#4C5C65',      // Dark Blue-Gray
  accent: '#F10826',       // Red/Crimson
  background: '#F5F7F8',   // Light Gray-White
  paper: '#FFFFFF',        // White
  lightGray: '#E7EBED',    // Secondary background
  text: '#4C5C65',         // Dark Gray text
  textSecondary: '#7E7E7E' // Secondary text
};

// Transportation type presets with dimensions in cm and weight in kg
export const TRANSPORTATION_TYPES = {
  containerHC40: {
    id: 'containerHC40',
    label: 'Container HC 40ft',
    length: 1200,
    width: 235,
    height: 265,
    weightCapacity: 23000
  },
  truck: {
    id: 'truck',
    label: 'Truck',
    length: 1350,
    width: 245,
    height: 300,
    weightCapacity: 23000
  },
  custom: {
    id: 'custom',
    label: 'Custom',
    length: 0,
    width: 0,
    height: 0,
    weightCapacity: 0
  }
};

export const DEFAULT_VOLUME = {
  transportationType: 'custom',
  length: 0,
  width: 0,
  height: 0,
  weightCapacity: 0
};

export const PIPE_COLORS = [
  '#2196f3', // Blue
  '#4caf50', // Green
  '#ff9800', // Orange
  '#9c27b0', // Purple
  '#f44336', // Red
  '#00bcd4', // Cyan
  '#ffeb3b', // Yellow
  '#795548', // Brown
  '#607d8b', // Gray
  '#e91e63'  // Pink
];

export const BOX_COLOR = '#607d8b';

export const CANVAS_SCALE = 10; // 1cm = 10px
