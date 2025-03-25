import React from 'react';
import { 
  Send, 
  Zap, 
  Hexagon, 
  GitBranch, 
  GitMerge
} from 'lucide-react';
import { CONNECTION_TYPES, NODE_TYPES } from '../constants';
import BaseMenu from './BaseMenu';

const NodeMenu = ({ 
  isOpen, 
  onClose, 
  sourceNodeId, 
  activeBranchInfo, 
  menuPosition, 
  transform, 
  onAddNode 
}) => {
  // Handle node selection with branch info
  const handleSelectNodeType = (nodeType) => {
    const connectionType = activeBranchInfo ? CONNECTION_TYPES.BRANCH : CONNECTION_TYPES.DEFAULT;
    const branchId = activeBranchInfo ? activeBranchInfo.branchId : null;
    
    onAddNode(sourceNodeId, nodeType, connectionType, branchId);
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
    </BaseMenu>
  );
};

export default NodeMenu;
