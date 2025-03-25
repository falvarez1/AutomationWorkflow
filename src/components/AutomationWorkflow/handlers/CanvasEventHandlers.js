import { MOUSE_CONTROLS, ZOOM_MIN, ZOOM_MAX } from '../constants';

/**
 * Handles canvas mouse down events for panning
 * 
 * @param {MouseEvent} e - Mouse event
 * @param {Object} state - Canvas state from useCanvasState hook
 * @param {Object} refs - React refs needed for tracking 
 */
export const handleCanvasMouseDown = (e, state, refs) => {
  const { transform, setIsPanning, setStartPanPos } = state;
  const { mouseDownPosRef, isDraggingRef, justClickedNodeRef } = refs;

  // Check if the click was on the canvas background
  const isClickingNode = e.target.closest('[data-node-element="true"]');
  
  // Only start panning if clicking on the canvas (not on a node)
  if (e.button === 0 && !isClickingNode) {
    // This is a direct click on the canvas background
    setIsPanning(true);
    setStartPanPos({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    
    // Save the initial mouse position to determine if this becomes a drag or a click
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
    
    e.preventDefault();
  }
  
  // Track genuine clicks on nodes (not drag operations)
  justClickedNodeRef.current = isClickingNode &&
    isClickingNode.getAttribute('data-was-just-clicked') === 'true';
};

/**
 * Handles mouse wheel events for zoom and pan
 * 
 * @param {WheelEvent} e - Wheel event
 * @param {Object} state - Canvas state from useCanvasState hook 
 * @param {Object} canvasRef - Reference to canvas element
 */
export const handleWheel = (e, state, canvasRef) => {
  const { transform, setTransform } = state;

  // Determine if we should zoom or pan based on configuration
  const shouldZoom = MOUSE_CONTROLS.WHEEL_ZOOMS 
    ? !(MOUSE_CONTROLS.ZOOM_TOGGLE_KEY && e.getModifierState(MOUSE_CONTROLS.ZOOM_TOGGLE_KEY)) 
    : (MOUSE_CONTROLS.ZOOM_TOGGLE_KEY && e.getModifierState(MOUSE_CONTROLS.ZOOM_TOGGLE_KEY));
  
  // For backward compatibility - still allow Ctrl/Meta to always trigger zoom
  const forceZoom = e.ctrlKey || e.metaKey;
  
  if (shouldZoom || forceZoom) {
    e.preventDefault();
    
    // Calculate zoom point (mouse position)
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate point in graph coordinates
    const graphX = (mouseX - transform.x) / transform.scale;
    const graphY = (mouseY - transform.y) / transform.scale;
    
    // Calculate zoom factor based on delta magnitude
    const absDelta = Math.abs(e.deltaY);
    
    // Use configured sensitivity
    const sensitivity = MOUSE_CONTROLS.ZOOM_SENSITIVITY;
    
    // Apply min/max zoom change constraints
    const baseZoomChange = Math.min(
      Math.max(absDelta * sensitivity, MOUSE_CONTROLS.MIN_ZOOM_CHANGE), 
      MOUSE_CONTROLS.MAX_ZOOM_CHANGE
    );
    
    // Apply direction (zoom in or out), respecting invert setting
    let zoomFactor;
    if (MOUSE_CONTROLS.INVERT_ZOOM) {
      zoomFactor = e.deltaY > 0
        ? 1 + baseZoomChange  // Inverted: scroll down = zoom in
        : 1 - baseZoomChange; // Inverted: scroll up = zoom out
    } else {
      zoomFactor = e.deltaY < 0
        ? 1 + baseZoomChange  // Normal: scroll up = zoom in
        : 1 - baseZoomChange; // Normal: scroll down = zoom out
    }
    
    setTransform(prev => {
      const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prev.scale * zoomFactor));
      
      // If ZOOM_TO_CURSOR is false, zoom toward center of screen instead
      if (!MOUSE_CONTROLS.ZOOM_TO_CURSOR) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const centerGraphX = (centerX - prev.x) / prev.scale;
        const centerGraphY = (centerY - prev.y) / prev.scale;
        
        return {
          x: centerX - centerGraphX * newScale,
          y: centerY - centerGraphY * newScale,
          scale: newScale
        };
      }
      
      // Default: Adjust position to zoom toward mouse point
      const newX = mouseX - graphX * newScale;
      const newY = mouseY - graphY * newScale;
      
      return {
        x: newX,
        y: newY,
        scale: newScale
      };
    });
  } 
  // If not zooming, handle as panning
  else {
    e.preventDefault();
    
    // Adjust sensitivity for touchpad panning
    const panSensitivity = 1.0;
    
    // Use deltaX and deltaY for panning
    const dx = -e.deltaX * panSensitivity;
    const dy = -e.deltaY * panSensitivity;
    
    // Apply the pan using requestAnimationFrame for smoother performance
    requestAnimationFrame(() => {
      setTransform(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));
    });
  }
};

/**
 * Handles mouse move events for panning
 * 
 * @param {MouseEvent} e - Mouse event
 * @param {Object} state - Canvas state from useCanvasState hook
 * @param {Object} refs - React refs needed for tracking
 */
export const handleMouseMove = (e, state, refs) => {
  const { startPanPos, setTransform } = state;
  const { mouseDownPosRef, isDraggingRef } = refs;
  
  // Check if we've moved enough to consider this a drag
  if (mouseDownPosRef.current) {
    const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
    const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);
    
    // If moved more than 5px, consider it a drag
    if (dx > 5 || dy > 5) {
      isDraggingRef.current = true;
    }
  }
  
  requestAnimationFrame(() => {
    setTransform(prev => ({
      ...prev,
      x: e.clientX - startPanPos.x,
      y: e.clientY - startPanPos.y
    }));
  });
};

/**
 * Handles mouse up events to end panning
 * 
 * @param {MouseEvent} e - Mouse event
 * @param {Object} state - Canvas state and setters
 * @param {Object} refs - React refs needed for tracking
 * @param {Function} onDeselectNode - Callback to deselect node
 */
export const handleMouseUp = (e, state, refs, onDeselectNode) => {
  const { setIsPanning } = state;
  const { isDraggingRef, mouseDownPosRef, justClickedNodeRef } = refs;
  
  setIsPanning(false);
  
  // Only deselect node if this was a clean click (not a drag)
  // and we're not clicking on a node
  if (!isDraggingRef.current && !justClickedNodeRef.current) {
    onDeselectNode();
  }
  
  // Reset tracking refs
  mouseDownPosRef.current = null;
};