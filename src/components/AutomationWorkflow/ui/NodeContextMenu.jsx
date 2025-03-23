import React from 'react';
import { Edit2, Copy, Trash2 } from 'lucide-react';

// Node Context Menu Component for displaying actions when hovering over a node
const NodeContextMenu = ({ position, nodeType, visible, onAction, menuPosition = 'bottom', offsetX = 0, offsetY = 0, orientation = 'vertical' }) => {
  if (!visible) return null;

  // Default menu items based on node type
  const getMenuItems = () => {
    const commonItems = [
      { id: 'edit', icon: <Edit2 className="w-4 h-4" />, label: 'Edit' },
      { id: 'duplicate', icon: <Copy className="w-4 h-4" />, label: 'Duplicate' },
      { id: 'delete', icon: <Trash2 className="w-4 h-4 text-red-500" />, label: 'Delete' }
    ];

    return commonItems;
  };

  // Calculate menu position based on configuration
  const getMenuStyles = () => {
    const baseStyle = {
      position: 'absolute',
      zIndex: 100
    };

    // Apply the configured position and offsets
    switch (menuPosition) {
      case 'top':
        return {
          ...baseStyle,
          bottom: '100%',
          left: `50%`,
          transform: `translateX(-50%) translateY(-${offsetY}px) translateX(${offsetX}px)`,
          marginBottom: '8px'
        };
      case 'right':
        return {
          ...baseStyle,
          left: `100%`,
          top: '50%',
          transform: `translateY(-50%) translateX(${offsetX}px) translateY(${offsetY}px)`,
          marginLeft: '8px'
        };
      case 'left':
        return {
          ...baseStyle,
          right: `100%`,
          top: '50%',
          transform: `translateY(-50%) translateX(-${offsetX}px) translateY(${offsetY}px)`,
          marginRight: '8px'
        };
      case 'bottom':
      default:
        return {
          ...baseStyle,
          top: '100%',
          left: `50%`,
          transform: `translateX(-50%) translateY(${offsetY}px) translateX(${offsetX}px)`,
          marginTop: '8px'
        };
    }
  };

  const menuItems = getMenuItems();
  const menuStyles = getMenuStyles();

  // Determine flex direction and spacing based on orientation
  const isVertical = orientation === 'vertical';
  const containerClass = isVertical
    ? "flex flex-col space-y-1"
    : "flex flex-row space-x-1";

  return (
    <div
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 animate-fadeIn node-context-menu"
      style={menuStyles}
    >
      <div className={containerClass}>
        {menuItems.map(item => (
          <button
            key={item.id}
            className="p-2 hover:bg-gray-100 rounded-md flex items-center justify-center w-9 h-9 transition-colors"
            onClick={() => onAction(item.id)}
            title={item.label}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NodeContextMenu;