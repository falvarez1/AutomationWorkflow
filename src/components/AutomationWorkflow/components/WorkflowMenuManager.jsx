import React, { useCallback } from 'react';
import NodeMenu from '../ui/NodeMenu';
import BranchMenu from '../ui/BranchMenu';
import { getMenuPosition } from '../utils/positionUtils';
import { pluginRegistry } from '../plugins/registry';

/**
 * Component that centralizes all menu management functionality
 */
const WorkflowMenuManager = ({
  menuState,
  workflowGraph,
  transform,
  buttonYOffset,
  onAddNode,
  onCloseMenu
}) => {
  // Calculate menu position based on menu state
  const calculateMenuPosition = useCallback(() => {
    return getMenuPosition(
      menuState,
      workflowGraph,
      transform,
      (node, branchId) => {
        const nodePlugin = pluginRegistry.getNodeType(node.type);
        return nodePlugin ? nodePlugin.getBranchEndpoint(node, branchId) : null;
      },
      buttonYOffset
    );
  }, [menuState, workflowGraph, transform, buttonYOffset]);

  // Determine which menu to show based on menu type
  const renderMenus = () => {
    // Handle direct position from AddNodeButton with no active node
    if (menuState.position && (menuState.menuType === 'addButton' || !menuState.activeNodeId)) {
      const position = calculateMenuPosition();
      
      return (
        <NodeMenu
          isOpen={true}
          onClose={onCloseMenu}
          sourceNodeId={menuState.activeNodeId || 'none'} // Use 'none' as fallback
          activeBranchInfo={null}
          menuPosition={position}
          transform={transform}
          buttonYOffset={buttonYOffset}
          onAddNode={onAddNode}
        />
      );
    }
    
    // For traditional node-based menus, require an active node ID
    if (!menuState.activeNodeId) return null;
    
    const position = calculateMenuPosition();
    
    // Standard node menu (non-branch)
    if (menuState.menuType === 'add') {
      return (
        <NodeMenu
          isOpen={true}
          onClose={onCloseMenu}
          sourceNodeId={menuState.activeNodeId}
          activeBranchInfo={null}
          menuPosition={position}
          transform={transform}
          buttonYOffset={buttonYOffset}
          onAddNode={onAddNode}
        />
      );
    }
    
    // Branch-specific menu
    if ((menuState.menuType === 'branch' || menuState.menuType === 'branchEdge') &&
        menuState.activeBranch) {
      return (
        <BranchMenu
          isOpen={true}
          onClose={onCloseMenu}
          sourceNodeId={menuState.activeNodeId}
          branchId={menuState.activeBranch}
          menuPosition={position}
          transform={transform}
          onAddNode={onAddNode}
        />
      );
    }
    
    return null;
  };
  
  return renderMenus();
};

export default WorkflowMenuManager;