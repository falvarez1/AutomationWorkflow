# Event Handling Refactoring - Implementation Plan

## Overview

This document outlines the implementation plan for Phase 5 of the Automation Workflow refactoring: Event Handling Refactoring. In this phase, we'll extract common event handling patterns to custom hooks and utilities to reduce duplication and improve maintainability.

## Current State

Currently, the codebase has:
- Duplicate drag-and-drop implementations across multiple components
- Repetitive mouse event handling code
- Similar animation logic in various places
- Event handling tightly coupled to component implementations

## Goals

1. Extract common event handlers to reusable hooks
2. Create standardized drag-and-drop functionality
3. Implement consistent animation patterns
4. Improve performance by optimizing event handling
5. Enhance testability of event-related code

## Implementation Steps

### Step 1: Create Base Drag-and-Drop Hook

First, we'll create a generic hook for drag-and-drop operations:

```javascript
// src/components/AutomationWorkflow/hooks/useDrag.js
import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for drag operations
 * 
 * @param {Object} options Configuration options
 * @returns {Object} Drag handlers and state
 */
export const useDrag = (options = {}) => {
  const {
    onDragStart,
    onDragMove,
    onDragEnd,
    threshold = 5,
    preventDefaultDrag = true
  } = options;
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Track starting position and current position
  const startPosRef = useRef({ x: 0, y: 0 });
  const currentPosRef = useRef({ x: 0, y: 0 });
  
  // Track if we've met the drag threshold
  const thresholdMetRef = useRef(false);
  
  // Handle mouse down event
  const handleMouseDown = useCallback((e) => {
    // Only handle left-click
    if (e.button !== 0) return;
    
    // Store start position
    startPosRef.current = { x: e.clientX, y: e.clientY };
    currentPosRef.current = { x: e.clientX, y: e.clientY };
    
    // Reset threshold flag
    thresholdMetRef.current = false;
    
    // Call user's onDragStart callback
    if (onDragStart) {
      onDragStart({
        event: e,
        position: { ...startPosRef.current }
      });
    }
    
    // Add document-level event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    if (preventDefaultDrag) {
      e.preventDefault();
    }
  }, [onDragStart, preventDefaultDrag]);
  
  // Handle mouse move event
  const handleMouseMove = useCallback((e) => {
    // Update current position
    currentPosRef.current = { x: e.clientX, y: e.clientY };
    
    // Calculate distance moved
    const dx = currentPosRef.current.x - startPosRef.current.x;
    const dy = currentPosRef.current.y - startPosRef.current.y;
    
    // Check if we've met the drag threshold
    if (!thresholdMetRef.current) {
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance >= threshold) {
        thresholdMetRef.current = true;
        setIsDragging(true);
      } else {
        return;
      }
    }
    
    // Update drag offset
    setDragOffset({ x: dx, y: dy });
    
    // Call user's onDragMove callback
    if (onDragMove) {
      onDragMove({
        event: e,
        position: { ...currentPosRef.current },
        offset: { x: dx, y: dy },
        delta: {
          x: e.clientX - currentPosRef.current.x,
          y: e.clientY - currentPosRef.current.y
        }
      });
    }
    
    if (preventDefaultDrag) {
      e.preventDefault();
    }
  }, [onDragMove, threshold, preventDefaultDrag]);
  
  // Handle mouse up event
  const handleMouseUp = useCallback((e) => {
    // Clean up event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Only trigger end events if we were actually dragging
    if (thresholdMetRef.current) {
      // Calculate final distance
      const dx = currentPosRef.current.x - startPosRef.current.x;
      const dy = currentPosRef.current.y - startPosRef.current.y;
      
      // Call user's onDragEnd callback
      if (onDragEnd) {
        onDragEnd({
          event: e,
          position: { ...currentPosRef.current },
          offset: { x: dx, y: dy }
        });
      }
      
      // Reset state
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
    }
    
    if (preventDefaultDrag) {
      e.preventDefault();
    }
  }, [onDragEnd, preventDefaultDrag]);
  
  return {
    isDragging,
    dragOffset,
    handlers: {
      onMouseDown: handleMouseDown
    }
  };
};
```

### Step 2: Create Node Drag Hook

Next, create a specialized hook for node dragging:

```javascript
// src/components/AutomationWorkflow/hooks/useNodeDrag.js
import { useCallback, useRef } from 'react';
import { useDrag } from './useDrag';
import { snapToGrid } from '../utils/gridUtils';

/**
 * Custom hook for node dragging operations
 * 
 * @param {Object} options Configuration options
 * @returns {Object} Node drag handlers and state
 */
export const useNodeDrag = (options = {}) => {
  const {
    id,
    position,
    gridSize = 20,
    snapToGrid: enableSnapToGrid = true,
    createMoveCommand,
    onDragStart: userDragStart,
    onDragEnd: userDragEnd
  } = options;
  
  // Store original position
  const startPositionRef = useRef({ x: 0, y: 0 });
  
  // Handle drag start
  const handleDragStart = useCallback((data) => {
    // Store the original position
    startPositionRef.current = { ...position };
    
    // Call user's onDragStart callback if provided
    if (userDragStart) {
      userDragStart({
        ...data,
        id,
        startPosition: startPositionRef.current
      });
    }
  }, [id, position, userDragStart]);
  
  // Handle drag end
  const handleDragEnd = useCallback((data) => {
    // Calculate new position
    let newX = startPositionRef.current.x + data.offset.x;
    let newY = startPositionRef.current.y + data.offset.y;
    
    // Snap to grid if enabled
    if (enableSnapToGrid) {
      ({ x: newX, y: newY } = snapToGrid({ x: newX, y: newY }, gridSize));
    }
    
    // Create move command if function is provided
    if (createMoveCommand) {
      const moveCommand = createMoveCommand(
        id,
        startPositionRef.current,
        { x: newX, y: newY }
      );
      
      // Execute the command
      if (moveCommand) {
        moveCommand.execute();
      }
    }
    
    // Call user's onDragEnd callback if provided
    if (userDragEnd) {
      userDragEnd({
        ...data,
        id,
        startPosition: startPositionRef.current,
        newPosition: { x: newX, y: newY }
      });
    }
  }, [id, enableSnapToGrid, gridSize, createMoveCommand, userDragEnd]);
  
  // Use the base drag hook
  const { isDragging, dragOffset, handlers } = useDrag({
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    threshold: 5
  });
  
  // Calculate current position during drag
  const currentPosition = {
    x: isDragging ? startPositionRef.current.x + dragOffset.x : position.x,
    y: isDragging ? startPositionRef.current.y + dragOffset.y : position.y
  };
  
  // Snap current position to grid if enabled
  const displayPosition = enableSnapToGrid && isDragging
    ? snapToGrid(currentPosition, gridSize)
    : currentPosition;
  
  return {
    isDragging,
    currentPosition: displayPosition,
    handlers
  };
};
```

### Step 3: Create Connection Drawing Hook

Create a hook for drawing connections between nodes:

```javascript
// src/components/AutomationWorkflow/hooks/useConnectionDraw.js
import { useState, useCallback, useRef } from 'react';
import { calculateConnectionPoints } from '../utils/connectionUtils';

/**
 * Custom hook for drawing connections between nodes
 * 
 * @param {Object} options Configuration options
 * @returns {Object} Connection handlers and state
 */
export const useConnectionDraw = (options = {}) => {
  const {
    nodes,
    onConnectionStart,
    onConnectionEnd,
    onConnectionCancel
  } = options;
  
  // Track active connection
  const [activeConnection, setActiveConnection] = useState(null);
  
  // Store source node information
  const sourceNodeRef = useRef(null);
  
  // Start drawing a connection
  const startConnection = useCallback((nodeId, outputIndex, event) => {
    // Find source node
    const sourceNode = nodes.find(node => node.id === nodeId);
    if (!sourceNode) return;
    
    // Store source node info
    sourceNodeRef.current = {
      id: nodeId,
      outputIndex,
      position: sourceNode.position,
      portPosition: calculateOutputPortPosition(sourceNode, outputIndex)
    };
    
    // Create active connection state
    setActiveConnection({
      sourceId: nodeId,
      outputIndex,
      sourcePosition: sourceNodeRef.current.portPosition,
      targetPosition: { x: event.clientX, y: event.clientY }
    });
    
    // Call user's connection start callback
    if (onConnectionStart) {
      onConnectionStart({
        sourceId: nodeId,
        outputIndex,
        sourceNode
      });
    }
    
    // Add document-level event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    
    event.preventDefault();
    event.stopPropagation();
  }, [nodes, onConnectionStart]);
  
  // Handle mouse move during connection drawing
  const handleMouseMove = useCallback((event) => {
    if (!activeConnection) return;
    
    // Update target position
    setActiveConnection(prev => ({
      ...prev,
      targetPosition: { x: event.clientX, y: event.clientY }
    }));
    
    event.preventDefault();
  }, [activeConnection]);
  
  // Handle mouse up to complete connection
  const handleMouseUp = useCallback((event) => {
    if (!activeConnection) return;
    
    // Clean up event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('keydown', handleKeyDown);
    
    // Check if we have a target node under the mouse
    const targetElement = document.elementFromPoint(event.clientX, event.clientY);
    const targetNodeEl = targetElement?.closest('.node-input-port');
    
    if (targetNodeEl) {
      const targetNodeId = targetNodeEl.dataset.nodeId;
      const inputIndex = parseInt(targetNodeEl.dataset.portIndex, 10);
      
      // Don't connect a node to itself
      if (targetNodeId !== activeConnection.sourceId) {
        // Find target node
        const targetNode = nodes.find(node => node.id === targetNodeId);
        
        if (targetNode && onConnectionEnd) {
          onConnectionEnd({
            sourceId: activeConnection.sourceId,
            outputIndex: activeConnection.outputIndex,
            targetId: targetNodeId,
            inputIndex,
            sourceNode: nodes.find(n => n.id === activeConnection.sourceId),
            targetNode
          });
        }
      }
    }
    
    // Reset active connection
    setActiveConnection(null);
    sourceNodeRef.current = null;
    
    event.preventDefault();
  }, [activeConnection, nodes, onConnectionEnd, handleMouseMove]);
  
  // Handle escape key to cancel connection
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape' && activeConnection) {
      // Clean up event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      
      // Reset connection state
      setActiveConnection(null);
      sourceNodeRef.current = null;
      
      // Call user's cancel callback
      if (onConnectionCancel) {
        onConnectionCancel({
          sourceId: activeConnection.sourceId,
          outputIndex: activeConnection.outputIndex
        });
      }
    }
  }, [activeConnection, onConnectionCancel, handleMouseMove, handleMouseUp]);
  
  // Calculate output port position for a node
  const calculateOutputPortPosition = useCallback((node, outputIndex) => {
    // Implementation will depend on your node layout
    // This is a simplified example
    const portElement = document.querySelector(
      `.node-output-port[data-node-id="${node.id}"][data-port-index="${outputIndex}"]`
    );
    
    if (portElement) {
      const rect = portElement.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }
    
    // Fallback: calculate position based on node
    return {
      x: node.position.x + 100, // Assume node width is 100
      y: node.position.y + 50 + (outputIndex * 20) // Assume 20px spacing between ports
    };
  }, []);
  
  return {
    activeConnection,
    startConnection,
    isDrawingConnection: !!activeConnection
  };
};
```

### Step 4: Create Context Menu Hook

Create a hook for handling context menus:

```javascript
// src/components/AutomationWorkflow/hooks/useContextMenu.js
import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for context menu functionality
 * 
 * @param {Object} options Configuration options
 * @returns {Object} Context menu handlers and state
 */
export const useContextMenu = (options = {}) => {
  const {
    items = [],
    onMenuItemClick,
    onMenuOpen,
    onMenuClose
  } = options;
  
  // Context menu state
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [contextData, setContextData] = useState(null);
  
  // Ref for the menu element
  const menuRef = useRef(null);
  
  // Open the context menu
  const openMenu = useCallback((event, data = {}) => {
    // Prevent default browser context menu
    event.preventDefault();
    
    // Calculate position
    const x = event.clientX;
    const y = event.clientY;
    
    // Set menu state
    setPosition({ x, y });
    setContextData(data);
    setIsOpen(true);
    
    // Call onMenuOpen callback
    if (onMenuOpen) {
      onMenuOpen({ position: { x, y }, data });
    }
  }, [onMenuOpen]);
  
  // Close the context menu
  const closeMenu = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      setContextData(null);
      
      // Call onMenuClose callback
      if (onMenuClose) {
        onMenuClose();
      }
    }
  }, [isOpen, onMenuClose]);
  
  // Handle menu item click
  const handleMenuItemClick = useCallback((item) => {
    // Close the menu
    closeMenu();
    
    // Call the menu item's onClick handler if provided
    if (item.onClick) {
      item.onClick(contextData);
    }
    
    // Call the onMenuItemClick callback
    if (onMenuItemClick) {
      onMenuItemClick({ item, data: contextData });
    }
  }, [contextData, closeMenu, onMenuItemClick]);
  
  // Handle clicks outside the menu to close it
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, closeMenu]);
  
  // Close menu on escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeMenu]);
  
  // Get filtered menu items based on context
  const getMenuItems = useCallback(() => {
    return items.filter(item => {
      // If the item has a shouldShow function, use it to determine visibility
      if (typeof item.shouldShow === 'function') {
        return item.shouldShow(contextData);
      }
      return true;
    });
  }, [items, contextData]);
  
  return {
    isOpen,
    position,
    contextData,
    menuRef,
    filteredItems: getMenuItems(),
    openMenu,
    closeMenu,
    handleMenuItemClick
  };
};
```

### Step 5: Create Animation Hook

Create a hook for managing animations:

```javascript
// src/components/AutomationWorkflow/hooks/useAnimation.js
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for animations
 * 
 * @param {Object} options Configuration options
 * @returns {Object} Animation state and controls
 */
export const useAnimation = (options = {}) => {
  const {
    duration = 300,
    easing = 'ease-in-out',
    delay = 0,
    onStart,
    onComplete,
    autoPlay = false
  } = options;
  
  // Animation state
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  // Refs for timing
  const startTimeRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Start the animation
  const play = useCallback(() => {
    // Reset state
    setIsComplete(false);
    setProgress(0);
    
    // Delay the animation if needed
    if (delay > 0) {
      const timeoutId = setTimeout(() => {
        setIsPlaying(true);
        startTimeRef.current = Date.now();
        
        // Call onStart callback
        if (onStart) {
          onStart();
        }
      }, delay);
      
      return () => clearTimeout(timeoutId);
    } else {
      setIsPlaying(true);
      startTimeRef.current = Date.now();
      
      // Call onStart callback
      if (onStart) {
        onStart();
      }
    }
  }, [delay, onStart]);
  
  // Stop the animation
  const stop = useCallback(() => {
    setIsPlaying(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);
  
  // Animation frame loop
  useEffect(() => {
    if (!isPlaying) return;
    
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const rawProgress = Math.min(elapsed / duration, 1);
      
      // Apply easing
      let easedProgress;
      switch (easing) {
        case 'linear':
          easedProgress = rawProgress;
          break;
        case 'ease-in':
          easedProgress = rawProgress * rawProgress;
          break;
        case 'ease-out':
          easedProgress = 1 - Math.pow(1 - rawProgress, 2);
          break;
        case 'ease-in-out':
        default:
          easedProgress = rawProgress < 0.5
            ? 2 * rawProgress * rawProgress
            : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2;
          break;
      }
      
      setProgress(easedProgress);
      
      // Check if animation is complete
      if (rawProgress >= 1) {
        setIsPlaying(false);
        setIsComplete(true);
        
        // Call onComplete callback
        if (onComplete) {
          onComplete();
        }
      } else {
        // Continue animation
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, duration, easing, onComplete]);
  
  // Auto-play on mount if enabled
  useEffect(() => {
    if (autoPlay) {
      play();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [autoPlay, play]);
  
  return {
    play,
    stop,
    isPlaying,
    progress,
    isComplete
  };
};
```

### Step 6: Create Zoom and Pan Hook

Create a hook for zoom and pan functionality:

```javascript
// src/components/AutomationWorkflow/hooks/useZoomPan.js
import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for zoom and pan functionality
 * 
 * @param {Object} options Configuration options
 * @returns {Object} Zoom and pan state and handlers
 */
export const useZoomPan = (options = {}) => {
  const {
    minZoom = 0.25,
    maxZoom = 2,
    initialZoom = 1,
    initialPan = { x: 0, y: 0 },
    zoomSensitivity = 0.001,
    onZoomChange,
    onPanChange
  } = options;
  
  // State for zoom and pan
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState(initialPan);
  
  // Refs for tracking pan interactions
  const isPanningRef = useRef(false);
  const lastPanPositionRef = useRef({ x: 0, y: 0 });
  
  // Constrain zoom level to min/max
  const constrainZoom = useCallback((value) => {
    return Math.min(maxZoom, Math.max(minZoom, value));
  }, [minZoom, maxZoom]);
  
  // Handle mouse wheel for zooming
  const handleWheel = useCallback((event) => {
    event.preventDefault();
    
    // Get mouse position relative to the container
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Calculate new zoom level
    const deltaY = event.deltaY;
    const scaleFactor = 1 - deltaY * zoomSensitivity;
    const newZoom = constrainZoom(zoom * scaleFactor);
    
    // Calculate new pan to zoom toward mouse position
    const newPan = {
      x: pan.x - (mouseX / zoom - mouseX / newZoom) * newZoom,
      y: pan.y - (mouseY / zoom - mouseY / newZoom) * newZoom
    };
    
    // Update state
    setZoom(newZoom);
    setPan(newPan);
    
    // Call callbacks
    if (onZoomChange) {
      onZoomChange(newZoom);
    }
    
    if (onPanChange) {
      onPanChange(newPan);
    }
  }, [zoom, pan, zoomSensitivity, constrainZoom, onZoomChange, onPanChange]);
  
  // Start panning
  const handlePanStart = useCallback((event) => {
    // Only handle middle-click or space+left-click
    const isMiddleClick = event.button === 1;
    const isSpaceLeftClick = event.button === 0 && event.getModifierState('Space');
    
    if (isMiddleClick || isSpaceLeftClick) {
      isPanningRef.current = true;
      lastPanPositionRef.current = { x: event.clientX, y: event.clientY };
      event.preventDefault();
      
      // Add document-level event listeners
      document.addEventListener('mousemove', handlePanMove);
      document.addEventListener('mouseup', handlePanEnd);
    }
  }, []);
  
  // Handle panning movement
  const handlePanMove = useCallback((event) => {
    if (!isPanningRef.current) return;
    
    const dx = event.clientX - lastPanPositionRef.current.x;
    const dy = event.clientY - lastPanPositionRef.current.y;
    
    const newPan = {
      x: pan.x + dx / zoom,
      y: pan.y + dy / zoom
    };
    
    setPan(newPan);
    lastPanPositionRef.current = { x: event.clientX, y: event.clientY };
    
    if (onPanChange) {
      onPanChange(newPan);
    }
    
    event.preventDefault();
  }, [pan, zoom, onPanChange]);
  
  // End panning
  const handlePanEnd = useCallback((event) => {
    isPanningRef.current = false;
    
    // Remove document-level event listeners
    document.removeEventListener('mousemove', handlePanMove);
    document.removeEventListener('mouseup', handlePanEnd);
    
    event.preventDefault();
  }, [handlePanMove]);
  
  // Reset zoom and pan
  const resetView = useCallback(() => {
    setZoom(initialZoom);
    setPan(initialPan);
    
    if (onZoomChange) {
      onZoomChange(initialZoom);
    }
    
    if (onPanChange) {
      onPanChange(initialPan);
    }
  }, [initialZoom, initialPan, onZoomChange, onPanChange]);
  
  // Set zoom to a specific level
  const setZoomLevel = useCallback((level, center = { x: 0, y: 0 }) => {
    const newZoom = constrainZoom(level);
    
    // Pan to maintain the center point
    const newPan = {
      x: pan.x - (center.x / zoom - center.x / newZoom) * newZoom,
      y: pan.y - (center.y / zoom - center.y / newZoom) * newZoom
    };
    
    setZoom(newZoom);
    setPan(newPan);
    
    if (onZoomChange) {
      onZoomChange(newZoom);
    }
    
    if (onPanChange) {
      onPanChange(newPan);
    }
  }, [zoom, pan, constrainZoom, onZoomChange, onPanChange]);
  
  // Clean up event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handlePanMove);
      document.removeEventListener('mouseup', handlePanEnd);
    };
  }, [handlePanMove, handlePanEnd]);
  
  return {
    zoom,
    pan,
    handlers: {
      onWheel: handleWheel,
      onMouseDown: handlePanStart
    },
    resetView,
    setZoomLevel
  };
};
```

### Step 7: Create Keyboard Shortcut Hook

Create a hook for keyboard shortcuts:

```javascript
// src/components/AutomationWorkflow/hooks/useKeyboardShortcuts.js
import { useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for keyboard shortcuts
 * 
 * @param {Object} shortcuts Map of keyboard shortcuts to handlers
 * @param {Object} options Configuration options
 * @returns {Object} Keyboard shortcut handlers
 */
export const useKeyboardShortcuts = (shortcuts = {}, options = {}) => {
  const {
    enableGlobalShortcuts = false,
    preventDefault = true,
    stopPropagation = true,
    disabled = false
  } = options;
  
  // Store the current shortcuts
  const shortcutsRef = useRef(shortcuts);
  
  // Update the ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);
  
  // Parse a shortcut string into keys
  const parseShortcut = useCallback((shortcut) => {
    const parts = shortcut.toLowerCase().split('+');
    const modifiers = {
      ctrl: parts.includes('ctrl') || parts.includes('control'),
      alt: parts.includes('alt'),
      shift: parts.includes('shift'),
      meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command')
    };
    
    // Extract the main key (the last part that's not a modifier)
    const mainKey = parts.filter(part => 
      !['ctrl', 'control', 'alt', 'shift', 'meta', 'cmd', 'command'].includes(part)
    ).pop();
    
    return { modifiers, key: mainKey };
  }, []);
  
  // Handle keydown events
  const handleKeyDown = useCallback((event) => {
    if (disabled) return;
    
    // Skip if we're in an input, textarea, or select
    const target = event.target;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return;
    }
    
    // Check for matching shortcuts
    for (const [shortcutKey, handler] of Object.entries(shortcutsRef.current)) {
      const { modifiers, key } = parseShortcut(shortcutKey);
      
      const ctrlMatches = modifiers.ctrl === (event.ctrlKey || event.metaKey);
      const altMatches = modifiers.alt === event.altKey;
      const shiftMatches = modifiers.shift === event.shiftKey;
      const metaMatches = modifiers.meta === event.metaKey;
      const keyMatches = !key || key === event.key.toLowerCase();
      
      if (ctrlMatches && altMatches && shiftMatches && metaMatches && keyMatches) {
        if (preventDefault) {
          event.preventDefault();
        }
        
        if (stopPropagation) {
          event.stopPropagation();
        }
        
        handler(event);
        break;
      }
    }
  }, [disabled, parseShortcut, preventDefault, stopPropagation]);
  
  // Set up the event listener
  useEffect(() => {
    if (disabled) return;
    
    const target = enableGlobalShortcuts ? document : window;
    target.addEventListener('keydown', handleKeyDown);
    
    return () => {
      target.removeEventListener('keydown', handleKeyDown);
    };
  }, [disabled, enableGlobalShortcuts, handleKeyDown]);
  
  return {
    parseShortcut
  };
};
```

### Step 8: Create Utils Library

Create utility functions for grid operations:

```javascript
// src/components/AutomationWorkflow/utils/gridUtils.js
/**
 * Snap a position to the nearest grid point
 * 
 * @param {Object} position The position to snap
 * @param {number} gridSize The size of the grid
 * @returns {Object} The snapped position
 */
export const snapToGrid = (position, gridSize = 20) => {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize
  };
};

/**
 * Check if a position is on a grid line
 * 
 * @param {Object} position The position to check
 * @param {number} gridSize The size of the grid
 * @returns {boolean} Whether the position is on a grid line
 */
export const isOnGridLine = (position, gridSize = 20) => {
  const xOnLine = position.x % gridSize === 0;
  const yOnLine = position.y % gridSize === 0;
  return xOnLine || yOnLine;
};
```

### Step 9: Create Connection Utils

```javascript
// src/components/AutomationWorkflow/utils/connectionUtils.js
/**
 * Calculate connection path between two points
 * 
 * @param {Object} source Source point coordinates
 * @param {Object} target Target point coordinates
 * @param {Object} options Path options
 * @returns {string} SVG path string
 */
export const calculateConnectionPath = (source, target, options = {}) => {
  const {
    curvature = 0.5,
    style = 'bezier'
  } = options;
  
  // For horizontal and vertical connections
  const isHorizontal = Math.abs(target.x - source.x) > Math.abs(target.y - source.y);
  
  if (style === 'straight') {
    // Straight line
    return `M${source.x},${source.y} L${target.x},${target.y}`;
  } else if (style === 'orthogonal') {
    // Orthogonal (right-angle) connection
    if (isHorizontal) {
      const midX = (source.x + target.x) / 2;
      return `M${source.x},${source.y} L${midX},${source.y} L${midX},${target.y} L${target.x},${target.y}`;
    } else {
      const midY = (source.y + target.y) / 2;
      return `M${source.x},${source.y} L${source.x},${midY} L${target.x},${midY} L${target.x},${target.y}`;
    }
  } else {
    // Default: Bezier curve
    const dx = Math.abs(target.x - source.x);
    const dy = Math.abs(target.y - source.y);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Control point distance based on curvature and distance
    const offset = distance * curvature;
    
    // Control points
    const controlX1 = isHorizontal ? source.x + offset : source.x;
    const controlY1 = isHorizontal ? source.y : source.y + offset;
    const controlX2 = isHorizontal ? target.x - offset : target.x;
    const controlY2 = isHorizontal ? target.y : target.y - offset;
    
    return `M${source.x},${source.y} C${controlX1},${controlY1} ${controlX2},${controlY2} ${target.x},${target.y}`;
  }
};

/**
 * Calculate connection points for nodes
 * 
 * @param {Object} sourceNode Source node
 * @param {Object} targetNode Target node
 * @param {Object} options Connection options
 * @returns {Object} Source and target connection points
 */
export const calculateConnectionPoints = (sourceNode, targetNode, options = {}) => {
  const {
    outputIndex = 0,
    inputIndex = 0,
    nodeWidth = 200,
    nodeHeight = 100,
    portOffset = 20
  } = options;
  
  // Default source port (right side)
  const sourcePoint = {
    x: sourceNode.position.x + nodeWidth,
    y: sourceNode.position.y + portOffset + (outputIndex * portOffset)
  };
  
  // Default target port (left side)
  const targetPoint = {
    x: targetNode.position.x,
    y: targetNode.position.y + portOffset + (inputIndex * portOffset)
  };
  
  return {
    source: sourcePoint,
    target: targetPoint
  };
};
```

### Step 10: Create an Index File for Hooks

```javascript
// src/components/AutomationWorkflow/hooks/index.js
export { useDrag } from './useDrag';
export { useNodeDrag } from './useNodeDrag';
export { useConnectionDraw } from './useConnectionDraw';
export { useContextMenu } from './useContextMenu';
export { useAnimation } from './useAnimation';
export { useZoomPan } from './useZoomPan';
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
```

### Step 11: Create an Index File for Utils

```javascript
// src/components/AutomationWorkflow/utils/index.js
export * from './gridUtils';
export * from './connectionUtils';
```

### Step 12: Update Node Component to Use Hooks

Refactor a node component to use the new hooks:

```jsx
// src/components/AutomationWorkflow/nodes/Node.jsx (example refactoring)
import React, { useCallback } from 'react';
import { useNodeDrag } from '../hooks/useNodeDrag';
import { useContextMenu } from '../hooks/useContextMenu';

const Node = ({
  id,
  type,
  title,
  position,
  selected,
  plugin,
  onSelect,
  commands
}) => {
  // Handle node selection
  const handleSelect = useCallback((event) => {
    if (!selected) {
      onSelect(id);
    }
    event.stopPropagation();
  }, [id, selected, onSelect]);
  
  // Create command factory function
  const createMoveCommand = useCallback((nodeId, oldPosition, newPosition) => {
    return new commands.MoveNodeCommand(
      nodeId,
      oldPosition,
      newPosition
    );
  }, [commands]);
  
  // Use the drag hook
  const { isDragging, currentPosition, handlers: dragHandlers } = useNodeDrag({
    id,
    position,
    createMoveCommand,
    gridSize: 20,
    snapToGrid: true
  });
  
  // Define context menu items
  const menuItems = [
    {
      id: 'delete',
      label: 'Delete',
      icon: 'trash',
      onClick: (data) => {
        const deleteCommand = new commands.DeleteNodeCommand(data.id);
        deleteCommand.execute();
      }
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: 'copy',
      onClick: (data) => {
        const duplicateCommand = new commands.DuplicateNodeCommand(data.id);
        duplicateCommand.execute();
      }
    }
  ];
  
  // Use the context menu hook
  const { isOpen, position: menuPosition, openMenu, menuRef, filteredItems, handleMenuItemClick } = useContextMenu({
    items: menuItems
  });
  
  // Handle right-click for context menu
  const handleContextMenu = useCallback((event) => {
    openMenu(event, { id, type });
  }, [id, type, openMenu]);
  
  return (
    <div
      className={`node ${selected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        transform: `translate(${currentPosition.x}px, ${currentPosition.y}px)`
      }}
      onClick={handleSelect}
      onMouseDown={dragHandlers.onMouseDown}
      onContextMenu={handleContextMenu}
    >
      <div className="node-header" style={{ backgroundColor: plugin.color }}>
        <div className="node-title">{title}</div>
      </div>
      <div className="node-content">
        {/* Node content here */}
      </div>
      
      {/* Context menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="context-menu"
          style={{
            position: 'fixed',
            top: menuPosition.y,
            left: menuPosition.x
          }}
        >
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="context-menu-item"
              onClick={() => handleMenuItemClick(item)}
            >
              {item.icon && <span className={`icon icon-${item.icon}`} />}
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(Node);
```

## Benefits

1. **Reduced Code Duplication**: Common event handling patterns are defined in reusable hooks
2. **Improved Separation of Concerns**: Event handling logic is separated from UI components
3. **Enhanced Testability**: Hooks can be tested independently of components
4. **Consistent Behavior**: Standardized event handling across the application
5. **Better Performance**: Optimized event handling and animation

## Integration with Existing Code

The refactored event handling system integrates with:

1. **Command Pattern**: Hooks like useNodeDrag create and execute commands
2. **UI Components**: Node and connection components use the hooks for interaction
3. **Workflow State**: State updates are handled through the command pattern for consistency

## Testing Strategy

1. **Unit Tests**: Test each hook in isolation
2. **Integration Tests**: Test hooks working together in components
3. **UI Tests**: Test event behavior in the user interface

## Next Steps After Implementation

1. **Documentation**: Document the event handling hooks for developers
2. **Performance Optimization**: Further optimize event handling for large workflows
3. **Accessibility**: Ensure keyboard navigation and screen reader support