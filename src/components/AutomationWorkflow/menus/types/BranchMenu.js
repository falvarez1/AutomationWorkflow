import { Menu } from '../core/Menu';
import { NODE_TYPES, CONNECTION_TYPES } from '../../constants';

/**
 * Menu for branch endpoints (yes/no branches for if/else, paths for splitflow)
 * Extends the base Menu class with branch-specific functionality
 */
export class BranchMenu extends Menu {
  constructor(id, options = {}) {
    super(id, {
      autoHide: true,
      autoHideTimeout: 2500,
      ...options
    });
  }

  /**
   * Configure the branch menu with node type-specific items
   * @param {string} nodeType - The type of the source node
   * @param {string} branchId - The ID of the branch
   */
  configureBranchItems(nodeType, branchId) {
    let items = [];
    
    // Common items
    const commonItems = [
      {
        id: NODE_TYPES.ACTION,
        label: 'Action',
        icon: 'play',
        command: null // Will be set by the show method
      },
      {
        id: NODE_TYPES.CONTROL,
        label: 'Control',
        icon: 'sliders',
        command: null
      }
    ];
    
    // Add node type-specific items
    if (nodeType === NODE_TYPES.IFELSE) {
      // For if/else branches, we might want special items
      // based on whether it's a 'yes' or 'no' branch
      if (branchId === 'yes') {
        // Items specific to the "Yes" branch
        items = [
          ...commonItems,
          {
            id: NODE_TYPES.IFELSE,
            label: 'Nested If/Else',
            icon: 'git-branch',
            command: null
          }
        ];
      } else if (branchId === 'no') {
        // Items specific to the "No" branch
        items = [
          ...commonItems,
          {
            id: NODE_TYPES.SPLITFLOW,
            label: 'Split Flow',
            icon: 'git-merge',
            command: null
          }
        ];
      }
    } else if (nodeType === NODE_TYPES.SPLITFLOW) {
      // For split flow branches
      items = [
        ...commonItems,
        {
          id: NODE_TYPES.IFELSE,
          label: 'If/Else',
          icon: 'git-branch',
          command: null
        }
      ];
    } else {
      // Default items for other node types
      items = commonItems;
    }
    
    this.setItems(items);
    return this;
  }

  /**
   * Configure the menu items to use the provided add node callback
   * @param {Function} addNodeCallback - Function to call when a node type is selected
   * @param {Object} config - Additional configuration
   */
  configureBranchActions(addNodeCallback, config = {}) {
    const { sourceNodeId, branchId } = config;
    
    // Update each item's command to use the provided callback
    const updatedItems = this.items.map(item => {
      return {
        ...item,
        command: {
          execute: () => {
            if (typeof addNodeCallback === 'function') {
              addNodeCallback(sourceNodeId, item.id, CONNECTION_TYPES.BRANCH, branchId);
              return true;
            }
            return false;
          }
        }
      };
    });
    
    this.setItems(updatedItems);
    return this;
  }

  /**
   * Show the branch menu with branch-specific configuration
   * @param {Object} targetElement - Element to position relative to
   * @param {Object} data - Additional data for positioning or configuration
   */
  show(targetElement, data = {}) {
    const { sourceNodeType, sourceNodeId, branchId, addNodeCallback } = data;
    
    // Configure items based on node type and branch
    if (sourceNodeType && branchId) {
      this.configureBranchItems(sourceNodeType, branchId);
    }
    
    // Configure actions if a callback is provided
    if (addNodeCallback && sourceNodeId && branchId) {
      this.configureBranchActions(addNodeCallback, {
        sourceNodeId,
        branchId
      });
    }
    
    // Call the parent show method
    super.show(targetElement, data);
    return this;
  }
}