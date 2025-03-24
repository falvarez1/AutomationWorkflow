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
      flash: 500
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
}

// Export a singleton instance
export const animationManager = new AnimationManager();
