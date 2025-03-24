import { useState, useCallback } from 'react';

/**
 * Custom hook to manage menu state and interactions
 * 
 * This consolidates all menu-related functions that were previously
 * scattered throughout the AutomationWorkflow component
 */
export const useMenuState = () => {
  // Consolidated state for all menu handling
  const [menuState, setMenuState] = useState({
    activeNodeId: null,
    activeBranch: null,
    position: null,
    menuType: null // 'add', 'branch', or 'branchEdge'
  });
  
  // Close all menus
  const handleCloseMenu = useCallback(() => {
    setMenuState({ 
      activeNodeId: null, 
      activeBranch: null, 
      position: null, 
      menuType: null 
    });
  }, []);
  
  // Base show menu function that the others will use
  const handleShowMenu = useCallback((nodeId, menuType, branchId = null, e, buttonRect) => {
    // Don't show menu if node doesn't exist or missing information
    if (!nodeId) return;
    
    // Prevent event propagation
    if (e) {
      e.stopPropagation();
    }
    
    // Toggle menu state
    setMenuState(prev => {
      // If clicking the same button that's already active, close the menu
      if (prev.activeNodeId === nodeId && 
          prev.menuType === menuType && 
          prev.activeBranch === branchId) {
        return { 
          activeNodeId: null, 
          activeBranch: null, 
          position: null, 
          menuType: null 
        };
      }
      
      // Otherwise, open the requested menu
      return {
        activeNodeId: nodeId,
        activeBranch: branchId,
        position: buttonRect,
        menuType: menuType
      };
    });
  }, []);
  
  // Specialized menu functions using the base function
  const handleShowAddMenu = useCallback((nodeId, e, buttonRect) => {
    handleShowMenu(nodeId, 'add', null, e, buttonRect);
  }, [handleShowMenu]);
  
  const handleShowBranchEndpointMenu = useCallback((nodeId, branchId, e, buttonRect) => {
    handleShowMenu(nodeId, 'branch', branchId, e, buttonRect);
  }, [handleShowMenu]);
  
  const handleShowBranchEdgeMenu = useCallback((nodeId, branchId, e, buttonRect) => {
    handleShowMenu(nodeId, 'branchEdge', branchId, e, buttonRect);
  }, [handleShowMenu]);
  
  return {
    menuState,
    handleCloseMenu,
    handleShowMenu,
    handleShowAddMenu,
    handleShowBranchEndpointMenu,
    handleShowBranchEdgeMenu
  };
};