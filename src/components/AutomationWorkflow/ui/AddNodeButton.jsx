import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useMenuSystem } from '../menus';

/**
 * Button component for adding nodes to the workflow
 * Works with the refactored menu system
 */
const AddNodeButton = ({
  position,
  nodeWidth,
  buttonSize,
  onAdd,
  isHighlighted = false,
  sourceNodeId = 'none',
  sourceType = 'standard',
  branchId = null
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef(null);
  const menuSystem = useMenuSystem();
  
  // Get button position and dimensions for menu positioning
  const getButtonRect = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2, // Center X
        y: rect.top + rect.height / 2,  // Center Y
        width: rect.width,
        height: rect.height,
        nodeId: sourceNodeId,
        branchId: branchId
      };
    }
    return null;
  };
  
  // Handle mouse events for hover state
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
  };
  
  // Handle button click to show appropriate menu
  const handleClick = (e) => {
    // Get the button rectangle for menu positioning
    const buttonRect = getButtonRect();
    if (!buttonRect) return;
    
    // Determine which menu to show based on button type
    if (sourceType === 'standard') {
      // For standard connections, show the add node menu
      menuSystem.toggleMenu('add-node-menu', buttonRect, {
        sourceNodeId,
        connectionType: 'default',
        addNodeCallback: onAdd,
        hideOthers: true
      });
    } else if (sourceType === 'branch') {
      // For branch connections, show the branch menu
      menuSystem.toggleMenu('branch-menu', buttonRect, {
        sourceNodeId,
        branchId,
        connectionType: 'branch',
        addNodeCallback: onAdd,
        hideOthers: true
      });
    }
    
    e.stopPropagation();
  };
  
  return (
    <div
      style={{
        position: 'absolute',
        left: (position.x - (buttonSize / 2)) + 'px', // Center directly on the position point
        top: (position.y - (buttonSize / 2)) + 'px', // Center vertically too
        zIndex: 5, // Between lines (0) and nodes (10+)
      }}
      data-node-element="true"
      data-source-node-id={sourceNodeId}
      data-button-type={sourceType}
      data-menu-trigger="true"
      className="add-node-button"
    >
      <button
        ref={buttonRef}
        style={{
          transition: 'transform 0.2s, box-shadow 0.2s, background-color 0.2s'
        }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`flex items-center justify-center w-10 h-10 rounded-full
          ${isHovered || isHighlighted ? 'bg-blue-600 shadow-lg transform scale-110' : 'bg-blue-500 shadow'}
          text-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2`}
      >
        <Plus className="w-6 h-6" />
        
        {/* Show tooltip on hover (only if not highlighted) */}
        {isHovered && !isHighlighted && (
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-50">
            Add step
          </div>
        )}
      </button>
    </div>
  );
};

export default AddNodeButton;