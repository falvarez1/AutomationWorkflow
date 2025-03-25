import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  RotateCw,
  Grid
} from 'lucide-react';

// Import Graph and command pattern components
import { Graph } from './components/AutomationWorkflow/graph/Graph';
import {
  commandManager,
  AddNodeCommand,
  MoveNodeCommand,
  DeleteNodeCommand,
  UpdateNodeCommand,
  UpdateNodeHeightCommand,
  DuplicateNodeCommand
} from './components/AutomationWorkflow/commands';

// Import command utilities
import { executeGraphCommand } from './components/AutomationWorkflow/utils/commandUtils';
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
// Remove NodeMenu and BranchMenu imports as they're used by WorkflowMenuManager
import ConnectionRenderer from './components/AutomationWorkflow/components/ConnectionRenderer';
import AddNodeButtonRenderer from './components/AutomationWorkflow/components/AddNodeButtonRenderer';
import WorkflowMenuManager from './components/AutomationWorkflow/components/WorkflowMenuManager';

// Import the NodePropertiesPanel
import { NodePropertiesPanel } from './components/AutomationWorkflow/NodeProperties';

// Import built-in controls
import {
  TextInputControl,
  SelectControl,
  NumberControl,
  CheckboxControl
} from './components/AutomationWorkflow/controls';

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
  // Add new mouse control imports
  MOUSE_CONTROLS
} from './components/AutomationWorkflow/constants';

// Add imports for the services at the top of the file
import { workflowService } from './services/workflowService';

// Add import at the top
import ExecuteWorkflowDialog from './components/AutomationWorkflow/components/ExecuteWorkflowDialog';

// Register node types
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
  workflowId = null, // Add workflowId prop for loading from backend
  gridOptions = {}, 
  nodePlacementOptions = {},
  readonly = false, // Add readonly mode
  onExecutionStatusChange = null // Callback for execution status changes
}) => {
  // Canvas pan and zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: .8 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPos, setStartPanPos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const transformRef = useRef(transform);
  
  // Keep transform ref updated with latest value
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);
  
  // Add state for undo/redo capabilities
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Initialize the graph state from the initial workflow steps
  const [workflowGraph, setWorkflowGraph] = useState(() => 
    Graph.fromWorkflowSteps(initialWorkflowSteps)
  );

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

  // State for selection and UI interactions
  const [activeTab, setActiveTab] = useState('flow');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [dragStartPosition, setDragStartPosition] = useState(null);
  
  // Consolidated menu close handlers
  const handleCloseMenu = useCallback(() => {
    setMenuState({ activeNodeId: null, activeBranch: null, position: null, menuType: null });
  }, []);

  // Consolidated state for all menu handling
  const [menuState, setMenuState] = useState({
    activeNodeId: null,
    activeBranch: null,
    position: null,
    menuType: null // 'add', 'branch', or 'branchEdge'
  });
  
  // Convert graph nodes to array for rendering compatibility
  const workflowSteps = useMemo(() => {
    return workflowGraph.getAllNodes();
  }, [workflowGraph]);

  // Find the currently selected node
  const selectedNode = useMemo(() => {
    return selectedNodeId ? workflowGraph.getNode(selectedNodeId) : null;
  }, [workflowGraph, selectedNodeId]);

  // Configurable offsets
  const [buttonYOffset] = useState(BUTTON_Y_OFFSET);
  const [edgeInputYOffset] = useState(EDGE_INPUT_Y_OFFSET);
  const [edgeOutputYOffset] = useState(EDGE_OUTPUT_Y_OFFSET);
  
  // Helper function to calculate branch endpoints for ifelse and splitflow nodes
  const getBranchEndpoint = useCallback((node, branchId) => {
    return BranchUtils.getBranchEndpoint(node, branchId, {
      DEFAULT_NODE_WIDTH: LAYOUT.NODE.DEFAULT_WIDTH,
      DEFAULT_NODE_HEIGHT: LAYOUT.NODE.DEFAULT_HEIGHT,
      BRANCH_VERTICAL_SPACING: 40
    });
  }, []);

// Handler for node height changes
const handleNodeHeightChange = useCallback((id, height) => {
  setWorkflowGraph(prevGraph => {
    const newGraph = new Graph();
    
    // Copy all nodes and edges
    prevGraph.getAllNodes().forEach(node => {
      newGraph.addNode(node.id === id ? { ...node, height } : node);
    });
    
    prevGraph.getAllEdges().forEach(edge => {
      newGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
    });
    
    return newGraph;
  });
}, []);

  // Close menus when clicking outside or on another node
  useEffect(() => {
    // Handle click outside events
    const handleClickOutside = (e) => {
      // Check if auto-close on outside click is enabled
      const clickOutsideClosesMenu = MENU_PLACEMENT.CLICK_OUTSIDE_CLOSES_MENU;
      
      // If auto-close is disabled, we don't need to proceed
      if (!clickOutsideClosesMenu) return;
      
      // Check if clicking on a node or node-related element
      const clickedNodeElement = e.target.closest('[data-node-element="true"]');
      const isClickingAddButton = clickedNodeElement && clickedNodeElement.classList.contains('add-node-button');
      const isClickingNode = clickedNodeElement && !isClickingAddButton;
      const isClickingMenu = e.target.closest('.node-menu');
      
      // Check if we're interacting with any menu
      if (menuState.activeNodeId !== null) {
        // Close menu when clicking on any node that's not an add button
        if (isClickingNode) {
          handleCloseMenu();
        }
        // Or when clicking anywhere else (except the menu or add button)
        else if (!isClickingMenu && !isClickingAddButton) {
          handleCloseMenu();
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuState, handleCloseMenu]);
  
  // Add a ref to track if we just clicked a node
  const justClickedNodeRef = useRef(false);
  
  // Add these refs to track drag vs click behavior
  const mouseDownPosRef = useRef(null);
  const isDraggingRef = useRef(false);
  
  // Modified handle canvas mouse down to respect just-clicked nodes
  const handleCanvasMouseDown = (e) => {
    // Check if the click was on the canvas background
    const isClickingNode = e.target.closest('[data-node-element="true"]');
    
    // Only start panning if clicking on the canvas (not on a node)
    if (e.button === 0 && !isClickingNode) {
      // This is a direct click on the canvas background
      setIsPanning(true);
      setStartPanPos({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      
      // Save the initial mouse position to determine if this becomes a drag or a click
      mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
      isDraggingRef.current = false;
      
      e.preventDefault();
    }
    
    // Reset the just clicked ref
    justClickedNodeRef.current = isClickingNode && 
      isClickingNode.getAttribute('data-was-just-clicked') === 'true';
  };
  
  // Handle canvas mouse move for panning with improved smoothness
  useEffect(() => {
    if (!isPanning) return;
    
    const handleMouseMove = (e) => {
      // Check if we've moved enough to consider this a drag
      if (mouseDownPosRef.current) {
        const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
        const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);
        
        // If moved more than 5px, consider it a drag
        if (dx > 5 || dy > 5) {
          isDraggingRef.current = true;
        }
      }
      
      requestAnimationFrame(() => {
        setTransform(prev => ({
          ...prev,
          x: e.clientX - startPanPos.x,
          y: e.clientY - startPanPos.y
        }));
      });
    };
    
    const handleMouseUp = (e) => {
      setIsPanning(false);
      
      // Only deselect node if this was a clean click (not a drag)
      // and we're not clicking on a node
      if (!isDraggingRef.current && !justClickedNodeRef.current) {
        setSelectedNodeId(null);
      }
      
      // Reset tracking refs
      mouseDownPosRef.current = null;
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, startPanPos]);
  
  // Smooth zoom with wheel
  useEffect(() => {
    const handleWheel = (e) => {
      // Determine if we should zoom or pan based on configuration
      const shouldZoom = MOUSE_CONTROLS.WHEEL_ZOOMS 
        ? !(MOUSE_CONTROLS.ZOOM_TOGGLE_KEY && e.getModifierState(MOUSE_CONTROLS.ZOOM_TOGGLE_KEY)) // Default to zoom unless toggle key is pressed
        : (MOUSE_CONTROLS.ZOOM_TOGGLE_KEY && e.getModifierState(MOUSE_CONTROLS.ZOOM_TOGGLE_KEY)); // Default to pan unless toggle key is pressed
      
      // For backward compatibility - still allow Ctrl/Meta to always trigger zoom
      const forceZoom = e.ctrlKey || e.metaKey;
      
      if (shouldZoom || forceZoom) {
        e.preventDefault();
        
        // Calculate zoom point (mouse position)
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate point in graph coordinates
        const graphX = (mouseX - transform.x) / transform.scale;
        const graphY = (mouseY - transform.y) / transform.scale;
        
        // Calculate zoom factor based on delta magnitude
        const absDelta = Math.abs(e.deltaY);
        
        // Use configured sensitivity
        const sensitivity = MOUSE_CONTROLS.ZOOM_SENSITIVITY;
        
        // Apply min/max zoom change constraints
        const baseZoomChange = Math.min(Math.max(absDelta * sensitivity, MOUSE_CONTROLS.MIN_ZOOM_CHANGE), MOUSE_CONTROLS.MAX_ZOOM_CHANGE);
        
        // Apply direction (zoom in or out), respecting invert setting
        let zoomFactor;
        if (MOUSE_CONTROLS.INVERT_ZOOM) {
          zoomFactor = e.deltaY > 0
            ? 1 + baseZoomChange  // Inverted: scroll down = zoom in
            : 1 - baseZoomChange; // Inverted: scroll up = zoom out
        } else {
          zoomFactor = e.deltaY < 0
            ? 1 + baseZoomChange  // Normal: scroll up = zoom in
            : 1 - baseZoomChange; // Normal: scroll down = zoom out
        }
        
        setTransform(prev => {
          const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prev.scale * zoomFactor));
          
          // If ZOOM_TO_CURSOR is false, zoom toward center of screen instead
          if (!MOUSE_CONTROLS.ZOOM_TO_CURSOR) {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const centerGraphX = (centerX - prev.x) / prev.scale;
            const centerGraphY = (centerY - prev.y) / prev.scale;
            
            return {
              x: centerX - centerGraphX * newScale,
              y: centerY - centerGraphY * newScale,
              scale: newScale
            };
          }
          
          // Default: Adjust position to zoom toward mouse point
          const newX = mouseX - graphX * newScale;
          const newY = mouseY - graphY * newScale;
          
          return {
            x: newX,
            y: newY,
            scale: newScale
          };
        });
      } 
      // If not zooming, handle as panning
      else {
        e.preventDefault();
        
        // Adjust sensitivity for touchpad panning
        const panSensitivity = 1.0;
        
        // Use deltaX and deltaY for panning
        const dx = -e.deltaX * panSensitivity;
        const dy = -e.deltaY * panSensitivity;
        
        // Apply the pan using requestAnimationFrame for smoother performance
        requestAnimationFrame(() => {
          setTransform(prev => ({
            ...prev,
            x: prev.x + dx,
            y: prev.y + dy
          }));
        });
      }
    };
    
    const canvasElement = canvasRef.current;
    if (canvasElement) {
      canvasElement.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (canvasElement) {
        canvasElement.removeEventListener('wheel', handleWheel);
      }
    };
  }, [transform]);
  
  // Handle zoom
  const handleZoom = (factor) => {
    setTransform(prev => {
      const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prev.scale * factor));
      // Keep the center of the view fixed when zooming with buttons
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const graphX = (centerX - prev.x) / prev.scale;
      const graphY = (centerY - prev.y) / prev.scale;
      const newX = centerX - graphX * newScale;
      const newY = centerY - graphY * newScale;
      
      return {
        x: newX,
        y: newY,
        scale: newScale
      };
    });
  };
  
  // Reset view
  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };
  
  // State to track animating nodes
  const [animatingNodes, setAnimatingNodes] = useState([]);
  
  // Helper functions
  const generateUniqueId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Helper functions for default node properties
  const getDefaultTitle = useCallback((nodeType) => {
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
  }, []);

  const getDefaultSubtitle = useCallback((nodeType) => {
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
  }, []);
  
  // Create a new node with the specified properties
  const createNewNode = useCallback((nodeType, position, overrides = {}) => {
    // Get any initial properties from the node plugin
    const nodePlugin = pluginRegistry.getNodeType(nodeType);
    const initialProps = nodePlugin.getInitialProperties ? nodePlugin.getInitialProperties() : {};
    
    return {
      id: generateUniqueId(),
      type: nodeType,
      position,
      height: DEFAULT_NODE_HEIGHT,
      isNew: true,
      contextMenuConfig: { position: 'right', offsetX: -5, offsetY: 0, orientation: 'vertical' },
      title: getDefaultTitle(nodeType),
      subtitle: getDefaultSubtitle(nodeType),
      ...initialProps,
      ...overrides
    };
  }, [getDefaultTitle, getDefaultSubtitle]);

  // Handle adding a new step
  const handleAddStep = useCallback((nodeId, nodeType, connectionType = CONNECTION_TYPES.DEFAULT, branchId = null) => {
    const sourceNode = workflowGraph.getNode(nodeId);
    if (!sourceNode) return;
    
    // Calculate position for new node
    let newPos;
    
    if (connectionType === CONNECTION_TYPES.BRANCH && branchId) {
      // For branch connections, use the branch endpoint position
      const branchEndpoint = getBranchEndpoint(sourceNode, branchId);
      const isLeftNode = branchId === 'yes' || branchId === 'path1';
      
      // Use configurable branch offset
      const branchOffset = isLeftNode ? branchLeftOffset : branchRightOffset;
  
      newPos = {
        x: branchEndpoint.x - (DEFAULT_NODE_WIDTH / 2) + branchOffset,
        y: branchEndpoint.y + branchVerticalSpacing
      };
    } else {
      // For standard connections, place new node below the source node
      newPos = {
        x: sourceNode.position.x,
        y: sourceNode.position.y + standardVerticalSpacing
      };
    }
    
    // Create new node
    const newNode = createNewNode(nodeType, newPos);
    
    // Create and execute the add node command
    const addNodeCommand = new AddNodeCommand(
      workflowGraph, 
      newNode,
      sourceNode.id,
      connectionType,
      branchId
    );
    
    // Execute command with commandUtils
    executeGraphCommand(addNodeCommand, commandManager, setWorkflowGraph, {
      onExecuteSuccess: () => {
        // Track the new node for animation
        setAnimatingNodes(prev => [...prev, newNode.id]);
        setTimeout(() => {
          setAnimatingNodes(prev => prev.filter(id => id !== newNode.id));
        }, 300);
      }
    });
    
    // Close menu
    handleCloseMenu();
  }, [workflowGraph, createNewNode, getBranchEndpoint, 
    standardVerticalSpacing, branchVerticalSpacing, 
    branchLeftOffset, branchRightOffset, handleCloseMenu]);

  // Initialize command manager and listen for changes
  useEffect(() => {
    // Setup command manager listener to update undo/redo state
    const handleCommandStateChange = (state) => {
      setCanUndo(state.canUndo);
      setCanRedo(state.canRedo);
    };
    
    commandManager.addListener(handleCommandStateChange);
    
    // Update initial state
    setCanUndo(commandManager.canUndo());
    setCanRedo(commandManager.canRedo());
    
    return () => {
      commandManager.removeListener(handleCommandStateChange);
    };
  }, []);

  // Handle undo and redo
  const handleUndo = () => {
    commandManager.undo();
  };

  const handleRedo = () => {
    commandManager.redo();
  };
  
  // Handle delete node action
  const handleDeleteNode = useCallback((nodeId) => {
    if (!nodeId) return;
    
    // Create delete command
    const deleteNodeCommand = new DeleteNodeCommand(workflowGraph, nodeId);
    
    // Execute command with commandUtils
    executeGraphCommand(deleteNodeCommand, commandManager, setWorkflowGraph, {
      onExecuteSuccess: () => {
        // Clear selected node if it was deleted
        if (selectedNodeId === nodeId) {
          setSelectedNodeId(null);
        }
      }
    });
  }, [workflowGraph, selectedNodeId]);

  // Handle node click for editing with improved logic
  const handleStepClick = useCallback((id, action) => {
    if (!id) return;
    
    // If an action is provided, handle the context menu action
    if (action) {
      switch (action) {
        case 'delete':
          handleDeleteNode(id);
          return;
        case 'duplicate':
          // Implement duplicate functionality
          const duplicateCommand = new DuplicateNodeCommand(
            workflowGraph,
            id,
            generateUniqueId,
            50, // X offset
            50  // Y offset
          );
          
          executeGraphCommand(duplicateCommand, commandManager, setWorkflowGraph, {
            onExecuteSuccess: (result) => {
              if (result && duplicateCommand.newNodeId) {
                // Start animation for the new node
                animationManager.startAnimation(
                  duplicateCommand.newNodeId, 
                  'nodeAdd'
                );
              }
            }
          });
          return;
        case 'edit':
          // Already handled by selecting the node
          break;
        default:
          // Handle other node-specific actions
          break;
      }
    }
    
    // Always select the node on click (no toggling anymore)
    setSelectedNodeId(id);
    justClickedNodeRef.current = true;
    
    // Clear this flag after a short delay
    setTimeout(() => {
      justClickedNodeRef.current = false;
    }, 200);
  }, [handleDeleteNode, workflowGraph, generateUniqueId]);
  
  // Handle node drag with grid snapping
  const handleNodeDrag = useCallback((id, x, y) => {
    let newX = x;
    let newY = y;
    if (snapToGrid) {
      newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
      newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
    }
    
    // Update the node position in the graph
    setWorkflowGraph(prevGraph => {
      const newGraph = new Graph();
      
      // Copy all nodes with updated position for the dragged node
      prevGraph.getAllNodes().forEach(node => {
        if (node.id === id) {
          newGraph.addNode({ ...node, position: { x: newX, y: newY } });
        } else {
          newGraph.addNode({ ...node });
        }
      });
      
      // Copy all edges
      prevGraph.getAllEdges().forEach(edge => {
        newGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
      });
      
      return newGraph;
    });
  }, [snapToGrid]);

  // Handle node drag start
  const handleNodeDragStart = useCallback((id, position) => {
    // Save the start position for the move command
    setDragStartPosition({ ...position });
    
    // Set the currently dragging node ID to prevent canvas panning
    // when dragging a node
    justClickedNodeRef.current = true;
  }, []);
  
  // Handle node drag end
  const handleNodeDragEnd = useCallback((id) => {
    if (!dragStartPosition) return;
    
    const node = workflowGraph.getNode(id);
    if (!node) return;
    
    // Get final position from the temp drag position we stored
    const currentPosition = node._currentDragPosition || node.position;
    
    // Reset the dragging flag
    justClickedNodeRef.current = false;
    
    // Only create a command if the position actually changed
    if (dragStartPosition.x !== currentPosition.x || dragStartPosition.y !== currentPosition.y) {
      // Create a move command
      const moveNodeCommand = new MoveNodeCommand(
        workflowGraph,
        id,
        { ...dragStartPosition },
        { ...currentPosition }
      );
      
      // Execute command with commandUtils
      executeGraphCommand(moveNodeCommand, commandManager, setWorkflowGraph);
    } else {
      // If position didn't change, ensure the graph state is updated with the final position
      // This handles the case where the drag was cancelled or didn't result in movement
      setWorkflowGraph(prevGraph => {
        const newGraph = new Graph();
        
        prevGraph.getAllNodes().forEach(node => {
          newGraph.addNode(node);
        });
        
        prevGraph.getAllEdges().forEach(edge => {
          newGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
        });
        
        return newGraph;
      });
    }
    
    // Reset the start position
    setDragStartPosition(null);
  }, [workflowGraph, dragStartPosition]);

  // Handle node property updates
  const handleUpdateNodeProperty = useCallback((nodeId, propertyId, value) => {
    if (!nodeId) return;
    
    // Get the current node
    const node = workflowGraph.getNode(nodeId);
    if (!node) return;
    
    // Create a command to update the property
    const updateCommand = new UpdateNodeCommand(
      workflowGraph,
      nodeId,
      {
        properties: {
          ...node.properties,
          [propertyId]: value
        }
      }
    );
    
    // Execute command with commandUtils
    executeGraphCommand(updateCommand, commandManager, setWorkflowGraph);
  }, [workflowGraph]);

  // Consolidated function to handle all menu interactions
  const handleShowMenu = useCallback((nodeId, menuType, branchId = null, e, buttonRect) => {
    // Don't show menu if node doesn't exist
    if (!workflowGraph.getNode(nodeId)) return;
    
    // Toggle menu state
    setMenuState(prev => {
      // If clicking the same button that's already active, close the menu
      if (prev.activeNodeId === nodeId && 
          prev.menuType === menuType && 
          prev.activeBranch === branchId) {
        return { activeNodeId: null, activeBranch: null, position: null, menuType: null };
      }
      
      // Otherwise, open the requested menu
      return {
        activeNodeId: nodeId,
        activeBranch: branchId,
        position: buttonRect,
        menuType: menuType
      };
    });
    
    e.stopPropagation();
  }, [workflowGraph]);
  
  // Replace the three separate menu functions with references to the consolidated function
  const handleShowAddMenu = useCallback((nodeId, e, buttonRect) => {
    handleShowMenu(nodeId, 'add', null, e, buttonRect);
  }, [handleShowMenu]);
  
  const handleShowBranchEndpointMenu = useCallback((nodeId, branchId, e, buttonRect) => {
    handleShowMenu(nodeId, 'branch', branchId, e, buttonRect);
  }, [handleShowMenu]);
  
  const handleShowBranchEdgeMenu = useCallback((nodeId, branchId, e, buttonRect) => {
    handleShowMenu(nodeId, 'branchEdge', branchId, e, buttonRect);
  }, [handleShowMenu]);
  
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

  // Add state for execution dialog
  const [showExecuteDialog, setShowExecuteDialog] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  
  // Get workflow input schema from trigger node
  const getWorkflowInputSchema = useCallback(() => {
    // Find trigger node (typically the first node)
    const triggerNode = workflowSteps.find(node => node.type === NODE_TYPES.TRIGGER);
    
    if (!triggerNode) return [];
    
    // Get input schema from the trigger node's plugin
    const triggerPlugin = pluginRegistry.getNodeType(triggerNode.type);
    return triggerPlugin.getInputSchema ? 
      triggerPlugin.getInputSchema(triggerNode.properties) : [];
  }, [workflowSteps]);

  // Initialize SignalR when component mounts
  useEffect(() => {
    const initBackendServices = async () => {
      try {
        setIsLoading(true);
        
        // Monitor connection status
        const removeStatusListener = workflowService.onConnectionStatusChange((status, error) => {
          setConnectionStatus(status);
          if (status === 'error') {
            console.error('Connection error:', error);
            // Could show a notification here
          }
        });
        

        // temporarily commented out
      //  await workflowService.init();
        console.log('Workflow service initialized');
        
        // Register for execution updates
        const removeExecutionListener = workflowService.onExecutionUpdate(update => {
          setExecutionStatus(prev => ({
            ...prev,
            ...update
          }));
          
          if (onExecutionStatusChange) {
            onExecutionStatusChange(update);
          }
        });
        
        // Register for node status updates
        const removeNodeStatusListener = workflowService.onNodeStatusUpdate(update => {
          // Update node status in the graph (e.g., highlighting active nodes)
          if (update.nodeId) {
            setWorkflowGraph(prev => {
              const newGraph = new Graph();
              
              prev.getAllNodes().forEach(node => {
                const nodeStatus = node.id === update.nodeId 
                  ? update.status 
                  : node.status;
                
                newGraph.addNode({
                  ...node,
                  status: nodeStatus,
                  statusData: node.id === update.nodeId 
                    ? update.data || {}
                    : node.statusData
                });
              });
              
              prev.getAllEdges().forEach(edge => {
                newGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
              });
              
              return newGraph;
            });
          }
        });
        
        // Load workflow from backend if ID is provided
        if (workflowId) {
          await loadWorkflowFromBackend(workflowId);
        }
        
        return () => {
          removeStatusListener();
          removeExecutionListener();
          removeNodeStatusListener();
        };
      } catch (error) {
        console.error('Failed to initialize workflow service:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initBackendServices();
  }, [workflowId, onExecutionStatusChange]);

  // Function to load workflow from backend
  const loadWorkflowFromBackend = async (id) => {
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
    } catch (error) {
      console.error('Failed to load workflow:', error);
      // Handle error (show notification, etc.)
    } finally {
      setIsLoading(false);
    }
  };

  // Function to save workflow to backend
  const saveWorkflowToBackend = async () => {
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
      
      // Show success notification
      console.log('Workflow saved successfully');
      return savedWorkflow;
    } catch (error) {
      console.error('Failed to save workflow:', error);
      // Handle error (show notification, etc.)
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Modify execute function to show dialog instead of executing directly
  const handleShowExecuteDialog = () => {
    setShowExecuteDialog(true);
  };

  // Function to execute workflow
  const executeWorkflow = async (inputs = {}) => {
    try {
      setIsLoading(true);
      
      if (!workflowMetadata.id) {
        // Save workflow first if it doesn't have an ID
        const savedWorkflow = await saveWorkflowToBackend();
        await workflowService.executeWorkflow(savedWorkflow.id, inputs);
      } else {
        await workflowService.executeWorkflow(workflowMetadata.id, inputs);
      }
      
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
      // Handle error (show notification, etc.)
    } finally {
      setIsLoading(false);
    }
  };

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
            onClick={saveWorkflowToBackend}
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
            onClick={handleShowExecuteDialog}
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
          onMouseDown={handleCanvasMouseDown}
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
                onClick={handleStepClick}
                onDragStart={handleNodeDragStart}
                onDrag={handleNodeDrag}
                onDragEnd={handleNodeDragEnd}
                onHeightChange={handleNodeHeightChange}
                isNew={step.isNew || animationManager.isAnimating(step.id)}
                isSelected={selectedNodeId === step.id}
                contextMenuConfig={step.contextMenuConfig}
                className="draggable-node"
              />
            ))}

            {/* Replace renderAddNodeButtons() call with AddNodeButtonRenderer component */}
            <AddNodeButtonRenderer
              workflowGraph={workflowGraph}
              menuState={menuState}
              handleShowAddMenu={handleShowAddMenu}
              handleShowBranchEdgeMenu={handleShowBranchEdgeMenu}
              handleShowBranchEndpointMenu={handleShowBranchEndpointMenu}
              pluginRegistry={pluginRegistry}
              edgeInputYOffset={edgeInputYOffset}
              edgeOutputYOffset={edgeOutputYOffset}
            />

            {/* Render menus inside canvas if attached to canvas */}
            {MENU_PLACEMENT.ATTACH_TO_CANVAS && (
              <WorkflowMenuManager
                menuState={menuState}
                workflowGraph={workflowGraph}
                transform={transform}
                buttonYOffset={buttonYOffset}
                onAddNode={handleAddStep}
                onCloseMenu={handleCloseMenu}
              />
            )}
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
              onClick={handleUndo}
              disabled={!canUndo}
              title="Undo"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              className={`p-2 rounded-full shadow focus:outline-none ${
                canRedo ? 'bg-white hover:bg-gray-50 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              onClick={handleRedo}
              disabled={!canRedo}
              title="Redo"
            >
              <RotateCw className="w-5 h-5" />
            </button>
          </div>

          {/* Render menus outside canvas if not attached to canvas */}
          {!MENU_PLACEMENT.ATTACH_TO_CANVAS && (
            <WorkflowMenuManager
              menuState={menuState}
              workflowGraph={workflowGraph}
              transform={transform}
              buttonYOffset={buttonYOffset}
              onAddNode={handleAddStep}
              onCloseMenu={handleCloseMenu}
            />
          )}
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
                onUpdate={handleUpdateNodeProperty}
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
        onExecute={executeWorkflow}
        workflowInputSchema={getWorkflowInputSchema()}
      />
    </div>
  );
};

export default AutomationWorkflow;
