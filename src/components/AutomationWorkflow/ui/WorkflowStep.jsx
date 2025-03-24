import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

/**
 * Represents a single node in the workflow graph
 */
const WorkflowStep = ({
  node,
  nodePlugin,
  isSelected = false,
  onClick,
  onDrag,
  onDragStart,
  onDragEnd,
  onHeightChange,
  onContextMenu,
  isAnimating = false
}) => {
  // Check if position is valid, use default if not
  if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
    console.warn(`Node ${node.id} has invalid position:`, node.position);
    // Use a default position to prevent crashes
    node.position = { x: 0, y: 0 };
  }
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nodeRef = useRef(null);
  const contentRef = useRef(null);
  
  // Update height when content changes
  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.offsetHeight;
      if (height !== node.height) {
        onHeightChange && onHeightChange(node.id, height);
      }
    }
  }, [node, node.id, onHeightChange]);
  
  // Get the node plugin icon if available
  const NodeIcon = nodePlugin?.icon || null;
  
  // Get node-type specific styles
  const getNodeStyles = () => {
    let baseStyles = 'border-2 rounded-md shadow-md p-3 bg-white flex flex-col';
    
    // Base border color by node type
    switch (node.type) {
      case 'trigger':
        baseStyles += ' border-blue-500';
        break;
      case 'control':
        baseStyles += ' border-purple-500';
        break;
      case 'action':
        baseStyles += ' border-green-500';
        break;
      case 'ifelse':
        baseStyles += ' border-orange-500';
        break;
      case 'splitflow':
        baseStyles += ' border-yellow-500';
        break;
      default:
        baseStyles += ' border-gray-300';
    }
    
    // Add selected styling
    if (isSelected) {
      baseStyles += ' ring-2 ring-blue-400 ring-offset-2';
    }
    
    // Add animating styling
    if (isAnimating) {
      baseStyles += ' animate-fadeIn';
    }
    
    return baseStyles;
  };
  
  // Handle mouse down for drag start
  const handleMouseDown = (e) => {
    // Only initiate drag on left-click and if not clicking the context menu button
    const isContextMenuClick = e.target.closest('[data-context-menu-trigger="true"]');
    if (e.button !== 0 || isContextMenuClick) return;
    
    // Set dragging state
    setIsDragging(true);
    
    // Calculate the offset from the top left of the node
    const rect = nodeRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    // Call the drag start handler with the current position
    onDragStart && onDragStart(node.id, { x: node.position.x, y: node.position.y });
    
    // Add temporary drag-related event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Prevent default to avoid text selection during drag
    e.preventDefault();
  };
  
  // Handle mouse move for dragging
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    // Calculate new position based on mouse position and initial offset
    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;
    
    // Apply transformation
    nodeRef.current.style.transform = `translate(${x}px, ${y}px)`;
    
    // Convert to graph coordinates
    // This assumes the parent container has a transform with scale
    const scale = parseFloat(getComputedStyle(nodeRef.current.parentElement).transform.split(',')[3]) || 1;
    
    // Call the drag handler with the new position
    onDrag && onDrag(
      node.id,
      x / scale,
      y / scale
    );
  };
  
  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    if (!isDragging) return;
    
    // Reset dragging state
    setIsDragging(false);
    
    // Remove temporary event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Call the drag end handler
    onDragEnd && onDragEnd(node.id);
  };
  
  // Handle node click
  const handleClick = (e) => {
    // If we're dragging, don't register a click
    if (isDragging) return;
    
    // Check if this is a context menu click
    const isContextMenuClick = e.target.closest('[data-context-menu-trigger="true"]');
    if (isContextMenuClick) return;
    
    // Mark this node as just clicked, so the canvas doesn't deselect it
    const nodeElement = nodeRef.current;
    if (nodeElement) {
      nodeElement.setAttribute('data-was-just-clicked', 'true');
      setTimeout(() => {
        nodeElement.removeAttribute('data-was-just-clicked');
      }, 100);
    }
    
    // Call the click handler
    onClick && onClick(node.id);
  };
  
  // Handle context menu button click
  const handleContextMenuClick = (e) => {
    e.stopPropagation();
    
    // Get the button position for the context menu
    const buttonRect = e.currentTarget.getBoundingClientRect();
    
    // Call the context menu handler
    onContextMenu && onContextMenu(node.id, {
      x: buttonRect.right,
      y: buttonRect.top,
      width: buttonRect.width,
      height: buttonRect.height,
      nodeId: node.id
    });
  };
  
  // Render type-specific content if available
  const renderTypeSpecificContent = () => {
    if (nodePlugin && nodePlugin.renderContent) {
      return nodePlugin.renderContent(node);
    }
    return null;
  };
  
  // Combine all event handlers
  return (
    <div
      ref={nodeRef}
      data-node-element="true"
      data-node-id={node.id}
      data-node-type={node.type}
      className={`absolute cursor-grab ${getNodeStyles()}`}
      style={{
        transform: `translate(${node.position.x}px, ${node.position.y}px)`,
        width: '240px',
        zIndex: isSelected ? 20 : 10,
        transition: isDragging ? 'none' : 'box-shadow 0.2s, border-color 0.2s, ring 0.2s',
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="p-1 rounded-md mr-2 text-white" style={{ backgroundColor: nodePlugin?.color || '#6B7280' }}>
            {NodeIcon && <NodeIcon className="w-4 h-4" />}
          </div>
          <h3 className="font-medium text-gray-900">{node.title || 'Unnamed Step'}</h3>
        </div>
        
        {/* Context menu button */}
        <button
          className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
          data-context-menu-trigger="true"
          onClick={handleContextMenuClick}
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
      
      <div ref={contentRef} className="text-sm text-gray-600">
        <p className="mb-2">{node.subtitle || 'No description'}</p>
        {renderTypeSpecificContent()}
      </div>
    </div>
  );
};

export default WorkflowStep;