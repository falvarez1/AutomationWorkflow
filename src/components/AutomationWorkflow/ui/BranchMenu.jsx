import React from 'react';
import { Send, Zap, Hexagon } from 'lucide-react';
import { CONNECTION_TYPES, NODE_TYPES } from '../constants';
import BaseMenu from './BaseMenu';

const BranchMenu = ({ 
  isOpen, 
  onClose, 
  sourceNodeId, 
  branchId, 
  menuPosition, 
  transform, 
  onAddNode 
}) => {
  // Handle node selection
  const handleSelectNodeType = (nodeType) => {
    onAddNode(sourceNodeId, nodeType, CONNECTION_TYPES.BRANCH, branchId);
  };
  
  return (
    <BaseMenu
      isOpen={isOpen}
      onClose={onClose}
      menuPosition={menuPosition}
      transform={transform}
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
    </BaseMenu>
  );
};

export default BranchMenu;
