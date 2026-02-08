# Pipe Calculator - Technical Architecture Plan

## Overview
A web-based calculator for optimizing pipe storage in a specified volume, with support for pipe nesting and optional box placement.

## Technology Stack
- **Frontend Framework**: React 18+
- **UI Component Library**: Material-UI (MUI) v5
- **State Management**: React Context API + useState/useReducer
- **Visualization**: HTML5 Canvas API
- **Build Tool**: Vite (for fast development and optimized builds)
- **Styling**: Material-UI's styling system with custom theme

## Project Structure
```
pipes-calculator/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── VolumeInput/
│   │   │   ├── VolumeInput.jsx
│   │   │   └── VolumeInput.styles.js
│   │   ├── PipesInput/
│   │   │   ├── PipesInput.jsx
│   │   │   ├── PipeRow.jsx
│   │   │   └── PipesInput.styles.js
│   │   ├── BoxesInput/
│   │   │   ├── BoxesInput.jsx
│   │   │   └── BoxesInput.styles.js
│   │   ├── ConfigurationInput/
│   │   │   ├── ConfigurationInput.jsx
│   │   │   └── ConfigurationInput.styles.js
│   │   ├── ResultsDisplay/
│   │   │   ├── ResultsDisplay.jsx
│   │   │   ├── PipeResultsTable.jsx
│   │   │   ├── VolumeUsage.jsx
│   │   │   └── ResultsDisplay.styles.js
│   │   ├── Visualization/
│   │   │   ├── PipeVisualization.jsx
│   │   │   ├── CanvasRenderer.jsx
│   │   │   └── Visualization.styles.js
│   │   └── CalculatorLayout/
│   │       ├── CalculatorLayout.jsx
│   │       └── CalculatorLayout.styles.js
│   ├── context/
│   │   └── CalculatorContext.jsx
│   ├── utils/
│   │   ├── calculations.js
│   │   ├── optimization.js
│   │   ├── nesting.js
│   │   └── validation.js
│   ├── constants/
│   │   └── defaults.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
└── README.md
```

## Component Architecture

### 1. CalculatorLayout (Main Container)
- **Purpose**: Orchestrates all components and manages overall layout
- **Props**: None
- **State**: Uses CalculatorContext
- **Responsibilities**:
  - Display header with title
  - Organize input sections (Volume, Pipes, Boxes, Configuration)
  - Display Calculate button
  - Show Results and Visualization sections
  - Handle responsive layout (stack on mobile, side-by-side on desktop)

### 2. VolumeInput Component
- **Purpose**: Collect volume dimensions and weight capacity
- **Inputs**:
  - Length (cm, number input)
  - Width (cm, number input)
  - Height (cm, number input)
  - Weight Capacity (kg, number input)
- **Validation**:
  - All dimensions must be positive numbers
  - Height must be at least as large as the largest pipe diameter
- **Output**: Volume object to context

### 3. PipesInput Component
- **Purpose**: Manage multiple pipe entries
- **Features**:
  - Add new pipe button
  - Remove pipe button
  - Dynamic list of PipeRow components
- **PipeRow Inputs**:
  - External Diameter (cm, number)
  - Internal Diameter (cm, number)
  - Length (cm, number)
  - Wall Thickness (cm, auto-calculated: external - internal)
  - Weight per meter (kg/m, number)
- **Validation**:
  - External diameter > Internal diameter
  - All values must be positive
  - Wall thickness calculated automatically

### 4. BoxesInput Component
- **Purpose**: Manage optional box entries
- **Features**:
  - Add/Remove boxes
  - Toggle visibility (optional feature)
- **Box Inputs**:
  - Length (cm, number)
  - Width (cm, number)
  - Height (cm, number)
- **Validation**:
  - All dimensions must be positive

### 5. ConfigurationInput Component
- **Purpose**: Set spacing and nesting parameters
- **Inputs**:
  - Minimum Space Between Pipes (cm, number, default: 0)
  - Allowance for Nesting (cm, number, default: 0)
- **Validation**:
  - Values must be non-negative

### 6. ResultsDisplay Component
- **Purpose**: Display calculation results
- **Sub-components**:
  - **PipeResultsTable**: Table showing each pipe's quantity, total length, total weight
  - **VolumeUsage**: Progress bar or gauge showing volume utilization percentage
- **Data Displayed**:
  - Total quantity of each pipe type
  - Total length per pipe type
  - Total weight per pipe type
  - Overall volume usage percentage
  - Total weight of all pipes
  - Remaining volume dimensions

### 7. Visualization Component
- **Purpose**: Render 2D diagram of pipe arrangement
- **Technology**: HTML5 Canvas
- **Features**:
  - Top-down view of volume
  - Pipes represented as circles with different colors
  - Nested pipes shown with concentric circles
  - Boxes shown as rectangles
  - Scale indicator
  - Legend for pipe types
  - Zoom and pan controls (optional enhancement)
- **Rendering Logic**:
  - Draw volume boundary
  - Draw pipes in optimal positions
  - Show nesting relationships
  - Display dimensions

## Core Algorithms

### 1. Pipe Nesting & Telescoping Algorithm (nesting.js)

```javascript
// Determine which pipes can be telescoped (nested inside others)
function findTelescopingPossibilities(pipes, allowance) {
  // Sort pipes by external diameter (descending)
  // For each pipe, find smaller pipes that can fit inside
  // Apply allowance for spacing
  // Return telescoping relationships
}

// Calculate telescoped pipe dimensions
function calculateTelescopedDimensions(outerPipe, innerPipes, allowance) {
  // Determine if pipes can be fully telescoped (all inner pipes fit completely inside)
  // or partially telescoped (some inner pipes extend beyond outer pipe)
  // Return combined dimensions and arrangement type
}
```

**Telescoping Logic**:

There are two types of telescoping arrangements:

**Type 1: Full Telescoping (Concentric Nesting)**
- All inner pipes fit completely inside the outer pipe
- Inner pipes are fully contained within the outer pipe's length
- Only the outer pipe's diameter is considered for space allocation
- Example: Outer pipe (Ø20cm, L:200cm) contains Inner pipe (Ø15cm, L:150cm)

**Type 2: Partial Telescoping (Extended Nesting)**
- Inner pipes extend beyond the outer pipe's length
- Both outer and inner pipe lengths contribute to total length
- The larger diameter between outer and extended inner pipes is considered
- Example: Outer pipe (Ø20cm, L:200cm) contains Inner pipe (Ø15cm, L:300cm) - inner extends 100cm beyond

**Algorithm Steps**:
1. Sort all pipes by external diameter (largest to smallest)
2. For each pipe, calculate available internal space: (internal_diameter - 2 * allowance)
3. Find smaller pipes that can fit: external_diameter <= available_internal_space
4. Determine telescoping type based on length comparisons:
   - If inner_pipe_length <= outer_pipe_length: Full telescoping
   - If inner_pipe_length > outer_pipe_length: Partial telescoping
5. Create telescoping hierarchy (tree structure with nested pipes)
6. Calculate combined dimensions:
   - For full telescoping: diameter = outer_diameter, length = outer_length
   - For partial telescoping: diameter = max(outer_diameter, inner_diameter), length = max(outer_length, inner_length)
7. Calculate combined weight: sum of all nested pipe weights

### 2. Volume Optimization Algorithm (optimization.js)
```javascript
// Optimize pipe arrangement within volume
function optimizeArrangement(volume, pipes, boxes, minSpace, nesting) {
  // Strategy: First-Fit Decreasing with nesting consideration
  // 1. Process nested pipe groups first
  // 2. Sort remaining pipes by diameter (descending)
  // 3. Place pipes layer by layer (height-wise)
  // 4. Within each layer, use bin-packing algorithm
  // 5. Place boxes in remaining spaces
  // Return optimal arrangement
}
```

**Algorithm Steps**:
1. **Preprocessing**:
   - Resolve nested pipe groups into single entities
   - Sort pipes by diameter (descending)
   - Sort boxes by volume (descending)

2. **Layer Assignment**:
   - Calculate max pipe diameter
   - Determine number of layers based on height
   - Assign pipes to layers

3. **2D Bin Packing** (per layer):
   - Use First-Fit Decreasing heuristic
   - Maintain list of available spaces
   - Place each pipe in first suitable space
   - Apply minimum spacing between pipes

4. **Box Placement**:
   - Place boxes in remaining rectangular spaces
   - Prioritize larger boxes first

5. **Validation**:
   - Check weight capacity
   - Verify all items fit within volume
   - Validate spacing constraints

### 3. Calculation Logic (calculations.js)
```javascript
// Calculate pipe quantities and weights
function calculateResults(arrangement, pipes) {
  // Sum up quantities, lengths, and weights
  // Calculate volume usage
  // Return results object
}
```

**Calculations**:
- Total quantity per pipe type
- Total length per pipe type: quantity × length
- Total weight per pipe type: total_length × weight_per_meter
- Overall weight: sum of all pipe weights
- Volume usage: (total_pipe_volume / volume_volume) × 100
- Remaining space: volume_dimensions - used_dimensions

### 4. Validation Logic (validation.js)
```javascript
// Validate all inputs
function validateInputs(volume, pipes, boxes, config) {
  // Check all required fields
  // Validate numeric ranges
  // Check logical constraints
  // Return validation errors (if any)
}
```

## State Management (CalculatorContext)

```javascript
const CalculatorContext = createContext();

const initialState = {
  volume: {
    length: 0,
    width: 0,
    height: 0,
    weightCapacity: 0
  },
  pipes: [], // Array of pipe objects
  boxes: [], // Array of box objects
  config: {
    minSpace: 0,
    allowance: 0
  },
  results: null,
  arrangement: null,
  errors: {},
  isValid: false
};
```

**Actions**:
- `UPDATE_VOLUME`: Update volume dimensions
- `ADD_PIPE`: Add new pipe to list
- `UPDATE_PIPE`: Update pipe properties
- `REMOVE_PIPE`: Remove pipe from list
- `ADD_BOX`: Add new box to list
- `UPDATE_BOX`: Update box properties
- `REMOVE_BOX`: Remove box from list
- `UPDATE_CONFIG`: Update configuration parameters
- `CALCULATE`: Run optimization and calculation
- `CLEAR_RESULTS`: Clear calculation results
- `SET_ERRORS`: Set validation errors

## Data Structures

### Pipe Object
```javascript
{
  id: string (unique),
  externalDiameter: number (cm),
  internalDiameter: number (cm),
  length: number (cm),
  wallThickness: number (cm, calculated),
  weightPerMeter: number (kg/m),
  quantity: number (calculated),
  telescopedWith: string[] (array of pipe IDs that are telescoped inside this pipe),
  telescopingType: 'none' | 'full' | 'partial' (type of telescoping),
  effectiveDiameter: number (cm, after telescoping),
  effectiveLength: number (cm, after telescoping)
}
```

### Box Object
```javascript
{
  id: string (unique),
  length: number (cm),
  width: number (cm),
  height: number (cm)
}
```

### Volume Object
```javascript
{
  length: number (cm),
  width: number (cm),
  height: number (cm),
  weightCapacity: number (kg)
}
```

### Results Object
```javascript
{
  pipeResults: [
    {
      pipeId: string,
      quantity: number,
      totalLength: number (cm),
      totalWeight: number (kg)
    }
  ],
  totalWeight: number (kg),
  volumeUsage: number (percentage),
  remainingVolume: {
    length: number,
    width: number,
    height: number
  },
  arrangement: {
    layers: [
      {
        height: number,
        items: [
          {
            type: 'pipe' | 'box',
            id: string,
            x: number,
            y: number,
            nestedItems: [] // for pipes with nested pipes
          }
        ]
      }
    ]
  }
}
```

## UI/UX Design

### Layout Strategy
- **Desktop**: Two-column layout
  - Left column: Input forms (Volume, Pipes, Boxes, Configuration)
  - Right column: Results and Visualization
- **Mobile**: Single column with stacked sections
- **Tablet**: Responsive grid layout

### Color Scheme (Material-UI Theme)
- Primary: Blue (#1976d2)
- Secondary: Orange (#ff9800)
- Success: Green (#4caf50)
- Warning: Amber (#ff9800)
- Error: Red (#f44336)
- Background: Light gray (#f5f5f5)
- Paper: White (#ffffff)

### User Flow
1. User enters volume dimensions
2. User adds pipes with specifications
3. (Optional) User adds boxes
4. User configures spacing and nesting parameters
5. User clicks "Calculate" button
6. System validates inputs
7. System runs optimization algorithm
8. Results displayed with:
   - Summary cards (total weight, volume usage)
   - Detailed pipe results table
   - 2D visualization of arrangement
9. User can modify inputs and recalculate

### Input Validation Feedback
- Real-time validation on input change
- Error messages below invalid fields
- Disable "Calculate" button until all inputs are valid
- Show validation summary if calculation fails

## Performance Considerations
- Memoize expensive calculations with useMemo
- Use useCallback for event handlers
- Lazy load visualization component
- Debounce input validation
- Virtualize long lists if needed (for many pipes)

## Accessibility
- ARIA labels for all form inputs
- Keyboard navigation support
- High contrast colors
- Screen reader compatible
- Focus management

## Future Enhancements (Optional)
- 3D visualization using Three.js
- Export results to PDF/CSV
- Save/load configurations
- Multiple volume comparison
- Undo/redo functionality
- Drag-and-drop pipe arrangement
- Real-time calculation preview
- Material selection database

## Testing Strategy
- Unit tests for calculation algorithms
- Integration tests for component interactions
- Visual regression tests for visualization
- E2E tests for user workflows
- Edge case testing (zero values, negative values, extreme dimensions)

## Deployment
- Build with Vite
- Deploy to static hosting (Netlify, Vercel, GitHub Pages)
- Optimize bundle size
- Enable gzip compression

## UI Sketch / Wireframe

### Desktop Layout (Two-Column)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PIPE CALCULATOR                                    │
├──────────────────────────────────────┬──────────────────────────────────────┤
│  INPUTS                              │  RESULTS                              │
│                                      │                                      │
│  ┌────────────────────────────────┐  │  ┌────────────────────────────────┐  │
│  │ VOLUME DIMENSIONS              │  │  │ SUMMARY                        │  │
│  │ ┌────────────────────────────┐ │  │  │ ┌────────────────────────────┐ │  │
│  │ │ Length:   [_______] cm     │ │  │  │ │ Total Weight:  1250 kg    │ │  │
│  │ │ Width:    [_______] cm     │ │  │  │ │ Volume Usage:   78%       │ │  │
│  │ │ Height:   [_______] cm     │ │  │  │ │ Pipes Count:   15         │ │  │
│  │ │ Max Weight:[_______] kg     │ │  │  │ └────────────────────────────┘ │  │
│  │ └────────────────────────────┘ │  │  └────────────────────────────────┘  │
│  └────────────────────────────────┘  │                                      │
│                                      │  ┌────────────────────────────────┐  │
│  ┌────────────────────────────────┐  │  │ PIPE RESULTS TABLE            │  │
│  │ PIPES                          │  │  │ ┌────┬────────┬────────┬──────┐ │  │
│  │ [+ Add Pipe]                   │  │  │ │Type│Quantity│Length  │Weight│ │  │
│  │ ┌────────────────────────────┐ │  │  │ ├────┼────────┼────────┼──────┤ │  │
│  │ │ Pipe 1                     │ │  │  │ │P1  │   5    │  500cm │ 250kg│ │  │
│  │ │ Ext Ø:  [_______] cm       │ │  │  │ │P2  │   3    │  300cm │ 180kg│ │  │
│  │ │ Int Ø:  [_______] cm       │ │  │  │ │P3  │   7    │  700cm │ 320kg│ │  │
│  │ │ Length: [_______] cm       │ │  │  │ └────┴────────┴────────┴──────┘ │  │
│  │ │ Wall:   [_______] cm (auto)│ │  │  └────────────────────────────────┘  │
│  │ │ Wt/m:   [_______] kg/m     │ │  │                                      │
│  │ │ [Remove]                    │ │  │  ┌────────────────────────────────┐  │
│  │ └────────────────────────────┘ │  │  │ VISUALIZATION                  │  │
│  │ ┌────────────────────────────┐ │  │  │ ┌────────────────────────────┐ │  │
│  │ │ Pipe 2                     │ │  │  │ │                            │ │  │
│  │ │ Ext Ø:  [_______] cm       │ │  │  │ │   ┌───┐                    │ │  │
│  │ │ Int Ø:  [_______] cm       │ │  │  │ │   │ ● │   ●   ●          │ │  │
│  │ │ Length: [_______] cm       │ │  │  │ │   └───┘                    │ │  │
│  │ │ Wall:   [_______] cm (auto)│ │  │  │ │       ●       ●           │ │  │
│  │ │ Wt/m:   [_______] kg/m     │ │  │  │ │   ●       ●       ●       │ │  │
│  │ │ [Remove]                    │ │  │  │ │                            │ │  │
│  │ └────────────────────────────┘ │  │  │ │  [Canvas: 2D Top-Down View] │ │  │
│  │ ...                            │  │  │ └────────────────────────────┘ │  │
│  └────────────────────────────────┘  │  │  ┌────────────────────────────┐ │  │
│                                      │  │  │ Legend:                     │ │  │
│  ┌────────────────────────────────┐  │  │  │ ● Pipe 1 (Ø10cm)           │ │  │
│  │ BOXES (Optional)               │  │  │  │ ● Pipe 2 (Ø15cm)           │ │  │
│  │ [+ Add Box]                    │  │  │  │ ● Pipe 3 (Ø20cm)           │ │  │
│  │ ┌────────────────────────────┐ │  │  │  │ ■ Box 1                     │ │  │
│  │ │ Box 1                      │ │  │  │  └────────────────────────────┘ │  │
│  │ │ L: [_____] W: [_____] H:   │ │  │  └────────────────────────────────┘  │
│  │ │     [_____] cm              │ │  │                                      │
│  │ │ [Remove]                    │ │  │                                      │
│  │ └────────────────────────────┘ │  │                                      │
│  └────────────────────────────────┘  │                                      │
│                                      │                                      │
│  ┌────────────────────────────────┐  │                                      │
│  │ CONFIGURATION                  │  │                                      │
│  │ ┌────────────────────────────┐ │  │                                      │
│  │ │ Min Space: [_______] cm    │ │  │                                      │
│  │ │ Allowance:  [_______] cm    │ │  │                                      │
│  │ └────────────────────────────┘ │  │                                      │
│  └────────────────────────────────┘  │                                      │
│                                      │                                      │
│  [CALCULATE]                         │                                      │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### Mobile Layout (Single Column)

```
┌─────────────────────────────┐
│     PIPE CALCULATOR         │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │ VOLUME DIMENSIONS     │  │
│  │ Length:   [_____] cm  │  │
│  │ Width:    [_____] cm  │  │
│  │ Height:   [_____] cm  │  │
│  │ Max Weight:[_____] kg │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ PIPES                 │  │
│  │ [+ Add Pipe]          │  │
│  │ ┌───────────────────┐  │  │
│  │ │ Pipe 1            │  │  │
│  │ │ Ext Ø: [_____] cm │  │  │
│  │ │ Int Ø: [_____] cm │  │  │
│  │ │ Len:   [_____] cm │  │  │
│  │ │ Wall:  [_____] cm │  │  │
│  │ │ Wt/m:  [_____] kg │  │  │
│  │ │ [Remove]          │  │  │
│  │ └───────────────────┘  │  │
│  │ ...                    │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ BOXES (Optional)      │  │
│  │ [+ Add Box]           │  │
│  │ ┌───────────────────┐  │  │
│  │ │ Box 1             │  │  │
│  │ │ L:[_] W:[_] H:[_] │  │  │
│  │ │ [Remove]          │  │  │
│  │ └───────────────────┘  │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ CONFIGURATION         │  │
│  │ Min Space: [_____] cm │  │
│  │ Allowance: [_____] cm │  │
│  └───────────────────────┘  │
│                             │
│  [CALCULATE]                │
│                             │
│  ┌───────────────────────┐  │
│  │ SUMMARY               │  │
│  │ Total Weight: 1250 kg │  │
│  │ Volume Usage: 78%    │  │
│  │ Pipes Count: 15      │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ PIPE RESULTS          │  │
│  │ P1: 5 × 500cm × 250kg│  │
│  │ P2: 3 × 300cm × 180kg│  │
│  │ P3: 7 × 700cm × 320kg│  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ VISUALIZATION         │  │
│  │ ┌───────────────────┐  │  │
│  │ │                   │  │  │
│  │ │   ●   ●   ●       │  │  │
│  │ │       ●           │  │  │
│  │ │   ●       ●       │  │  │
│  │ │                   │  │  │
│  │ └───────────────────┘  │  │
│  │ [Scroll for more]      │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### Component Detail: Pipe Row

```
┌─────────────────────────────────────────────────────────────┐
│ Pipe 1                                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  External Diameter:    [___________] cm                     │
│  Internal Diameter:    [___________] cm                     │
│  Length:              [___________] cm                     │
│  Wall Thickness:      [___________] cm (auto-calculated)    │
│  Weight per Meter:    [___________] kg/m                    │
│                                                             │
│  [Remove Pipe]                                               │
└─────────────────────────────────────────────────────────────┘
```

### Component Detail: Visualization Canvas

```
┌─────────────────────────────────────────────────────────────┐
│ PIPE ARRANGEMENT - TOP DOWN VIEW                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Scale: 1cm = 10px                  [Zoom In] [Zoom Out]    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Volume Boundary (200cm × 150cm)                      │   │
│  │                                                     │   │
│  │    ●──────●                    ●──────●             │   │
│  │   /│      │\                  /│      │\            │   │
│  │  ● │  P1  │ ●               ● │  P1  │ ●           │   │
│  │   │       │                 │       │             │   │
│  │  ● │  P2  │ ●               ● │  P2  │ ●           │   │
│  │   \│      │/                  \│      │/            │   │
│  │    ●──────●                    ●──────●             │   │
│  │                                                     │   │
│  │          ●──────●                                  │   │
│  │         /│      │\                                 │   │
│  │        ● │  P3  │ ●                                │   │
│  │         \│      │/                                 │   │
│  │          ●──────●                                  │   │
│  │                                                     │   │
│  │     ┌─────────────┐                                │   │
│  │     │   Box 1     │                                │   │
│  │     │  50×30×20   │                                │   │
│  │     └─────────────┘                                │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Legend:                                                     │
│  ● Pipe 1 (Ø10cm, L:100cm) - Blue                          │
│  ● Pipe 2 (Ø15cm, L:150cm) - Green                         │
│  ● Pipe 3 (Ø20cm, L:200cm) - Orange                        │
│  ■ Box 1 (50×30×20cm) - Gray                               │
│                                                             │
│  Layer 1 of 3 | Height: 0-50cm                             │
│  [◀ Previous Layer] [Next Layer ▶]                         │
└─────────────────────────────────────────────────────────────┘
```

### Component Detail: Telescoped Pipes Visualization

```
┌─────────────────────────────────────────────────────────────┐
│ TELESCOPED PIPES - CROSS SECTION VIEW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FULL TELESCOPING (Concentric Nesting)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │         Outer Pipe (P1) - Ø20cm, L:200cm           │   │
│  │      ╔═════════════════════════════════╗           │   │
│  │      ║                                   ║           │   │
│  │      ║   Inner Pipe (P2) - Ø15cm, L:150cm  ║           │   │
│  │      ║   ┌───────────────────────┐      ║           │   │
│  │      ║   │                       │      ║           │   │
│  │      ║   │  Inner Pipe (P3)     │      ║           │   │
│  │      ║   │  - Ø10cm, L:100cm    │      ║           │   │
│  │      ║   │                       │      ║           │   │
│  │      ║   └───────────────────────┘      ║           │   │
│  │      ║                                   ║           │   │
│  │      ╚═════════════════════════════════╝           │   │
│  │                                                     │   │
│  │  Effective Dimensions: Ø20cm × L:200cm              │   │
│  │  Total Weight: P1 + P2 + P3                         │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  PARTIAL TELESCOPING (Extended Nesting)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  Outer Pipe (P1) - Ø20cm, L:200cm                    │   │
│  │  ╔═════════════════════════════════╗                │   │
│  │  ║                                   ║                │   │
│  │  ║   Inner Pipe (P2) - Ø15cm, L:300cm ║                │   │
│  │  ║   ┌───────────────────────┐      ║                │   │
│  │  ║   │                       │      ║                │   │
│  │  ║   │  Inner Pipe (P3)     │      ║                │   │
│  │  ║   │  - Ø10cm, L:250cm    │      ║                │   │
│  │  ║   │                       │      ║                │   │
│  │  ╚═══╪═══════════════════════╪══════╝                │   │
│  │      │                       │                        │   │
│  │      │  Extended Section     │                        │   │
│  │      │  (P2 extends 100cm)   │                        │   │
│  │      │                       │                        │   │
│  │      │  ┌───────────────┐    │                        │   │
│  │      │  │ P3 extended   │    │                        │   │
│  │      │  │ (50cm more)   │    │                        │   │
│  │      │  └───────────────┘    │                        │   │
│  │      │                       │                        │   │
│  │  Effective Dimensions: Ø20cm × L:300cm                │   │
│  │  Total Weight: P1 + P2 + P3                         │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  TELESCOPING LEGEND                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  ══════ Outer Pipe boundary                         │   │
│  │  ─────── Inner Pipe boundary                         │   │
│  │  ······· Allowance gap (configurable)               │   │
│  │                                                     │   │
│  │  Full Telescoping:                                   │   │
│  │  - All inner pipes fit completely inside            │   │
│  │  - Only outer pipe length matters for space        │   │
│  │                                                     │   │
│  │  Partial Telescoping:                               │   │
│  │  - Inner pipes extend beyond outer pipe            │   │
│  │  - Maximum length determines space requirement     │   │
│  │  - Maximum diameter determines space requirement   │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Telescoped Pipes in Results Table

```
┌─────────────────────────────────────────────────────────────┐
│ PIPE RESULTS WITH TELESCOPING                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────┬────────┬────────┬────────┬──────────┬──────────┐  │
│  │Type│Quantity│Length  │Weight  │Telescoped│Effective │  │
│  │    │        │        │        │With      │Dimensions│  │
│  ├────┼────────┼────────┼────────┼──────────┼──────────┤  │
│  │P1  │   5    │ 1000cm │ 500kg  │ P2, P3   │Ø20×200cm │  │
│  │P2  │   5    │  750cm │ 375kg  │ P1       │(nested)  │  │
│  │P3  │   5    │  500cm │ 250kg  │ P1, P2   │(nested)  │  │
│  │P4  │   3    │  600cm │ 300kg  │ -        │Ø15×200cm │  │
│  └────┴────────┴────────┴────────┴──────────┴──────────┘  │
│                                                             │
│  Telescoping Type: Full (Concentric)                        │
│  Space Saved: 40% compared to non-telescoped arrangement    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Telescoping Configuration UI

```
┌─────────────────────────────────────────────────────────────┐
│ TELESCOPING CONFIGURATION                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Allowance for Telescoping: [_______] cm                    │
│  (Space between nested pipes for easy removal)              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ TELESCOPING SUGGESTIONS                              │   │
│  │                                                     │   │
│  │  ✓ Pipe 1 (Ø20cm) can telescope with:              │   │
│  │    - Pipe 2 (Ø15cm) - Full telescoping              │   │
│  │    - Pipe 3 (Ø10cm) - Full telescoping              │   │
│  │                                                     │   │
│  │  ✓ Pipe 2 (Ø15cm) can telescope with:              │   │
│  │    - Pipe 3 (Ø10cm) - Full telescoping              │   │
│  │                                                     │   │
│  │  ⚠ Pipe 4 (Ø15cm) cannot telescope (no smaller     │   │
│  │    pipes available)                                │   │
│  │                                                     │   │
│  │  [Apply All Suggestions]  [Clear All Telescoping]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Manual Telescoping Selection:                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Pipe 1 (Ø20cm) telescopes with:                     │   │
│  │ ☑ Pipe 2 (Ø15cm)                                    │   │
│  │ ☑ Pipe 3 (Ø10cm)                                    │   │
│  │ ☐ Pipe 4 (Ø15cm) - Cannot fit (diameter too large) │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Color Scheme Reference

```
Primary Colors:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Primary Blue:     #1976d2  ████████████                    │
│  Secondary Orange: #ff9800  ████████████                    │
│  Success Green:    #4caf50  ████████████                    │
│  Warning Amber:    #ff9800  ████████████                    │
│  Error Red:        #f44336  ████████████                    │
│  Background:       #f5f5f5  ████████████                    │
│  Paper:            #ffffff  ████████████                    │
│                                                             │
│  Pipe Type Colors (for visualization):                      │
│  Pipe 1: #2196f3 (Blue)    ████████████                    │
│  Pipe 2: #4caf50 (Green)   ████████████                    │
│  Pipe 3: #ff9800 (Orange)  ████████████                    │
│  Pipe 4: #9c27b0 (Purple)  ████████████                    │
│  Pipe 5: #f44336 (Red)     ████████████                    │
│  Box:    #607d8b (Gray)    ████████████                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Input Form States

```
┌─────────────────────────────────────────────────────────────┐
│ VALIDATION STATES                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. EMPTY STATE:                                             │
│     ┌───────────────────────────────────────────────────┐   │
│     │ Length: [_______] cm                              │   │
│     └───────────────────────────────────────────────────┘   │
│                                                             │
│  2. VALID STATE:                                             │
│     ┌───────────────────────────────────────────────────┐   │
│     │ Length: [200____] cm                              │   │
│     └───────────────────────────────────────────────────┘   │
│                                                             │
│  3. INVALID STATE:                                          │
│     ┌───────────────────────────────────────────────────┐   │
│     │ Length: [-50____] cm                              │   │
│     │ ⚠ Length must be a positive number               │   │
│     └───────────────────────────────────────────────────┘   │
│                                                             │
│  4. CALCULATED FIELD:                                        │
│     ┌───────────────────────────────────────────────────┐   │
│     │ Wall Thickness: [2.5____] cm (auto-calculated)    │   │
│     └───────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Results Display States

```
┌─────────────────────────────────────────────────────────────┐
│ RESULTS STATES                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. NO RESULTS YET:                                         │
│     ┌───────────────────────────────────────────────────┐   │
│     │                                                     │   │
│     │         Enter inputs and click Calculate          │   │
│     │                                                     │   │
│     └───────────────────────────────────────────────────┘   │
│                                                             │
│  2. CALCULATING:                                            │
│     ┌───────────────────────────────────────────────────┐   │
│     │                                                     │   │
│     │         ⏳ Calculating optimal arrangement...      │   │
│     │                                                     │   │
│     └───────────────────────────────────────────────────┘   │
│                                                             │
│  3. RESULTS SHOWN:                                          │
│     ┌───────────────────────────────────────────────────┐   │
│     │  Total Weight: 1250 kg  Volume Usage: 78%         │   │
│     │                                                     │   │
│     │  ┌────┬────────┬────────┬──────┐                  │   │
│     │  │Type│Quantity│Length  │Weight│                  │   │
│     │  ├────┼────────┼────────┼──────┤                  │   │
│     │  │P1  │   5    │  500cm │ 250kg│                  │   │
│     │  │P2  │   3    │  300cm │ 180kg│                  │   │
│     │  └────┴────────┴────────┴──────┘                  │   │
│     └───────────────────────────────────────────────────┘   │
│                                                             │
│  4. ERROR STATE:                                            │
│     ┌───────────────────────────────────────────────────┐   │
│     │  ❌ Error: Pipes exceed volume capacity          │   │
│     │                                                     │   │
│     │  Please reduce pipe quantities or dimensions      │   │
│     └───────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

```
┌─────────────────────────────────────────────────────────────┐
│ RESPONSIVE BEHAVIOR                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Desktop (≥1200px):                                         │
│  ┌────────────────────┬────────────────────┐                │
│  │                    │                    │                │
│  │   Inputs Column    │   Results Column   │                │
│  │   (50% width)      │   (50% width)      │                │
│  │                    │                    │                │
│  └────────────────────┴────────────────────┘                │
│                                                             │
│  Tablet (768px - 1199px):                                  │
│  ┌──────────────────────────────────────────────┐           │
│  │                                              │           │
│  │           Inputs (60% width)                │           │
│  │                                              │           │
│  └──────────────────────────────────────────────┘           │
│  ┌──────────────────────────────────────────────┐           │
│  │                                              │           │
│  │          Results (60% width)                │           │
│  │                                              │           │
│  └──────────────────────────────────────────────┘           │
│                                                             │
│  Mobile (<768px):                                            │
│  ┌──────────────────────────────────────────────┐           │
│  │                                              │           │
│  │              Inputs (100% width)             │           │
│  │                                              │           │
│  └──────────────────────────────────────────────┘           │
│  ┌──────────────────────────────────────────────┐           │
│  │                                              │           │
│  │             Results (100% width)             │           │
│  │                                              │           │
│  └──────────────────────────────────────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
