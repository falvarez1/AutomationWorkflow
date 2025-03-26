import { NODE_TYPES, LAYOUT } from '../constants';

/**
 * Utility functions for calculating branch-related positions and endpoints
 */
export const BranchUtils = {
  /**
   * Calculate the endpoint position for a specific branch of a node
   * 
   * @param {Object} node - The node containing the branches
   * @param {string} branchId - The ID of the branch to calculate
   * @param {Object} pluginRegistry - The plugin registry to look up node type metadata
   * @param {Object} defaults - Default dimensions and spacing values
   * @returns {Object|null} The calculated endpoint position {x, y} or null if invalid
   */
  getBranchEndpoint: (node, branchId, pluginRegistry, defaults= {}) => {
    const {
      DEFAULT_NODE_WIDTH = LAYOUT.NODE.DEFAULT_WIDTH,
      DEFAULT_NODE_HEIGHT = LAYOUT.NODE.DEFAULT_HEIGHT,
      BRANCH_EDGE_OFFSET = LAYOUT.EDGE.BRANCH_EDGE_OFFSET
    } = defaults;

    const startX = node.position.x + (DEFAULT_NODE_WIDTH / 2);
    const startY = node.position.y + (node.height || DEFAULT_NODE_HEIGHT);
    
    if (node.type === NODE_TYPES.IFELSE) {
      // For IFELSE nodes, we only have two valid branch IDs: 'yes' and 'no'
      if (branchId === 'yes') {
        return { x: startX - 65, y: startY + BRANCH_EDGE_OFFSET };
      } else if (branchId === 'no') {
        return { x: startX + 65, y: startY + BRANCH_EDGE_OFFSET };
      } else {
        // Return null for invalid branch IDs to prevent unwanted buttons
        return null;
      }
    } else if (node.type === NODE_TYPES.SPLITFLOW) {
      // Get all branches for this split flow node from the node's properties
      //const branches = node.properties?.branches || [];
      //const branches = pluginRegistry.getNodeType('splitflow').getBranches(node.properties);
      const branches = BranchUtils.getNodeBranches(node, pluginRegistry);
      const index = branches.findIndex(b => b.id === branchId);
      //console.log('BranchUtils node properties', node.properties);
      if (index === -1) {
        return null; // Invalid branch ID
      }
      
      // Get the total number of branches to determine spacing
      const totalBranches = branches.length;
      
      // Calculate spacing between branches
      // For 2 branches: positions at -65 and +65 (similar to IfElse)
      // For 3+ branches: evenly distribute with appropriate spacing
      const spacing = totalBranches === 2 ? 130 : 120;
      
      // Calculate position based on index and total branches
      const startPosition = -(spacing * (totalBranches - 1)) / 2;
      const xOffset = startPosition + (index * spacing);
      
      return { x: startX + xOffset, y: startY + BRANCH_EDGE_OFFSET };
    }
    
    // Default return for other node types
    return { x: startX, y: startY + BRANCH_EDGE_OFFSET };
  },
  
  /**
   * Get all valid branches for a given node
   * 
   * @param {Object} node - The node to get branches for
   * @param {Object} pluginRegistry - The plugin registry to look up node type metadata
   * @returns {Array} Array of branch objects with id and label
   */
  getNodeBranches: (node, pluginRegistry) => {
    if (!node || !pluginRegistry) return [];
    
    const nodePlugin = pluginRegistry.getNodeType(node.type);
    if (!nodePlugin || !nodePlugin.getBranches) return [];
    
  //  console.log("Getting branches for node", node.id, "type", node.type, "properties", node.properties);
    let branches = nodePlugin.getBranches(node.properties) || [];
  //  console.log("Generated branches:", branches);
    
    // Fallback for SPLITFLOW nodes
    if (node.type === NODE_TYPES.SPLITFLOW && branches.length === 0) {
      branches = [
        { id: 'path1', label: 'Path 1' },
        { id: 'path2', label: 'Path 2' }
      ];
    }
    
    return branches;
  }
};
