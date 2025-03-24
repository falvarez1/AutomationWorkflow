import React, { createContext, useContext, useEffect, useState } from 'react';
import { menuManager } from '../core/MenuManager';
import MenuContainer from './MenuContainer';

// Create a context for the menu system
const MenuContext = createContext(null);

/**
 * Provider component for the menu system
 * Manages menu visibility and provides access to menu functionality
 */
export const MenuProvider = ({ children }) => {
  // State to track visible menus
  const [visibleMenus, setVisibleMenus] = useState({});
  // Map of menu id to menu data
  const [menuData, setMenuData] = useState({});

  // Initialize menu manager
  useEffect(() => {
    menuManager.initialize();

    // Set up a listener for menu events
    const handleMenuEvent = (eventType, eventData) => {
      if (eventType === 'menuShown') {
        const { menuId } = eventData;
        const menu = menuManager.getMenu(menuId);
        
        if (menu) {
          setVisibleMenus(prev => ({
            ...prev,
            [menuId]: true
          }));
          
          setMenuData(prev => ({
            ...prev,
            [menuId]: {
              id: menuId,
              items: menu.items,
              position: menu.position,
              options: menu.options
            }
          }));
        }
      } else if (eventType === 'menuHidden') {
        const { menuId } = eventData;
        
        setVisibleMenus(prev => {
          const newState = { ...prev };
          delete newState[menuId];
          return newState;
        });
      }
    };

    menuManager.addListener(handleMenuEvent);

    return () => {
      menuManager.removeListener(handleMenuEvent);
      menuManager.dispose();
    };
  }, []);

  // Handle menu item click
  const handleMenuItemClick = (menuId, itemId) => {
    menuManager.handleMenuItemClick(menuId, itemId, {});
  };

  // Handle mouse enter for menu
  const handleMenuMouseEnter = (menuId) => {
    const menu = menuManager.getMenu(menuId);
    if (menu) {
      menu.handleMouseEnter();
    }
  };

  // Handle mouse leave for menu
  const handleMenuMouseLeave = (menuId) => {
    const menu = menuManager.getMenu(menuId);
    if (menu) {
      menu.handleMouseLeave();
    }
  };

  // Context value
  const contextValue = {
    // Register a menu with the system
    registerMenu: (menuType, menuId, config) => {
      return menuManager.registerMenu(menuType, menuId, config);
    },
    
    // Show a menu
    showMenu: (menuId, targetElement, data) => {
      return menuManager.showMenu(menuId, targetElement, data);
    },
    
    // Hide a menu
    hideMenu: (menuId) => {
      return menuManager.hideMenu(menuId);
    },
    
    // Hide all menus
    hideAllMenus: () => {
      menuManager.hideAllMenus();
    },
    
    // Toggle a menu's visibility
    toggleMenu: (menuId, targetElement, data) => {
      return menuManager.toggleMenu(menuId, targetElement, data);
    },
    
    // Create a menu command
    createCommand: (commandType, config) => {
      return menuManager.createCommand(commandType, config);
    },
    
    // Check if a menu is visible
    isMenuVisible: (menuId) => {
      return menuManager.isMenuVisible(menuId);
    }
  };

  return (
    <MenuContext.Provider value={contextValue}>
      {children}
      
      {/* Render all visible menus */}
      {Object.keys(visibleMenus).map(menuId => {
        const menu = menuData[menuId];
        if (!menu) return null;
        
        return (
          <MenuContainer
            key={menuId}
            id={menuId}
            items={menu.items}
            position={menu.position}
            visible={true}
            onMouseEnter={() => handleMenuMouseEnter(menuId)}
            onMouseLeave={() => handleMenuMouseLeave(menuId)}
            onItemClick={(itemId) => handleMenuItemClick(menuId, itemId)}
            zIndex={menu.options?.zIndex || 100}
            attachToCanvas={menu.options?.attachToCanvas !== false}
            className={menu.options?.className || ''}
          />
        );
      })}
    </MenuContext.Provider>
  );
};

/**
 * Hook to access the menu context
 * @returns {Object} Menu context with functions for interacting with menus
 */
export const useMenuSystem = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenuSystem must be used within a MenuProvider');
  }
  return context;
};