import { LAYOUT, MENU_PLACEMENT } from '../constants';

/**
 * Calculates the endpoint position for a branch connection
 * 
 * @param {Object} node - The source node
 * @param {string} branchId - The branch identifier
 * @param {Object} pluginRegistry - Registry to look up node type information
 * @returns {Object|null} The calculated endpoint position {x, y} or null if invalid
 */
export const getBranchEndpoint = (node, branchId, pluginRegistry) => {
  const startX = node.position.x + (LAYOUT.NODE.DEFAULT_WIDTH / 2);
  const startY = node.position.y + (node.height || LAYOUT.NODE.DEFAULT_HEIGHT);
  
  if (node.type === 'ifelse') {
    // For IFELSE nodes, we only have two valid branch IDs: 'yes' and 'no'
    if (branchId === 'yes') {
      return { x: node.position.x - 65 + (LAYOUT.NODE.DEFAULT_WIDTH / 2), y: startY + 40 };
    } else if (branchId === 'no') {
      return { x: node.position.x + 65 + (LAYOUT.NODE.DEFAULT_WIDTH / 2), y: startY + 40 };
    } else {
      // Return null for invalid branch IDs to prevent unwanted buttons
      return null;
    }
  } else if (node.type === 'splitflow') {
    // Get all branches for this split flow node
    const branches = pluginRegistry.getNodeType('splitflow').getBranches(node.properties);
    const index = branches.findIndex(b => b.id === branchId);
    
    if (index === -1) {
      return null; // Invalid branch ID
    }
    
    // Get the total number of branches to determine spacing
    const totalBranches = branches.length;
    
    // Calculate spacing between branches
    // For 2 branches: positions at -65 and +65 (similar to IfElse)
    // For 3 branches: positions at -120, 0, and +120
    const spacing = totalBranches === 2 ? 130 : 120;
    
    // Calculate position based on index and total branches
    const startPosition = -(spacing * (totalBranches - 1)) / 2;
    const xOffset = startPosition + (index * spacing);
    
    return { x: startX + xOffset, y: startY + 40 };
  }
  
  // Default return for other node types
  return { x: startX, y: startY };
};

/**
 * Calculates the standard connection points between two nodes
 * 
 * @param {Object} sourceNode - The source node
 * @param {Object} targetNode - The target node
 * @param {number} edgeInputYOffset - Input edge Y offset
 * @param {number} edgeOutputYOffset - Output edge Y offset
 * @returns {Object} The calculated start and end positions
 */
export const calculateConnectionPoints = (
  sourceNode, 
  targetNode, 
  edgeInputYOffset = LAYOUT.EDGE.INPUT_Y_OFFSET,
  edgeOutputYOffset = LAYOUT.EDGE.OUTPUT_Y_OFFSET
) => {
  if (!sourceNode || !targetNode) return { startPos: null, endPos: null };
  
  const sourceX = sourceNode.position.x + (LAYOUT.NODE.DEFAULT_WIDTH / 2);
  const sourceY = sourceNode.position.y + (sourceNode.height || LAYOUT.NODE.DEFAULT_HEIGHT) + edgeOutputYOffset;
  
  const targetX = targetNode.position.x + (LAYOUT.NODE.DEFAULT_WIDTH / 2);
  const targetY = targetNode.position.y + edgeInputYOffset;
  
  return {
    startPos: { x: sourceX, y: sourceY },
    endPos: { x: targetX, y: targetY }
  };
};

/**
 * Calculates the branch connection points between nodes
 * 
 * @param {Object} sourceNode - The source node
 * @param {Object} targetNode - The target node
 * @param {string} branchId - The branch identifier
 * @param {Object} pluginRegistry - Registry to look up node type information
 * @param {number} edgeInputYOffset - Input edge Y offset
 * @returns {Object} The calculated start and end positions
 */
export const calculateBranchConnectionPoints = (
  sourceNode, 
  targetNode, 
  branchId,
  pluginRegistry,
  edgeInputYOffset = LAYOUT.EDGE.INPUT_Y_OFFSET
) => {
  if (!sourceNode || !targetNode || !branchId) return { startPos: null, endPos: null };
  
  const branchEndpoint = getBranchEndpoint(sourceNode, branchId, pluginRegistry);
  
  const targetX = targetNode.position.x + (LAYOUT.NODE.DEFAULT_WIDTH / 2);
  const targetY = targetNode.position.y + edgeInputYOffset;
  
  return {
    startPos: branchEndpoint,
    endPos: { x: targetX, y: targetY }
  };
};

/**
 * Calculates menu position based on node and menu state
 * 
 * @param {Object} menuState - Current menu state
 * @param {Object} workflowGraph - Graph instance
 * @param {Object} transform - Current canvas transform
 * @param {Function} getBranchEndpoint - Function to get branch endpoint
 * @param {number} buttonYOffset - Button vertical offset
 * @param {boolean} isAttachedToCanvas - Whether menu should be attached to canvas
 * @returns {Object} The calculated menu position {x, y}
 */
export const getMenuPosition = (
  menuState, 
  workflowGraph, 
  transform, 
  getBranchEndpointFn,
  buttonYOffset = LAYOUT.BUTTON.Y_OFFSET,
  isAttachedToCanvas = MENU_PLACEMENT.ATTACH_TO_CANVAS
) => {
  const { activeNodeId, activeBranch, position: anchorPosition, menuType } = menuState;
  if (!activeNodeId) return { x: 0, y: 0 };
  
  const sourceNode = workflowGraph.getNode(activeNodeId);
  if (!sourceNode) return { x: 0, y: 0 };
  
  // Branch specific position
  if (activeBranch && (menuType === 'branch' || menuType === 'branchEdge')) {
    if (isAttachedToCanvas) {
      // Position menu relative to the node in graph coordinates
      if (anchorPosition) {
        // Convert screen coords to graph coords
        return {
          x: (anchorPosition.x - transform.x) / transform.scale,
          y: (anchorPosition.y + anchorPosition.height/2 + buttonYOffset + MENU_PLACEMENT.MENU_VERTICAL_OFFSET - transform.y) / transform.scale
        };
      } else {
        const branchEndpoint = getBranchEndpointFn(sourceNode, activeBranch);
        return {
          x: branchEndpoint.x,
          y: branchEndpoint.y + LAYOUT.BUTTON.SIZE + 10
        };
      }
    } else {
      // Fixed position (outside transform)
      if (anchorPosition) {
        return anchorPosition;
      } else {
        const branchEndpoint = getBranchEndpointFn(sourceNode, activeBranch);
        // Convert branch endpoint position to screen coordinates
        return {
          x: branchEndpoint.x * transform.scale + transform.x,
          y: (branchEndpoint.y + LAYOUT.BUTTON.SIZE + 10) * transform.scale + transform.y
        };
      }
    }
  } 
  // Standard node position
  else {
    if (isAttachedToCanvas) {
      // Position menu in graph coordinates (part of the canvas transform)
      if (anchorPosition) {
        // Convert screen coords to graph coords
        return {
          x: (anchorPosition.x - transform.x) / transform.scale,
          y: (anchorPosition.y + anchorPosition.height/2 + buttonYOffset + MENU_PLACEMENT.MENU_VERTICAL_OFFSET - transform.y) / transform.scale
        };
      } else {
        return {
          x: sourceNode.position.x + (LAYOUT.NODE.DEFAULT_WIDTH / 2),
          y: sourceNode.position.y + (sourceNode.height || LAYOUT.NODE.DEFAULT_HEIGHT) + buttonYOffset + LAYOUT.BUTTON.SIZE + 10
        };
      }
    } else {
      // Fixed position (outside transform)
      if (anchorPosition) {
        return anchorPosition;
      } else {
        // Convert node position to screen coordinates
        return {
          x: sourceNode.position.x * transform.scale + transform.x + (LAYOUT.NODE.DEFAULT_WIDTH / 2) * transform.scale,
          y: (sourceNode.position.y + (sourceNode.height || LAYOUT.NODE.DEFAULT_HEIGHT) + buttonYOffset + LAYOUT.BUTTON.SIZE + 10) * transform.scale + transform.y
        };
      }
    }
  }
};