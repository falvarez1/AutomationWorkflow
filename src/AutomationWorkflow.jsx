import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Edit2,
  Send,
  Plus,
  ChevronRight,
  Hexagon,
  Zap,
  ZoomIn,
  ZoomOut,
  Maximize,
  Move,
  GitBranch,
  GitMerge,
  Trash2,
  Copy,
  RotateCcw,
  RotateCw
} from 'lucide-react';

// Import Graph and command pattern components
import { Graph } from './components/AutomationWorkflow/graph/Graph';
import { 
  commandManager,
  AddNodeCommand,
  MoveNodeCommand,
  DeleteNodeCommand,
  UpdateNodeCommand,
  UpdateEdgeCommand
} from './components/AutomationWorkflow/commands';

// Import the plugin registry and plugins
import { pluginRegistry } from './components/AutomationWorkflow/plugins/registry';
import { TriggerNodePlugin } from './components/AutomationWorkflow/plugins/TriggerNodePlugin';
import { ControlNodePlugin } from './components/AutomationWorkflow/plugins/ControlNodePlugin';
import { ActionNodePlugin } from './components/AutomationWorkflow/plugins/ActionNodePlugin';
import { IfElseNodePlugin } from './components/AutomationWorkflow/plugins/IfElseNodePlugin';
import { SplitFlowNodePlugin } from './components/AutomationWorkflow/plugins/SplitFlowNodePlugin';

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
  INITIAL_WORKFLOW_STEPS
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

// Draggable Workflow Step Component
const WorkflowStep = ({ id, type, title, subtitle, position, transform, onClick, onDragStart, onDrag, onDragEnd, onHeightChange, isNew, isAnimating, isSelected, contextMenuConfig: propContextMenuConfig }) => {
  const nodeRef = useRef(null);
  const headerHeightRef = useRef(null); // Ref to cache the calculated header height
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [, setNodeHeight] = useState(DEFAULT_NODE_HEIGHT); // Only the setter is used
  const [hasRendered, setHasRendered] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuConfig] = useState(propContextMenuConfig || {
    position: 'right', // default position - now on the right
    offsetX: -5,
    offsetY: 0,
    orientation: 'vertical' // default orientation - vertical menu
  });
  const [wasJustClicked, setWasJustClicked] = useState(false);
  
  // Calculate and cache the header height when the component mounts
  useEffect(() => {
    // Calculate and store the header height in the ref
    headerHeightRef.current = calculateHeaderHeight();
    
    // Recalculate on window resize for responsive layouts
    const handleResize = () => {
      headerHeightRef.current = calculateHeaderHeight();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array means this runs once on mount

  // Show context menu when hovering or selected
  useEffect(() => {
    setShowContextMenu(isHovering || isSelected);
  }, [isHovering, isSelected]);

  // Handle initial animation after first render
  useEffect(() => {
    if (isNew && !hasRendered) {
      setTimeout(() => {
        setHasRendered(true);
      }, 50);
    }
  }, [isNew, hasRendered]);

  // Prevent deselection when clicking directly on a node
  useEffect(() => {
    if (wasJustClicked) {
      // Reset the flag after a short delay
      const timer = setTimeout(() => {
        setWasJustClicked(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [wasJustClicked]);

  // Different styles based on step type
  const getTypeConfig = () => {
    switch (type) {
      case NODE_TYPES.TRIGGER:
        return {
          label: <span className="px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded">Trigger</span>,
          icon: <Zap className="w-6 h-6 text-blue-500" />,
          borderColor: 'border-blue-200',
          hoverColor: 'hover:border-blue-400',
          selectedColor: 'border-blue-500',
          bgHover: 'hover:bg-blue-50'
        };
      case NODE_TYPES.CONTROL:
        return {
          label: <span className="px-3 py-1 text-sm font-medium text-white bg-purple-500 rounded">Control</span>,
          icon: <Hexagon className="w-6 h-6 text-purple-500" />,
          borderColor: 'border-purple-200',
          hoverColor: 'hover:border-purple-400',
          selectedColor: 'border-purple-500',
          bgHover: 'hover:bg-purple-50'
        };
      case NODE_TYPES.ACTION:
        return {
          label: <span className="px-3 py-1 text-sm font-medium text-white bg-red-500 rounded">Action</span>,
          icon: <Zap className="w-6 h-6 text-red-500" />,
          borderColor: 'border-red-200',
          hoverColor: 'hover:border-red-400',
          selectedColor: 'border-red-500',
          bgHover: 'hover:bg-red-50'
        };
      case NODE_TYPES.IFELSE:
        return {
          label: <span className="px-3 py-1 text-sm font-medium text-white bg-indigo-500 rounded">If/Else</span>,
          icon: <GitBranch className="w-6 h-6 text-indigo-500" />,
          borderColor: 'border-indigo-200',
          hoverColor: 'hover:border-indigo-400',
          selectedColor: 'border-indigo-500',
          bgHover: 'hover:bg-indigo-50'
        };
      case NODE_TYPES.SPLITFLOW:
        return {
          label: <span className="px-3 py-1 text-sm font-medium text-white bg-green-500 rounded">Split Flow</span>,
          icon: <GitMerge className="w-6 h-6 text-green-500" />,
          borderColor: 'border-green-200',
          hoverColor: 'hover:border-green-400',
          selectedColor: 'border-green-500',
          bgHover: 'hover:bg-green-50'
        };
      default:
        return {
          label: null,
          icon: null,
          borderColor: 'border-gray-200',
          hoverColor: 'hover:border-gray-400',
          selectedColor: 'border-gray-500',
          bgHover: 'hover:bg-gray-50'
        };
    }
  };

    // Function to calculate the header height
    const calculateHeaderHeight = () => {
    
      // If we can't find the header, calculate based on canvas position
      const canvasElement = document.getElementById('workflow-canvas');
      if (canvasElement && nodeRef.current) {
        const canvasRect = canvasElement.getBoundingClientRect();
        return canvasRect.top;
      }
      
      // Last resort fallback value
      return 145;
    };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only handle left-click

    // Set the clicked flag to prevent deselection
    setWasJustClicked(true);

    // Calculate the offset between mouse position and element position
    const rect = nodeRef.current.getBoundingClientRect();

    // Prevent division by zero or negative scale values
    const safeScale = Math.max(transform.scale, 0.1);
    
    // Calculate X coordinate conversion from screen to canvas
    const offsetX = (e.clientX - rect.left) / safeScale;
   
    let headerHeight = calculateHeaderHeight() || headerHeightRef.current || 0; // Fallback to 0 if headerHeight is not set

    // Get the current header height and apply proper scaling
    const scaledHeaderOffset = headerHeight / safeScale;
    const offsetY = (e.clientY - rect.top) / safeScale + scaledHeaderOffset;

    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);

    if (onDragStart) {
      onDragStart(id, position);
    }

    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (onDrag) {
        // Apply a smoother drag by using requestAnimationFrame
        requestAnimationFrame(() => {
          // Convert screen coordinates to canvas coordinates
          const canvasX = (e.clientX - transform.x) / transform.scale;
          const canvasY = (e.clientY - transform.y) / transform.scale;

          // Then apply the offset
          const newX = canvasX - dragOffset.x;
          const newY = canvasY - dragOffset.y;
          onDrag(id, newX, newY);
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (onDragEnd) {
        onDragEnd(id);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, id, dragOffset, onDrag, onDragEnd, transform]);

  const config = getTypeConfig();

  // Measure actual node height using ResizeObserver
  useEffect(() => {
    if (!nodeRef.current) return;

    const observer = new ResizeObserver(entries => {
      const height = entries[0].contentRect.height;
      setNodeHeight(height);

      // Report height change to parent component
      if (onHeightChange) {
        onHeightChange(id, height);
      }
    });

    observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, [id, onHeightChange]);

  // Determine the appropriate styles based on state
  const style = {
    position: 'absolute',
    left: position.x + 'px',
    top: position.y + 'px',
    width: `${DEFAULT_NODE_WIDTH}px`,
    height: 'auto', // Allow for natural height based on content
    zIndex: isDragging ? 100 : (isSelected ? 50 : 10), // Always above connection lines
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isNew && !hasRendered ? 0 : 1,
    transform: isNew && !hasRendered ? 'scale(0.9)' : 'scale(1)',
    transition: isDragging
      ? 'none'
      : 'left 0.3s ease, top 0.3s ease, opacity 0.3s ease, transform 0.3s ease, box-shadow 0.2s, border-color 0.2s'
  };

  // Handle context menu actions
  const handleContextMenuAction = (actionId) => {
    // Action triggered for node
    // Pass the action up to parent component if needed
    if (onClick) {
      onClick(id, actionId);
    }
  };

  return (
    <div
      ref={nodeRef}
      style={style}
      data-node-id={id}
      data-node-element="true"
      data-was-just-clicked={wasJustClicked ? "true" : "false"}
      className={`p-4 bg-white border-2 ${isSelected ? config.selectedColor : config.borderColor} ${!isDragging && config.hoverColor} rounded-lg ${isDragging ? 'shadow-xl' : 'shadow-sm hover:shadow-md'} ${config.bgHover}`}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={(e) => {
        if (!isDragging && onClick) {
          onClick(id);
          e.stopPropagation();
        }
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg border ${isSelected ? 'border-gray-300 bg-gray-50' : 'border-gray-200'} mr-3`}>
            {config.icon}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center">
          {config.label}
        </div>
      </div>

      {/* Floating context menu */}
      <NodeContextMenu
        visible={showContextMenu}
        nodeType={type}
        onAction={handleContextMenuAction}
        menuPosition={contextMenuConfig.position}
        offsetX={contextMenuConfig.offsetX}
        offsetY={contextMenuConfig.offsetY}
        orientation={contextMenuConfig.orientation}
      />

      {isDragging && (
        <div className="absolute inset-0 border-2 border-dashed border-gray-300 rounded-lg pointer-events-none"></div>
      )}
    </div>
  );
};

// Node Context Menu Component for displaying actions when hovering over a node
const NodeContextMenu = ({ position, nodeType, visible, onAction, menuPosition = 'bottom', offsetX = 0, offsetY = 0, orientation = 'vertical' }) => {
  if (!visible) return null;

  // Default menu items based on node type
  const getMenuItems = () => {
    const commonItems = [
      { id: 'edit', icon: <Edit2 className="w-4 h-4" />, label: 'Edit' },
      { id: 'duplicate', icon: <Copy className="w-4 h-4" />, label: 'Duplicate' },
      { id: 'delete', icon: <Trash2 className="w-4 h-4 text-red-500" />, label: 'Delete' }
    ];

    return commonItems;
  };

  // Calculate menu position based on configuration
  const getMenuStyles = () => {
    const baseStyle = {
      position: 'absolute',
      zIndex: 100
    };

    // Apply the configured position and offsets
    switch (menuPosition) {
      case 'top':
        return {
          ...baseStyle,
          bottom: '100%',
          left: `50%`,
          transform: `translateX(-50%) translateY(-${offsetY}px) translateX(${offsetX}px)`,
          marginBottom: '8px'
        };
      case 'right':
        return {
          ...baseStyle,
          left: `100%`,
          top: '50%',
          transform: `translateY(-50%) translateX(${offsetX}px) translateY(${offsetY}px)`,
          marginLeft: '8px'
        };
      case 'left':
        return {
          ...baseStyle,
          right: `100%`,
          top: '50%',
          transform: `translateY(-50%) translateX(-${offsetX}px) translateY(${offsetY}px)`,
          marginRight: '8px'
        };
      case 'bottom':
      default:
        return {
          ...baseStyle,
          top: '100%',
          left: `50%`,
          transform: `translateX(-50%) translateY(${offsetY}px) translateX(${offsetX}px)`,
          marginTop: '8px'
        };
    }
  };

  const menuItems = getMenuItems();
  const menuStyles = getMenuStyles();

  // Determine flex direction and spacing based on orientation
  const isVertical = orientation === 'vertical';
  const containerClass = isVertical
    ? "flex flex-col space-y-1"
    : "flex flex-row space-x-1";

  return (
    <div
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 animate-fadeIn node-context-menu"
      style={menuStyles}
    >
      <div className={containerClass}>
        {menuItems.map(item => (
          <button
            key={item.id}
            className="p-2 hover:bg-gray-100 rounded-md flex items-center justify-center w-9 h-9 transition-colors"
            onClick={() => onAction(item.id)}
            title={item.label}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

// Connector Line Component with Bezier Curves for smoother connections
const ConnectorLine = ({ startPos, endPos, isHighlighted = false, label = null }) => {
  // Use the positions as passed in - they're already positioned correctly
  // The startPos is the center bottom of the source node
  // The endPos is the center top of the target node
  const startX = startPos.x;
  const startY = startPos.y;
  const endX = endPos.x;
  const endY = endPos.y;

  // Calculate distance and control points
  const distance = Math.abs(endY - startY);
  const curveStrength = Math.min(distance * 0.4, 100);

  const ctrl1X = startX;
  const ctrl1Y = startY + curveStrength;
  const ctrl2X = endX;
  const ctrl2Y = endY - curveStrength;

  // Calculate label placement - position it closer to the source node for branches
  // This moves it to 1/4 of the way along the connection instead of the midpoint
  const labelPosition = label ? 0.3 : 0.5; // Closer to source if it has a label
  const midX = startX + (endX - startX) * labelPosition;
  const midY = startY + (endY - startY) * labelPosition;
  
  // For branch labels, position them higher up to avoid button overlap
  const labelOffsetY = label ? -15 : 0;

  const pathStyle = {
    stroke: isHighlighted ? '#3B82F6' : '#D1D5DB',
    strokeWidth: isHighlighted ? 3 : 2,
    fill: 'none',
    strokeDasharray: isHighlighted ? '5,5' : 'none'
  };

  return (
    <>
      <path
        d={`M ${startX} ${startY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${endX} ${endY}`}
        style={pathStyle}
      />
      {label && (
        <g transform={`translate(${midX}, ${midY + labelOffsetY})`}>
          <rect
            x="-30"
            y="-12"
            width="60"
            height="24"
            rx="4"
            ry="4"
            fill="white"
            stroke={isHighlighted ? '#3B82F6' : '#D1D5DB'}
            strokeWidth="1"
          />
          <text
            x="0"
            y="5"
            textAnchor="middle"
            fontSize="12"
            fontFamily="Arial, sans-serif"
            fill={isHighlighted ? '#3B82F6' : '#6B7280'}
          >
            {label}
          </text>
        </g>
      )}
    </>
  );
};

// Add Node Button Component with integrated menu
const AddNodeButton = ({ position, nodeWidth, buttonSize, onAdd, isHighlighted = false, onMouseEnter, onMouseLeave, showMenu = false, sourceNodeId = 'none', sourceType = 'standard' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef(null); // Add ref to get button position for menu
  
  // Handle mouse events directly instead of using isMenuHovered state
  const handleMouseEnter = () => {
    setIsHovered(true);
    onMouseEnter?.();
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    onMouseLeave?.();
  };
  
  return (
    <div
      ref={buttonRef}
      style={{
        position: 'absolute',
        left: (position.x - (buttonSize / 2)) + 'px', // Center directly on the position point
        top: (position.y - (buttonSize / 2)) + 'px', // Center vertically too
        zIndex: 5, // Between lines (0) and nodes (10+)
      }}
      data-node-element="true"
      data-source-node-id={sourceNodeId}
      data-button-type={sourceType}
      className="add-node-button"
    >
      <button
        style={{
          transition: 'transform 0.2s, box-shadow 0.2s, background-color 0.2s'
        }}
        onClick={(e) => {
          onAdd(e);
          e.stopPropagation();
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`flex items-center justify-center w-10 h-10 rounded-full
          ${isHovered || isHighlighted ? 'bg-blue-600 shadow-lg transform scale-110' : 'bg-blue-500 shadow'}
          text-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2`}
      >
        <Plus className="w-6 h-6" />
        
        {/* Show tooltip on hover (only if menu is not shown) */}
        {isHovered && !showMenu && (
          <div className="absolute top-full mt-2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-50">
            Add node
          </div>
        )}
      </button>
    </div>
  );
};

// Main Automation Workflow Component
const AutomationWorkflow = () => {
  // Canvas pan and zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: .8 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPos, setStartPanPos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  
  // Add state for undo/redo capabilities
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Initialize the graph state from the initial workflow steps
  const [workflowGraph, setWorkflowGraph] = useState(() => 
    Graph.fromWorkflowSteps(INITIAL_WORKFLOW_STEPS)
  );

  // State for selection and UI interactions
  const [activeTab, setActiveTab] = useState('flow');
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [activeAddButtonNodeId, setActiveAddButtonNodeId] = useState(null);
  const [activeBranchButton, setActiveBranchButton] = useState(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [highlightedConnection, setHighlightedConnection] = useState(null);
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
        return { x: node.position.x - 150 + (DEFAULT_NODE_WIDTH / 2), y: startY + 100 };
      } else if (branchId === 'no') {
        return { x: node.position.x + 150 + (DEFAULT_NODE_WIDTH / 2), y: startY + 100 };
      } else {
        // Return null for invalid branch IDs to prevent unwanted buttons
        return null;
      }
    } else if (node.type === NODE_TYPES.SPLITFLOW) {
      // Similar logic for splitflow branches
      const branches = pluginRegistry.getNodeType('splitflow').getBranches(node);
      const index = branches.findIndex(b => b.id === branchId);
      
      if (branchId === 'other' || index === branches.length - 1) {
        return { x: node.position.x + 150 + (DEFAULT_NODE_WIDTH / 2), y: startY + 100 };
      } else {
        return { x: node.position.x - 150 + (DEFAULT_NODE_WIDTH / 2), y: startY + 100 };
      }
    }
    
    // Default return for other node types
    return { x: startX, y: startY };
  }, []);
  
  // Auto-hide menu timer
  const menuHideTimerRef = useRef(null);
  const [isMouseOverMenuOrButton, setIsMouseOverMenuOrButton] = useState(false);
  
  // Functions to clear and start the auto-hide timer - memoized to prevent recreation on each render
  const clearMenuHideTimer = useCallback(() => {
    if (menuHideTimerRef.current) {
      clearTimeout(menuHideTimerRef.current);
      menuHideTimerRef.current = null;
    }
  }, []);
  
  const startMenuHideTimer = useCallback(() => {
    clearMenuHideTimer();
    menuHideTimerRef.current = setTimeout(() => {
      if (!isMouseOverMenuOrButton) {
        setActiveAddButtonNodeId(null);
      }
    }, AUTO_HIDE_TIMEOUT);
  }, [clearMenuHideTimer, isMouseOverMenuOrButton]);
  
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
  
  // Mouse over menu/button tracking functions
  const handleMenuMouseEnter = useCallback(() => {
    clearMenuHideTimer();
    setIsMouseOverMenuOrButton(true);
  }, [clearMenuHideTimer]);
  
  const handleMenuMouseLeave = useCallback(() => {
    setIsMouseOverMenuOrButton(false);
  }, []);
  
  // Close menus when clicking outside or on another node
  useEffect(() => {
    // Handle click outside events
    const handleClickOutside = (e) => {
      // Check if clicking on a node or node-related element
      const clickedNodeElement = e.target.closest('[data-node-element="true"]');
      const isClickingAddButton = clickedNodeElement && clickedNodeElement.classList.contains('add-node-button');
      const isClickingNode = clickedNodeElement && !isClickingAddButton;
      const isClickingMenu = e.target.closest('.node-menu');
      
      // Only handle the context menu closing
      if (showNodeMenu && !isClickingMenu) {
        setShowNodeMenu(false);
      }
      
      // Handle add button menu closing
      if (activeAddButtonNodeId !== null) {
        // Close menu when clicking on any node that's not an add button
        if (isClickingNode) {
          setActiveAddButtonNodeId(null);
          clearMenuHideTimer();
        }
        // Or when clicking anywhere else (except the menu or add button)
        else if (!isClickingMenu && !isClickingAddButton) {
          setActiveAddButtonNodeId(null);
          clearMenuHideTimer();
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearMenuHideTimer();
    };
  }, [showNodeMenu, activeAddButtonNodeId, clearMenuHideTimer]);
  
  // Start auto-hide timer when menu is opened
  useEffect(() => {
    if (activeAddButtonNodeId !== null && !isMouseOverMenuOrButton) {
      startMenuHideTimer();
    } else {
      clearMenuHideTimer();
    }
    
    return () => clearMenuHideTimer();
  }, [activeAddButtonNodeId, isMouseOverMenuOrButton, clearMenuHideTimer, startMenuHideTimer]);
  
  // Add a ref to track if we just clicked a node
  const justClickedNodeRef = useRef(false);
  
  // Modified handle canvas mouse down to respect just-clicked nodes
  const handleCanvasMouseDown = (e) => {
    // Check if the click was on the canvas background
    const isClickingNode = e.target.closest('[data-node-element="true"]');
    
    // Check if any node was just clicked to prevent deselection
    const wasJustClicked = isClickingNode && 
      isClickingNode.getAttribute('data-was-just-clicked') === 'true';
    
    // Only consider it a canvas click if we're clicking directly on the canvas element
    // and not on a node element
    if (e.button === 0 && !isClickingNode) {
      // This is a direct click on the canvas background
      setIsPanning(true);
      setStartPanPos({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      
      // Deselect nodes only on direct canvas background clicks
      // and if we didn't just click a node
      if (!justClickedNodeRef.current) {
        setSelectedNodeId(null);
      }
      
      e.preventDefault();
    }
    
    // Reset the just clicked ref
    justClickedNodeRef.current = wasJustClicked;
  };
  
  // Handle canvas mouse move for panning with improved smoothness
  useEffect(() => {
    if (!isPanning) return;
    
    const handleMouseMove = (e) => {
      requestAnimationFrame(() => {
        setTransform(prev => ({
          ...prev,
          x: e.clientX - startPanPos.x,
          y: e.clientY - startPanPos.y
        }));
      });
    };
    
    const handleMouseUp = () => {
      setIsPanning(false);
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
  }, []);

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

  // Handle adding a new step
  const handleAddStep = useCallback((nodeId, nodeType, connectionType = CONNECTION_TYPES.DEFAULT, branchId = null) => {
    const sourceNode = workflowGraph.getNode(nodeId);
    if (!sourceNode) return;
    
    // Calculate position for new node
    let newPos;
    
    if (connectionType === CONNECTION_TYPES.BRANCH && branchId) {
      // For branch connections, use the branch endpoint position
      const branchEndpoint = getBranchEndpoint(sourceNode, branchId);
      newPos = {
        x: branchEndpoint.x - (DEFAULT_NODE_WIDTH / 2), // Adjust to place node centered on endpoint
        y: branchEndpoint.y + 50 // Place node below the endpoint
      };
    } else {
      // For standard connections, place new node below the source node
      newPos = {
        x: sourceNode.position.x,
        y: sourceNode.position.y + 175
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
    
    // Close any open menus
    setActiveAddButtonNodeId(null);
    setActiveBranchButton(null);
  }, [workflowGraph, createNewNode, getBranchEndpoint]);

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
  
  // Handle showing the add node menu
  const handleShowAddMenu = useCallback((nodeId, e) => {
    // Don't show menu if node doesn't exist
    if (!workflowGraph.getNode(nodeId)) return;
    
    // Toggle the active button - if this button is already active, close it
    setActiveAddButtonNodeId(prevId => prevId === nodeId ? null : nodeId);
    
    // If opening, reset any active branch buttons
    if (activeAddButtonNodeId !== nodeId) {
      setActiveBranchButton(null);
    }
    
    e.stopPropagation();
  }, [workflowGraph, activeAddButtonNodeId]);
  
  // Handle showing the branch endpoint menu
  const handleShowBranchEndpointMenu = useCallback((nodeId, branchId, e) => {
    // Don't show menu if node doesn't exist
    if (!workflowGraph.getNode(nodeId)) return;
    
    // Toggle the active branch button
    setActiveBranchButton(prev => {
      if (prev && prev.nodeId === nodeId && prev.branchId === branchId) {
        return null;
      }
      return { nodeId, branchId };
    });
    
    // If opening, reset any active add buttons
    if (!activeBranchButton || activeBranchButton.nodeId !== nodeId || activeBranchButton.branchId !== branchId) {
      setActiveAddButtonNodeId(null);
    }
    
    e.stopPropagation();
  }, [workflowGraph, activeBranchButton]);
  
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
  // Render standard connections
  // Render standard connections
  workflowGraph.getAllEdges().forEach(edge => {
      const sourceNode = workflowGraph.getNode(edge.sourceId);
      const targetNode = workflowGraph.getNode(edge.targetId);
      
      if (!sourceNode || !targetNode) return;
      
      let connectionPoints;
      
      if (edge.type === CONNECTION_TYPES.DEFAULT) {
        connectionPoints = calculateConnectionPoints(sourceNode, targetNode);
      } else if (edge.type === CONNECTION_TYPES.BRANCH) {
        connectionPoints = calculateBranchConnectionPoints(sourceNode, targetNode, edge.label);
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
        
        buttons.push(
          <AddNodeButton
            key={`add-button-edge-${edge.sourceId}-${edge.targetId}-${edge.type}`}
            position={buttonPosition}
            nodeWidth={0} // Not node-relative anymore
            buttonSize={BUTTON_SIZE}
            onAdd={(e) => handleShowAddMenu(edge.sourceId, e)}
            isHighlighted={activeAddButtonNodeId === edge.sourceId}
            onMouseEnter={() => {}} // No action needed
            onMouseLeave={() => {}} // No action needed
            showMenu={activeAddButtonNodeId === edge.sourceId}
            sourceNodeId={edge.sourceId}
            sourceType="standard"
          />
        );
      }
    });
    
    // Add dashed edge and button for nodes that don't have outgoing edges
    workflowGraph.getAllNodes().forEach((node) => {
      const hasOutgoingEdge = workflowGraph.getOutgoingEdges(node.id).length > 0;
      
      // Only add a dashed edge and button if there are no outgoing edges
      if (!hasOutgoingEdge) {
        const startPos = {
          x: node.position.x + (DEFAULT_NODE_WIDTH / 2),
          y: node.position.y + (node.height || DEFAULT_NODE_HEIGHT)
        };
        
        const endPos = {
          x: startPos.x,
          y: startPos.y + 70 // Distance for dashed edge
        };
        
        const buttonPosition = {
          x: endPos.x,
          y: endPos.y
        };
        
        // Add dashed edge
        buttons.push(
          <svg
            key={`dashed-edge-${node.id}`}
            className="absolute pointer-events-none"
            style={{
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'visible',
              zIndex: 4 // Between edges (0) and nodes (10+)
            }}
          >
            <path
              d={`M ${startPos.x} ${startPos.y} L ${endPos.x} ${endPos.y}`}
              stroke="#D1D5DB"
              strokeWidth="2"
              strokeDasharray="5,5"
              fill="none"
            />
          </svg>
        );
        
        // Add "Add a step" button at end of dashed line
        buttons.push(
          <div
            key={`add-step-button-${node.id}`}
            className="absolute flex items-center justify-center"
            style={{
              top: buttonPosition.y - 10, // Adjust to center it
              left: buttonPosition.x - 70, // Adjust to center it
              width: 140,
              borderRadius: 20,
              zIndex: 5
            }}
          >
            <button
              className="flex items-center justify-center gap-2 bg-white border border-blue-300 text-blue-500 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all"
              onClick={(e) => handleShowAddMenu(node.id, e)}
            >
              <Plus size={16} className="text-blue-500" />
              <span>Add a step</span>
            </button>
          </div>
        );
      }
      
      // Add branch endpoint buttons for IF/ELSE and SPLIT FLOW nodes

    });
    
    return buttons;
  }, [
    workflowGraph,
    activeAddButtonNodeId,
    handleShowAddMenu,
    calculateConnectionPoints,
    calculateBranchConnectionPoints
  ]);
  
  // Render the add node menu when active
  const renderActiveAddNodeMenu = useCallback(() => {
    if (!activeAddButtonNodeId) return null;
    
    const sourceNode = workflowGraph.getNode(activeAddButtonNodeId);
    if (!sourceNode) return null;
    
    const menuPosition = {
      x: sourceNode.position.x + (DEFAULT_NODE_WIDTH / 2),
      y: sourceNode.position.y + (sourceNode.height || DEFAULT_NODE_HEIGHT) + buttonYOffset + BUTTON_SIZE + 10
    };
    
    return (
      <div 
        className="absolute bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10 node-menu"
        style={{
          left: `${menuPosition.x}px`,
          top: `${menuPosition.y}px`,
          transform: 'translateX(-50%)'
        }}
        onMouseEnter={handleMenuMouseEnter}
        onMouseLeave={handleMenuMouseLeave}
      >
        <div className="flex space-x-2">
          <button 
            className="p-2 flex flex-col items-center text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md w-20 h-20"
            onClick={() => handleAddStep(activeAddButtonNodeId, NODE_TYPES.TRIGGER)}
          >
            <Zap className="w-6 h-6 mb-1" />
            Trigger
          </button>
          <button 
            className="p-2 flex flex-col items-center text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md w-20 h-20"
            onClick={() => handleAddStep(activeAddButtonNodeId, NODE_TYPES.CONTROL)}
          >
            <Hexagon className="w-6 h-6 mb-1" />
            Control
          </button>
          <button 
            className="p-2 flex flex-col items-center text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded-md w-20 h-20"
            onClick={() => handleAddStep(activeAddButtonNodeId, NODE_TYPES.ACTION)}
          >
            <Send className="w-6 h-6 mb-1" />
            Action
          </button>
        </div>
        <div className="flex space-x-2 mt-2">
          <button 
            className="p-2 flex flex-col items-center text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md w-20 h-20"
            onClick={() => handleAddStep(activeAddButtonNodeId, NODE_TYPES.IFELSE)}
          >
            <GitBranch className="w-6 h-6 mb-1" />
            If/Else
          </button>
          <button 
            className="p-2 flex flex-col items-center text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded-md w-20 h-20"
            onClick={() => handleAddStep(activeAddButtonNodeId, NODE_TYPES.SPLITFLOW)}
          >
            <GitMerge className="w-6 h-6 mb-1" />
            Split Flow
          </button>
        </div>
      </div>
    );
  }, [
    activeAddButtonNodeId, 
    workflowGraph, 
    buttonYOffset, 
    handleMenuMouseEnter, 
    handleMenuMouseLeave, 
    handleAddStep
  ]);
  
  // Render the branch endpoint menu when active
  const renderActiveBranchEndpointMenu = useCallback(() => {
    if (!activeBranchButton) return null;
    
    const { nodeId, branchId } = activeBranchButton;
    const sourceNode = workflowGraph.getNode(nodeId);
    if (!sourceNode) return null;
    
    const branchEndpoint = getBranchEndpoint(sourceNode, branchId);
    
    const menuPosition = {
      x: branchEndpoint.x,
      y: branchEndpoint.y + BUTTON_SIZE + 10
    };
    
    return (
      <div 
        className="absolute bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10 node-menu"
        style={{
          left: `${menuPosition.x}px`,
          top: `${menuPosition.y}px`,
          transform: 'translateX(-50%)'
        }}
        onMouseEnter={handleMenuMouseEnter}
        onMouseLeave={handleMenuMouseLeave}
      >
        <div className="flex space-x-2">
          <button 
            className="p-2 flex flex-col items-center text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md w-20 h-20"
            onClick={() => handleAddStep(nodeId, NODE_TYPES.TRIGGER, CONNECTION_TYPES.BRANCH, branchId)}
          >
            <Zap className="w-6 h-6 mb-1" />
            Trigger
          </button>
          <button 
            className="p-2 flex flex-col items-center text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md w-20 h-20"
            onClick={() => handleAddStep(nodeId, NODE_TYPES.CONTROL, CONNECTION_TYPES.BRANCH, branchId)}
          >
            <Hexagon className="w-6 h-6 mb-1" />
            Control
          </button>
          <button 
            className="p-2 flex flex-col items-center text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded-md w-20 h-20"
            onClick={() => handleAddStep(nodeId, NODE_TYPES.ACTION, CONNECTION_TYPES.BRANCH, branchId)}
          >
            <Send className="w-6 h-6 mb-1" />
            Action
          </button>
        </div>
      </div>
    );
  }, [
    activeBranchButton, 
    workflowGraph, 
    getBranchEndpoint, 
    handleMenuMouseEnter, 
    handleMenuMouseLeave, 
    handleAddStep
  ]);

  // We're now passing pluginRegistry directly to NodePropertiesPanel

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
            backgroundImage: 'radial-gradient(circle, #E5E7EB 1px, transparent 1px)',
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
              {renderConnections()}
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

            {/* Add node buttons */}
            {renderAddNodeButtons()}

            {/* Active Add Node Menu */}
            {renderActiveAddNodeMenu()}

            {/* Active Branch Endpoint Menu */}
            {renderActiveBranchEndpointMenu()}
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
        </div>

        {/* Properties panel */}
        {selectedNode && (
          <div className="w-1/3 max-w-md border-l border-gray-200 bg-white overflow-y-auto animate-slideIn">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  Node Properties
                </h2>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

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