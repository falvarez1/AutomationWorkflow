/**
 * Base Menu class that defines the contract for all menu types
 */
export class Menu {
  constructor(id, options = {}) {
    this.id = id;
    this.isVisible = false;
    this.position = { x: 0, y: 0 };
    this.options = {
      autoHide: true,
      autoHideTimeout: 2500,
      zIndex: 100,
      ...options
    };
    this.items = [];
    this.parentNode = null;
    this.targetElement = null;
    this.positioningStrategy = null;
    this.eventHandlers = {
      onShow: null,
      onHide: null,
      onItemClick: null,
      onMouseEnter: null,
      onMouseLeave: null
    };
    this.autoHideTimer = null;
  }

  /**
   * Set the menu's positioning strategy
   * @param {MenuPositioningStrategy} strategy - The positioning strategy to use
   */
  setPositioningStrategy(strategy) {
    this.positioningStrategy = strategy;
    return this;
  }

  /**
   * Add an item to the menu
   * @param {MenuItem} item - The menu item to add
   */
  addItem(item) {
    this.items.push(item);
    return this;
  }

  /**
   * Set multiple items at once
   * @param {Array<MenuItem>} items - Array of menu items
   */
  setItems(items) {
    this.items = [...items];
    return this;
  }

  /**
   * Show the menu
   * @param {Object} targetElement - The target element to position the menu relative to
   * @param {Object} data - Additional data for positioning or rendering
   */
  show(targetElement, data = {}) {
    this.targetElement = targetElement;
    this.isVisible = true;
    this.updatePosition(data);
    
    if (this.options.autoHide) {
      this.startAutoHideTimer();
    }
    
    if (this.eventHandlers.onShow) {
      this.eventHandlers.onShow(this);
    }
    
    return this;
  }

  /**
   * Hide the menu
   */
  hide() {
    this.isVisible = false;
    this.clearAutoHideTimer();
    
    if (this.eventHandlers.onHide) {
      this.eventHandlers.onHide(this);
    }
    
    return this;
  }

  /**
   * Update the menu's position
   * @param {Object} data - Additional data for positioning
   */
  updatePosition(data = {}) {
    if (this.positioningStrategy && this.targetElement) {
      this.position = this.positioningStrategy.calculatePosition(this, this.targetElement, data);
    }
    return this;
  }

  /**
   * Handle menu item click
   * @param {string} itemId - The ID of the clicked item
   * @param {Object} data - Additional data for the action
   */
  handleItemClick(itemId, data = {}) {
    const item = this.items.find(item => item.id === itemId);
    if (item && item.command) {
      item.command.execute(data);
    }
    
    if (this.eventHandlers.onItemClick) {
      this.eventHandlers.onItemClick(itemId, data, this);
    }
    
    if (item && item.closeOnClick !== false) {
      this.hide();
    }
    
    return this;
  }

  /**
   * Set event handlers for the menu
   * @param {Object} handlers - Object containing event handler functions
   */
  setEventHandlers(handlers) {
    this.eventHandlers = {
      ...this.eventHandlers,
      ...handlers
    };
    return this;
  }

  /**
   * Start the auto-hide timer
   */
  startAutoHideTimer() {
    this.clearAutoHideTimer();
    
    if (this.options.autoHide && this.options.autoHideTimeout > 0) {
      this.autoHideTimer = setTimeout(() => {
        this.hide();
      }, this.options.autoHideTimeout);
    }
    
    return this;
  }

  /**
   * Clear the auto-hide timer
   */
  clearAutoHideTimer() {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
    
    return this;
  }

  /**
   * Handle mouse enter event
   */
  handleMouseEnter() {
    this.clearAutoHideTimer();
    
    if (this.eventHandlers.onMouseEnter) {
      this.eventHandlers.onMouseEnter(this);
    }
    
    return this;
  }

  /**
   * Handle mouse leave event
   */
  handleMouseLeave() {
    if (this.options.autoHide) {
      this.startAutoHideTimer();
    }
    
    if (this.eventHandlers.onMouseLeave) {
      this.eventHandlers.onMouseLeave(this);
    }
    
    return this;
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.clearAutoHideTimer();
    this.items = [];
    this.eventHandlers = {};
    this.targetElement = null;
  }
}