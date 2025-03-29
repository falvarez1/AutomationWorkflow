# AutomationWorkflow Main Component Refactoring

The final step in our comprehensive refactoring plan is to update the main AutomationWorkflow.jsx component to use all the extracted modules. Below is the planned structure for the refactored component.

## Imports

```javascript
import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  RotateCw,
  Grid
} from 'lucide-react';

// Import Graph and command pattern components
import { Graph } from './components/AutomationWorkflow/graph/Graph';
import { commandManager } from './components/AutomationWorkflow/commands';

// Import utility modules
import { BranchUtils } from './components/AutomationWorkflow/utils/BranchUtils';
import { animationManager } from './components/AutomationWorkflow/utils/AnimationManager';

// Import the plugin registry and plugins
import { pluginRegistry } from './components/AutomationWorkflow/plugins/registry';
import { TriggerNodePlugin } from './components/AutomationWorkflow/plugins/TriggerNodePlugin';
import { ControlNodePlugin } from './components/AutomationWorkflow/plugins/ControlNodePlugin';
import { ActionNodePlugin } from './components/AutomationWorkflow/plugins/ActionNodePlugin';
import { IfElseNodePlugin } from './components/AutomationWorkflow/plugins/IfElseNodePlugin';
import { SplitFlowNodePlugin } from './components/AutomationWorkflow/plugins/SplitFlowNodePlugin';

// Import UI components
import WorkflowStep from './components/AutomationWorkflow/ui/WorkflowStep';
import ConnectionRenderer from './components/AutomationWorkflow/components/ConnectionRenderer';
import AddNodeButtonRenderer from './components/AutomationWorkflow/components/AddNodeButtonRenderer';
import WorkflowMenuManager from './components/AutomationWorkflow/components/WorkflowMenuManager';
import { NodePropertiesPanel } from './components/AutomationWorkflow/NodeProperties';
import ExecuteWorkflowDialog from './components/AutomationWorkflow/components/ExecuteWorkflowDialog';

// Import constants
import {
  LAYOUT,
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  GRID_SIZE,
  ZOOM_MIN,
  ZOOM_MAX,
  BUTTON_SIZE,
  EDGE_INPUT_Y_OFFSET,
  EDGE_OUTPUT_Y_OFFSET,
  BUTTON_Y_OFFSET,
  NODE_TYPES,
  CONNECTION_TYPES,
  INITIAL_WORKFLOW_STEPS,
  BRANCH_EDGE_COLORS,
  SHOW_GRID,
  GRID_COLOR,
  GRID_DOT_SIZE,
  SNAP_TO_GRID,
  STANDARD_VERTICAL_SPACING,
  BRANCH_VERTICAL_SPACING,
  BRANCH_LEFT_OFFSET,
  BRANCH_RIGHT_OFFSET,
  MENU_PLACEMENT,
  MOUSE_CONTROLS
} from './components/AutomationWorkflow/constants';

// Import custom hooks
import { useCanvasState } from './components/AutomationWorkflow/hooks/useCanvasState';
import { useWorkflowState } from './components/AutomationWorkflow/hooks/useWorkflowState';

// Import event handlers
import { 
  handleCanvasMouseDown,
  handleWheel,
  handleMouseMove,
  handleMouseUp
} from './components/AutomationWorkflow/handlers/CanvasEventHandlers';

import {
  handleNodeHeightChange,
  handleStepClick,
  handleNodeDrag,
  handleNodeDragStart,
  handleNodeDragEnd,
  handleUpdateNodeProperty,
  handleDeleteNode
} from './components/AutomationWorkflow/handlers/NodeEventHandlers';

import {
  handleCloseMenu,
  handleShowMenu,
  handleShowAddMenu,
  handleShowBranchEndpointMenu,
  handleShowBranchEdgeMenu,
  setupMenuCloseHandlers
} from './components/AutomationWorkflow/handlers/MenuEventHandlers';

import {
  handleAddStep,
  handleUndo,
  handleRedo
} from './components/AutomationWorkflow/handlers/WorkflowEventHandlers';

// Import backend service integration
import {
  initWorkflowService,
  loadWorkflowFromBackend, 
  saveWorkflowToBackend,
  executeWorkflow,
  getWorkflowInputSchema
} from './components/AutomationWorkflow/services/workflowServiceIntegration';

// Register node types (keep this part outside the component)
pluginRegistry.registerNodeType(TriggerNodePlugin);
pluginRegistry.registerNodeType(ControlNodePlugin);
pluginRegistry.registerNodeType(ActionNodePlugin);
pluginRegistry.registerNodeType(IfElseNodePlugin);
pluginRegistry.registerNodeType(SplitFlowNodePlugin);
```

## Component Structure

```javascript
// Main Automation Workflow Component
const AutomationWorkflow = ({ 
  initialWorkflowSteps = INITIAL_WORKFLOW_STEPS,
  workflowId = null,
  gridOptions = {}, 
  nodePlacementOptions = {},
  readonly = false,
  onExecutionStatusChange = null
}) => {
  // Use custom hooks for state management
  const canvasRef = useRef(null);
  const justClickedNodeRef = useRef(false);
  const mouseDownPosRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Use custom hooks for state management
  const canvasState = useCanvasState(0.8);
  const workflowState = useWorkflowState(initialWorkflowSteps);
  
  // Extract values from canvasState
  const { 
    transform, 
    setTransform, 
    isPanning, 
    setIsPanning,
    startPanPos,
    setStartPanPos,
    transformRef,
    resetView,
    handleZoom
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
    handleCloseMenu: closeMenu,
    dragStartPosition,
    setDragStartPosition,
    canUndo,
    canRedo,
    handleUndo: undoAction,
    handleRedo: redoAction
  } = workflowState;

  // Additional state
  const [activeTab, setActiveTab] = useState('flow');
  const [showExecuteDialog, setShowExecuteDialog] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const [animatingNodes, setAnimatingNodes] = useState([]);
  
  // Get grid settings with defaults from constants
  const showGrid = gridOptions.showGrid !== undefined ? gridOptions.showGrid : SHOW_GRID;
  const gridDotSize = gridOptions.gridDotSize || GRID_DOT_SIZE;
  let scaledGridDotSize = gridDotSize * transform.scale;
  const gridColor = gridOptions.gridColor || GRID_COLOR;
  const [snapToGrid, setSnapToGrid] = useState(
    gridOptions.snapToGrid !== undefined ? gridOptions.snapToGrid : SNAP_TO_GRID
  );

  // Get node placement settings with defaults from constants
  const standardVerticalSpacing = nodePlacementOptions.standardVerticalSpacing || STANDARD_VERTICAL_SPACING;
  const branchVerticalSpacing = nodePlacementOptions.branchVerticalSpacing || BRANCH_VERTICAL_SPACING;
  const branchLeftOffset = nodePlacementOptions.branchLeftOffset || BRANCH_LEFT_OFFSET;
  const branchRightOffset = nodePlacementOptions.branchRightOffset || BRANCH_RIGHT_OFFSET;

  // Configurable offsets
  const [buttonYOffset] = useState(BUTTON_Y_OFFSET);
  const [edgeInputYOffset] = useState(EDGE_INPUT_Y_OFFSET);
  const [edgeOutputYOffset] = useState(EDGE_OUTPUT_Y_OFFSET);
  
  // Add state for workflow metadata and execution status
  const [workflowMetadata, setWorkflowMetadata] = useState({
    id: workflowId,
    name: 'New Workflow',
    description: '',
    lastModified: null,
    status: 'draft'
  });
  
  const [executionStatus, setExecutionStatus] = useState({
    isExecuting: false,
    currentNodeId: null,
    progress: 0,
    startTime: null,
    errors: []
  });

  // Handler functions that use the extracted utility modules
  const handleCanvasMouseDownEvent = (e) => {
    handleCanvasMouseDown(e, canvasState, {
      mouseDownPosRef,
      isDraggingRef,
      justClickedNodeRef
    });
  };

  const handleWheelEvent = (e) => {
    handleWheel(e, canvasState, canvasRef);
  };

  const handleStepClickEvent = (id, action) => {
    handleStepClick(
      id,
      action,
      workflowGraph,
      setWorkflowGraph,
      setSelectedNodeId,
      transform,
      setTransform,
      { justClickedNodeRef },
      handleDeleteNodeEvent,
      commandManager,
      generateUniqueId
    );
  };

  const handleNodeDragEvent = (id, x, y) => {
    handleNodeDrag(id, x, y, snapToGrid, workflowGraph, setWorkflowGraph);
  };

  const handleNodeDragStartEvent = (id, position) => {
    handleNodeDragStart(id, position, setDragStartPosition, closeMenu);
  };

  const handleNodeDragEndEvent = (id) => {
    handleNodeDragEnd(
      id,
      dragStartPosition,
      workflowGraph,
      setWorkflowGraph,
      setDragStartPosition,
      commandManager
    );
  };

  const handleDeleteNodeEvent = (nodeId) => {
    handleDeleteNode(
      nodeId,
      workflowGraph,
      setWorkflowGraph,
      selectedNodeId,
      setSelectedNodeId,
      commandManager
    );
  };

  const handleUpdateNodePropertyEvent = (nodeId, propertyId, value) => {
    handleUpdateNodeProperty(
      nodeId,
      propertyId,
      value,
      workflowGraph,
      setWorkflowGraph,
      commandManager
    );
  };

  const handleCloseMenuEvent = () => {
    handleCloseMenu(setMenuState);
  };

  const handleShowMenuEvent = (nodeId, menuType, branchId, e, buttonRect) => {
    handleShowMenu(
      nodeId,
      menuType,
      branchId,
      e,
      buttonRect,
      workflowGraph,
      setMenuState
    );
  };

  const handleShowAddMenuEvent = (nodeId, e, buttonRect) => {
    handleShowAddMenu(nodeId, e, buttonRect, workflowGraph, setMenuState);
  };

  const handleShowBranchEndpointMenuEvent = (nodeId, branchId, e, buttonRect) => {
    handleShowBranchEndpointMenu(nodeId, branchId, e, buttonRect, workflowGraph, setMenuState);
  };

  const handleShowBranchEdgeMenuEvent = (nodeId, branchId, e, buttonRect) => {
    handleShowBranchEdgeMenu(nodeId, branchId, e, buttonRect, workflowGraph, setMenuState);
  };

  const handleAddStepEvent = (nodeId, nodeType, connectionType = CONNECTION_TYPES.DEFAULT, branchId = null) => {
    const layoutConfig = {
      standardVerticalSpacing,
      branchVerticalSpacing,
      branchLeftOffset,
      branchRightOffset,
      DEFAULT_NODE_WIDTH
    };

    handleAddStep(
      nodeId,
      nodeType,
      connectionType,
      branchId,
      workflowGraph,
      setWorkflowGraph,
      commandManager,
      (node, branchId) => BranchUtils.getBranchEndpoint(node, branchId, {
        DEFAULT_NODE_WIDTH: LAYOUT.NODE.DEFAULT_WIDTH,
        DEFAULT_NODE_HEIGHT: LAYOUT.NODE.DEFAULT_HEIGHT,
        BRANCH_VERTICAL_SPACING: 40
      }),
      pluginRegistry,
      layoutConfig,
      handleCloseMenuEvent,
      (newNode) => {
        // Track the new node for animation
        setAnimatingNodes(prev => [...prev, newNode.id]);
        setTimeout(() => {
          setAnimatingNodes(prev => prev.filter(id => id !== newNode.id));
        }, 300);
      }
    );
  };

  const handleShowExecuteDialogEvent = () => {
    setShowExecuteDialog(true);
  };

  const handleExecuteWorkflowEvent = async (inputs = {}) => {
    try {
      if (!workflowMetadata.id) {
        // Save workflow first if it doesn't have an ID
        const savedWorkflow = await saveWorkflowToBackend(
          workflowGraph,
          workflowMetadata,
          setWorkflowMetadata,
          setIsLoading
        );
        await executeWorkflow(
          savedWorkflow.id,
          inputs,
          setIsLoading,
          setExecutionStatus,
          setActiveTab
        );
      } else {
        await executeWorkflow(
          workflowMetadata.id,
          inputs,
          setIsLoading,
          setExecutionStatus,
          setActiveTab
        );
      }
    } catch (error) {
      console.error('Failed to execute workflow:', error);
    }
  };

  const handleSaveWorkflowEvent = async () => {
    try {
      await saveWorkflowToBackend(
        workflowGraph,
        workflowMetadata,
        setWorkflowMetadata,
        setIsLoading
      );
      console.log('Workflow saved successfully');
    } catch (error) {
      console.error('Failed to save workflow:', error);
    }
  };

  // Effect for panning with improved smoothness
  useEffect(() => {
    if (!isPanning) return;
    
    const handleMouseMoveEvent = (e) => {
      handleMouseMove(e, canvasState, {
        mouseDownPosRef,
        isDraggingRef
      });
    };
    
    const handleMouseUpEvent = (e) => {
      handleMouseUp(
        e, 
        canvasState, 
        {
          isDraggingRef,
          mouseDownPosRef,
          justClickedNodeRef
        },
        () => setSelectedNodeId(null)
      );
    };
    
    document.addEventListener('mousemove', handleMouseMoveEvent);
    document.addEventListener('mouseup', handleMouseUpEvent);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMoveEvent);
      document.removeEventListener('mouseup', handleMouseUpEvent);
    };
  }, [isPanning, startPanPos, canvasState]);

  // Effect for smooth zooming with wheel
  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (canvasElement) {
      canvasElement.addEventListener('wheel', handleWheelEvent, { passive: false });
    }
    
    return () => {
      if (canvasElement) {
        canvasElement.removeEventListener('wheel', handleWheelEvent);
      }
    };
  }, [transform]);

  // Effect for closing menus when clicking outside
  useEffect(() => {
    return setupMenuCloseHandlers(menuState, handleCloseMenuEvent);
  }, [menuState]);

  // Initialize SignalR when component mounts
  useEffect(() => {
    const initBackendServices = async () => {
      try {
        const cleanup = await initWorkflowService({
          setIsLoading,
          setConnectionStatus,
          setExecutionStatus,
          setWorkflowGraph,
          onExecutionStatusChange,
          workflowId
        });
        
        return cleanup;
      } catch (error) {
        console.error('Failed to initialize workflow service:', error);
      }
    };
    
    const cleanupFn = initBackendServices();
    
    return () => {
      if (cleanupFn && typeof cleanupFn.then === 'function') {
        cleanupFn.then(cleanup => {
          if (cleanup) cleanup();
        });
      }
    };
  }, [workflowId, onExecutionStatusChange]);

  // Get workflow input schema
  const getWorkflowInputSchemaFn = () => {
    return getWorkflowInputSchema(workflowSteps, pluginRegistry);
  };

  // Rendering logic (largely unchanged)
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Connection status indicator */}
      {connectionStatus !== 'connected' && (
        <div className={`text-white text-sm py-1 px-4 text-center ${
          connectionStatus === 'reconnecting' ? 'bg-yellow-500' :
          connectionStatus === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          {connectionStatus === 'reconnecting' ? 'Reconnecting to server...' :
           connectionStatus === 'error' ? 'Connection error. Please refresh the page.' :
           'Connecting to server...'}
        </div>
      )}
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      )}
    
      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 bg-white shadow-sm">
        <button
          className={`px-5 py-4 text-sm font-medium focus:outline-none ${
            activeTab === 'flow'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('flow')}
        >
          Workflow Editor
        </button>
        
        {/* Add an execution tab */}
        <button
          className={`px-5 py-4 text-sm font-medium focus:outline-none ${
            activeTab === 'execution'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('execution')}
        >
          Execution
        </button>
        
        {/* Workflow metadata display */}
        <div className="ml-auto flex items-center pr-4">
          <span className="text-sm text-gray-500 mr-4">
            {workflowMetadata.name}
            {workflowMetadata.lastModified && 
              ` • Last saved: ${new Date(workflowMetadata.lastModified).toLocaleString()}`}
          </span>
          
          {/* Save button */}
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
            onClick={handleSaveWorkflowEvent}
            disabled={readonly || connectionStatus !== 'connected'}
          >
            Save
          </button>
          
          {/* Execute button - now opens dialog */}
          <button
            className={`ml-2 px-4 py-2 rounded focus:outline-none ${
              executionStatus.isExecuting || connectionStatus !== 'connected'
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
            onClick={handleShowExecuteDialogEvent}
            disabled={executionStatus.isExecuting || readonly || connectionStatus !== 'connected'}
          >
            {executionStatus.isExecuting ? 'Executing...' : 'Execute'}
          </button>
        </div>
      </div>

      {/* Main content area - add condition to show execution view */}
      <div className="flex-grow flex overflow-hidden">
        {activeTab === 'flow' ? (
          /* Existing canvas area */
          <div
          ref={canvasRef}
          id="workflow-canvas"
          className="relative flex-grow overflow-hidden"
          style={{
            cursor: isPanning ? 'grabbing' : 'default',
            backgroundColor: '#F9FAFB',
            backgroundImage: showGrid ? `radial-gradient(circle, ${gridColor} ${scaledGridDotSize}px, transparent 1px)` : 'none',
            backgroundSize: `${GRID_SIZE * transform.scale}px ${GRID_SIZE * transform.scale}px`,
            backgroundPosition: `${transform.x}px ${transform.y}px`
          }}
          onMouseDown={handleCanvasMouseDownEvent}
        >
          {/* Canvas content with transform */}
          <div
            className="absolute top-0 left-0 w-full h-full transform-gpu"
            id="canvas-content"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: '0 0',
              width: '100%',
              height: '100%',
              overflow: 'visible' // Allow elements to extend outside container boundaries
            }}
          >
            {/* SVG for connection lines */}
            <svg
              width="100%"
              height="100%"
              className="absolute top-0 left-0 pointer-events-none"
              style={{ zIndex: 0, overflow: "visible" }}
              preserveAspectRatio="none"
            >
              <ConnectionRenderer
                workflowGraph={workflowGraph}
                selectedNodeId={selectedNodeId}
                pluginRegistry={pluginRegistry}
                edgeInputYOffset={edgeInputYOffset}
                edgeOutputYOffset={edgeOutputYOffset}
              />
            </svg>

            {/* Workflow step nodes */}
            {workflowSteps.map(step => (
              <WorkflowStep
                key={step.id}
                id={step.id}
                type={step.type}
                title={step.title}
                subtitle={step.subtitle}
                position={step.position}
                transform={transform}
                onClick={handleStepClickEvent}
                onDragStart={handleNodeDragStartEvent}
                onDrag={handleNodeDragEvent}
                onDragEnd={handleNodeDragEndEvent}
                onHeightChange={(id, height) => handleNodeHeightChange(id, height, workflowGraph, setWorkflowGraph, commandManager)}
                isNew={step.isNew || animationManager.isAnimating(step.id)}
                isSelected={selectedNodeId === step.id}
                contextMenuConfig={step.contextMenuConfig}
                className="draggable-node"
              />
            ))}

            {/* Add node button renderer */}
            <AddNodeButtonRenderer
              workflowGraph={workflowGraph}
              menuState={menuState}
              handleShowAddMenu={handleShowAddMenuEvent}
              handleShowBranchEdgeMenu={handleShowBranchEdgeMenuEvent}
              handleShowBranchEndpointMenu={handleShowBranchEndpointMenuEvent}
              pluginRegistry={pluginRegistry}
              edgeInputYOffset={edgeInputYOffset}
              edgeOutputYOffset={edgeOutputYOffset}
            />
          </div>

          {/* Floating controls for zoom and reset (fixed position) */}
          <div className="absolute bottom-4 left-4 flex space-x-2">
            <button
              className="p-2 bg-white rounded-full shadow hover:bg-gray-50 focus:outline-none"
              onClick={() => handleZoom(1.2)}
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5 text-gray-700" />
            </button>
            <button
              className="p-2 bg-white rounded-full shadow hover:bg-gray-50 focus:outline-none"
              onClick={() => handleZoom(0.8)}
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5 text-gray-700" />
            </button>
            <button
              className="p-2 bg-white rounded-full shadow hover:bg-gray-50 focus:outline-none"
              onClick={resetView}
              title="Reset View"
            >
              <Maximize className="w-5 h-5 text-gray-700" />
            </button>
            
            {/* Add Snap to Grid toggle button */}
            <button
              className={`p-2 rounded-full shadow focus:outline-none ${
                snapToGrid ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setSnapToGrid(!snapToGrid)}
              title={snapToGrid ? "Snap to Grid: On" : "Snap to Grid: Off"}
            >
              <Grid className="w-5 h-5" />
            </button>
          </div>

          {/* Undo/Redo controls */}
          <div className="absolute top-4 left-4 flex space-x-2">
            <button
              className={`p-2 rounded-full shadow focus:outline-none ${
                canUndo ? 'bg-white hover:bg-gray-50 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              onClick={undoAction}
              disabled={!canUndo}
              title="Undo"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              className={`p-2 rounded-full shadow focus:outline-none ${
                canRedo ? 'bg-white hover:bg-gray-50 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              onClick={redoAction}
              disabled={!canRedo}
              title="Redo"
            >
              <RotateCw className="w-5 h-5" />
            </button>
          </div>

          <WorkflowMenuManager
            menuState={menuState}
            workflowGraph={workflowGraph}
            transform={transform}
            buttonYOffset={buttonYOffset}
            onAddNode={handleAddStepEvent}
            onCloseMenu={handleCloseMenuEvent}
          />          
        </div>
        ) : (
          /* Execution view */
          <div className="p-6 w-full overflow-auto">
            <h2 className="text-xl font-semibold mb-4">Workflow Execution</h2>
            
            {executionStatus.isExecuting ? (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between mb-4">
                  <span className="font-medium">Status: Running</span>
                  <span className="text-gray-500">
                    Started: {executionStatus.startTime && new Date(executionStatus.startTime).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${executionStatus.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                {executionStatus.currentNodeId && (
                  <div className="text-sm text-gray-600">
                    Executing node: {
                      workflowGraph.getNode(executionStatus.currentNodeId)?.title || 
                      executionStatus.currentNodeId
                    }
                  </div>
                )}
                
                {executionStatus.errors.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-red-600 font-medium mb-2">Errors</h3>
                    <ul className="bg-red-50 p-3 rounded border border-red-200">
                      {executionStatus.errors.map((error, index) => (
                        <li key={index} className="text-red-700">{error.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-gray-500">No active execution. Click "Execute" to run this workflow.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Properties panel - keep existing code */}
        {selectedNode && (
          <div className="w-1/3 max-w-md border-l border-gray-200 bg-white overflow-y-auto animate-slideIn">
            <div className="p-6"> 
              <NodePropertiesPanel
                node={selectedNode}
                registry={pluginRegistry}
                onUpdate={handleUpdateNodePropertyEvent}
                onClose={() => setSelectedNodeId(null)}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Execute workflow dialog */}
      <ExecuteWorkflowDialog
        isOpen={showExecuteDialog}
        onClose={() => setShowExecuteDialog(false)}
        onExecute={handleExecuteWorkflowEvent}
        workflowInputSchema={getWorkflowInputSchemaFn()}
      />
    </div>
  );
};

export default AutomationWorkflow;
```

## Implementation Notes

1. **Custom Hooks Integration**:
   - `useCanvasState` now provides all canvas-related state and operations
   - `useWorkflowState` manages graph state, selection, and command-related operations

2. **Event Handler Integration**:
   - Each event handler has been replaced with a wrapper that calls the extracted handler function
   - All necessary parameters are passed to ensure proper functionality

3. **Backend Integration**:
   - Service initialization and operations are now delegated to the workflowServiceIntegration module
   - A proper cleanup function is returned to handle component unmounting

4. **Benefits**:
   - Component size reduced from 1400+ lines to a much more maintainable size
   - Clear separation of concerns with each aspect of the component isolated into its purpose-built module
   - Enhanced testability with each module having a focused responsibility

## Next Steps for Implementation

To implement this refactoring:

1. **Incremental Approach**: Refactor one section at a time to maintain functionality
2. **Testing**: Test each refactored section to ensure it behaves exactly as before
3. **Code Review**: Ensure all imports and dependencies are correctly resolved
4. **Documentation**: Add inline documentation to clarify the flow between modules

This refactoring will significantly improve the maintainability and extensibility of the AutomationWorkflow component.