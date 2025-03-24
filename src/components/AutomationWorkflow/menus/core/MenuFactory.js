import { Menu } from './Menu';
import { createPositioningStrategy } from './MenuPositioningStrategy';
import { createCommand } from './MenuCommand';

/**
 * Factory for creating menu instances
 * Centralizes menu creation logic and configuration
 */
export class MenuFactory {
  constructor() {
    this.registeredMenuTypes = new Map();
    this.defaultConfig = {
      autoHide: true,
      autoHideTimeout: 2500,
      zIndex: 100,
    };
  }

  /**
   * Register a menu type with the factory
   * @param {string} menuType - Unique identifier for the menu type
   * @param {Class} menuClass - Menu class to instantiate
   * @param {Object} defaultConfig - Default configuration for this menu type
   */
  registerMenuType(menuType, menuClass, defaultConfig = {}) {
    this.registeredMenuTypes.set(menuType, {
      class: menuClass,
      defaultConfig
    });
    return this;
  }

  /**
   * Check if a menu type is registered
   * @param {string} menuType - Menu type to check
   * @returns {boolean} True if the menu type is registered
   */
  hasMenuType(menuType) {
    return this.registeredMenuTypes.has(menuType);
  }

  /**
   * Create a menu instance
   * @param {string} menuType - Type of menu to create
   * @param {string} menuId - Unique ID for this menu instance
   * @param {Object} config - Configuration for the menu
   * @returns {Menu} The created menu instance
   */
  createMenu(menuType, menuId, config = {}) {
    // Use base Menu class as fallback
    let MenuClass = Menu;
    let typeConfig = {};

    // If the menu type is registered, use its class and default config
    if (this.hasMenuType(menuType)) {
      const registration = this.registeredMenuTypes.get(menuType);
      MenuClass = registration.class;
      typeConfig = registration.defaultConfig;
    }

    // Merge configurations
    const mergedConfig = {
      ...this.defaultConfig,
      ...typeConfig,
      ...config
    };

    // Create the menu instance
    const menu = new MenuClass(menuId, mergedConfig);

    // Set up positioning strategy if specified
    if (mergedConfig.positioning) {
      const strategy = createPositioningStrategy(
        mergedConfig.positioning.type,
        mergedConfig.positioning.options
      );
      menu.setPositioningStrategy(strategy);
    }

    // Set up menu items if specified
    if (Array.isArray(mergedConfig.items)) {
      const items = mergedConfig.items.map(itemConfig => {
        // Create command for the item if specified
        let command = null;
        if (itemConfig.command) {
          command = createCommand(
            itemConfig.command.type,
            itemConfig.command.config
          );
        }

        return {
          id: itemConfig.id,
          label: itemConfig.label,
          icon: itemConfig.icon,
          command,
          closeOnClick: itemConfig.closeOnClick !== false,
          disabled: !!itemConfig.disabled
        };
      });

      menu.setItems(items);
    }

    // Set up event handlers if specified
    if (mergedConfig.eventHandlers) {
      menu.setEventHandlers(mergedConfig.eventHandlers);
    }

    return menu;
  }

  /**
   * Set global default configuration
   * @param {Object} config - Default configuration to apply to all menus
   */
  setDefaultConfig(config) {
    this.defaultConfig = {
      ...this.defaultConfig,
      ...config
    };
    return this;
  }
}

// Export a singleton instance
export const menuFactory = new MenuFactory();