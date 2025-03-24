import { menuFactory } from './MenuFactory';
import { AUTO_HIDE_TIMEOUT } from '../../constants';
import { createCommand } from './MenuCommand';

/**
 * Manages all menus in the application
 * Provides a centralized interface for creating, showing, and hiding menus
 */
export class MenuManager {
  constructor() {
    this.menus = new Map(); // Map of menu ID to menu instance
    this.activeMenus = new Set(); // Set of currently visible menu IDs
    this.listeners = new Set(); // Set of event listeners
    this.isInitialized = false;
    
    // Default configuration
    this.config = {
      autoHideTimeout: AUTO_HIDE_TIMEOUT,
      attachToCanvas: true,
    };
    
    // Bind methods to maintain "this" context
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
  }

  /**
   * Initialize the menu manager
   * @param {Object} config - Configuration options
   */
  initialize(config = {}) {
    if (this.isInitialized) return;
    
    this.config = {
      ...this.config,
      ...config
    };
    
    // Set up global event listeners
    document.addEventListener('mousedown', this.handleDocumentClick);
    
    this.isInitialized = true;
    return this;
  }

  /**
   * Clean up resources when no longer needed
   */
  dispose() {
    // Remove event listeners
    document.removeEventListener('mousedown', this.handleDocumentClick);
    
    // Clean up all menus
    this.hideAllMenus();
    this.menus.forEach(menu => menu.dispose());
    this.menus.clear();
    this.activeMenus.clear();
    this.listeners.clear();
    
    this.isInitialized = false;
  }

  /**
   * Register a menu with the manager
   * @param {string} menuType - Type of menu to create
   * @param {string} menuId - Unique ID for this menu
   * @param {Object} config - Configuration for the menu
   * @returns {Menu} The registered menu
   */
  registerMenu(menuType, menuId, config = {}) {
    // Create the menu
    const menu = menuFactory.createMenu(menuType, menuId, {
      ...config,
      eventHandlers: {
        ...config.eventHandlers,
        onShow: (menu) => {
          this.activeMenus.add(menu.id);
          this.notifyListeners('menuShown', { menuId: menu.id });
          if (config.eventHandlers?.onShow) {
            config.eventHandlers.onShow(menu);
          }
        },
        onHide: (menu) => {
          this.activeMenus.delete(menu.id);
          this.notifyListeners('menuHidden', { menuId: menu.id });
          if (config.eventHandlers?.onHide) {
            config.eventHandlers.onHide(menu);
          }
        }
      }
    });
    
    // Store the menu
    this.menus.set(menuId, menu);
    
    return menu;
  }

  /**
   * Get a registered menu by ID
   * @param {string} menuId - ID of the menu to retrieve
   * @returns {Menu|null} The menu or null if not found
   */
  getMenu(menuId) {
    return this.menus.get(menuId) || null;
  }

  /**
   * Check if a menu is currently visible
   * @param {string} menuId - ID of the menu to check
   * @returns {boolean} True if the menu is visible
   */
  isMenuVisible(menuId) {
    const menu = this.getMenu(menuId);
    return menu ? menu.isVisible : false;
  }

  /**
   * Show a menu
   * @param {string} menuId - ID of the menu to show
   * @param {Object} targetElement - Element to position the menu relative to
   * @param {Object} data - Additional data for positioning or rendering
   * @returns {boolean} True if the menu was shown
   */
  showMenu(menuId, targetElement, data = {}) {
    const menu = this.getMenu(menuId);
    if (!menu) return false;
    
    // If specified in options, hide other menus when showing this one
    if (data.hideOthers) {
      this.hideAllMenus();
    }
    
    menu.show(targetElement, data);
    return true;
  }

  /**
   * Hide a menu
   * @param {string} menuId - ID of the menu to hide
   * @returns {boolean} True if the menu was hidden
   */
  hideMenu(menuId) {
    const menu = this.getMenu(menuId);
    if (!menu) return false;
    
    menu.hide();
    return true;
  }

  /**
   * Hide all visible menus
   */
  hideAllMenus() {
    this.activeMenus.forEach(menuId => {
      this.hideMenu(menuId);
    });
  }

  /**
   * Toggle a menu's visibility
   * @param {string} menuId - ID of the menu to toggle
   * @param {Object} targetElement - Element to position the menu relative to if showing
   * @param {Object} data - Additional data for positioning or rendering
   * @returns {boolean} True if the menu is now visible, false if now hidden
   */
  toggleMenu(menuId, targetElement, data = {}) {
    const menu = this.getMenu(menuId);
    if (!menu) return false;
    
    if (menu.isVisible) {
      this.hideMenu(menuId);
      return false;
    } else {
      this.showMenu(menuId, targetElement, data);
      return true;
    }
  }

  /**
   * Handle a menu item click
   * @param {string} menuId - ID of the menu containing the item
   * @param {string} itemId - ID of the clicked item
   * @param {Object} data - Additional data for the action
   * @returns {boolean} True if the item was handled
   */
  handleMenuItemClick(menuId, itemId, data = {}) {
    const menu = this.getMenu(menuId);
    if (!menu) return false;
    
    menu.handleItemClick(itemId, data);
    return true;
  }

  /**
   * Create a command that interacts with menus
   * @param {string} commandType - Type of command to create
   * @param {Object} config - Configuration for the command
   * @returns {MenuCommand} The created command
   */
  createCommand(commandType, config = {}) {
    // Handle menu-specific commands
    if (commandType === 'showMenu') {
      return createCommand('function', {
        callback: (data) => this.showMenu(config.menuId, data.targetElement, data)
      });
    } else if (commandType === 'hideMenu') {
      return createCommand('function', {
        callback: (data) => this.hideMenu(config.menuId)
      });
    } else if (commandType === 'toggleMenu') {
      return createCommand('function', {
        callback: (data) => this.toggleMenu(config.menuId, data.targetElement, data)
      });
    }
    
    // For other command types, use the standard factory
    return createCommand(commandType, config);
  }

  /**
   * Add a listener for menu events
   * @param {Function} listener - Callback function (eventType, eventData)
   */
  addListener(listener) {
    if (typeof listener === 'function') {
      this.listeners.add(listener);
    }
    return this;
  }

  /**
   * Remove a listener
   * @param {Function} listener - The listener to remove
   */
  removeListener(listener) {
    this.listeners.delete(listener);
    return this;
  }

  /**
   * Handle clicks on the document
   * Used to close menus when clicking outside
   * @param {Event} e - The mouse event
   */
  handleDocumentClick(e) {
    if (this.activeMenus.size === 0) return;
    
    // Check if the click was inside a menu
    const isClickInsideMenu = e.target.closest('.automation-menu') !== null;
    
    // Check if the click was inside a menu trigger (buttons that show menus)
    const isClickOnMenuTrigger = e.target.closest('[data-menu-trigger]') !== null;
    
    if (!isClickInsideMenu && !isClickOnMenuTrigger) {
      this.hideAllMenus();
    }
  }

  /**
   * Notify all listeners of an event
   * @param {string} eventType - Type of event
   * @param {Object} eventData - Event data
   */
  notifyListeners(eventType, eventData = {}) {
    this.listeners.forEach(listener => {
      try {
        listener(eventType, eventData);
      } catch (error) {
        console.error('Error in menu manager listener:', error);
      }
    });
  }
}

// Export a singleton instance
export const menuManager = new MenuManager();