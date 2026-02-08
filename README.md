# Pipe Calculator

A web-based calculator for optimizing pipe storage in a specified volume, with support for pipe telescoping (nesting) and optional box placement.

## Features

- **Volume Input**: Enter volume dimensions (Length, Width, Height) and weight capacity
- **Pipe Management**: Add multiple pipes with specifications:
  - External and internal diameters
  - Length
  - Wall thickness (auto-calculated)
  - Weight per meter
- **Box Management**: Optional feature to add boxes with dimensions
- **Configuration**: Set minimum space between pipes and allowance for telescoping
- **Telescoping Support**: Two types of telescoping:
  - **Full Telescoping**: All inner pipes fit completely inside the outer pipe
  - **Partial Telescoping**: Inner pipes extend beyond the outer pipe's length
- **Optimization Algorithm**: Uses First-Fit Decreasing heuristic with layer-based packing
- **2D Visualization**: HTML5 Canvas rendering showing pipe arrangement with:
  - Top-down view of volume
  - Color-coded pipes
  - Nested pipe visualization
  - Zoom controls
  - Layer navigation
- **Results Display**:
  - Summary cards (total weight, volume usage, pipes count)
  - Detailed pipe results table
  - Volume usage progress bar
  - Recommendations based on results

## Technology Stack

- **Frontend Framework**: React 18+
- **UI Component Library**: Material-UI (MUI) v5
- **State Management**: React Context API + useReducer
- **Visualization**: HTML5 Canvas API
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
pipes-calculator/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── VolumeInput/
│   │   ├── PipesInput/
│   │   ├── BoxesInput/
│   │   ├── ConfigurationInput/
│   │   ├── ResultsDisplay/
│   │   └── Visualization/
│   ├── context/
│   │   └── CalculatorContext.jsx
│   ├── utils/
│   │   ├── validation.js
│   │   ├── nesting.js
│   │   ├── optimization.js
│   │   └── calculations.js
│   ├── constants/
│   │   └── defaults.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
└── README.md
```

## Usage

1. **Enter Volume Dimensions**: Specify the available storage space
2. **Add Pipes**: Click "Add Pipe" to add pipes with their specifications
3. **(Optional) Add Boxes**: Enable and add boxes if needed
4. **Configure Settings**: Set minimum space between pipes and telescoping allowance
5. **Click Calculate**: The system will:
   - Validate all inputs
   - Apply telescoping optimization
   - Calculate optimal arrangement
   - Display results and visualization
6. **Review Results**: Check the summary, table, and visualization
7. **Modify and Recalculate**: Adjust inputs as needed

## Telescoping Method

The calculator supports two types of pipe telescoping:

### Full Telescoping (Concentric Nesting)
- All inner pipes fit completely inside the outer pipe
- Inner pipes are fully contained within the outer pipe's length
- Only the outer pipe's diameter is considered for space allocation
- Example: Outer pipe (Ø20cm, L:200cm) contains Inner pipe (Ø15cm, L:150cm)

### Partial Telescoping (Extended Nesting)
- Inner pipes extend beyond the outer pipe's length
- Both outer and inner pipe lengths contribute to total length
- The larger diameter between outer and extended inner pipes is considered
- Example: Outer pipe (Ø20cm, L:200cm) contains Inner pipe (Ø15cm, L:300cm) - inner extends 100cm beyond

## Algorithm Details

### Telescoping Algorithm
1. Sort pipes by external diameter (descending)
2. For each pipe, calculate available internal space
3. Find smaller pipes that can fit inside
4. Determine telescoping type based on length comparisons
5. Create telescoping hierarchy (tree structure)
6. Calculate effective dimensions for nested pipes

### Volume Optimization Algorithm
1. Preprocess: Resolve nested pipe groups into single entities
2. Sort pipes by diameter (descending)
3. Create layers based on height
4. Apply 2D bin packing per layer (First-Fit Decreasing)
5. Place boxes in remaining rectangular spaces
6. Validate weight capacity and spacing constraints

## Validation

The calculator includes comprehensive input validation:
- All dimensions must be positive numbers
- External diameter must be greater than internal diameter
- Volume height must accommodate largest pipe diameter
- Weight capacity validation
- Real-time error feedback

## Responsive Design

- **Desktop (≥1200px)**: Two-column layout
- **Tablet (768px - 1199px)**: Responsive grid
- **Mobile (<768px)**: Single column stacked layout

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

MIT

## Author

KuzeyBoru
