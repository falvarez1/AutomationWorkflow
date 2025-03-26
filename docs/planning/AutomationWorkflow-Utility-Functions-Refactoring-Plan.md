# AutomationWorkflow Utility Functions Refactoring Plan

## Overview

This document outlines a plan to improve the architecture of the `AutomationWorkflow.jsx` component by moving utility functions to more appropriate locations. These changes will make the main component more focused on its core responsibilities and improve code maintainability.

## Current Issues

The `AutomationWorkflow.jsx` file contains several utility functions that don't directly relate to the component's core responsibilities:

1. `generateUniqueId` (line 544) - Creates unique identifiers
2. `animateCanvasPan` (lines 444-474) - Handles smooth canvas animation
3. `ensureElementVisibility` (lines 477-537) - Manages viewport positioning

These functions add complexity to the main component and could be better organized in dedicated utility modules.

## Refactoring Approach

Based on the existing project structure and utility files, we'll move these functions to the following locations:

1. Create a new `GeneralUtils.js` for general-purpose functions
2. Add canvas-related functions to existing utility files

## Detailed Implementation Plan

### 1. Create `GeneralUtils.js` for Common Utilities

Create a new file: `src/components/AutomationWorkflow/utils/GeneralUtils.js`

```javascript
/**
 * General utility functions for the Automation Workflow
 */

/**
 * Generates a unique ID combining timestamp and random string
 * @returns {string} Unique identifier
 */
export const generateUniqueId = () => 
  `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
```

### 2. Add Canvas Animation to `AnimationManager.js`

Update the existing `src/components/AutomationWorkflow/utils/AnimationManager.js`:

```javascript
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

// Update AnimationManager class to include the canvas pan method
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

  // Existing methods...

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

// Export the singleton instance (keep this line unchanged)
export const animationManager = new AnimationManager();
```

### 3. Add Viewport Management to `positionUtils.js`

Update the existing `src/components/AutomationWorkflow/utils/positionUtils.js`:

```javascript
import { animateCanvasPan } from './AnimationManager';

/**
 * Checks if an element is visible in the viewport and pans if needed
 * 
 * @param {Object} elementRect - Rectangle representing element boundaries
 * @param {Object} transform - Current transform state
 * @param {Function} setTransform - State setter function for transform
 * @param {boolean} propertyPanelOpen - Whether property panel is open
 * @returns {boolean} Whether panning was needed
 */
export const ensureElementVisibility = (
  elementRect, 
  transform, 
  setTransform, 
  propertyPanelOpen = false
) => {
  // Handle both rectangle formats (left/right/top/bottom and x/y/width/height)
  let normalizedRect;
  
  if ('x' in elementRect && 'width' in elementRect) {
    // Convert center-based buttonRect to left/right/top/bottom format
    normalizedRect = {
      left: elementRect.x - elementRect.width / 2,
      right: elementRect.x + elementRect.width / 2,
      top: elementRect.y - elementRect.height / 2,
      bottom: elementRect.y + elementRect.height / 2
    };
  } else {
    // Already in correct format
    normalizedRect = elementRect;
  }
  
  // Get viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const propertyPanelWidth = propertyPanelOpen ? 484 : 0; // Width of the properties panel
  
  // Calculate element position in viewport coordinates
  const elementInViewport = {
    left: normalizedRect.left * transform.scale + transform.x,
    right: normalizedRect.right * transform.scale + transform.x,
    top: normalizedRect.top * transform.scale + transform.y,
    bottom: normalizedRect.bottom * transform.scale + transform.y
  };
  
  // Define minimum padding from edges
  const padding = 30; // Increased padding for better visibility
  
  // Calculate required panning amounts
  let panX = 0, panY = 0;
  
  // Check horizontal visibility (accounting for properties panel)
  if (elementInViewport.right > viewportWidth - propertyPanelWidth - padding) {
    panX = viewportWidth - propertyPanelWidth - elementInViewport.right - padding;
  } else if (elementInViewport.left < padding) {
    panX = padding - elementInViewport.left;
  }
  
  // Check vertical visibility with extra attention to bottom edge
  if (elementInViewport.bottom > viewportHeight - padding) {
    // Ensure there's enough padding at the bottom
    panY = viewportHeight - elementInViewport.bottom - padding;
  } else if (elementInViewport.top < padding) {
    panY = padding - elementInViewport.top;
  }
  
  // Smoothly animate panning if needed
  if (panX !== 0 || panY !== 0) {
    animateCanvasPan(transform.x, transform.y, panX, panY, setTransform);
    return true;
  }
  
  return false;
};
```

## Changes to AutomationWorkflow.jsx

After implementing these utility functions, we'll need to update the imports and usages in the main component:

1. Remove the function implementations from the component
2. Add imports for the functions
3. Update function calls to use the imported functions

### Add Imports

```javascript
// Add these imports
import { generateUniqueId } from './components/AutomationWorkflow/utils/GeneralUtils';
import { ensureElementVisibility } from './components/AutomationWorkflow/utils/positionUtils';
import { animateCanvasPan } from './components/AutomationWorkflow/utils/AnimationManager';
```

### Update Function Calls

1. Replace the `generateUniqueId` implementation with direct calls to the imported function
2. Replace the `animateCanvasPan` function calls with calls to the imported function
3. Replace the `ensureElementVisibility` implementation with calls to the imported function, passing the necessary parameters:

```javascript
// Example for ensureElementVisibility
const nodeRect = {
  left: node.position.x,
  right: node.position.x + DEFAULT_NODE_WIDTH,
  top: node.position.y,
  bottom: node.position.y + (node.height || DEFAULT_NODE_HEIGHT)
};

// Call the utility function, passing all required parameters
ensureElementVisibility(nodeRect, transform, setTransform, true);
```

## Benefits of This Approach

1. **Improved Separation of Concerns**: Each utility function will be in a file that matches its purpose.

2. **Reduced Complexity**: The main AutomationWorkflow component will be more focused on its core responsibilities.

3. **Better Reusability**: These utility functions can now be easily used by other components.

4. **Improved Testability**: Isolated utility functions are easier to test independently.

5. **Enhanced Maintainability**: Smaller, more focused files are easier to understand and maintain.

## Implementation Strategy

To implement these changes, I recommend switching to Code mode for execution of the refactoring plan.