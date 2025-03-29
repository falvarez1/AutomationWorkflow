# AutomationWorkflow Comprehensive Refactoring Plan

## Overview

This document outlines an expanded refactoring plan for the `AutomationWorkflow.jsx` component to improve its architecture, maintainability, and scalability. We'll move beyond just utility functions to address several other aspects of the component that could benefit from better organization.

## Current Issues

The `AutomationWorkflow.jsx` file has grown to over 1400 lines of code and includes:

1. Multiple utility functions that don't directly relate to the component's core responsibilities
2. Numerous event handlers that could be better organized
3. Node creation and management functions that could be extracted
4. Backend service integration code mixed with UI logic
5. Complex rendering logic that could be better structured

## Expanded Refactoring Approach

We'll break down the refactoring into several focused areas:

### 1. Utility Functions (Previously Identified)

Move these to appropriate utility files:
- `generateUniqueId` (line 544)
- `animateCanvasPan` (lines 444-474)
- `ensureElementVisibility` (lines 477-537)

### 2. Node Management Functions

Extract these to a new `NodeUtils.js` file:
- `getDefaultTitle` (lines 547-562)
- `getDefaultSubtitle` (lines 564-579)
- `createNewNode` (lines 582-599)

### 3. Event Handlers

Split event handlers into logical groups:

#### Canvas Event Handlers (new `CanvasEventHandlers.js`)
- `handleCanvasMouseDown` (lines 242-263)
- `handleZoom` (lines 419-436)
- `resetView` (lines 439-441)

#### Node Event Handlers (new `NodeEventHandlers.js`)
- `handleNodeHeightChange` (lines 189-205)
- `handleStepClick` (lines 705-772)
- `handleNodeDrag` (lines 775-803)
- `handleNodeDragStart` (lines 806-812)
- `handleNodeDragEnd` (lines 815-858)
- `handleUpdateNodeProperty` (lines 861-882)

#### Menu Event Handlers (new `MenuEventHandlers.js`)
- `handleCloseMenu` (lines 153-155)
- `handleShowMenu` (lines 885-908)
- `handleShowAddMenu` (lines 911-913)
- `handleShowBranchEndpointMenu` (lines 915-917)
- `handleShowBranchEdgeMenu` (lines 919-921)

#### Workflow Event Handlers (new `WorkflowEventHandlers.js`)
- `handleAddStep` (lines 602-656)
- `handleDeleteNode` (lines 687-702)
- `handleUndo` (lines 678-680)
- `handleRedo` (lines 682-684)

### 4. Backend Service Integration

Move backend integration to a new `workflowServiceIntegration.js` file:
- `loadWorkflowFromBackend` (lines 1041-1065)
- `saveWorkflowToBackend` (lines 1068-1099)
- `executeWorkflow` (lines 1107-1136)
- `handleShowExecuteDialog` (lines 1102-1104)

### 5. State Management

Create a more structured approach to state management using custom hooks:

#### Canvas State Hook (new `useCanvasState.js`)
```javascript
export function useCanvasState(initialScale = 0.8) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: initialScale });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPos, setStartPanPos] = useState({ x: 0, y: 0 });
  const transformRef = useRef(transform);
  
  // Update transform ref when transform changes
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);
  
  return {
    transform,
    setTransform,
    isPanning,
    setIsPanning,
    startPanPos,
    setStartPanPos,
    transformRef
  };
}
```

#### Workflow State Hook (new `useWorkflowState.js`)
```javascript
export function useWorkflowState(initialWorkflowSteps) {
  const [workflowGraph, setWorkflowGraph] = useState(() => 
    Graph.fromWorkflowSteps(initialWorkflowSteps)
  );
  
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [menuState, setMenuState] = useState({
    activeNodeId: null,
    activeBranch: null,
    position: null,
    menuType: null
  });
  
  // Derived state
  const workflowSteps = useMemo(() => {
    return workflowGraph.getAllNodes();
  }, [workflowGraph]);
  
  const selectedNode = useMemo(() => {
    return selectedNodeId ? workflowGraph.getNode(selectedNodeId) : null;
  }, [workflowGraph, selectedNodeId]);
  
  return {
    workflowGraph,
    setWorkflowGraph,
    workflowSteps,
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    menuState,
    setMenuState
  };
}
```

## Detailed Implementation Plan

### 1. Utility Functions Refactoring (As previously outlined)

#### Create `GeneralUtils.js`
```javascript
/**
 * Generates a unique ID combining timestamp and random string
 * @returns {string} Unique identifier
 */
export const generateUniqueId = () => 
  `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
```

#### Update `AnimationManager.js`
```javascript
// Add animateCanvasPan function and method to the AnimationManager
```

#### Update `positionUtils.js`
```javascript
// Add ensureElementVisibility function
```

### 2. Node Management Functions

#### Create `src/components/AutomationWorkflow/utils/NodeUtils.js`
```javascript
import { NODE_TYPES } from '../constants';
import { generateUniqueId } from './GeneralUtils';
import { LAYOUT } from '../constants';

/**
 * Get default title for a node based on its type
 * 
 * @param {string} nodeType - Type of the node
 * @returns {string} Default title
 */
export const getDefaultTitle = (nodeType) => {
  switch (nodeType) {
    case NODE_TYPES.TRIGGER:
      return 'New Trigger';
    case NODE_TYPES.CONTROL:
      return 'New Control';
    case NODE_TYPES.ACTION:
      return 'New Action';
    case NODE_TYPES.IFELSE:
      return 'New If/Else';
    case NODE_TYPES.SPLITFLOW:
      return 'New Split Flow';
    default:
      return 'New Step';
  }
};

/**
 * Get default subtitle for a node based on its type
 * 
 * @param {string} nodeType - Type of the node
 * @returns {string} Default subtitle
 */
export const getDefaultSubtitle = (nodeType) => {
  switch (nodeType) {
    case NODE_TYPES.TRIGGER:
      return 'Configure this trigger';
    case NODE_TYPES.CONTROL:
      return 'Configure this control';
    case NODE_TYPES.ACTION:
      return 'Configure this action';
    case NODE_TYPES.IFELSE:
      return 'Configure condition';
    case NODE_TYPES.SPLITFLOW:
      return 'Configure split conditions';
    default:
      return 'Configure properties';
  }
};

/**
 * Create a new node with the specified properties
 * 
 * @param {string} nodeType - Type of node to create
 * @param {Object} position - Position {x, y} for the new node
 * @param {Object} pluginRegistry - Plugin registry for looking up node type metadata
 * @param {Object} overrides - Optional property overrides
 * @returns {Object} New node object
 */
export const createNewNode = (nodeType, position, pluginRegistry, overrides = {}) => {
  // Get any initial properties from the node plugin
  const nodePlugin = pluginRegistry.getNodeType(nodeType);
  const initialProps = nodePlugin.getInitialProperties ? nodePlugin.getInitialProperties() : {};
  
  return {
    id: generateUniqueId(),
    type: nodeType,
    position,
    height: LAYOUT.NODE.DEFAULT_HEIGHT,
    isNew: true,
    contextMenuConfig: { position: 'right', offsetX: -5, offsetY: 0, orientation: 'vertical' },
    title: getDefaultTitle(nodeType),
    subtitle: getDefaultSubtitle(nodeType),
    ...initialProps,
    ...overrides
  };
};
```

### 3. Event Handlers

#### Create `src/components/AutomationWorkflow/handlers/CanvasEventHandlers.js`

This file will contain all the event handlers related to canvas operations:
- `handleCanvasMouseDown`
- `handleZoom`
- `resetView`

#### Create `src/components/AutomationWorkflow/handlers/NodeEventHandlers.js`

This file will contain all the event handlers related to node operations:
- `handleNodeHeightChange`
- `handleStepClick`
- `handleNodeDrag`
- `handleNodeDragStart`
- `handleNodeDragEnd`
- `handleUpdateNodeProperty`

#### Create `src/components/AutomationWorkflow/handlers/MenuEventHandlers.js`

This file will contain all the event handlers related to menu operations:
- `handleCloseMenu`
- `handleShowMenu`
- `handleShowAddMenu`
- `handleShowBranchEndpointMenu`
- `handleShowBranchEdgeMenu`

#### Create `src/components/AutomationWorkflow/handlers/WorkflowEventHandlers.js`

This file will contain all the event handlers related to workflow operations:
- `handleAddStep`
- `handleDeleteNode`
- `handleUndo`
- `handleRedo`

### 4. Backend Service Integration

#### Create `src/components/AutomationWorkflow/services/workflowServiceIntegration.js`

```javascript
import { workflowService } from '../../../services/workflowService';
import { Graph } from '../graph/Graph';

/**
 * Load workflow from backend
 * 
 * @param {string} id - Workflow ID
 * @param {Function} setWorkflowGraph - State setter for workflow graph
 * @param {Function} setWorkflowMetadata - State setter for workflow metadata
 * @param {Function} setIsLoading - State setter for loading indicator
 * @returns {Promise} Promise that resolves when workflow is loaded
 */
export const loadWorkflowFromBackend = async (
  id,
  setWorkflowGraph,
  setWorkflowMetadata,
  setIsLoading
) => {
  try {
    setIsLoading(true);
    const workflow = await workflowService.getWorkflow(id);
    
    // Update workflow metadata
    setWorkflowMetadata({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      lastModified: workflow.lastModified,
      status: workflow.status
    });
    
    // Convert backend workflow to graph
    if (workflow.steps && workflow.steps.length > 0) {
      setWorkflowGraph(Graph.fromWorkflowSteps(workflow.steps));
    }
    
    return workflow;
  } catch (error) {
    console.error('Failed to load workflow:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

/**
 * Save workflow to backend
 * 
 * @param {Object} workflowGraph - Current workflow graph
 * @param {Object} workflowMetadata - Current workflow metadata
 * @param {Function} setWorkflowMetadata - State setter for workflow metadata
 * @param {Function} setIsLoading - State setter for loading indicator
 * @returns {Promise} Promise that resolves with saved workflow
 */
export const saveWorkflowToBackend = async (
  workflowGraph,
  workflowMetadata,
  setWorkflowMetadata,
  setIsLoading
) => {
  try {
    setIsLoading(true);
    
    // Convert graph to backend workflow format
    const workflow = {
      id: workflowMetadata.id,
      name: workflowMetadata.name,
      description: workflowMetadata.description,
      steps: workflowGraph.toWorkflowSteps()
    };
    
    const savedWorkflow = await workflowService.saveWorkflow(workflow);
    
    // Update local state with saved data
    setWorkflowMetadata(prev => ({
      ...prev,
      id: savedWorkflow.id,
      lastModified: savedWorkflow.lastModified
    }));
    
    return savedWorkflow;
  } catch (error) {
    console.error('Failed to save workflow:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

/**
 * Execute workflow
 * 
 * @param {Object} workflowGraph - Current workflow graph
 * @param {Object} workflowMetadata - Current workflow metadata
 * @param {Object} inputs - Workflow input values
 * @param {Function} setExecutionStatus - State setter for execution status
 * @param {Function} setActiveTab - State setter for active tab
 * @param {Function} setIsLoading - State setter for loading indicator
 * @returns {Promise} Promise that resolves when execution starts
 */
export const executeWorkflow = async (
  workflowGraph,
  workflowMetadata,
  inputs,
  setExecutionStatus,
  setActiveTab,
  setIsLoading
) => {
  try {
    setIsLoading(true);
    
    let workflowId = workflowMetadata.id;
    
    if (!workflowId) {
      // Save workflow first if it doesn't have an ID
      const savedWorkflow = await saveWorkflowToBackend(
        workflowGraph,
        workflowMetadata,
        () => {}, // No-op since we don't need to update metadata here
        setIsLoading
      );
      workflowId = savedWorkflow.id;
    }
    
    await workflowService.executeWorkflow(workflowId, inputs);
    
    // Update local execution status
    setExecutionStatus({
      isExecuting: true,
      currentNodeId: null,
      progress: 0,
      startTime: new Date(),
      errors: []
    });
    
    // Switch to execution tab to show progress
    setActiveTab('execution');
  } catch (error) {
    console.error('Failed to execute workflow:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};
```

### 5. Custom Hooks for State Management

#### Create `src/components/AutomationWorkflow/hooks/useCanvasState.js`

```javascript
import { useState, useRef, useEffect } from 'react';

/**
 * Hook for managing canvas state (panning, zooming, etc.)
 * 
 * @param {number} initialScale - Initial zoom scale
 * @returns {Object} Canvas state and setters
 */
export function useCanvasState(initialScale = 0.8) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: initialScale });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPos, setStartPanPos] = useState({ x: 0, y: 0 });
  const transformRef = useRef(transform);
  
  // Update transform ref when transform changes
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);
  
  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };
  
  return {
    transform,
    setTransform,
    isPanning,
    setIsPanning,
    startPanPos,
    setStartPanPos,
    transformRef,
    resetView
  };
}
```

#### Create `src/components/AutomationWorkflow/hooks/useWorkflowState.js`

```javascript
import { useState, useMemo, useCallback } from 'react';
import { Graph } from '../graph/Graph';
import { commandManager } from '../commands';

/**
 * Hook for managing workflow state
 * 
 * @param {Array} initialWorkflowSteps - Initial workflow steps
 * @returns {Object} Workflow state and setters
 */
export function useWorkflowState(initialWorkflowSteps) {
  const [workflowGraph, setWorkflowGraph] = useState(() => 
    Graph.fromWorkflowSteps(initialWorkflowSteps)
  );
  
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [dragStartPosition, setDragStartPosition] = useState(null);
  const [menuState, setMenuState] = useState({
    activeNodeId: null,
    activeBranch: null,
    position: null,
    menuType: null
  });
  
  // Undo/redo state
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  // Derived state
  const workflowSteps = useMemo(() => {
    return workflowGraph.getAllNodes();
  }, [workflowGraph]);
  
  const selectedNode = useMemo(() => {
    return selectedNodeId ? workflowGraph.getNode(selectedNodeId) : null;
  }, [workflowGraph, selectedNodeId]);
  
  // Menu handlers
  const handleCloseMenu = useCallback(() => {
    setMenuState({ activeNodeId: null, activeBranch: null, position: null, menuType: null });
  }, []);
  
  return {
    workflowGraph,
    setWorkflowGraph,
    workflowSteps,
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    menuState,
    setMenuState,
    handleCloseMenu,
    dragStartPosition,
    setDragStartPosition,
    canUndo,
    setCanUndo,
    canRedo,
    setCanRedo
  };
}
```

## Updated AutomationWorkflow.jsx Structure

After these refactorings, the main component will be significantly simpler:

```javascript
import React, { useEffect } from 'react';
// Import lucide icons, graph, commands, utils, plugins, etc.

// Import custom hooks
import { useCanvasState } from './hooks/useCanvasState';
import { useWorkflowState } from './hooks/useWorkflowState';

// Import handlers
import { 
  handleCanvasMouseDown, 
  handleZoom 
} from './handlers/CanvasEventHandlers';
import { 
  handleNodeHeightChange, 
  handleStepClick,
  handleNodeDrag,
  handleNodeDragStart,
  handleNodeDragEnd,
  handleUpdateNodeProperty
} from './handlers/NodeEventHandlers';
import {
  handleShowMenu,
  handleShowAddMenu,
  handleShowBranchEndpointMenu,
  handleShowBranchEdgeMenu
} from './handlers/MenuEventHandlers';
import {
  handleAddStep,
  handleDeleteNode,
  handleUndo,
  handleRedo
} from './handlers/WorkflowEventHandlers';

// Import backend service integration
import {
  loadWorkflowFromBackend,
  saveWorkflowToBackend,
  executeWorkflow
} from './services/workflowServiceIntegration';

// Import constants, components, etc.

const AutomationWorkflow = ({ 
  initialWorkflowSteps = INITIAL_WORKFLOW_STEPS,
  workflowId = null,
  gridOptions = {}, 
  nodePlacementOptions = {},
  readonly = false,
  onExecutionStatusChange = null
}) => {
  // Use custom hooks for state management
  const canvasState = useCanvasState(0.8);
  const workflowState = useWorkflowState(initialWorkflowSteps);
  
  // Additional state
  const [activeTab, setActiveTab] = useState('flow');
  const [snapToGrid, setSnapToGrid] = useState(
    gridOptions.snapToGrid !== undefined ? gridOptions.snapToGrid : SNAP_TO_GRID
  );
  
  // Extract values from canvasState
  const { 
    transform, 
    setTransform, 
    isPanning, 
    setIsPanning,
    startPanPos,
    setStartPanPos,
    transformRef,
    resetView
  } = canvasState;
  
  // Extract values from workflowState
  const {
    workflowGraph,
    setWorkflowGraph,
    workflowSteps,
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    menuState,
    setMenuState,
    handleCloseMenu,
    dragStartPosition,
    setDragStartPosition,
    canUndo,
    setCanUndo,
    canRedo,
    setCanRedo
  } = workflowState;
  
  // Rest of the component
  // ...
  
  return (
    // The JSX remains largely the same, but with simplified function calls
    // ...
  );
};

export default AutomationWorkflow;
```

## Implementation Strategy

To implement this comprehensive refactoring:

1. Start with the utility functions (original plan)
2. Implement the Node Management utilities
3. Create the custom hooks for state management
4. Implement the event handler modules
5. Create the backend service integration module
6. Update the main component to use all the new modules

I recommend switching to Code mode for execution of this refactoring plan.

## Benefits of This Approach

1. **Drastically Reduced Component Size**: The main component will be reduced from 1400+ lines to likely under 500 lines.

2. **Improved Separation of Concerns**: Each functional area will be in its own module.

3. **Better Reusability**: These functions can now be easily used by other components.

4. **Improved Testability**: Isolated functions are much easier to test independently.

5. **Enhanced Maintainability**: Smaller, more focused files are easier to understand and maintain.

6. **Easier Onboarding**: New developers can understand the system more easily with this clear separation of concerns.

7. **Better Scalability**: Adding new features becomes easier when the codebase is well-organized.