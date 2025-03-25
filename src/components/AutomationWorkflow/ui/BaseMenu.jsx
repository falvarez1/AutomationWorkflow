import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MENU_PLACEMENT } from '../constants';

/**
 * Base menu component that provides common menu functionality
 * Both NodeMenu and BranchMenu will use this component
 */
const BaseMenu = ({
  isOpen,
  onClose,
  menuPosition,
  transform = { x: 0, y: 0, scale: 1 },
  autoHideTimeout = 30000,
  children
}) => {
  // Auto-hide timer state
  const menuHideTimerRef = useRef(null);
  // Removed unused isMouseOver state as it is not used
  
  // Clear and start timer functions
  const clearHideTimer = () => {
    if (menuHideTimerRef.current) {
      clearTimeout(menuHideTimerRef.current);
      menuHideTimerRef.current = null;
    }
  };
  
  const startHideTimer = useCallback(() => {
    clearHideTimer();
    menuHideTimerRef.current = setTimeout(() => {
      onClose();
    }, autoHideTimeout);
  }, [onClose, autoHideTimeout]);
  
  // Mouse event handlers
  const handleMouseEnter = () => {
    clearHideTimer();
  };
  
  const handleMouseLeave = () => {
    startHideTimer();
  };
  // Start/clear timer when menu opens/closes
  useEffect(() => {
    if (isOpen) {
      startHideTimer();
    } else {
      clearHideTimer();
    }
    
    return () => clearHideTimer();
  }, [isOpen, autoHideTimeout, startHideTimer]);
  
  if (!isOpen) return null;
  
  // Calculate position based on attachment mode
  let menuStyle = {};
  
  if (MENU_PLACEMENT.ATTACH_TO_CANVAS) {
    // For attached menus, we need to apply the transform directly in the style
    // to make the menu move with the canvas when panning
    const transformMatrix = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
    
    menuStyle = {
      position: 'fixed', // Changed to fixed to be in the viewport
      left: `${menuPosition.x}px`,
      top: `${menuPosition.y}px`,
      transform: `${transformMatrix} translateX(-50%)`, // Apply canvas transform + center horizontally
      transformOrigin: '0 0', // Set transform origin to top-left
      zIndex: MENU_PLACEMENT.MENU_Z_INDEX
    };
  } else {
    // Fixed position (outside transform)
    menuStyle = {
      left: menuPosition.x,
      top: menuPosition.y + MENU_PLACEMENT.MENU_VERTICAL_OFFSET,
      transform: 'translateX(-50%)',
      position: 'fixed',
      zIndex: MENU_PLACEMENT.MENU_Z_INDEX
    };
  }
  
  return (
    <div
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 node-menu absolute"
      style={menuStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-node-element="false"
    >
      {children}
    </div>
  );
};

export default BaseMenu;