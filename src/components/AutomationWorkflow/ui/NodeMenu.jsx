import React, { useEffect, useRef, useState } from 'react';
import { 
  Send, 
  Zap, 
  Hexagon, 
  GitBranch, 
  GitMerge
} from 'lucide-react';
import { CONNECTION_TYPES, NODE_TYPES, MENU_PLACEMENT } from '../constants';

const NodeMenu = ({ 
  isOpen, 
  onClose, 
  sourceNodeId, 
  activeBranchInfo, 
  menuPosition, 
  transform, 
  buttonYOffset,
  onAddNode 
}) => {
  // Auto-hide timer state
  const menuHideTimerRef = useRef(null);
  const [isMouseOver, setIsMouseOver] = useState(false);
  
  // Clear and start timer functions
  const clearHideTimer = () => {
    if (menuHideTimerRef.current) {
      clearTimeout(menuHideTimerRef.current);
      menuHideTimerRef.current = null;
    }
  };
  
  const startHideTimer = () => {
    clearHideTimer();
      menuHideTimerRef.current = setTimeout(() => {
        onClose();
      }, 3000); // Use a timeout constant
  };
  
  // Mouse event handlers
  const handleMouseEnter = () => {
    clearHideTimer();
    setIsMouseOver(true);
  };
  
  const handleMouseLeave = () => {
    setIsMouseOver(false);
    startHideTimer();
  };
  
  // Start/clear timer when menu opens/closes
  useEffect(() => {
    if (isOpen) {
      startHideTimer();
    } else {
      clearHideTimer();
    }
    
    return () => clearHideTimer();
  }, [isOpen]);
  
  // Handle node selection with branch info
  const handleSelectNodeType = (nodeType) => {
    const connectionType = activeBranchInfo ? CONNECTION_TYPES.BRANCH : CONNECTION_TYPES.DEFAULT;
    const branchId = activeBranchInfo ? activeBranchInfo.branchId : null;
    
    onAddNode(sourceNodeId, nodeType, connectionType, branchId);
  };
  
  if (!isOpen) return null;
  
  // Calculate position based on attachment mode
  let menuStyle = {};
  
  if (MENU_PLACEMENT.ATTACH_TO_CANVAS) {
    // Position within canvas transform
    menuStyle = {
      left: `${menuPosition.x}px`,
      top: `${menuPosition.y}px`,
      transform: 'translateX(-50%)',
      zIndex: MENU_PLACEMENT.MENU_Z_INDEX
    };
  } else {
    // Fixed position (outside transform)
    menuStyle = {
      left: menuPosition.x,
      top: menuPosition.y + MENU_PLACEMENT.MENU_VERTICAL_OFFSET,
      transform: 'translateX(-50%)',
      position: 'fixed',
      zIndex: MENU_PLACEMENT.MENU_Z_INDEX
    };
  }
  
  return (
    <div 
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 node-menu absolute"
      style={menuStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex space-x-2">
        <button
          className="p-2 flex flex-col items-center text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md w-20 h-20"
          onClick={() => handleSelectNodeType(NODE_TYPES.TRIGGER)}
        >
          <Zap className="w-6 h-6 mb-1" />
          Trigger
        </button>
        <button
          className="p-2 flex flex-col items-center text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md w-20 h-20"
          onClick={() => handleSelectNodeType(NODE_TYPES.CONTROL)}
        >
          <Hexagon className="w-6 h-6 mb-1" />
          Control
        </button>
        <button
          className="p-2 flex flex-col items-center text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded-md w-20 h-20"
          onClick={() => handleSelectNodeType(NODE_TYPES.ACTION)}
        >
          <Send className="w-6 h-6 mb-1" />
          Action
        </button>
      </div>
      <div className="flex space-x-2 mt-2">
        <button
          className="p-2 flex flex-col items-center text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md w-20 h-20"
          onClick={() => handleSelectNodeType(NODE_TYPES.IFELSE)}
        >
          <GitBranch className="w-6 h-6 mb-1" />
          If/Else
        </button>
        <button
          className="p-2 flex flex-col items-center text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded-md w-20 h-20"
          onClick={() => handleSelectNodeType(NODE_TYPES.SPLITFLOW)}
        >
          <GitMerge className="w-6 h-6 mb-1" />
          Split Flow
        </button>
      </div>
    </div>
  );
};

export default NodeMenu;
