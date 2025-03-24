import { Menu } from '../core/Menu';
import { NODE_TYPES } from '../../constants';

/**
 * Menu for selecting node types when adding a new step
 * Extends the base Menu class with node type-specific functionality
 */
export class NodeTypeMenu extends Menu {
  constructor(id, options = {}) {
    super(id, {
      autoHide: true,
      autoHideTimeout: 2500,
      ...options
    });
    
    // Set default node types if not provided
    if (!this.items || this.items.length === 0) {
      this.setDefaultNodeTypes();
    }
  }

  /**
   * Set up default node types as menu items
   */
  setDefaultNodeTypes() {
    const items = [
      {
        id: NODE_TYPES.TRIGGER,
        label: 'Trigger',
        icon: 'zap',
        description: 'Starting point of a workflow',
        command: null // Will be set by the MenuFactory
      },
      {
        id: NODE_TYPES.CONTROL,
        label: 'Control',
        icon: 'sliders',
        description: 'Control the flow of execution',
        command: null
      },
      {
        id: NODE_TYPES.ACTION,
        label: 'Action',
        icon: 'play',
        description: 'Perform an action',
        command: null
      },
      {
        id: NODE_TYPES.IFELSE,
        label: 'If/Else',
        icon: 'git-branch',
        description: 'Branch based on a condition',
        command: null
      },
      {
        id: NODE_TYPES.SPLITFLOW,
        label: 'Split Flow',
        icon: 'git-merge',
        description: 'Split into multiple paths',
        command: null
      }
    ];
    
    this.setItems(items);
  }

  /**
   * Filter the available node types based on source node type
   * @param {string} sourceNodeType - Type of the source node
   */
  filterNodeTypesBySource(sourceNodeType) {
    // Reset to default items first
    this.setDefaultNodeTypes();
    
    // Apply filters based on source node type
    let filteredItems = [...this.items];
    
    switch (sourceNodeType) {
      case NODE_TYPES.TRIGGER:
        // Triggers can't follow other nodes
        filteredItems = filteredItems.filter(item => item.id !== NODE_TYPES.TRIGGER);
        break;
        
      case NODE_TYPES.IFELSE:
      case NODE_TYPES.SPLITFLOW:
        // These are already branching nodes, so don't allow more branching from standard connections
        // (Branch connections are handled separately)
        break;
        
      default:
        // No specific restrictions for other node types
        break;
    }
    
    this.setItems(filteredItems);
    return this;
  }

  /**
   * Configure the menu items to use the provided add node callback
   * @param {Function} addNodeCallback - Function to call when a node type is selected
   * @param {Object} config - Additional configuration
   */
  configureNodeTypeActions(addNodeCallback, config = {}) {
    const { sourceNodeId, connectionType, branchId } = config;
    
    // Update each item's command to use the provided callback
    const updatedItems = this.items.map(item => {
      return {
        ...item,
        command: {
          execute: () => {
            if (typeof addNodeCallback === 'function') {
              addNodeCallback(sourceNodeId, item.id, connectionType, branchId);
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
   * Show the menu with additional node-specific data
   * @param {Object} targetElement - Element to position relative to
   * @param {Object} data - Additional data for positioning or filtering
   */
  show(targetElement, data = {}) {
    // Filter node types if a source node type is specified
    if (data.sourceNodeType) {
      this.filterNodeTypesBySource(data.sourceNodeType);
    }
    
    // Configure actions if a callback is provided
    if (data.addNodeCallback) {
      this.configureNodeTypeActions(data.addNodeCallback, {
        sourceNodeId: data.sourceNodeId,
        connectionType: data.connectionType,
        branchId: data.branchId
      });
    }
    
    // Call the parent show method
    super.show(targetElement, data);
    return this;
  }
}