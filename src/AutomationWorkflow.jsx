import React, { useState, useRef, useEffect, useCallback } from 'react';

// Import Graph and command pattern components
import { Graph } from './components/AutomationWorkflow/graph/Graph';
import { commandManager } from './components/AutomationWorkflow/commands';

// Import utility modules
import { BranchUtils } from './components/AutomationWorkflow/utils/BranchUtils';
import { animationManager } from './components/AutomationWorkflow/utils/AnimationManager';
import { generateUniqueId } from './components/AutomationWorkflow/utils/GeneralUtils';

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

// Import new components for refactoring
import ErrorBoundary from './components/AutomationWorkflow/ErrorBoundary';
import WorkflowEditorView from './components/AutomationWorkflow/views/WorkflowEditorView';
import ExecutionView from './components/AutomationWorkflow/views/ExecutionView';
import TabNavigation from './components/AutomationWorkflow/navigation/TabNavigation';
import ConnectionStatusBar from './components/AutomationWorkflow/status/ConnectionStatusBar';

// Import constants
import {
  LAYOUT,
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  GRID_SIZE,
  EDGE_INPUT_Y_OFFSET,
  EDGE_OUTPUT_Y_OFFSET,
  BUTTON_Y_OFFSET,
  CONNECTION_TYPES,
  INITIAL_WORKFLOW_STEPS,
  SHOW_GRID,
  GRID_COLOR,
  GRID_DOT_SIZE,
  SNAP_TO_GRID,
  STANDARD_VERTICAL_SPACING,
  BRANCH_VERTICAL_SPACING,
  BRANCH_LEFT_OFFSET,
  BRANCH_RIGHT_OFFSET
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

// Import built-in controls
import {
  TextInputControl,
  SelectControl,
  NumberControl,
  CheckboxControl
} from './components/AutomationWorkflow/controls';

// Register node types (keep this part outside the component)
pluginRegistry.registerNodeType(TriggerNodePlugin);
pluginRegistry.registerNodeType(ControlNodePlugin);
pluginRegistry.registerNodeType(ActionNodePlugin);
pluginRegistry.registerNodeType(IfElseNodePlugin);
pluginRegistry.registerNodeType(SplitFlowNodePlugin);
// Register property controls
pluginRegistry.registerPropertyControl(TextInputControl);
pluginRegistry.registerPropertyControl(SelectControl);
pluginRegistry.registerPropertyControl(NumberControl);
pluginRegistry.registerPropertyControl(CheckboxControl);

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

  // Add wrapper for height change function to correctly pass parameters
  const handleNodeHeightChangeEvent = (id, height) => {
    handleNodeHeightChange(id, height, workflowGraph, setWorkflowGraph, commandManager);
  };
  
  // Handler functions that use the extracted utility modules
  const handleCanvasMouseDownEvent = (e) => {
    // Explicitly pass the needed properties rather than the whole canvasState object
    handleCanvasMouseDown(e, {
      transform,
      setIsPanning,
      setStartPanPos
    }, {
      mouseDownPosRef,
      isDraggingRef,
      justClickedNodeRef
    });
  };

  const handleWheelEvent = useCallback((e) => {
    // Explicitly pass the needed properties rather than the whole canvasState object
    handleWheel(e, {
      transform,
      setTransform
    }, canvasRef);
  }, [transform, setTransform, canvasRef]);

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
      commandManager,
      snapToGrid // Pass the current global snapToGrid setting
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

  const handleCloseMenuEvent = useCallback(() => {
    handleCloseMenu(setMenuState);
  }, [setMenuState]);

  const handleShowMenuEvent = useCallback((nodeId, menuType, branchId, e, buttonRect) => {
    handleShowMenu(
      nodeId,
      menuType,
      branchId,
      e,
      buttonRect,
      workflowGraph,
      setMenuState
    );
  }, [workflowGraph, setMenuState]);

  // Use useCallback with dependencies to ensure these handlers have access to the latest workflowGraph
  const handleShowAddMenuEvent = useCallback((nodeId, e, buttonRect) => {
    handleShowAddMenu(nodeId, e, buttonRect, workflowGraph, setMenuState);
  }, [workflowGraph, setMenuState]);

  const handleShowBranchEndpointMenuEvent = useCallback((nodeId, branchId, e, buttonRect) => {
    handleShowBranchEndpointMenu(nodeId, branchId, e, buttonRect, workflowGraph, setMenuState);
  }, [workflowGraph, setMenuState]);

  const handleShowBranchEdgeMenuEvent = useCallback((nodeId, branchId, e, buttonRect) => {
    handleShowBranchEdgeMenu(nodeId, branchId, e, buttonRect, workflowGraph, setMenuState);
  }, [workflowGraph, setMenuState]);

  const handleAddStepEvent = useCallback((nodeId, nodeType, connectionType = CONNECTION_TYPES.DEFAULT, branchId = null) => {
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
      (node, branchId) => BranchUtils.getBranchEndpoint(node, branchId, pluginRegistry, {
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
  }, [workflowGraph, branchLeftOffset, branchRightOffset, branchVerticalSpacing, standardVerticalSpacing, setWorkflowGraph, handleCloseMenuEvent]);

  // Create handler for undo and redo actions
  const handleUndoEvent = () => {
    handleUndo(commandManager);
  };

  const handleRedoEvent = () => {
    handleRedo(commandManager);
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
      handleMouseMove(e, {
        startPanPos,
        setTransform
      }, {
        mouseDownPosRef,
        isDraggingRef
      });
    };
    
    const handleMouseUpEvent = (e) => {
      handleMouseUp(
        e,
        {
          setIsPanning
        },
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
  }, [isPanning, startPanPos, setIsPanning, setTransform, setSelectedNodeId]);

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
  }, [transform, handleWheelEvent]);

  // Effect for closing menus when clicking outside
  useEffect(() => {
    return setupMenuCloseHandlers(menuState, handleCloseMenuEvent);
  }, [menuState, handleCloseMenuEvent]);

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
  }, [workflowId, onExecutionStatusChange, setWorkflowGraph]);

  // Get workflow input schema
  const getWorkflowInputSchemaFn = () => {
    return getWorkflowInputSchema(workflowSteps, pluginRegistry);
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-gray-50">
        <ConnectionStatusBar status={connectionStatus} isLoading={isLoading} />
        
        <TabNavigation 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          readonly={readonly}
          connectionStatus={connectionStatus}
          isExecuting={executionStatus.isExecuting}
          workflowMetadata={workflowMetadata}
          onSave={handleSaveWorkflowEvent}
          onExecute={handleShowExecuteDialogEvent}
        />
        
        <div className="flex-grow flex overflow-hidden">
          {activeTab === 'flow' ? (
            <WorkflowEditorView
              canvasRef={canvasRef}
              transform={transform}
              isPanning={isPanning}
              showGrid={showGrid}
              gridColor={gridColor}
              gridDotSize={scaledGridDotSize}
              GRID_SIZE={GRID_SIZE}
              handleCanvasMouseDown={handleCanvasMouseDownEvent}
              workflowGraph={workflowGraph}
              workflowSteps={workflowSteps}
              selectedNodeId={selectedNodeId}
              handleZoom={handleZoom}
              resetView={resetView}
              snapToGrid={snapToGrid}
              setSnapToGrid={setSnapToGrid}
              canUndo={canUndo}
              canRedo={canRedo}
              handleUndoEvent={handleUndoEvent}
              handleRedoEvent={handleRedoEvent}
              menuState={menuState}
              WorkflowMenuManager={WorkflowMenuManager}
              handleStepClick={handleStepClickEvent}
              handleNodeDragStart={handleNodeDragStartEvent}
              handleNodeDrag={handleNodeDragEvent}
              handleNodeDragEnd={handleNodeDragEndEvent}
              handleNodeHeightChange={handleNodeHeightChangeEvent}
              edgeInputYOffset={edgeInputYOffset}
              edgeOutputYOffset={edgeOutputYOffset}
              buttonYOffset={buttonYOffset}
              animatingNodes={animatingNodes}
              pluginRegistry={pluginRegistry}
              // Add missing props for the edge and step buttons
              AddNodeButtonRenderer={AddNodeButtonRenderer}
              handleShowAddMenu={handleShowAddMenuEvent}
              handleShowBranchEdgeMenu={handleShowBranchEdgeMenuEvent}
              handleShowBranchEndpointMenu={handleShowBranchEndpointMenuEvent}
              handleCloseMenu={handleCloseMenuEvent}
              handleAddNode={handleAddStepEvent}
            />
          ) : (
            <ExecutionView 
              executionStatus={executionStatus}
              workflowGraph={workflowGraph}
            />
          )}
          
          {/* Properties panel */}
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
    </ErrorBoundary>
  );
};

export default AutomationWorkflow;
