import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';

// Add Node Button Component with integrated menu
const AddNodeButton = ({
  position,
  nodeWidth,
  buttonSize,
  onAdd,
  isHighlighted = false,
  onMouseEnter,
  onMouseLeave,
  showMenu = false,
  sourceNodeId = 'none',
  sourceType = 'standard'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef(null);
  
  // Handle mouse events directly instead of using isMenuHovered state
  const handleMouseEnter = () => {
    setIsHovered(true);
    onMouseEnter?.(getButtonRect());
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    onMouseLeave?.();
  };
  
  // Function to get button position and dimensions
  const getButtonRect = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2, // Center X
        y: rect.top + rect.height / 2,  // Center Y
        width: rect.width,
        height: rect.height
      };
    }
    return null;
  };
  
  // Re-emit button position when it changes
  useEffect(() => {
    if (isHighlighted && buttonRef.current) {
      onMouseEnter?.(getButtonRect());
    }
  }, [position, isHighlighted]);
  
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
      className="add-node-button"
    >
      <button
        ref={buttonRef}
        style={{
          transition: 'transform 0.2s, box-shadow 0.2s, background-color 0.2s'
        }}
        onClick={(e) => {
          onAdd(e, getButtonRect());
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
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-50">
            Add step
          </div>
        )}
      </button>
    </div>
  );
};

export default AddNodeButton;