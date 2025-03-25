import { useState, useRef, useEffect } from 'react';
import { ZOOM_MIN, ZOOM_MAX } from '../constants';
import { animateCanvasPan } from '../utils/AnimationManager';

/**
 * Hook for managing canvas state (panning, zooming, etc.)
 * 
 * @param {number} initialScale - Initial zoom scale
 * @returns {Object} Canvas state and setters
 */
export function useCanvasState(initialScale = 0.8) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: initialScale });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPos, setStartPanPos] = useState({ x: 0, y: 0 });
  const transformRef = useRef(transform);
  
  // Update transform ref when transform changes
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);
  
  /**
   * Reset view to default position and scale
   */
  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };
  
  /**
   * Handle zoom in/out with button controls
   * 
   * @param {number} factor - Zoom factor (> 1 to zoom in, < 1 to zoom out)
   */
  const handleZoom = (factor) => {
    setTransform(prev => {
      const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prev.scale * factor));
      // Keep the center of the view fixed when zooming with buttons
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const graphX = (centerX - prev.x) / prev.scale;
      const graphY = (centerY - prev.y) / prev.scale;
      const newX = centerX - graphX * newScale;
      const newY = centerY - graphY * newScale;
      
      return {
        x: newX,
        y: newY,
        scale: newScale
      };
    });
  };

  /**
   * Pan the canvas by a specific delta
   * 
   * @param {number} deltaX - X distance to pan
   * @param {number} deltaY - Y distance to pan
   * @returns {Promise} Promise that resolves when animation completes
   */
  const panCanvas = (deltaX, deltaY) => {
    return animateCanvasPan(transform.x, transform.y, deltaX, deltaY, setTransform);
  };
  
  return {
    transform,
    setTransform,
    isPanning,
    setIsPanning,
    startPanPos,
    setStartPanPos,
    transformRef,
    resetView,
    handleZoom,
    panCanvas
  };
}