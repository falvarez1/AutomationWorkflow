import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
import {
  commandManager,
  AddNodeCommand,
  MoveNodeCommand,
  DeleteNodeCommand,
  UpdateNodeCommand
} from './components/AutomationWorkflow/commands';

// Import the plugin registry and plugins
import { pluginRegistry } from './components/AutomationWorkflow/plugins/registry';
import { TriggerNodePlugin } from './components/AutomationWorkflow/plugins/TriggerNodePlugin';
import { ControlNodePlugin } from './components/AutomationWorkflow/plugins/ControlNodePlugin';
import { ActionNodePlugin } from './components/AutomationWorkflow/plugins/ActionNodePlugin';
import { IfElseNodePlugin } from './components/AutomationWorkflow/plugins/IfElseNodePlugin';
import { SplitFlowNodePlugin } from './components/AutomationWorkflow/plugins/SplitFlowNodePlugin';

// Import UI components
import WorkflowStep from './components/AutomationWorkflow/ui/WorkflowStep';
import ConnectorLine from './components/AutomationWorkflow/ui/ConnectorLine';
import AddNodeButton from './components/AutomationWorkflow/ui/AddNodeButton';

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
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  GRID_SIZE,
  ZOOM_MIN,
  ZOOM_MAX,
  AUTO_HIDE_TIMEOUT,
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
} from './components/AutomationWorkflow/constants';

// Import the refactored menu system
import { 
  menuFactory, 
  MenuProvider, 
  useMenuSystem,
  NodeTypeMenu, 
  NodeContextMenu, 
  BranchMenu 
} from './components/AutomationWorkflow/menus';

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

// Register menu types with the factory
menuFactory.registerMenuType('nodeType', NodeTypeMenu);
menuFactory.registerMenuType('nodeContext', NodeContextMenu);
menuFactory.registerMenuType('branch', BranchMenu);

// Main Automation Workflow Component
const AutomationWorkflow = ({ 
  initialWorkflowSteps = INITIAL_WORKFLOW_STEPS,
  gridOptions = {}, // Allow grid options to be passed as props
  nodePlacementOptions = {} // Add node placement options
}) => {
  // Canvas pan and zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: .8 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPos, setStartPanPos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const transformRef = useRef(transform);
  
  // Initialize menu system
  const menuSystem = useMenuSystem();
  
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
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [dragStartPosition, setDragStartPosition] = useState(null);
  
  // Convert graph nodes to array for rendering compatibility
  const workflowSteps = useMemo(() => {
    return workflowGraph.getAllNodes();
  }, [workflowGraph]);

  // Find the currently selected node
  const selectedNode = useMemo(() => {
    return selectedNodeId ? workflowGraph.getNode(selectedNodeId) : null;
  }, [workflowGraph, selectedNodeId]);

  // Configurable offsets
  const [edgeInputYOffset] = useState(EDGE_INPUT_Y_OFFSET);
  const [edgeOutputYOffset] = useState(EDGE_OUTPUT_Y_OFFSET);
  
  // Helper function to calculate branch endpoints for ifelse and splitflow nodes
  const getBranchEndpoint = useCallback((node, branchId) => {
    const startX = node.position.x + (DEFAULT_NODE_WIDTH / 2);
    const startY = node.position.y + (node.height || DEFAULT_NODE_HEIGHT);
    
    if (node.type === NODE_TYPES.IFELSE) {
      // For IFELSE nodes, we only have two valid branch IDs: 'yes' and 'no'
      if (branchId === 'yes') {
        return { x: node.position.x - 65 + (DEFAULT_NODE_WIDTH / 2), y: startY + 40 };
      } else if (branchId === 'no') {
        return { x: node.position.x + 65 + (DEFAULT_NODE_WIDTH / 2), y: startY + 40 };
      } else {
        // Return null for invalid branch IDs to prevent unwanted buttons
        return null;
      }
    } else if (node.type === NODE_TYPES.SPLITFLOW) {
      // Get all branches for this split flow node
      const branches = pluginRegistry.getNodeType('splitflow').getBranches(node.properties);
      const index = branches.findIndex(b => b.id === branchId);
      
      if (index === -1) {
        return null; // Invalid branch ID
      }
      
      // Get the total number of branches to determine spacing
      const totalBranches = branches.length;
      
      // Calculate spacing between branches
      // For 2 branches: positions at -65 and +65 (similar to IfElse)
      // For 3 branches: positions at -120, 0, and +120
      const spacing = totalBranches === 2 ? 130 : 120;
      
      // Calculate position based on index and total branches
      const startPosition = -(spacing * (totalBranches - 1)) / 2;
      const xOffset = startPosition + (index * spacing);
      
      return { x: startX + xOffset, y: startY + 40 };
    }
    
    // Default return for other node types
    return { x: startX, y: startY };
  }, []);

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
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        // Calculate zoom point (mouse position)
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate point in graph coordinates
        const graphX = (mouseX - transform.x) / transform.scale;
        const graphY = (mouseY - transform.y) / transform.scale;
        
        // Calculate zoom factor based on delta magnitude
        // This makes it less sensitive for trackpads which often generate small delta values
        const absDelta = Math.abs(e.deltaY);
        
        // Reduced sensitivity factor (smaller number = less sensitive)
        const sensitivity = 0.009;
        
        // Calculate a proportional zoom factor based on the scroll amount
        // Clamp it to a reasonable range to prevent too aggressive zooming
        const baseZoomChange = Math.min(Math.max(absDelta * sensitivity, 0.01), 0.05);
        
        // Apply direction (zoom in or out)
        const zoomFactor = e.deltaY < 0
          ? 1 + baseZoomChange  // Zoom in: slightly above 1 (e.g., 1.01 to 1.05)
          : 1 - baseZoomChange; // Zoom out: slightly below 1 (e.g., 0.99 to 0.95)
        
        setTransform(prev => {
          const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prev.scale * zoomFactor));
          
          // Adjust position to zoom toward mouse point
          const newX = mouseX - graphX * newScale;
          const newY = mouseY - graphY * newScale;
          
          return {
            x: newX,
            y: newY,
            scale: newScale
          };
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
    
    commandManager.executeCommand({
      execute: () => {
        addNodeCommand.execute();
        // Update the graph state after command execution
        setWorkflowGraph(new Graph());
        setWorkflowGraph(prevGraph => {
          const newGraph = new Graph();
          
          // Copy all nodes from the updated graph
          addNodeCommand.graph.getAllNodes().forEach(node => {
            newGraph.addNode({ ...node });
          });
          
          // Copy all edges from the updated graph
          addNodeCommand.graph.getAllEdges().forEach(edge => {
            newGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
          });
          
          return newGraph;
        });
        
        // Track the new node for animation
        setAnimatingNodes(prev => [...prev, newNode.id]);
        setTimeout(() => {
          setAnimatingNodes(prev => prev.filter(id => id !== newNode.id));
        }, 300);
        
        return true;
      },
      undo: () => {
        addNodeCommand.undo();
        // Update the graph state after undo
        setWorkflowGraph(new Graph());
        setWorkflowGraph(prevGraph => {
          const newGraph = new Graph();
          
          // Copy all nodes from the updated graph
          addNodeCommand.graph.getAllNodes().forEach(node => {
            newGraph.addNode({ ...node });
          });
          
          // Copy all edges from the updated graph
          addNodeCommand.graph.getAllEdges().forEach(edge => {
            newGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
          });
          
          return newGraph;
        });
        
        return true;
      }
    });
    
    // Hide all menus
    menuSystem.hideAllMenus();
  }, [workflowGraph, createNewNode, getBranchEndpoint, 
    standardVerticalSpacing, branchVerticalSpacing, 
    branchLeftOffset, branchRightOffset, menuSystem]);

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

  // Initialize menu system
  useEffect(() => {
    // Register standard node type menu
    menuSystem.registerMenu('nodeType', 'add-node-menu', {
      positioning: {
        type: 'bottom',
        options: { offsetY: 10 }
      },
      autoHide: true,
      autoHideTimeout: AUTO_HIDE_TIMEOUT
    });
    
    // Register node context menu
    menuSystem.registerMenu('nodeContext', 'node-context-menu', {
      positioning: {
        type: 'right',
        options: { offsetX: 10 }
      },
      autoHide: true,
      autoHideTimeout: AUTO_HIDE_TIMEOUT
    });
    
    // Register branch menu
    menuSystem.registerMenu('branch', 'branch-menu', {
      positioning: {
        type: 'branchEndpoint',
        options: { offsetY: 5 }
      },
      autoHide: true,
      autoHideTimeout: AUTO_HIDE_TIMEOUT
    });
    
    // Register edge menu
    menuSystem.registerMenu('nodeType', 'edge-menu', {
      positioning: {
        type: 'edgeMidpoint',
        options: { offsetY: 0 }
      },
      autoHide: true,
      autoHideTimeout: AUTO_HIDE_TIMEOUT
    });
    
    return () => {
      // Hide all menus on cleanup
      menuSystem.hideAllMenus();
    };
  }, [menuSystem]);

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
    
    // Create and execute delete command
    const deleteNodeCommand = new DeleteNodeCommand(workflowGraph, nodeId);
    
    commandManager.executeCommand({
      execute: () => {
        deleteNodeCommand.execute();
        
        // Update graph state after command execution
        setWorkflowGraph(new Graph());
        setWorkflowGraph(prevGraph => {
          const newGraph = new Graph();
          
          // Copy all nodes from the updated graph
          deleteNodeCommand.graph.getAllNodes().forEach(node => {
            newGraph.addNode({ ...node });
          });
          
          // Copy all edges from the updated graph
          deleteNodeCommand.graph.getAllEdges().forEach(edge => {
            newGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
          });
          
          return newGraph;
        });
        
        // Clear selected node if it was deleted
        if (selectedNodeId === nodeId) {
          setSelectedNodeId(null);
        }
        
        return true;
      },
      undo: () => {
        deleteNodeCommand.undo();
        
        // Update graph state after undo
        setWorkflowGraph(new Graph());
        setWorkflowGraph(prevGraph => {
          const newGraph = new Graph();
          
          // Copy all nodes from the updated graph
          deleteNodeCommand.graph.getAllNodes().forEach(node => {
            newGraph.addNode({ ...node });
          });
          
          // Copy all edges from the updated graph
          deleteNodeCommand.graph.getAllEdges().forEach(edge => {
            newGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
          });
          
          return newGraph;
        });
        
        return true;
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
          // Duplicate functionality could be added here
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
  }, [handleDeleteNode]);
  
  // Handle node context menu
  const handleNodeContextMenu = useCallback((nodeId, buttonRect) => {
    const node = workflowGraph.getNode(nodeId);
    if (!node) return;
    
    // Configure the context menu with node-specific handlers
    menuSystem.showMenu('node-context-menu', buttonRect, {
      nodeId,
      handlers: {
        edit: () => setSelectedNodeId(nodeId),
        delete: () => handleDeleteNode(nodeId),
        duplicate: () => console.log('Duplicate functionality not implemented')
      },
      hideOthers: true
    });
  }, [workflowGraph, menuSystem, handleDeleteNode]);
  
  // Handle showing the add node menu
  const handleShowAddMenu = useCallback((nodeId, e, buttonRect) => {
    // Don't show menu if node doesn't exist
    const sourceNode = workflowGraph.getNode(nodeId);
    if (!sourceNode) return;
    
    menuSystem.toggleMenu('add-node-menu', buttonRect, {
      sourceNodeId: nodeId,
      sourceNodeType: sourceNode.type,
      connectionType: CONNECTION_TYPES.DEFAULT,
      addNodeCallback: handleAddStep,
      hideOthers: true
    });
    
    e.stopPropagation();
  }, [workflowGraph, menuSystem, handleAddStep]);
  
  // Handle showing the branch endpoint menu
  const handleShowBranchEndpointMenu = useCallback((nodeId, branchId, e, buttonRect) => {
    // Don't show menu if node doesn't exist
    const sourceNode = workflowGraph.getNode(nodeId);
    if (!sourceNode) return;
    
    menuSystem.toggleMenu('branch-menu', buttonRect, {
      sourceNodeId: nodeId,
      sourceNodeType: sourceNode.type,
      branchId,
      addNodeCallback: handleAddStep,
      hideOthers: true
    });
    
    e.stopPropagation();
  }, [workflowGraph, menuSystem, handleAddStep]);
  
  // Handle showing the branch edge menu (when clicking + on a branch connection)
  const handleShowBranchEdgeMenu = useCallback((nodeId, branchId, e, buttonRect) => {
    // Don't show menu if node doesn't exist
    const sourceNode = workflowGraph.getNode(nodeId);
    if (!sourceNode) return;
    
    menuSystem.toggleMenu('branch-menu', buttonRect, {
      sourceNodeId: nodeId,
      sourceNodeType: sourceNode.type,
      branchId,
      connectionType: CONNECTION_TYPES.BRANCH,
      addNodeCallback: handleAddStep,
      hideOthers: true
    });
    
    e.stopPropagation();
  }, [workflowGraph, menuSystem, handleAddStep]);
  
  // Handle node drag with grid snapping
  const handleNodeDrag = useCallback((id, x, y) => {
    // Apply grid snapping if enabled
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
  }, []);
  
  // Handle node drag end
  const handleNodeDragEnd = useCallback((id) => {
    if (!dragStartPosition) return;
    
    const node = workflowGraph.getNode(id);
    if (!node) return;
    
    const currentPosition = node.position;
    
    // Only create a command if the position actually changed
    if (dragStartPosition.x !== currentPosition.x || dragStartPosition.y !== currentPosition.y) {
      // Create and execute a move command
      const moveNodeCommand = new MoveNodeCommand(
        workflowGraph,
        id,
        { ...dragStartPosition },
        { ...currentPosition }
      );
      
      commandManager.executeCommand({
        execute: () => {
          moveNodeCommand.execute();
          
          // Update graph state after command execution
          setWorkflowGraph(new Graph());
          setWorkflowGraph(prevGraph => {
            const newGraph = new Graph();
            
            // Copy all nodes from the updated graph
            moveNodeCommand.graph.getAllNodes().forEach(node => {
              newGraph.addNode({ ...node });
            });
            
            // Copy all edges from the updated graph
            moveNodeCommand.graph.getAllEdges().forEach(edge => {
              newGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
            });
            
            return newGraph;
          });
          
          return true;
        },
        undo: () => {
          moveNodeCommand.undo();
          
          // Update graph state after undo
          setWorkflowGraph(new Graph());
          setWorkflowGraph(prevGraph => {
            const newGraph = new Graph();
            
            // Copy all nodes from the updated graph
            moveNodeCommand.graph.getAllNodes().forEach(node => {
              newGraph.addNode({ ...node });
            });
            
            // Copy all edges from the updated graph
            moveNodeCommand.graph.getAllEdges().forEach(edge => {
              newGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
            });
            
            return newGraph;
          });
          
          return true;
        }
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
    
    commandManager.executeCommand({
      execute: () => {
        updateCommand.execute();
        
        // Update graph state after command execution
        setWorkflowGraph(new Graph());
        setWorkflowGraph(prevGraph => {
          const newGraph = new Graph();
          
          // Copy all nodes from the updated graph
          updateCommand.graph.getAllNodes().forEach(node => {
            newGraph.addNode({ ...node });
          });
          
          // Copy all edges from the updated graph
          updateCommand.graph.getAllEdges().forEach(edge => {
            newGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
          });
          
          return newGraph;
        });
        
        return true;
      },
      undo: () => {
        updateCommand.undo();
        
        // Update graph state after undo
        setWorkflowGraph(new Graph());
        setWorkflowGraph(prevGraph => {
          const newGraph = new Graph();
          
          // Copy all nodes from the updated graph
          updateCommand.graph.getAllNodes().forEach(node => {
            newGraph.addNode({ ...node });
          });
          
          // Copy all edges from the updated graph
          updateCommand.graph.getAllEdges().forEach(edge => {
            newGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
          });
          
          return newGraph;
        });
        
        return true;
      }
    });
  }, [workflowGraph]);
  
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
  
  // This function calculates the connection endpoints
  const calculateConnectionPoints = useCallback((sourceNode, targetNode) => {
    if (!sourceNode || !targetNode) return { startPos: null, endPos: null };
    
    const sourceX = sourceNode.position.x + (DEFAULT_NODE_WIDTH / 2);
    const sourceY = sourceNode.position.y + (sourceNode.height || DEFAULT_NODE_HEIGHT) + edgeOutputYOffset;
    
    const targetX = targetNode.position.x + (DEFAULT_NODE_WIDTH / 2);
    const targetY = targetNode.position.y + edgeInputYOffset;
    
    return {
      startPos: { x: sourceX, y: sourceY },
      endPos: { x: targetX, y: targetY }
    };
  }, [edgeInputYOffset, edgeOutputYOffset]);
  
  // Function to calculate branch connection points
  const calculateBranchConnectionPoints = useCallback((sourceNode, targetNode, branchId) => {
    if (!sourceNode || !targetNode || !branchId) return { startPos: null, endPos: null };
    
    const branchEndpoint = getBranchEndpoint(sourceNode, branchId);
    
    const targetX = targetNode.position.x + (DEFAULT_NODE_WIDTH / 2);
    const targetY = targetNode.position.y + edgeInputYOffset;
    
    return {
      startPos: branchEndpoint,
      endPos: { x: targetX, y: targetY }
    };
  }, [getBranchEndpoint, edgeInputYOffset]);

  // Render all connector lines between nodes
  const renderConnections = useCallback(() => {
    const connectors = [];
    
    workflowGraph.getAllEdges().forEach(edge => {
      const sourceNode = workflowGraph.getNode(edge.sourceId);
      const targetNode = workflowGraph.getNode(edge.targetId);
      
      if (!sourceNode || !targetNode) return;
      
      let connectionPoints;
      let edgeColor = BRANCH_EDGE_COLORS.DEFAULT; // Default gray color
      
      if (edge.type === CONNECTION_TYPES.DEFAULT) {
        connectionPoints = calculateConnectionPoints(sourceNode, targetNode);
      } else if (edge.type === CONNECTION_TYPES.BRANCH) {
        connectionPoints = calculateBranchConnectionPoints(sourceNode, targetNode, edge.label);
        
        // Apply color based on node type and branch label
        if (sourceNode.type === NODE_TYPES.IFELSE) {
          if (edge.label === 'yes') {
            edgeColor = BRANCH_EDGE_COLORS.IFELSE.YES;
          } else if (edge.label === 'no') {
            edgeColor = BRANCH_EDGE_COLORS.IFELSE.NO;
          }
        } else if (sourceNode.type === NODE_TYPES.SPLITFLOW) {
          // For split flow, use branch-specific colors or default
          const branchKey = `BRANCH_${edge.label}`;
          edgeColor = BRANCH_EDGE_COLORS.SPLITFLOW[branchKey] || BRANCH_EDGE_COLORS.SPLITFLOW.DEFAULT;
        }
      }
      
      // Check if this edge is connected to the selected node
      const isConnectedToSelectedNode = selectedNodeId &&
        (edge.sourceId === selectedNodeId || edge.targetId === selectedNodeId);
      
      if (connectionPoints && connectionPoints.startPos && connectionPoints.endPos) {
        connectors.push(
          <ConnectorLine
            key={`${edge.sourceId}-${edge.targetId}-${edge.type}-${edge.label || 'default'}`}
            startPos={connectionPoints.startPos}
            endPos={connectionPoints.endPos}
            isHighlighted={isConnectedToSelectedNode}
            label={edge.type === CONNECTION_TYPES.BRANCH ? edge.label : null}
            color={edgeColor}
          />
        );
      }
    });
    
    return connectors;
  }, [workflowGraph, calculateConnectionPoints, calculateBranchConnectionPoints, selectedNodeId]);
  
  // Render add node buttons on edge lines
  const renderAddNodeButtons = useCallback(() => {
    const buttons = [];
    
    // Render a button on each edge connection line (midway between source and target)
    workflowGraph.getAllEdges().forEach((edge) => {
      const sourceNode = workflowGraph.getNode(edge.sourceId);
      const targetNode = workflowGraph.getNode(edge.targetId);
      
      if (!sourceNode || !targetNode) return;
      
      let connectionPoints;
      
      // Calculate connection points based on the edge type
      if (edge.type === CONNECTION_TYPES.DEFAULT) {
        connectionPoints = calculateConnectionPoints(sourceNode, targetNode);
      } else if (edge.type === CONNECTION_TYPES.BRANCH) {
        connectionPoints = calculateBranchConnectionPoints(sourceNode, targetNode, edge.label);
      }
      
      if (connectionPoints && connectionPoints.startPos && connectionPoints.endPos) {
        // Calculate midpoint of the edge for button placement
        const midX = (connectionPoints.startPos.x + connectionPoints.endPos.x) / 2;
        const midY = (connectionPoints.startPos.y + connectionPoints.endPos.y) / 2;
        
        const buttonPosition = { x: midX, y: midY };
        
        // For branch edges, use handleShowBranchEdgeMenu instead
        const onAddHandler = edge.type === CONNECTION_TYPES.BRANCH
          ? (e, buttonRect) => handleShowBranchEdgeMenu(edge.sourceId, edge.label, e, buttonRect)
          : (e, buttonRect) => handleShowAddMenu(edge.sourceId, e, buttonRect);
        
        const isHighlighted = menuSystem.isMenuVisible(
          edge.type === CONNECTION_TYPES.BRANCH ? 'branch-menu' : 'add-node-menu'
        );
        
        buttons.push(
          <AddNodeButton
            key={`add-button-${edge.sourceId}-${edge.targetId}-${edge.type}-${edge.label || 'default'}`}
            position={buttonPosition}
            buttonSize={BUTTON_SIZE}
            onAdd={onAddHandler}
            isHighlighted={isHighlighted}
            sourceNodeId={edge.sourceId}
            sourceType={edge.type === CONNECTION_TYPES.DEFAULT ? 'standard' : 'branch'}
          />
        );
      }
    });
    
    return buttons;
  }, [
    workflowGraph, 
    calculateConnectionPoints, 
    calculateBranchConnectionPoints, 
    handleShowAddMenu, 
    handleShowBranchEdgeMenu,
    menuSystem
  ]);
  
  // Render branch endpoint buttons
  const renderBranchEndpointButtons = useCallback(() => {
    const buttons = [];
    
    // For each ifelse or splitflow node, render branch endpoint buttons
    workflowSteps.forEach(node => {
      if (node.type === NODE_TYPES.IFELSE || node.type === NODE_TYPES.SPLITFLOW) {
        let branchIds = [];
        
        if (node.type === NODE_TYPES.IFELSE) {
          branchIds = ['yes', 'no']; // Fixed branch IDs for ifelse
        } else if (node.type === NODE_TYPES.SPLITFLOW) {
          // Get branch IDs from the plugin based on node properties
          const splitflowPlugin = pluginRegistry.getNodeType('splitflow');
          const branches = splitflowPlugin.getBranches(node.properties);
          branchIds = branches.map(branch => branch.id);
        }
        
        // For each branch ID, get the endpoint position and render a button
        branchIds.forEach(branchId => {
          const branchEndpoint = getBranchEndpoint(node, branchId);
          if (!branchEndpoint) return;
          
          // Check if this branch already has a connection
          const hasBranchConnection = workflowGraph.getAllEdges().some(edge => 
            edge.sourceId === node.id && 
            edge.type === CONNECTION_TYPES.BRANCH && 
            edge.label === branchId
          );
          
          // If there's already a connection, don't show a button
          if (hasBranchConnection) return;
          
          const isHighlighted = 
            menuSystem.isMenuVisible('branch-menu');
          
          buttons.push(
            <AddNodeButton
              key={`branch-button-${node.id}-${branchId}`}
              position={branchEndpoint}
              buttonSize={BUTTON_SIZE}
              onAdd={(e, buttonRect) => handleShowBranchEndpointMenu(node.id, branchId, e, buttonRect)}
              isHighlighted={isHighlighted}
              sourceNodeId={node.id}
              sourceType="branch"
              branchId={branchId}
            />
          );
        });
      }
    });
    
    return buttons;
  }, [workflowSteps, workflowGraph, getBranchEndpoint, handleShowBranchEndpointMenu, menuSystem]);
  
  // Create a grid pattern for the background
  const renderGridPattern = useMemo(() => {
    if (!showGrid) return null;
    
    const gridId = 'workflow-grid';
    const gridSize = GRID_SIZE * transform.scale;
    
    return (
      <defs>
        <pattern 
          id={gridId} 
          width={gridSize} 
          height={gridSize} 
          patternUnits="userSpaceOnUse"
        >
          <circle 
            cx={gridSize / 2} 
            cy={gridSize / 2} 
            r={scaledGridDotSize / 2} 
            fill={gridColor} 
          />
        </pattern>
      </defs>
    );
  }, [showGrid, transform.scale, gridColor, scaledGridDotSize]);
  
  // Render toolbar controls
  const renderToolbar = () => (
    <div className="workflow-toolbar absolute top-4 right-4 bg-white p-2 rounded-lg shadow-md z-50 flex flex-col space-y-2">
      <button 
        onClick={() => handleZoom(1.1)} 
        className="p-2 rounded hover:bg-gray-100"
        title="Zoom In"
      >
        <ZoomIn className="w-5 h-5" />
      </button>
      <button 
        onClick={() => handleZoom(0.9)} 
        className="p-2 rounded hover:bg-gray-100"
        title="Zoom Out"
      >
        <ZoomOut className="w-5 h-5" />
      </button>
      <button 
        onClick={resetView} 
        className="p-2 rounded hover:bg-gray-100"
        title="Reset View"
      >
        <Maximize className="w-5 h-5" />
      </button>
      <button 
        onClick={handleUndo} 
        className={`p-2 rounded ${canUndo ? 'hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'}`}
        disabled={!canUndo}
        title="Undo"
      >
        <RotateCcw className="w-5 h-5" />
      </button>
      <button 
        onClick={handleRedo} 
        className={`p-2 rounded ${canRedo ? 'hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'}`}
        disabled={!canRedo}
        title="Redo"
      >
        <RotateCw className="w-5 h-5" />
      </button>
      <button 
        onClick={() => setSnapToGrid(!snapToGrid)} 
        className={`p-2 rounded ${snapToGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
        title={snapToGrid ? "Snap to Grid: On" : "Snap to Grid: Off"}
      >
        <Grid className="w-5 h-5" />
      </button>
    </div>
  );
  
  return (
    <div className="automation-workflow-container relative w-full h-screen overflow-hidden bg-gray-50">
      {/* Main Canvas */}
      <div
        ref={canvasRef}
        className="automation-workflow-canvas absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleCanvasMouseDown}
        style={{ touchAction: 'none' }} // Disable browser handling of touch events
      >
        {/* Canvas Content */}
        <div
          className="absolute inset-0 transform-gpu"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Grid Background */}
          {showGrid && (
            <svg 
              className="absolute inset-0 w-full h-full" 
              style={{ pointerEvents: 'none' }}
            >
              {renderGridPattern}
              <rect 
                x="-10000" 
                y="-10000" 
                width="20000" 
                height="20000" 
                fill={`url(#workflow-grid)`} 
              />
            </svg>
          )}
          
          {/* Connector Lines */}
          <div className="connector-lines-container">
            {renderConnections()}
          </div>
          
          {/* Workflow Nodes */}
          <div className="workflow-nodes-container">
            {workflowSteps.map(node => (
              <WorkflowStep
                key={node.id}
                node={node}
                nodePlugin={pluginRegistry.getNodeType(node.type)}
                isSelected={selectedNodeId === node.id}
                onClick={handleStepClick}
                onDrag={handleNodeDrag}
                onDragStart={handleNodeDragStart}
                onDragEnd={handleNodeDragEnd}
                onHeightChange={handleNodeHeightChange}
                onContextMenu={handleNodeContextMenu}
                isAnimating={animatingNodes.includes(node.id)}
              />
            ))}
          </div>
          
          {/* Add Node Buttons */}
          <div className="add-node-buttons-container">
            {renderAddNodeButtons()}
            {renderBranchEndpointButtons()}
          </div>
        </div>
      </div>
      
      {/* Toolbar */}
      {renderToolbar()}
      
      {/* Properties Panel (when a node is selected) */}
      {selectedNode && (
        <NodePropertiesPanel 
          node={selectedNode}
          onUpdateProperty={handleUpdateNodeProperty}
          onClose={() => setSelectedNodeId(null)}
          nodePlugin={pluginRegistry.getNodeType(selectedNode.type)}
        />
      )}
    </div>
  );
};

// Wrap AutomationWorkflow with MenuProvider
const AutomationWorkflowWithMenus = (props) => (
  <MenuProvider>
    <AutomationWorkflow {...props} />
  </MenuProvider>
);

export default AutomationWorkflowWithMenus;