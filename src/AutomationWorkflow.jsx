import React, { useState, useRef, useEffect, useCallback } from 'react';
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

// Import command pattern components
import { commandManager, DeleteNodeCommand, MoveNodeCommand, AddNodeCommand } from './components/AutomationWorkflow/commands';

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

// Constants
const DEFAULT_NODE_HEIGHT = 90;
const DEFAULT_NODE_WIDTH = 300;
const GRID_SIZE = 20;
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 2;
const AUTO_HIDE_TIMEOUT = 2500; // 2.5 seconds

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
    offsetX: 10,
    offsetY: 0
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
      case 'trigger':
        return {
          label: <span className="px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded">Trigger</span>,
          icon: <Zap className="w-6 h-6 text-blue-500" />,
          borderColor: 'border-blue-200',
          hoverColor: 'hover:border-blue-400',
          selectedColor: 'border-blue-500',
          bgHover: 'hover:bg-blue-50'
        };
      case 'control':
        return {
          label: <span className="px-3 py-1 text-sm font-medium text-white bg-purple-500 rounded">Control</span>,
          icon: <Hexagon className="w-6 h-6 text-purple-500" />,
          borderColor: 'border-purple-200',
          hoverColor: 'hover:border-purple-400',
          selectedColor: 'border-purple-500',
          bgHover: 'hover:bg-purple-50'
        };
      case 'action':
        return {
          label: <span className="px-3 py-1 text-sm font-medium text-white bg-red-500 rounded">Action</span>,
          icon: <Zap className="w-6 h-6 text-red-500" />,
          borderColor: 'border-red-200',
          hoverColor: 'hover:border-red-400',
          selectedColor: 'border-red-500',
          bgHover: 'hover:bg-red-50'
        };
      case 'ifelse':
        return {
          label: <span className="px-3 py-1 text-sm font-medium text-white bg-indigo-500 rounded">If/Else</span>,
          icon: <GitBranch className="w-6 h-6 text-indigo-500" />,
          borderColor: 'border-indigo-200',
          hoverColor: 'hover:border-indigo-400',
          selectedColor: 'border-indigo-500',
          bgHover: 'hover:bg-indigo-50'
        };
      case 'splitflow':
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
      />

      {isDragging && (
        <div className="absolute inset-0 border-2 border-dashed border-gray-300 rounded-lg pointer-events-none"></div>
      )}
    </div>
  );
};

// Node Context Menu Component for displaying actions when hovering over a node
const NodeContextMenu = ({ position, nodeType, visible, onAction, menuPosition = 'bottom', offsetX = 0, offsetY = 0 }) => {
  if (!visible) return null;

  // Default menu items based on node type
  const getMenuItems = () => {
    const commonItems = [
      { id: 'edit', icon: <Edit2 className="w-4 h-4" />, label: 'Edit' },
      { id: 'duplicate', icon: <Copy className="w-4 h-4" />, label: 'Duplicate' },
      { id: 'delete', icon: <Trash2 className="w-4 h-4 text-red-500" />, label: 'Delete' }
    ];

    switch (nodeType) {
      case 'trigger':
        return [
          ...commonItems,
          { id: 'configure-trigger', icon: <Zap className="w-4 h-4 text-blue-500" />, label: 'Configure Trigger' }
        ];
      case 'control':
        return [
          ...commonItems,
          { id: 'set-conditions', icon: <Hexagon className="w-4 h-4 text-purple-500" />, label: 'Set Conditions' }
        ];
      case 'action':
        return [
          ...commonItems,
          { id: 'configure-action', icon: <Send className="w-4 h-4 text-red-500" />, label: 'Configure Action' }
        ];
      case 'ifelse':
        return [
          ...commonItems,
          { id: 'configure-condition', icon: <GitBranch className="w-4 h-4 text-indigo-500" />, label: 'Configure Condition' }
        ];
      case 'splitflow':
        return [
          ...commonItems,
          { id: 'configure-split', icon: <GitMerge className="w-4 h-4 text-green-500" />, label: 'Configure Split' }
        ];
      default:
        return commonItems;
    }
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

  return (
    <div
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 animate-fadeIn node-context-menu"
      style={menuStyles}
    >
      <div className="flex flex-col space-y-1">
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
  // Static node dimensions (we're already using a constant NODE_WIDTH)

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
        left: position.x + (nodeWidth / 2) - (buttonSize / 2) + 'px', // Center on the node
        top: position.y + 'px',
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

// Add a new component for branch endpoint buttons that appears integrated with connector lines
const BranchEndpointButton = ({ position, buttonSize, onAdd, isHighlighted = false, onMouseEnter, onMouseLeave, showMenu = false, sourceNodeId = 'none', branchId = 'none' }) => {
  const [isHovered, setIsHovered] = useState(false);
  
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
      style={{
        position: 'absolute',
        left: position.x - (buttonSize / 2) + 'px', // Center on the endpoint
        top: position.y - (buttonSize / 2) + 'px',  // Center on the endpoint
        zIndex: 6, // Higher than regular add buttons
      }}
      data-node-element="true"
      data-source-node-id={sourceNodeId}
      data-branch-id={branchId}
      data-button-type="branch-endpoint"
      className="branch-endpoint-button"
    >
      {/* Connector visual to make button appear integrated with the line */}
      <div 
        className="connector-dot"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          background: isHovered || isHighlighted ? '#3B82F6' : '#D1D5DB',
          transform: 'translate(-50%, -50%)',
          transition: 'background-color 0.2s',
          zIndex: 1
        }}
      />
      
      <button
        style={{
          position: 'relative',
          transition: 'transform 0.2s, box-shadow 0.2s, background-color 0.2s',
          zIndex: 2
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
            Add branch node
          </div>
        )}
      </button>
    </div>
  );
};

// Main Automation Workflow Component
const AutomationWorkflow = () => {
  // Define constants at the component level
  const NODE_WIDTH = 300;
  const BUTTON_SIZE = 40;

  const [activeTab, setActiveTab] = useState('flow');
  const canvasRef = useRef(null);
  // Add state for undo/redo capabilities
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState([
    {
      id: "customer-joins-node",
      type: 'trigger',
      title: 'Customer joins Segment',
      subtitle: 'Not onboarded',
      position: { x: window.innerWidth / 2, y: 25 },
      height: 90,
      contextMenuConfig: { position: 'right', offsetX: 10, offsetY: 0 },
      outgoingConnections: {
        default: { targetNodeId: "two-day-delay-node" }
      }
    },
    {
      id: "two-day-delay-node",
      type: 'control',
      title: 'Delay',
      subtitle: '2 days',
      position: { x: window.innerWidth / 2, y: 200 },
      height: 90,
      contextMenuConfig: { position: 'right', offsetX: 10, offsetY: 0 },
      outgoingConnections: {
        default: { targetNodeId: "send-email-node" }
      }
    },
    {
      id: "send-email-node",
      type: 'action',
      title: 'Send email',
      subtitle: 'Just one more step to go',
      position: { x: window.innerWidth / 2, y: 350 },
      height: 90,
      contextMenuConfig: { position: 'right', offsetX: 10, offsetY: 0 },
      outgoingConnections: {
        default: { targetNodeId: "check-clicked-node" }
      }
    },
    {
      id: "check-clicked-node",
      type: 'ifelse',
      title: 'Check if clicked',
      subtitle: 'Email link was clicked',
      position: { x: window.innerWidth / 2, y: 525 },
      height: 90,
      contextMenuConfig: { position: 'right', offsetX: 10, offsetY: 0 },
      branchConnections: {
        // Empty initially - will be filled when branch nodes are added
      }
    }
  ]);
  
  // Canvas pan and zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: .8 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPos, setStartPanPos] = useState({ x: 0, y: 0 });
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(null);
  // Add a separate state for tracking which add button menu is open
  const [activeAddButtonIndex, setActiveAddButtonIndex] = useState(null);
  // Add state for tracking which branch button is active (nodeIndex and branchId)
  const [activeBranchButton, setActiveBranchButton] = useState(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [highlightedConnection, setHighlightedConnection] = useState(null);
  // Add state to track original position when dragging
  const [dragStartPosition, setDragStartPosition] = useState(null);
  
  // Configurable offsets
  const [buttonYOffset] = useState(0); // Default vertical offset for "+" buttons
  const [edgeInputYOffset] = useState(0); // Offset for input edge connections (top of node)
  const [edgeOutputYOffset] = useState(40); // Offset for output edge connections (bottom of node)
  
  // Helper function to calculate branch endpoints for ifelse and splitflow nodes
  const getBranchEndpoint = useCallback((node, branchId) => {
    const startX = node.position.x + (NODE_WIDTH / 2);
    const startY = node.position.y + (node.height || DEFAULT_NODE_HEIGHT);
    
    if (node.type === 'ifelse') {
      if (branchId === 'yes') {
        return { x: node.position.x - 150 + (NODE_WIDTH / 2), y: startY + 100 };
      } else {
        return { x: node.position.x + 150 + (NODE_WIDTH / 2), y: startY + 100 };
      }
    } else if (node.type === 'splitflow') {
      // Similar logic for splitflow branches
      const branches = pluginRegistry.getNodeType('splitflow').getBranches(node);
      const index = branches.findIndex(b => b.id === branchId);
      
      if (branchId === 'other' || index === branches.length - 1) {
        return { x: node.position.x + 150 + (NODE_WIDTH / 2), y: startY + 100 };
      } else {
        return { x: node.position.x - 150 + (NODE_WIDTH / 2), y: startY + 100 };
      }
    }
    
    return { x: startX, y: startY };
  }, [NODE_WIDTH]);
  
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
    console.log('Starting menu hide timer...');
    clearMenuHideTimer();
    menuHideTimerRef.current = setTimeout(() => {
      // Removed console log
      if (!isMouseOverMenuOrButton) {
        setActiveAddButtonIndex(null);
      }
    }, AUTO_HIDE_TIMEOUT);
  }, [clearMenuHideTimer, isMouseOverMenuOrButton, setActiveAddButtonIndex]);
  
  // Handler for node height changes
  const handleNodeHeightChange = (id, height) => {
    setWorkflowSteps(prev =>
      prev.map(step => step.id === id ? { ...step, height } : step)
    );
  };
  
  // Note: We've removed the unused adjustment functions
  
  // Mouse over menu/button tracking functions - memoized to prevent recreating functions on each render
  const handleMenuMouseEnter = useCallback(() => {
    clearMenuHideTimer();
    setIsMouseOverMenuOrButton(true);
  }, [clearMenuHideTimer]);
  
  const handleMenuMouseLeave = useCallback(() => {
    setIsMouseOverMenuOrButton(false);
    // startMenuHideTimer() commented out but left for reference
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
      if (activeAddButtonIndex !== null) {
        // Close menu when clicking on any node that's not an add button
        if (isClickingNode) {
          setActiveAddButtonIndex(null);
          clearMenuHideTimer();
        }
        // Or when clicking anywhere else (except the menu or add button)
        else if (!isClickingMenu && !isClickingAddButton) {
          setActiveAddButtonIndex(null);
          clearMenuHideTimer();
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearMenuHideTimer();
    };
  }, [showNodeMenu, activeAddButtonIndex, clearMenuHideTimer]);
  
  // Start auto-hide timer when menu is opened
  useEffect(() => {
    if (activeAddButtonIndex !== null && !isMouseOverMenuOrButton) {
      startMenuHideTimer();
    } else {
      clearMenuHideTimer();
    }
    
    return () => clearMenuHideTimer();
  }, [activeAddButtonIndex, isMouseOverMenuOrButton, clearMenuHideTimer, startMenuHideTimer]);
  
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
        setSelectedNodeIndex(null);
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

  const createNewNode = (nodeType, position, overrides = {}) => {
    // Get any initial properties from the node plugin
    const nodePlugin = pluginRegistry.getNodeType(nodeType);
    const initialProps = nodePlugin.getInitialProperties ? nodePlugin.getInitialProperties() : {};
    return {
      id: generateUniqueId(),
      type: nodeType,
      position,
      height: DEFAULT_NODE_HEIGHT,
      isNew: true,
      contextMenuConfig: { position: 'right', offsetX: 10, offsetY: 0 },
      branchConnections: nodePlugin.hasMultipleBranches() ? {} : undefined,
      outgoingConnections: {}, // Add empty outgoing connections property
      ...initialProps,
      ...overrides
    };
  };

  // Helper functions for default node properties
  const getDefaultTitle = (nodeType) => {
    switch (nodeType) {
      case 'trigger':
        return 'New Trigger';
      case 'control':
        return 'New Control';
      case 'action':
        return 'New Action';
      case 'ifelse':
        return 'New If/Else';
      case 'splitflow':
        return 'New Split Flow';
      default:
        return 'New Step';
    }
  };

  const getDefaultSubtitle = (nodeType) => {
    switch (nodeType) {
      case 'trigger':
        return 'Configure this trigger';
      case 'control':
        return 'Configure this control';
      case 'action':
        return 'Configure this action';
      case 'ifelse':
        return 'Configure condition';
      case 'splitflow':
        return 'Configure split conditions';
      default:
        return 'Configure properties';
    }
  };

  // Handle adding a new step
  const handleAddStep = useCallback((index, nodeType) => {
    const sourceNode = workflowSteps[index];
    
    // Calculate position for new node
    const newPos = {
      x: sourceNode.position.x,
      y: sourceNode.position.y + 175
    };
    
    // Create new node
    const newNodeId = generateUniqueId();
    const newNode = createNewNode(nodeType, newPos, {
      id: newNodeId,
      title: getDefaultTitle(nodeType),
      subtitle: getDefaultSubtitle(nodeType)
    });
    
    // Find any current target nodes of the source node
    let targetNodeId = null;
    if (sourceNode.outgoingConnections?.default?.targetNodeId) {
      targetNodeId = sourceNode.outgoingConnections.default.targetNodeId;
    }
    
    // Set up the source node's outgoing connection to point to the new node
    const updatedSourceNode = {
      ...sourceNode,
      outgoingConnections: {
        ...sourceNode.outgoingConnections,
        default: { targetNodeId: newNodeId }
      }
    };
    
    // Set up the new node's outgoing connection to point to any previous target
    if (targetNodeId) {
      newNode.outgoingConnections.default = { targetNodeId };
    }
    
    // Update the workflow steps
    const updatedSteps = workflowSteps.map(step => 
      step.id === sourceNode.id ? updatedSourceNode : step
    );
    
    setWorkflowSteps([...updatedSteps, newNode]);
    
    // ...rest of add node logic...
  }, [workflowSteps, createNewNode, getDefaultTitle, getDefaultSubtitle]);


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
  
  // Handle undo action
  const handleUndo = () => {
    commandManager.undo();
  };
  
  // Handle redo action
  const handleRedo = () => {
    commandManager.redo();
  };
  
  // Handle delete node action
  const handleDeleteNode = (nodeIndex) => {
    if (nodeIndex === null || nodeIndex < 0 || nodeIndex >= workflowSteps.length) return;
    
    // Create and execute delete command
    const deleteCommand = new DeleteNodeCommand(
      workflowSteps,
      setWorkflowSteps,
      setSelectedNodeIndex,
      nodeIndex
    );
    
    commandManager.executeCommand(deleteCommand);
  };
  
  // Handle node click for editing with improved logic
  const handleStepClick = (id, action) => {
    const index = workflowSteps.findIndex(step => step.id === id);
    if (index < 0) return;
    
    // If an action is provided, handle the context menu action
    if (action) {
      switch (action) {
        case 'delete':
          handleDeleteNode(index);
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
    setSelectedNodeIndex(index);
    justClickedNodeRef.current = true;
    
    // Clear this flag after a short delay
    setTimeout(() => {
      justClickedNodeRef.current = false;
    }, 200);
  };
  
  // Handle node drag with grid snapping
  const handleNodeDrag = (id, x, y) => {
    // This function receives client coordinates adjusted by the drag offset
    setWorkflowSteps(prev =>
      prev.map(step => {
        if (step.id === id) {
          // Apply grid snapping if enabled
          let newX = x;
          let newY = y;
          
          if (snapToGrid) {
            newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
            newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
          }
          
          // Just use the calculated position - no need for additional adjustments
          return { ...step, position: { x: newX, y: newY } };
        }
        return step;
      })
    );
  };
  
  // Handle node drag end
  const handleNodeDragEnd = (id) => {
    // Get the node that was dragged
    const index = workflowSteps.findIndex(step => step.id === id);
    if (index < 0 || !dragStartPosition) return;

    const node = workflowSteps[index];
    const currentPosition = node.position;
    
    // Only create a command if the position actually changed
    if (dragStartPosition.x !== currentPosition.x || dragStartPosition.y !== currentPosition.y) {
      // Create and execute a move command
      const moveCommand = new MoveNodeCommand(
        setWorkflowSteps,
        null, // No need to update selection for move operations
        id,
        dragStartPosition,
        currentPosition
      );
      
      commandManager.executeCommand(moveCommand);
    }
    
    // Reset the start position
    setDragStartPosition(null);
    
    // Keep this node selected
    if (index >= 0) {
      setSelectedNodeIndex(index);
    }
  };
  
  // Handle update node fields with optimized implementations
  const handleUpdateNodeTitle = (nodeIndex, newTitle) => {
    setWorkflowSteps(prevSteps => {
      // Only create a new array if we're actually changing something
      if (prevSteps[nodeIndex].title === newTitle) return prevSteps;
      
      const newSteps = [...prevSteps];
      newSteps[nodeIndex] = {
        ...newSteps[nodeIndex],
        title: newTitle
      };
      return newSteps;
    });
  };
  
  const handleUpdateNodeSubtitle = (nodeIndex, newSubtitle) => {
    setWorkflowSteps(prevSteps => {
      // Only create a new array if we're actually changing something
      if (prevSteps[nodeIndex].subtitle === newSubtitle) return prevSteps;
      
      const newSteps = [...prevSteps];
      newSteps[nodeIndex] = {
        ...newSteps[nodeIndex],
        subtitle: newSubtitle
      };
      return newSteps;
    });
  };
  
  // Generic node update handler for the dynamic properties panel
  const handleUpdateNodeProperty = (nodeId, propertyId, value) => {
    setWorkflowSteps(prevSteps => {
      const nodeIndex = prevSteps.findIndex(step => step.id === nodeId);
      if (nodeIndex === -1) return prevSteps;
      
      // Only create a new array if we're actually changing something
      if (prevSteps[nodeIndex][propertyId] === value) return prevSteps;
      
      const newSteps = [...prevSteps];
      newSteps[nodeIndex] = {
        ...newSteps[nodeIndex],
        [propertyId]: value
      };
      return newSteps;
    });
  };
  
  // Handle direct add node from button menu (without opening separate menu)
  const handleAddNodeFromButton = useCallback((index, nodeType) => {
    handleAddStep(index, nodeType);
  }, [handleAddStep]);
  
  // Handle showing the branch menu - wrap in useCallback to avoid exhaustive-deps warning
  const handleShowBranchAddMenu = useCallback((nodeIndex, branchId, e) => {
    setActiveBranchButton({ nodeIndex, branchId });
    e.stopPropagation();
    clearMenuHideTimer();
  }, [clearMenuHideTimer]);
  
  // Handle adding a node from a branch endpoint
  const handleAddNodeFromBranch = useCallback((nodeIndex, branchId, nodeType) => {
    const sourceNode = workflowSteps[nodeIndex];
    if (!sourceNode) return;
    
    // Get endpoint position for branch
    const endpoint = getBranchEndpoint(sourceNode, branchId);
    
    // Create new node with a unique ID
    const newNodeId = generateUniqueId();
    const newNode = createNewNode(
      nodeType,
      { x: endpoint.x - (NODE_WIDTH / 2), y: endpoint.y + 50 },
      { id: newNodeId }
    );
    
    // Update the source node's branch connections
    const updatedSourceNode = {
      ...sourceNode,
      branchConnections: {
        ...sourceNode.branchConnections,
        [branchId]: { targetNodeId: newNodeId }
      }
    };
    
    // Update the workflow steps
    const updatedSteps = workflowSteps.map(step => 
      step.id === sourceNode.id ? updatedSourceNode : step
    );
    
    setWorkflowSteps([...updatedSteps, newNode]);
    
    // Reset branch button
    setActiveBranchButton(null);
    
    // Auto-select the new node after a delay
    setTimeout(() => {
      setAnimatingNodes(prev => prev.filter(id => id !== newNode.id));
    }, 300);
  }, [
    workflowSteps,
    getBranchEndpoint,
    NODE_WIDTH,
    createNewNode
  ]);

  // Handle showing the add node menu (now using dedicated state)
  const handleShowAddMenu = (index, e) => {
    // Just toggle the active add button index
    if (activeAddButtonIndex === index) {
      setActiveAddButtonIndex(null);
      clearMenuHideTimer();
    } else {
      // Close any other open menu first
      setActiveAddButtonIndex(null);
      clearMenuHideTimer();
      
      // Small delay to ensure previous menu is closed
      setTimeout(() => {
        setActiveAddButtonIndex(index);
        startMenuHideTimer(); // Start timer when opening menu
      }, 10);
    }
    e.stopPropagation();
  };
  
  // Portal for rendering the add step menu outside the transform container
  const renderMenuPortal = useCallback(() => {
    // Handle regular add node menu
    if (activeAddButtonIndex !== null) {
      const index = activeAddButtonIndex;
      const step = workflowSteps[index];
      
      if (!step) return null;
         
      // Calculate position
      const buttonPosition = index < workflowSteps.length - 1
        ? {
            x: step.position.x + ((workflowSteps[index + 1].position.x - step.position.x) / 2),
            y: step.position.y + (step.height || 90) + ((workflowSteps[index + 1].position.y - (step.position.y + (step.height || 90))) / 2) + buttonYOffset
          }
        : {
            x: workflowSteps[workflowSteps.length - 1].position.x,
            y: workflowSteps[workflowSteps.length - 1].position.y + (workflowSteps[workflowSteps.length - 1].height || 90) + 50 + buttonYOffset
          };
      
      // Calculate screen coordinates
      const screenX = transform.x + (buttonPosition.x * transform.scale);
      const screenY = transform.y + (buttonPosition.y * transform.scale + 180);
      
      // Position for the menu - properly scaled with the canvas
      const menuX = screenX + ((NODE_WIDTH / 2) * transform.scale);
      const menuY = screenY;
      
      return createPortal(
        <div
          className="node-menu"
          style={{
            position: 'fixed',
            left: `${menuX}px`,
            top: `${menuY}px`,
            transform: `translate(${20 * transform.scale}px, -50%) scale(${transform.scale})`,
            zIndex: 100000, // Very high z-index
            pointerEvents: 'auto', // Ensure it can be clicked
            transformOrigin: 'left center' // Set transform origin for better positioning
          }}
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
        >
          <div className="bg-white rounded-lg shadow-xl p-3 border border-gray-200 animate-fadeIn" style={{ minWidth: '180px' }}>
            <h3 className="font-medium text-gray-900 mb-2">Add step</h3>
            <div className="space-y-1">
              <button
                className="flex items-center w-full p-2 hover:bg-blue-50 rounded-md text-left"
                onClick={() => handleAddNodeFromButton(index, 'trigger')}
                style={{ transformOrigin: 'left center' }}
              >
                <div className="p-1 rounded mr-2 bg-blue-100">
                  <Zap className="w-4 h-4 text-blue-500" />
                </div>
                <span>Trigger</span>
              </button>
              <button
                className="flex items-center w-full p-2 hover:bg-blue-50 rounded-md text-left"
                onClick={() => handleAddNodeFromButton(index, 'control')}
                style={{ transformOrigin: 'left center' }}
              >
                <div className="p-1 rounded mr-2 bg-purple-100">
                  <Hexagon className="w-4 h-4 text-purple-500" />
                </div>
                <span>Control</span>
              </button>
              <button
                className="flex items-center w-full p-2 hover:bg-blue-50 rounded-md text-left"
                onClick={() => handleAddNodeFromButton(index, 'action')}
                style={{ transformOrigin: 'left center' }}
              >
                <div className="p-1 rounded mr-2 bg-red-100">
                  <Send className="w-4 h-4 text-red-500" />
                </div>
                <span>Action</span>
              </button>
              <button
                className="flex items-center w-full p-2 hover:bg-blue-50 rounded-md text-left"
                onClick={() => handleAddNodeFromButton(index, 'ifelse')}
                style={{ transformOrigin: 'left center' }}
              >
                <div className="p-1 rounded mr-2 bg-indigo-100">
                  <GitBranch className="w-4 h-4 text-indigo-500" />
                </div>
                <span>If/Else</span>
              </button>
              <button
                className="flex items-center w-full p-2 hover:bg-blue-50 rounded-md text-left"
                onClick={() => handleAddNodeFromButton(index, 'splitflow')}
                style={{ transformOrigin: 'left center' }}
              >
                <div className="p-1 rounded mr-2 bg-green-100">
                  <GitMerge className="w-4 h-4 text-green-500" />
                </div>
                <span>Split Flow</span>
              </button>
            </div>
          </div>
        </div>,
        document.body // Render directly to body to avoid z-index issues
      );
    }
    
    // Handle branch add menus
    if (activeBranchButton) {
      const { nodeIndex, branchId } = activeBranchButton;
      const step = workflowSteps[nodeIndex];
      if (!step) return null;
      
      // Get branch details
      const nodePlugin = pluginRegistry.getNodeType(step.type);
      const branches = nodePlugin ? nodePlugin.getBranches(step) : [];
      const branch = branches.find(b => b.id === branchId);
      
      // Get branch endpoint position
      const endpoint = getBranchEndpoint(step, branchId);
      
      // Calculate screen coordinates
      const screenX = transform.x + (endpoint.x * transform.scale);
      const screenY = transform.y + (endpoint.y * transform.scale);
      
      return createPortal(
        <div
          className="branch-node-menu"
          style={{
            position: 'fixed',
            left: `${screenX}px`,
            top: `${screenY}px`,
            transform: `translate(-50%, 20px) scale(${transform.scale})`,
            zIndex: 100000,
            pointerEvents: 'auto',
            transformOrigin: 'center top'
          }}
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
        >
          <div className="bg-white rounded-lg shadow-xl p-3 border border-gray-200 animate-fadeIn" style={{ minWidth: '200px' }}>
            <h3 className="font-medium text-gray-900 mb-2">Add to {branch?.label || branchId} branch</h3>
            <div className="space-y-1">
              <button
                className="flex items-center w-full p-2 hover:bg-blue-50 rounded-md text-left"
                onClick={() => handleAddNodeFromBranch(nodeIndex, branchId, 'action')}
                style={{ transformOrigin: 'left center' }}
              >
                <div className="p-1 rounded mr-2 bg-red-100">
                  <Send className="w-4 h-4 text-red-500" />
                </div>
                <span>Action</span>
              </button>
              <button
                className="flex items-center w-full p-2 hover:bg-blue-50 rounded-md text-left"
                onClick={() => handleAddNodeFromBranch(nodeIndex, branchId, 'control')}
                style={{ transformOrigin: 'left center' }}
              >
                <div className="p-1 rounded mr-2 bg-purple-100">
                  <Hexagon className="w-4 h-4 text-purple-500" />
                </div>
                <span>Control</span>
              </button>
              <button
                className="flex items-center w-full p-2 hover:bg-blue-50 rounded-md text-left"
                onClick={() => handleAddNodeFromBranch(nodeIndex, branchId, 'ifelse')}
                style={{ transformOrigin: 'left center' }}
              >
                <div className="p-1 rounded mr-2 bg-indigo-100">
                  <GitBranch className="w-4 h-4 text-indigo-500" />
                </div>
                <span>If/Else</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      );
    }
    
    return null;
  }, [
    activeAddButtonIndex,
    activeBranchButton,
    workflowSteps,
    buttonYOffset,
    transform,
    NODE_WIDTH,
    handleMenuMouseEnter,
    handleMenuMouseLeave,
    handleAddNodeFromButton,
    handleAddNodeFromBranch,
    getBranchEndpoint
  ]);
  
  // Update the rendering of connector lines to use the tree structure
  const renderConnections = () => {
    return (
      <g>
        {/* Render standard connections */}
        {workflowSteps.map(sourceNode => {
          // Skip nodes without connections
          if (!sourceNode.outgoingConnections?.default?.targetNodeId) return null;
          
          // Find the target node
          const targetNodeId = sourceNode.outgoingConnections.default.targetNodeId;
          const targetNode = workflowSteps.find(n => n.id === targetNodeId);
          if (!targetNode) return null;
          
          return (
            <ConnectorLine
              key={`connector-${sourceNode.id}-${targetNodeId}`}
              startPos={{
                x: sourceNode.position.x + (NODE_WIDTH / 2),
                y: sourceNode.position.y + (sourceNode.height || DEFAULT_NODE_HEIGHT) + edgeOutputYOffset
              }}
              endPos={{
                x: targetNode.position.x + (NODE_WIDTH / 2),
                y: targetNode.position.y + edgeInputYOffset
              }}
              isHighlighted={selectedNodeIndex === workflowSteps.indexOf(sourceNode) || 
                            selectedNodeIndex === workflowSteps.indexOf(targetNode)}
            />
          );
        })}
        
        {/* Render branch connections */}
        {workflowSteps.map(sourceNode => {
          if (!sourceNode.branchConnections) return null;
          
          const nodePlugin = pluginRegistry.getNodeType(sourceNode.type);
          if (!nodePlugin || !nodePlugin.hasMultipleBranches(sourceNode)) return null;
          
          const branches = nodePlugin.getBranches(sourceNode);
          if (!branches || branches.length < 2) return null;
          
          const startX = sourceNode.position.x + (NODE_WIDTH / 2);
          const startY = sourceNode.position.y + (sourceNode.height || DEFAULT_NODE_HEIGHT) + edgeOutputYOffset;
          
          return (
            <React.Fragment key={`branches-${sourceNode.id}`}>
              {branches.map(branch => {
                const targetNodeId = sourceNode.branchConnections[branch.id]?.targetNodeId;
                const targetNode = targetNodeId ? workflowSteps.find(n => n.id === targetNodeId) : null;
                
                let endPoint;
                if (targetNode) {
                  endPoint = {
                    x: targetNode.position.x + (NODE_WIDTH / 2),
                    y: targetNode.position.y + edgeInputYOffset
                  };
                } else {
                  endPoint = getBranchEndpoint(sourceNode, branch.id);
                }
                
                if (!endPoint) return null;
                
                return (
                  <ConnectorLine
                    key={`branch-connector-${sourceNode.id}-${branch.id}`}
                    startPos={{
                      x: startX,
                      y: startY
                    }}
                    endPos={endPoint}
                    isHighlighted={selectedNodeIndex === workflowSteps.indexOf(sourceNode) ||
                                  (targetNode && selectedNodeIndex === workflowSteps.indexOf(targetNode))}
                    label={branch.label}
                  />
                );
              })}
            </React.Fragment>
          );
        })}
      </g>
    );
  };

  // Render "+" buttons for nodes with flexibility for both standard connections and branches
  const renderAddNodeButtons = () => {
    return (
      <>
        {/* Render standard node connection buttons */}
        {workflowSteps.map(node => {
          // Skip branch nodes
          const nodePlugin = pluginRegistry.getNodeType(node.type);
          const hasBranches = nodePlugin && nodePlugin.hasMultipleBranches(node);
          
          if (hasBranches) return null;
          
          const nodeIndex = workflowSteps.indexOf(node);
          
          return (
            <AddNodeButton
              key={`add-button-${node.id}`}
              position={{
                x: node.position.x,
                y: node.position.y + (node.height || DEFAULT_NODE_HEIGHT) + 50
              }}
              nodeWidth={NODE_WIDTH}
              buttonSize={BUTTON_SIZE}
              onAdd={(e) => handleShowAddMenu(nodeIndex, e)}
              isHighlighted={nodeIndex === selectedNodeIndex}
              onMouseEnter={handleMenuMouseEnter}
              onMouseLeave={handleMenuMouseLeave}
              showMenu={activeAddButtonIndex === nodeIndex}
              sourceNodeId={node.id}
              sourceType="standard"
            />
          );
        })}
        
        {/* Render branch endpoint buttons */}
        {workflowSteps.map(node => {
          const nodePlugin = pluginRegistry.getNodeType(node.type);
          if (!nodePlugin || !nodePlugin.hasMultipleBranches(node)) return null;
          
          const branches = nodePlugin.getBranches(node);
          if (!branches || branches.length < 2) return null;
          
          const nodeIndex = workflowSteps.indexOf(node);
          
          return (
            <React.Fragment key={`branch-buttons-${node.id}`}>
              {branches.map(branch => {
                const targetNodeId = node.branchConnections?.[branch.id]?.targetNodeId;
                const targetNode = targetNodeId ? workflowSteps.find(n => n.id === targetNodeId) : null;
                
                if (!targetNode) {
                  // Show endpoint button if branch has no target
                  const endpoint = getBranchEndpoint(node, branch.id);
                  
                  return (
                    <BranchEndpointButton
                      key={`branch-button-${node.id}-${branch.id}`}
                      position={endpoint}
                      buttonSize={BUTTON_SIZE}
                      onAdd={(e) => handleShowBranchAddMenu(nodeIndex, branch.id, e)}
                      isHighlighted={selectedNodeIndex === nodeIndex}
                      onMouseEnter={handleMenuMouseEnter}
                      onMouseLeave={handleMenuMouseLeave}
                      showMenu={activeBranchButton?.nodeIndex === nodeIndex && 
                              activeBranchButton?.branchId === branch.id}
                      sourceNodeId={node.id}
                      branchId={branch.id}
                    />
                  );
                } else {
                  // Show continuation button after target node
                  const targetPlugin = pluginRegistry.getNodeType(targetNode.type);
                  const targetHasBranches = targetPlugin && targetPlugin.hasMultipleBranches(targetNode);
                  const targetIndex = workflowSteps.indexOf(targetNode);
                  
                  if (!targetHasBranches && targetIndex >= 0) {
                    return (
                      <AddNodeButton
                        key={`branch-button-after-${targetNode.id}`}
                        position={{
                          x: targetNode.position.x,
                          y: targetNode.position.y + (targetNode.height || DEFAULT_NODE_HEIGHT) + 50
                        }}
                        nodeWidth={NODE_WIDTH}
                        buttonSize={BUTTON_SIZE}
                        onAdd={(e) => handleShowAddMenu(targetIndex, e)}
                        isHighlighted={targetIndex === selectedNodeIndex}
                        onMouseEnter={handleMenuMouseEnter}
                        onMouseLeave={handleMenuMouseLeave}
                        showMenu={activeAddButtonIndex === targetIndex}
                        sourceNodeId={targetNode.id}
                        sourceType="branch-continuation"
                      />
                    );
                  }
                }
                return null;
              })}
            </React.Fragment>
          );
        })}
      </>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center">
          <button className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm">Automations</span>
          </button>
        </div>
        <h1 className="text-xl font-semibold">Onboarding completion</h1>
        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Pause
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Edit
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Test
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-green-500 border border-transparent rounded-md hover:bg-green-600">
            More actions...
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex justify-center py-4 bg-white border-b">
        <div className="flex space-x-2">
          <button 
            className={`px-4 py-2 text-gray-600 flex items-center ${activeTab === 'details' ? 'bg-blue-50 text-blue-700' : ''} rounded-md hover:bg-gray-100`}
            onClick={() => setActiveTab('details')}
          >
            Details and Goal <ChevronRight className="w-4 h-4 ml-1" />
          </button>
          <button 
            className={`px-4 py-2 text-gray-600 ${activeTab === 'flow' ? 'bg-blue-50 text-blue-700' : ''} rounded-md hover:bg-gray-100`}
            onClick={() => setActiveTab('flow')}
          >
            Flow
          </button>
        </div>
      </div>

      {/* Zoom Controls for Flow tab */}
      {activeTab === 'flow' && (
        <div className="absolute left-6 top-40 bg-white rounded-lg shadow-md p-2 z-50">
          <div className="flex flex-col space-y-2">
            <button 
              onClick={() => handleZoom(1.1)} 
              className="p-2 hover:bg-gray-100 rounded-md flex items-center justify-center"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handleZoom(0.9)} 
              className="p-2 hover:bg-gray-100 rounded-md flex items-center justify-center"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button 
              onClick={resetView} 
              className="p-2 hover:bg-gray-100 rounded-md flex items-center justify-center"
              title="Reset View"
            >
              <Maximize className="w-5 h-5" />
            </button>
            <div className="border-t border-gray-200 my-1"></div>
            <div className="text-center text-xs text-gray-500">
              {Math.round(transform.scale * 100)}%
            </div>
            <div className="border-t border-gray-200 my-1"></div>
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`p-2 rounded-md flex items-center justify-center ${snapToGrid ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}
              title={snapToGrid ? "Snap to Grid On" : "Snap to Grid Off"}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2">
                <path d="M3 3h18v18H3z" />
                <path d="M3 9h18" />
                <path d="M3 15h18" />
                <path d="M9 3v18" />
                <path d="M15 3v18" />
              </svg>
            </button>
            <div className="border-t border-gray-200 my-1"></div>
            {/* Undo/Redo controls */}
            <button
              onClick={handleUndo}
              className={`p-2 rounded-md flex items-center justify-center ${!canUndo ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}`}
              title="Undo"
              disabled={!canUndo}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handleRedo}
              className={`p-2 rounded-md flex items-center justify-center ${!canRedo ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}`}
              title="Redo"
              disabled={!canRedo}
            >
              <RotateCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden" id="main-content">
        {/* Workflow Canvas */}
        <div
          id="workflow-canvas"
          ref={canvasRef}
          className="flex-1 relative overflow-hidden"
          style={{ 
            backgroundImage: 'radial-gradient(circle, #e0e0e0 1px, transparent 1px)', 
            backgroundSize: '20px 20px',
            backgroundPosition: `${transform.x % 20}px ${transform.y % 20}px`,
            cursor: isPanning ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleCanvasMouseDown}
        >
          {/* SVG for all connections */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                overflow: 'visible'
              }}
            >
              <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
                {renderConnections()}
              </g>
          </svg>
          </div>
          
          {/* Transform container for nodes and buttons */}
          <div
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: '0 0',
              width: 'max-content',
              height: 'max-content',
              position: 'absolute',
              minWidth: '100%',
              minHeight: '100%',
              zIndex: 1
            }}
          >
            {renderAddNodeButtons()}
            
            {/* Render all nodes */}
            {workflowSteps.map((step, index) => (
              <WorkflowStep
                key={step.id}
                id={step.id}
                type={step.type}
                title={step.title}
                subtitle={step.subtitle}
                position={step.position}
                transform={transform}
                onClick={handleStepClick}
                onDragStart={(id, position) => {
                  const dragIndex = workflowSteps.findIndex(step => step.id === id);
                  setSelectedNodeIndex(dragIndex);
                  setDragStartPosition(position);
                }}
                onDrag={handleNodeDrag}
                onDragEnd={handleNodeDragEnd}
                onHeightChange={handleNodeHeightChange}
                isNew={step.isNew || false}
                isAnimating={animatingNodes.includes(step.id)}
                isSelected={selectedNodeIndex === index}
                contextMenuConfig={step.contextMenuConfig}
              />
            ))}
          </div>
          
          {/* Canvas instructions overlay */}
          <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 rounded-lg shadow-sm p-2 text-sm text-gray-600 flex items-center">
            <Move className="w-4 h-4 mr-1" /> Drag canvas to pan •
            <ZoomIn className="w-4 h-4 mx-1" /> Scroll to zoom •
            Drag nodes to reposition •
            <RotateCcw className="w-4 h-4 mx-1" /> Undo/Redo available
          </div>
        </div>
        
        {/* Right Sidebar - Either shows metrics or node properties */}
        {activeTab !== 'flow' ? (
          <div className="w-80 border-l bg-white overflow-y-auto">
            {/* Metrics panel */}
            {/* ... */}
          </div>
        ) : (
          /* Dynamic Node Properties Panel - shown only when a node is selected */
          selectedNodeIndex !== null && (
            <NodePropertiesPanel
              node={workflowSteps[selectedNodeIndex]}
              onClose={() => setSelectedNodeIndex(null)}
              onUpdate={handleUpdateNodeProperty}
              registry={pluginRegistry}
            />
          )
        )}

        
      </div>
      
      {/* Menu portal - rendered using React's createPortal outside the component tree */}
      {renderMenuPortal()}
    </div>
  );
};

export default AutomationWorkflow;