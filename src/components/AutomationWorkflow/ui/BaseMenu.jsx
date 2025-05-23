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
  transform,
  autoHideTimeout = 3000,
  children
}) => {
  // Auto-hide timer state
  const menuHideTimerRef = useRef(null);
  
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
  let menuStyle = {
    left: menuPosition.x,
    top: menuPosition.y + MENU_PLACEMENT.MENU_VERTICAL_OFFSET,
    transform: 'translateX(-50%)',
    position: 'fixed',
    zIndex: MENU_PLACEMENT.MENU_Z_INDEX
  };
  
  
  return (
    <div
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 node-menu absolute"
      style={menuStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-menu-element="true"
    >
      {children}
    </div>
  );
};

export default BaseMenu;