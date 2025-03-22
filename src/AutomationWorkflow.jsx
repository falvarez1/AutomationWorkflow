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
pluginRegistry.registerPropertyControl(NumberControl);

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
  // Static node dimensions
  const nodeWidth = 300;

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

  // Calculate midpoint for label placement
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

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
        <g transform={`translate(${midX}, ${midY})`}>
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
const AddNodeButton = ({ position, nodeWidth, buttonSize, onAdd, isHighlighted = false, onMouseEnter, onMouseLeave, showMenu = false, onAddNodeType }) => {
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
      id: 1,
      type: 'trigger',
      title: 'Customer joins Segment',
      subtitle: 'Not onboarded',
      position: { x: window.innerWidth / 2, y: 25 },
      height: 90,
      contextMenuConfig: { position: 'right', offsetX: 10, offsetY: 0 }
    },
    {
      id: 2,
      type: 'control',
      title: 'Delay',
      subtitle: '2 days',
      position: { x: window.innerWidth / 2, y: 200 },
      height: 90,
      contextMenuConfig: { position: 'right', offsetX: 10, offsetY: 0 }
    },
    {
      id: 3,
      type: 'action',
      title: 'Send email',
      subtitle: 'Just one more step to go',
      position: { x: window.innerWidth / 2, y: 350 },
      height: 90,
      contextMenuConfig: { position: 'right', offsetX: 10, offsetY: 0 }
    },
    {
      id: 4,
      type: 'ifelse',
      title: 'Check if clicked',
      subtitle: 'Email link was clicked',
      position: { x: window.innerWidth / 2, y: 525 },
      height: 90,
      contextMenuConfig: { position: 'right', offsetX: 10, offsetY: 0 },
      branchConnections: {} // Initialize empty branch connections
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
  const [highlightedConnection] = useState(null);
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
  
  // Handle adding a new step
  const handleAddStep = useCallback((index, nodeType) => {
    // Calculate position for new node - below the current one
    const prevNode = workflowSteps[index];
    const newPos = {
      x: prevNode.position.x,
      y: prevNode.position.y + 175
    };
    
    // First phase: Push down all nodes below this one
    const nodesToAnimate = [];
    const updatedSteps = workflowSteps.map(step => {
      if (step.position.y > prevNode.position.y) {
        nodesToAnimate.push(step.id);
        return {
          ...step,
          position: { ...step.position, y: step.position.y + 175 }
        };
      }
      return step;
    });
    
    // Track which nodes are animating
    setAnimatingNodes(nodesToAnimate);
    
    // Create the new node based on type
    let newStep;
    
    // Default context menu config for new nodes
    const defaultContextMenuConfig = {
      position: 'right',
      offsetX: 10,
      offsetY: 0
    };
    
    switch (nodeType) {
      case 'trigger':
        newStep = {
          id: Date.now(),
          type: 'trigger',
          title: 'New Trigger',
          subtitle: 'Configure this trigger',
          position: newPos,
          isNew: true, // Flag to indicate this is a new node for animation
          contextMenuConfig: defaultContextMenuConfig
        };
        break;
      case 'action':
        newStep = {
          id: Date.now(),
          type: 'action',
          title: 'Send email',
          subtitle: 'Configure this email',
          position: newPos,
          isNew: true, // Flag to indicate this is a new node for animation
          contextMenuConfig: defaultContextMenuConfig
        };
        break;
      case 'ifelse':
        newStep = {
          id: Date.now(),
          type: 'ifelse',
          title: 'If/else',
          subtitle: 'Clicked link is not Something...',
          position: newPos,
          isNew: true, // Flag to indicate this is a new node for animation
          contextMenuConfig: defaultContextMenuConfig,
          branchConnections: {} // Add branch connections property for ifelse nodes
        };
        break;
      case 'splitflow':
        newStep = {
          id: Date.now(),
          type: 'splitflow',
          title: 'Split flow',
          subtitle: 'Split based on First name',
          position: newPos,
          isNew: true, // Flag to indicate this is a new node for animation
          contextMenuConfig: defaultContextMenuConfig,
          branchConnections: {} // Add branch connections property for splitflow nodes
        };
        break;
      case 'control':
      default:
        newStep = {
          id: Date.now(),
          type: 'control',
          title: 'Delay',
          subtitle: '3 days',
          position: newPos,
          isNew: true, // Flag to indicate this is a new node for animation
          contextMenuConfig: defaultContextMenuConfig
        };
    }
    
    // Connection updates for branching nodes
    let connectionsToUpdate = {};
    
    // If inserting a branching node (ifelse or splitflow) between two nodes
    if ((nodeType === 'ifelse' || nodeType === 'splitflow') && index < workflowSteps.length - 1) {
      // Get the node that would be below the new node
      const targetNode = workflowSteps[index + 1];
      
      // Determine the leftmost branch ID
      const leftBranchId = nodeType === 'ifelse' ? 'yes' : 'branch_0';
      
      // Set up the branch connection to point to the target node
      newStep.branchConnections = {
        [leftBranchId]: { targetNodeId: targetNode.id }
      };
      
      // Calculate the position for the target node
      const leftBranchEndpoint = getBranchEndpoint(newStep, leftBranchId);
      const newTargetPosition = {
        x: leftBranchEndpoint.x - (NODE_WIDTH / 2), // Center under endpoint
        y: leftBranchEndpoint.y + 50 // Position below endpoint
      };
      
      // Store connection information for the command
      connectionsToUpdate = {
        targetNodeIndex: index + 2, // After the new node is inserted
        newPosition: newTargetPosition
      };
    }
    // Create and execute AddNodeCommand
    const addCommand = new AddNodeCommand(
      setWorkflowSteps,
      setSelectedNodeIndex,
      setAnimatingNodes,
      newStep,
      index + 1, // Insert after the current node
      connectionsToUpdate,
      updatedSteps // Pre-updated steps (with pushed down nodes)
    );
    
    // Execute the command
    commandManager.executeCommand(addCommand);
    
    // Close the menu
    setActiveAddButtonIndex(null);
    
    // After animation completes, remove the animation flags
    setTimeout(() => {
      setAnimatingNodes([]);
      setWorkflowSteps(current =>
        current.map(step => ({
          ...step,
          isNew: false
        }))
      );
    }, 400); // Slightly longer than the CSS transition duration
  }, [workflowSteps, getBranchEndpoint, NODE_WIDTH, setAnimatingNodes, setWorkflowSteps, setActiveAddButtonIndex, setSelectedNodeIndex]);
  
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
    
    // Get node plugin for the type
    const nodePlugin = pluginRegistry.getNodeType(nodeType);
    if (!nodePlugin) return;
    
    // Get initial properties
    const initialProps = nodePlugin.getInitialProperties();
    
    // Get endpoint position for branch
    const endpoint = getBranchEndpoint(sourceNode, branchId);
    
    // Create new node with a unique ID
    const newNodeId = Date.now();
    const newNode = {
      id: newNodeId,
      type: nodeType,
      ...initialProps,
      position: {
        x: endpoint.x - (NODE_WIDTH / 2), // Center under the endpoint
        y: endpoint.y + 50 // Position below endpoint
      },
      height: DEFAULT_NODE_HEIGHT,
      isNew: true,
      contextMenuConfig: {
        position: 'right',
        offsetX: 10,
        offsetY: 0
      },
      // Initialize branchConnections if this is a branching node
      branchConnections: nodePlugin.hasMultipleBranches() ? {} : undefined
    };
    
    // Connection information for the command
    const connectionsToUpdate = {
      sourceNodeIndex: nodeIndex,
      branchId: branchId,
      targetNodeId: newNodeId
    };
    
    // Create a copy of workflow steps for the command
    const updatedSteps = [...workflowSteps];
    
    // Create and execute AddNodeCommand
    const addCommand = new AddNodeCommand(
      setWorkflowSteps,
      setSelectedNodeIndex,
      setAnimatingNodes,
      newNode,
      nodeIndex + 1, // Insert after the source node
      connectionsToUpdate,
      updatedSteps
    );
    
    // Execute the command
    commandManager.executeCommand(addCommand);
    
    // Reset branch button
    setActiveBranchButton(null);
    
    // Auto-select the new node after a delay (this happens in the command now)
    setTimeout(() => {
      setAnimatingNodes(prev => prev.filter(id => id !== newNodeId));
    }, 300);
  }, [
    workflowSteps,
    setWorkflowSteps,
    getBranchEndpoint,
    setActiveBranchButton,
    setAnimatingNodes,
    setSelectedNodeIndex,
    NODE_WIDTH,
    DEFAULT_NODE_HEIGHT
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
          {/* Transform container */}
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
                {/* Draw connector lines for standard (non-branching) nodes */}
                {workflowSteps.map((step, index) => {
                  const nodePlugin = pluginRegistry.getNodeType(step.type);
                  
                  // If this is a branching node, we'll handle it differently
                  if (nodePlugin && nodePlugin.hasMultipleBranches(step)) {
                    return null; // Skip standard connections for branching nodes
                  }
                  
                  // Only connect if there is a next node and this isn't a branch node
                  return (
                    index < workflowSteps.length - 1 && (
                     <ConnectorLine
                       key={`connector-${step.id}-${workflowSteps[index + 1].id}`}
                       startPos={{
                         x: step.position.x + (NODE_WIDTH / 2), // Center of the node
                         y: step.position.y + (step.height || DEFAULT_NODE_HEIGHT) + edgeOutputYOffset
                       }}
                       endPos={{
                         x: workflowSteps[index + 1].position.x + (NODE_WIDTH / 2), // Center of the node
                         y: workflowSteps[index + 1].position.y + edgeInputYOffset
                       }}
                       isHighlighted={index === selectedNodeIndex || index + 1 === selectedNodeIndex ||
                                      index === highlightedConnection}
                     />
                    )
                  );
                })}
{/* Special branching connections for If/Else and Split nodes */}
{workflowSteps.map((step, index) => {
  const nodePlugin = pluginRegistry.getNodeType(step.type);
  
  // Only process nodes that have multiple branches
  if (!nodePlugin || !nodePlugin.hasMultipleBranches(step)) {
    return null;
  }
  
  // Get dynamic branches for this node
  const branches = nodePlugin.getBranches(step);
  if (!branches || branches.length < 2) {
    return null;
  }
  
  // Calculate center point of the node
  const startX = step.position.x + (NODE_WIDTH / 2);
  const startY = step.position.y + (step.height || DEFAULT_NODE_HEIGHT) + edgeOutputYOffset;
  
  // Create a fragment for all branch connections
  return (
    <React.Fragment key={`branches-${step.id}`}>
      {branches.map(branch => {
        // Check if this branch has a target connection
        const targetId = step.branchConnections?.[branch.id]?.targetNodeId;
        const targetNode = targetId ? workflowSteps.find(n => n.id === targetId) : null;
        
        // Calculate endpoint for the branch
        let endPoint;
        
        if (targetNode) {
          // If there's a target node, connect directly to it
          endPoint = {
            x: targetNode.position.x + (NODE_WIDTH / 2),
            y: targetNode.position.y + edgeInputYOffset
          };
        } else {
          // Otherwise, use the branch endpoint
          if (step.type === 'ifelse') {
            if (branch.id === 'yes') {
              endPoint = {
                x: step.position.x - 150 + (NODE_WIDTH / 2),
                y: startY + 100
              };
            } else {
              endPoint = {
                x: step.position.x + 150 + (NODE_WIDTH / 2),
                y: startY + 100
              };
            }
          } else if (step.type === 'splitflow') {
            // For splitflow, use similar logic
            if (branch.id === 'other' || branch.id.includes('branch_1')) {
              endPoint = {
                x: step.position.x + 150 + (NODE_WIDTH / 2),
                y: startY + 100
              };
            } else {
              endPoint = {
                x: step.position.x - 150 + (NODE_WIDTH / 2),
                y: startY + 100
              };
            }
          }
        }
        
        // Skip if no endpoint was calculated
        if (!endPoint) return null;
        
        return (
          <ConnectorLine
            key={`connector-${step.id}-${branch.id}`}
            startPos={{
              x: startX,
              y: startY
            }}
            endPos={endPoint}
            isHighlighted={index === selectedNodeIndex || (targetId && workflowSteps.findIndex(n => n.id === targetId) === selectedNodeIndex)}
            label={branch.label}
          />
        );
      })}
    </React.Fragment>
  );
})}
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
            {/* Render AddNodeButtons for branch endpoints */}
            {workflowSteps.map((step, index) => {
              const nodePlugin = pluginRegistry.getNodeType(step.type);
              if (!nodePlugin || !nodePlugin.hasMultipleBranches(step)) return null;
              
              const branches = nodePlugin.getBranches(step);
              if (!branches || branches.length < 2) return null;
              
              return (
                <React.Fragment key={`branch-buttons-${step.id}`}>
                  {branches.map(branch => {
                    // Skip if branch already has a target
                    if (step.branchConnections?.[branch.id]?.targetNodeId) return null;
                    
                    const endpoint = getBranchEndpoint(step, branch.id);
                    
                    return (
                      <AddNodeButton
                        key={`branch-button-${step.id}-${branch.id}`}
                        position={{
                          x: endpoint.x, // Use exact endpoint position
                          y: endpoint.y
                        }}
                        nodeWidth={0} // Set to zero to prevent position adjustments in AddNodeButton
                        buttonSize={BUTTON_SIZE}
                        onAdd={(e) => handleShowBranchAddMenu(index, branch.id, e)}
                        isHighlighted={selectedNodeIndex === index}
                        onMouseEnter={handleMenuMouseEnter}
                        onMouseLeave={handleMenuMouseLeave}
                        showMenu={activeBranchButton?.nodeIndex === index &&
                                 activeBranchButton?.branchId === branch.id}
                      />
                    );
                  })}
                </React.Fragment>
              );
            })}
            
            {/* Render workflow steps */}
            {workflowSteps.map((step, index) => (
              <React.Fragment key={step.id}>
                <WorkflowStep
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
                    // Save the original position for undo/redo
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
                
                {/* Add "+" button after each step (but not for branching nodes) */}
                {index < workflowSteps.length - 1 && (() => {
                  // Check if the current node is a branching node
                  const nodePlugin = pluginRegistry.getNodeType(step.type);
                  const hasBranches = nodePlugin && nodePlugin.hasMultipleBranches(step);
                  
                  // Only render the add button if this is not a branching node
                  if (!hasBranches) {
                    return (
                      <AddNodeButton
                        position={{
                          x: step.position.x + ((workflowSteps[index + 1].position.x - step.position.x) / 2),
                          y: step.position.y + (step.height || 90) + ((workflowSteps[index + 1].position.y - (step.position.y + (step.height || 90))) / 2) + buttonYOffset
                        }}
                        nodeWidth={NODE_WIDTH}
                        buttonSize={BUTTON_SIZE}
                        onAdd={(e) => handleShowAddMenu(index, e)}
                        isHighlighted={index === selectedNodeIndex || index + 1 === selectedNodeIndex}
                        onMouseEnter={handleMenuMouseEnter}
                        onMouseLeave={handleMenuMouseLeave}
                        showMenu={activeAddButtonIndex === index}
                      />
                    );
                  }
                  return null;
                })()}
              </React.Fragment>
            ))}
            {/* Add final "+" button below the last node (but not for branching nodes) */}
            {workflowSteps.length > 0 && (() => {
              // Check if the last node is a branching node
              const lastNode = workflowSteps[workflowSteps.length - 1];
              const nodePlugin = pluginRegistry.getNodeType(lastNode.type);
              const hasBranches = nodePlugin && nodePlugin.hasMultipleBranches(lastNode);
              
              // Only render the add button if the last node is not a branching node
              if (!hasBranches) {
                return (
                  <AddNodeButton
                    position={{
                      x: workflowSteps[workflowSteps.length - 1].position.x,
                      y: workflowSteps[workflowSteps.length - 1].position.y + (workflowSteps[workflowSteps.length - 1].height || 90) + 50 + buttonYOffset
                    }}
                    nodeWidth={NODE_WIDTH}
                    buttonSize={BUTTON_SIZE}
                    onAdd={(e) => handleShowAddMenu(workflowSteps.length - 1, e)}
                    isHighlighted={workflowSteps.length - 1 === selectedNodeIndex}
                    onMouseEnter={handleMenuMouseEnter}
                    onMouseLeave={handleMenuMouseLeave}
                    showMenu={activeAddButtonIndex === workflowSteps.length - 1}
                  />
                );
              }
              return null;
            })()}
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