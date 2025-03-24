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
  MENU_PLACEMENT
} from './components/AutomationWorkflow/constants';

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
  gridOptions = {}, // Allow grid options to be passed as props
  nodePlacementOptions = {} // Add node placement options
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
    
    // Replace with consolidated menu close
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
  

  return (
    <div className="flex flex-col h-screen bg-gray-50">
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
        {/* Additional tabs could be added here */}
      </div>

      {/* Main content area */}
      <div className="flex-grow flex overflow-hidden">
        {/* Canvas area */}
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
                isNew={step.isNew || animatingNodes.includes(step.id)}
                isSelected={selectedNodeId === step.id}
                contextMenuConfig={step.contextMenuConfig}
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

        {/* Properties panel */}
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
    </div>
  );
};

export default AutomationWorkflow;
