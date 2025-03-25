/**
 * Smoothly animates canvas panning with easing
 *
 * @param {number} startX - Starting X position
 * @param {number} startY - Starting Y position
 * @param {number} deltaX - Change in X position
 * @param {number} deltaY - Change in Y position
 * @param {Function} setTransform - State setter function for transform
 * @param {number} duration - Animation duration in milliseconds (default: 300)
 * @returns {Promise} A promise that resolves when animation completes
 */
export const animateCanvasPan = (
  startX,
  startY,
  deltaX,
  deltaY,
  setTransform,
  duration = 300
) => {
  const startTime = Date.now();
  const targetX = startX + deltaX;
  const targetY = startY + deltaY;
  
  return new Promise((resolve) => {
    const animatePan = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic function for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const newX = startX + (targetX - startX) * easeProgress;
      const newY = startY + (targetY - startY) * easeProgress;
      
      setTransform(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
      
      if (progress < 1) {
        requestAnimationFrame(animatePan);
      } else {
        resolve();
      }
    };
    
    requestAnimationFrame(animatePan);
  });
};

/**
 * Centralized manager for handling workflow element animations
 */
export class AnimationManager {
  constructor() {
    this.animatingElements = new Map();
    this.animationDurations = {
      nodeAdd: 300,
      nodeRemove: 200,
      nodeUpdate: 150,
      flash: 500,
      canvasPan: 300 // Add canvas pan duration
    };
  }

  /**
   * Start animation for a specific element
   * 
   * @param {string} elementId - ID of the element to animate
   * @param {string} animationType - Type of animation to apply
   * @param {Object} options - Additional animation options
   * @returns {Promise} Promise that resolves when animation completes
   */
  startAnimation(elementId, animationType, options = {}) {
    // Add element to the tracking map with animation type
    this.animatingElements.set(elementId, animationType);
    
    // Return a promise that resolves when animation completes
    return new Promise((resolve) => {
      const duration = options.duration || this.animationDurations[animationType];
      
      setTimeout(() => {
        this.animatingElements.delete(elementId);
        resolve();
      }, duration);
    });
  }

  /**
   * Check if an element is currently animating
   * 
   * @param {string} elementId - ID of the element to check
   * @returns {boolean|string} Animation type if animating, false otherwise
   */
  isAnimating(elementId) {
    return this.animatingElements.has(elementId) 
      ? this.animatingElements.get(elementId) 
      : false;
  }

  /**
   * Get all currently animating elements
   * 
   * @returns {Array} Array of element IDs that are currently animating
   */
  getAnimatingElements() {
    return Array.from(this.animatingElements.keys());
  }

  /**
   * Cancel animation for a specific element
   * 
   * @param {string} elementId - ID of the element to stop animating
   */
  cancelAnimation(elementId) {
    this.animatingElements.delete(elementId);
  }

  /**
   * Animate canvas panning using the standalone animateCanvasPan function
   *
   * @param {number} startX - Starting X position
   * @param {number} startY - Starting Y position
   * @param {number} deltaX - Change in X position
   * @param {number} deltaY - Change in Y position
   * @param {Function} setTransform - State setter function for transform
   * @returns {Promise} A promise that resolves when animation completes
   */
  animateCanvasPan(startX, startY, deltaX, deltaY, setTransform) {
    return animateCanvasPan(
      startX,
      startY,
      deltaX,
      deltaY,
      setTransform,
      this.animationDurations.canvasPan
    );
  }
}

// Export a singleton instance
export const animationManager = new AnimationManager();
