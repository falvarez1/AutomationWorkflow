import { Menu } from '../core/Menu';
import { Edit2, Copy, Trash2 } from 'lucide-react';

/**
 * Menu for node context actions (edit, duplicate, delete)
 * Extends the base Menu class with node-specific context menu functionality
 */
export class NodeContextMenu extends Menu {
  constructor(id, options = {}) {
    super(id, {
      autoHide: true,
      autoHideTimeout: 2500,
      ...options
    });
    
    // Set default context menu items if not provided
    if (!this.items || this.items.length === 0) {
      this.setDefaultItems();
    }
  }

  /**
   * Set up default context menu items
   */
  setDefaultItems() {
    const items = [
      {
        id: 'edit',
        label: 'Edit',
        icon: <Edit2 className="w-4 h-4" />,
        command: null // Will be set by the MenuFactory or on show
      },
      {
        id: 'duplicate',
        label: 'Duplicate',
        icon: <Copy className="w-4 h-4" />,
        command: null
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: <Trash2 className="w-4 h-4 text-red-500" />,
        command: null
      }
    ];
    
    this.setItems(items);
  }

  /**
   * Configure the menu items with action callbacks
   * @param {Object} handlers - Object containing action handler functions
   */
  configureActions(handlers = {}) {
    const updatedItems = this.items.map(item => {
      const handler = handlers[item.id];
      
      return {
        ...item,
        command: handler ? {
          execute: (data) => {
            if (typeof handler === 'function') {
              return handler(data.nodeId, item.id);
            }
            return false;
          }
        } : null
      };
    });
    
    this.setItems(updatedItems);
    return this;
  }

  /**
   * Show the menu with node-specific context
   * @param {Object} targetElement - Element to position relative to
   * @param {Object} data - Additional data (e.g., nodeId, handlers)
   */
  show(targetElement, data = {}) {
    // Configure actions if handlers are provided
    if (data.handlers) {
      this.configureActions(data.handlers);
    }
    
    // Call the parent show method
    super.show(targetElement, data);
    return this;
  }

  /**
   * Handle menu item click with node context
   * @param {string} itemId - ID of the clicked item
   * @param {Object} data - Additional data for the action
   */
  handleItemClick(itemId, data = {}) {
    // Ensure nodeId is included in the action data
    const actionData = {
      ...data,
      nodeId: data.nodeId || (this.targetElement ? this.targetElement.nodeId : null)
    };
    
    // Call the parent handler
    return super.handleItemClick(itemId, actionData);
  }
}