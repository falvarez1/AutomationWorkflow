import React, { useState, useRef, useEffect } from 'react';
import { Hexagon, Zap, GitBranch, GitMerge } from 'lucide-react';
import { NODE_TYPES, DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT } from '../constants';
import NodeContextMenu from './NodeContextMenu';

// Draggable Workflow Step Component
const WorkflowStep = ({
  id,
  type,
  title,
  subtitle,
  position,
  transform,
  onClick,
  onDragStart,
  onDrag,
  onDragEnd,
  onHeightChange,
  isNew,
  isAnimating,
  isSelected,
  sourceNodeRefs = [],
  contextMenuConfig: propContextMenuConfig
}) => {
  const nodeRef = useRef(null);
  const headerHeightRef = useRef(null); // Ref to cache the calculated header height
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [nodeHeight, setNodeHeight] = useState(DEFAULT_NODE_HEIGHT); // Only the setter is used
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
          label: <span className="px-3 py-1 text-sm font-medium text-white whitespace-nowrap bg-green-500 rounded">Split Flow</span>,
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
        const newHeight = entries[0].contentRect.height;
        if (newHeight !== nodeHeight) {  // ensure we only update when different
            setNodeHeight(newHeight);

            if (onHeightChange) {
                onHeightChange(id, newHeight);
            }
        }
    });

    observer.observe(nodeRef.current);
    return () => observer.disconnect();
}, [id, onHeightChange, nodeHeight]);

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
      data-source-nodes={sourceNodeRefs.map(ref => `${ref.sourceId}:${ref.type}:${ref.label || 'null'}`).join(',')}
      className={`p-4 bg-white border border-l-4 ${isSelected ? config.selectedColor : config.borderColor} ${!isDragging && config.hoverColor} rounded-lg ${isDragging ? 'shadow-xl' : 'shadow-sm hover:shadow-md'} ${config.bgHover}`}
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

// Optimize with custom comparison function
export default React.memo(WorkflowStep, (prevProps, nextProps) => {
  // Only re-render on specific prop changes
  return (
    prevProps.title === nextProps.title &&
    prevProps.subtitle === nextProps.subtitle &&
    prevProps.position.x === nextProps.position.x &&
    prevProps.position.y === nextProps.position.y &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isNew === nextProps.isNew &&
    // Essential - Check if transform has changed
    prevProps.transform.x === nextProps.transform.x &&
    prevProps.transform.y === nextProps.transform.y &&
    prevProps.transform.scale === nextProps.transform.scale
  );
});