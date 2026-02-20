/**
 * Calculator Context
 * Global state management for the Pipe Calculator
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { DEFAULT_CONFIG, DEFAULT_VOLUME } from '../constants/defaults.js';
import { validateInputs, hasErrors } from '../utils/validation.js';
import { optimizeArrangement } from '../utils/optimization.js';
import { calculateResults } from '../utils/calculations.js';

// Initial state
const initialState = {
  volume: { ...DEFAULT_VOLUME },
  pipes: [],
  boxes: [],
  config: { ...DEFAULT_CONFIG },
  results: null,
  arrangement: null,
  errors: {},
  isValid: false,
  isCalculating: false
};

// Action types
const ACTIONS = {
  UPDATE_VOLUME: 'UPDATE_VOLUME',
  ADD_PIPE: 'ADD_PIPE',
  UPDATE_PIPE: 'UPDATE_PIPE',
  REMOVE_PIPE: 'REMOVE_PIPE',
  ADD_BOX: 'ADD_BOX',
  UPDATE_BOX: 'UPDATE_BOX',
  REMOVE_BOX: 'REMOVE_BOX',
  UPDATE_CONFIG: 'UPDATE_CONFIG',
  CALCULATE: 'CALCULATE',
  CLEAR_RESULTS: 'CLEAR_RESULTS',
  SET_ERRORS: 'SET_ERRORS',
  SET_CALCULATING: 'SET_CALCULATING',
  RESET: 'RESET'
};

// Reducer
function calculatorReducer(state, action) {
  switch (action.type) {
    case ACTIONS.UPDATE_VOLUME:
      return {
        ...state,
        volume: { ...state.volume, ...action.payload },
        results: null,
        arrangement: null
      };

    case ACTIONS.ADD_PIPE:
      const newPipe = {
        id: `pipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        externalDiameter: 0,
        internalDiameter: 0,
        standardLength: 0,      // Single pipe length in cm (e.g., 600 for 6m)
        quantityInMeters: 0,    // Total length required in meters
        wallThickness: 0,
        weightPerMeter: 0,
        // Legacy fields for compatibility
        length: 0,
        telescopedWith: [],
        telescopingType: 'none',
        effectiveDiameter: 0,
        effectiveLength: 0
      };
      return {
        ...state,
        pipes: [...state.pipes, newPipe],
        results: null,
        arrangement: null
      };

    case ACTIONS.UPDATE_PIPE:
      return {
        ...state,
        pipes: state.pipes.map(pipe =>
          pipe.id === action.payload.id
            ? { ...pipe, ...action.payload.updates }
            : pipe
        ),
        results: null,
        arrangement: null
      };

    case ACTIONS.REMOVE_PIPE:
      return {
        ...state,
        pipes: state.pipes.filter(pipe => pipe.id !== action.payload.id),
        results: null,
        arrangement: null
      };

    case ACTIONS.ADD_BOX:
      const newBox = {
        id: `box-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        length: 0,
        width: 0,
        height: 0
      };
      return {
        ...state,
        boxes: [...state.boxes, newBox],
        results: null,
        arrangement: null
      };

    case ACTIONS.UPDATE_BOX:
      return {
        ...state,
        boxes: state.boxes.map(box =>
          box.id === action.payload.id
            ? { ...box, ...action.payload.updates }
            : box
        ),
        results: null,
        arrangement: null
      };

    case ACTIONS.REMOVE_BOX:
      return {
        ...state,
        boxes: state.boxes.filter(box => box.id !== action.payload.id),
        results: null,
        arrangement: null
      };

    case ACTIONS.UPDATE_CONFIG:
      return {
        ...state,
        config: { ...state.config, ...action.payload },
        results: null,
        arrangement: null
      };

    case ACTIONS.CALCULATE:
      return {
        ...state,
        results: action.payload.results,
        arrangement: action.payload.arrangement
      };

    case ACTIONS.CLEAR_RESULTS:
      return {
        ...state,
        results: null,
        arrangement: null
      };

    case ACTIONS.SET_ERRORS:
      return {
        ...state,
        errors: action.payload,
        isValid: !hasErrors(action.payload)
      };

    case ACTIONS.SET_CALCULATING:
      return {
        ...state,
        isCalculating: action.payload
      };

    case ACTIONS.RESET:
      return {
        ...initialState,
        config: { ...DEFAULT_CONFIG }
      };

    default:
      return state;
  }
}

// Create context
const CalculatorContext = createContext(null);

// Provider component
export function CalculatorProvider({ children }) {
  const [state, dispatch] = useReducer(calculatorReducer, initialState);

  // Auto-validate when state changes
  useEffect(() => {
    const errors = validateInputs(state.volume, state.pipes, state.boxes, state.config);
    dispatch({ type: ACTIONS.SET_ERRORS, payload: errors });
  }, [state.volume, state.pipes, state.boxes, state.config]);

  // Update volume
  const updateVolume = useCallback((volume) => {
    dispatch({ type: ACTIONS.UPDATE_VOLUME, payload: volume });
  }, []);

  // Add pipe
  const addPipe = useCallback(() => {
    dispatch({ type: ACTIONS.ADD_PIPE });
  }, []);

  // Update pipe
  const updatePipe = useCallback((id, updates) => {
    dispatch({ type: ACTIONS.UPDATE_PIPE, payload: { id, updates } });
  }, []);

  // Remove pipe
  const removePipe = useCallback((id) => {
    dispatch({ type: ACTIONS.REMOVE_PIPE, payload: { id } });
  }, []);

  // Add box
  const addBox = useCallback(() => {
    dispatch({ type: ACTIONS.ADD_BOX });
  }, []);

  // Update box
  const updateBox = useCallback((id, updates) => {
    dispatch({ type: ACTIONS.UPDATE_BOX, payload: { id, updates } });
  }, []);

  // Remove box
  const removeBox = useCallback((id) => {
    dispatch({ type: ACTIONS.REMOVE_BOX, payload: { id } });
  }, []);

  // Update config
  const updateConfig = useCallback((config) => {
    dispatch({ type: ACTIONS.UPDATE_CONFIG, payload: config });
  }, []);

  // Validate inputs
  const validate = useCallback(() => {
    const errors = validateInputs(state.volume, state.pipes, state.boxes, state.config);
    dispatch({ type: ACTIONS.SET_ERRORS, payload: errors });
    return !hasErrors(errors);
  }, [state.volume, state.pipes, state.boxes, state.config]);

  // Calculate results
  const calculate = useCallback(async () => {
    const isValid = validate();
    if (!isValid) {
      return false;
    }

    dispatch({ type: ACTIONS.SET_CALCULATING, payload: true });

    try {
      // Simulate async calculation (for UI feedback)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Optimize arrangement - now handles nesting internally
      // Pass allowance to optimization so it can determine nesting
      const arrangement = optimizeArrangement(
        state.volume,
        state.pipes,
        state.boxes,
        state.config.minSpace,
        state.config.allowance
      );

      // Calculate results from the arrangement
      const results = calculateResults(
        arrangement,
        state.pipes,
        state.boxes,
        state.volume,
        state.config
      );

      dispatch({
        type: ACTIONS.CALCULATE,
        payload: { results, arrangement }
      });

      return true;
    } catch (error) {
      console.error('Calculation error:', error);
      return false;
    } finally {
      dispatch({ type: ACTIONS.SET_CALCULATING, payload: false });
    }
  }, [state.volume, state.pipes, state.boxes, state.config, validate]);

  // Clear results
  const clearResults = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_RESULTS });
  }, []);

  // Reset calculator
  const reset = useCallback(() => {
    dispatch({ type: ACTIONS.RESET });
  }, []);

  const value = {
    ...state,
    updateVolume,
    addPipe,
    updatePipe,
    removePipe,
    addBox,
    updateBox,
    removeBox,
    updateConfig,
    validate,
    calculate,
    clearResults,
    reset
  };

  return (
    <CalculatorContext.Provider value={value}>
      {children}
    </CalculatorContext.Provider>
  );
}

// Custom hook to use the context
export function useCalculator() {
  const context = useContext(CalculatorContext);
  if (!context) {
    throw new Error('useCalculator must be used within a CalculatorProvider');
  }
  return context;
}
