/**
 * Menu event handlers for the Automation Workflow
 */

/**
 * Handle closing all menus
 * 
 * @param {Function} setMenuState - State setter for menu state
 */
export const handleCloseMenu = (setMenuState) => {
  setMenuState({ 
    activeNodeId: null, 
    activeBranch: null, 
    position: null, 
    menuType: null 
  });
};

/**
 * Consolidated function to handle all menu interactions
 * 
 * @param {string} nodeId - ID of the node to show menu for
 * @param {string} menuType - Type of menu ('add', 'branch', or 'branchEdge')
 * @param {string|null} branchId - Optional branch ID for branch-specific menus
 * @param {Event} e - The original event
 * @param {Object} buttonRect - Rectangle representing the button position
 * @param {Object} workflowGraph - Current graph state
 * @param {Function} setMenuState - State setter for menu state
 */
export const handleShowMenu = (nodeId, menuType, branchId, e, buttonRect, workflowGraph, setMenuState) => {
  // Don't show menu if node doesn't exist
  if (!workflowGraph.getNode(nodeId)) return;
  
  // Toggle menu state
  setMenuState(prev => {
    // If clicking the same button that's already active, close the menu
    if (prev.activeNodeId === nodeId &&
        prev.menuType === menuType &&
        prev.activeBranch === branchId) {
      return { activeNodeId: null, activeBranch: null, position: null, menuType: null };
    }
    
    // Return the menu state
    return {
      activeNodeId: nodeId,
      activeBranch: branchId,
      position: buttonRect,
      menuType: menuType
    };
  });
  
  e.stopPropagation();
};

/**
 * Show the add node menu
 * 
 * @param {string} nodeId - ID of the node to show menu for
 * @param {Event} e - The original event
 * @param {Object} buttonRect - Rectangle representing the button position
 * @param {Object} workflowGraph - Current graph state 
 * @param {Function} setMenuState - State setter for menu state
 */
export const handleShowAddMenu = (nodeId, e, buttonRect, workflowGraph, setMenuState) => {
  handleShowMenu(nodeId, 'add', null, e, buttonRect, workflowGraph, setMenuState);
};

/**
 * Show the branch endpoint menu
 * 
 * @param {string} nodeId - ID of the node to show menu for
 * @param {string} branchId - ID of the branch 
 * @param {Event} e - The original event
 * @param {Object} buttonRect - Rectangle representing the button position
 * @param {Object} workflowGraph - Current graph state
 * @param {Function} setMenuState - State setter for menu state
 */
export const handleShowBranchEndpointMenu = (nodeId, branchId, e, buttonRect, workflowGraph, setMenuState) => {
  handleShowMenu(nodeId, 'branch', branchId, e, buttonRect, workflowGraph, setMenuState);
};

/**
 * Show the branch edge menu
 * 
 * @param {string} nodeId - ID of the node to show menu for
 * @param {string} branchId - ID of the branch
 * @param {Event} e - The original event
 * @param {Object} buttonRect - Rectangle representing the button position
 * @param {Object} workflowGraph - Current graph state
 * @param {Function} setMenuState - State setter for menu state
 */
export const handleShowBranchEdgeMenu = (nodeId, branchId, e, buttonRect, workflowGraph, setMenuState) => {
  handleShowMenu(nodeId, 'branchEdge', branchId, e, buttonRect, workflowGraph, setMenuState);
};

/**
 * Setup document-level click handler to close menus when clicking outside
 * 
 * @param {Object} menuState - Current menu state
 * @param {Function} handleCloseMenuFn - Function to close the menu
 * @returns {Function} Cleanup function to remove event listeners
 */
export const setupMenuCloseHandlers = (menuState, handleCloseMenuFn) => {
  // Handle click/touch events
  const handleClickOrDrag = (e) => {
    // Always proceed (ignoring CLICK_OUTSIDE_CLOSES_MENU setting)
    
    // Check what was clicked
    const clickedNodeElement = e.target.closest('[data-node-element="true"]');
    const isClickingAddButton = clickedNodeElement && clickedNodeElement.classList.contains('add-node-button');
    const isClickingMenu = e.target.closest('[data-menu-element="true"]');
    
    // Check if we're interacting with any menu
    if (menuState.activeNodeId !== null) {
      // Per requirements: only keep menu open when mousing over menu or add button
      // Close menu in all other cases
      if (!isClickingMenu && !isClickingAddButton) {
        handleCloseMenuFn();
      }
    }
  };
  
  document.addEventListener('mousedown', handleClickOrDrag);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('mousedown', handleClickOrDrag);
  };
};