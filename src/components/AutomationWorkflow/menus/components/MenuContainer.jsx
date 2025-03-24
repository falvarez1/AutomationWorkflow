import React, { useRef, useEffect } from 'react';
import MenuItem from './MenuItem';

/**
 * Container component for displaying menus
 * Handles positioning, animations, and rendering menu items
 */
const MenuContainer = ({
  id,
  items = [],
  position,
  visible = false,
  onMouseEnter,
  onMouseLeave,
  onItemClick,
  className = '',
  zIndex = 100,
  attachToCanvas = true,
  animationDuration = 200,
}) => {
  const menuRef = useRef(null);

  // Apply mouse enter/leave event handlers for auto-hide functionality
  useEffect(() => {
    const menuElement = menuRef.current;
    if (!menuElement) return;

    // Handle mouse enter
    const handleMouseEnter = () => {
      if (onMouseEnter) onMouseEnter();
    };

    // Handle mouse leave
    const handleMouseLeave = () => {
      if (onMouseLeave) onMouseLeave();
    };

    menuElement.addEventListener('mouseenter', handleMouseEnter);
    menuElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      menuElement.removeEventListener('mouseenter', handleMouseEnter);
      menuElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [onMouseEnter, onMouseLeave]);

  // If the menu is not visible, don't render anything
  if (!visible) return null;

  // Calculate menu position styles
  const getPositionStyles = () => {
    if (!position) return {};

    // Decide on position mode based on attachToCanvas
    if (attachToCanvas) {
      // Position is absolute within the canvas
      return {
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)', // Center the menu on the position point
      };
    } else {
      // Position is fixed on the screen
      return {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
      };
    }
  };

  return (
    <div
      ref={menuRef}
      id={`menu-${id}`}
      className={`automation-menu bg-white rounded-lg shadow-lg border border-gray-200 py-1 overflow-hidden ${className}`}
      style={{
        ...getPositionStyles(),
        zIndex,
        minWidth: '180px',
        maxWidth: '300px',
        animation: `fadeIn ${animationDuration}ms ease-out`,
      }}
      data-testid={`menu-${id}`}
    >
      {items.length === 0 ? (
        <div className="px-3 py-2 text-sm text-gray-500 italic">No items available</div>
      ) : (
        <div className="menu-items">
          {items.map((item) => (
            <MenuItem
              key={item.id}
              id={item.id}
              icon={item.icon}
              label={item.label}
              disabled={item.disabled}
              onClick={() => onItemClick(item.id)}
              className={item.className}
              iconClassName={item.iconClassName}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuContainer;