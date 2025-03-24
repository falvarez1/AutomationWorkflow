/**
 * Interface for menu positioning strategies
 * Different strategies can position menus in different ways relative to their target elements
 */
export class MenuPositioningStrategy {
  /**
   * Calculate the position for a menu relative to its target element
   * @param {Menu} menu - The menu to position
   * @param {Object} targetElement - The element to position the menu relative to
   * @param {Object} data - Additional data for positioning calculations
   * @returns {Object} Position coordinates {x, y}
   */
  calculatePosition(menu, targetElement, data = {}) {
    throw new Error("Method 'calculatePosition' must be implemented by subclasses");
  }
}

/**
 * Position a menu centered above its target element
 */
export class TopCenterPositioningStrategy extends MenuPositioningStrategy {
  constructor(offset = 8) {
    super();
    this.offset = offset;
  }

  calculatePosition(menu, targetElement, data = {}) {
    const offsetY = data.offsetY || this.offset;
    return {
      x: targetElement.x,
      y: targetElement.y - offsetY
    };
  }
}

/**
 * Position a menu centered below its target element
 */
export class BottomCenterPositioningStrategy extends MenuPositioningStrategy {
  constructor(offset = 8) {
    super();
    this.offset = offset;
  }

  calculatePosition(menu, targetElement, data = {}) {
    const offsetY = data.offsetY || this.offset;
    return {
      x: targetElement.x,
      y: targetElement.y + offsetY
    };
  }
}

/**
 * Position a menu to the right of its target element
 */
export class RightPositioningStrategy extends MenuPositioningStrategy {
  constructor(offset = 8) {
    super();
    this.offset = offset;
  }

  calculatePosition(menu, targetElement, data = {}) {
    const offsetX = data.offsetX || this.offset;
    return {
      x: targetElement.x + offsetX,
      y: targetElement.y
    };
  }
}

/**
 * Position a menu to the left of its target element
 */
export class LeftPositioningStrategy extends MenuPositioningStrategy {
  constructor(offset = 8) {
    super();
    this.offset = offset;
  }

  calculatePosition(menu, targetElement, data = {}) {
    const offsetX = data.offsetX || this.offset;
    return {
      x: targetElement.x - offsetX,
      y: targetElement.y
    };
  }
}

/**
 * Position a menu relative to a branch endpoint (used for branch menus)
 */
export class BranchEndpointPositioningStrategy extends MenuPositioningStrategy {
  constructor(offsetX = 0, offsetY = 0) {
    super();
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  calculatePosition(menu, targetElement, data = {}) {
    const offsetX = data.offsetX !== undefined ? data.offsetX : this.offsetX;
    const offsetY = data.offsetY !== undefined ? data.offsetY : this.offsetY;
    
    return {
      x: targetElement.x + offsetX,
      y: targetElement.y + offsetY
    };
  }
}

/**
 * Position a menu at a calculated midpoint on an edge (used for edge menus)
 */
export class EdgeMidpointPositioningStrategy extends MenuPositioningStrategy {
  constructor(offsetX = 0, offsetY = 0) {
    super();
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  calculatePosition(menu, targetElement, data = {}) {
    // For edge menus, targetElement typically contains the edge endpoints
    const { startPos, endPos } = targetElement;
    const offsetX = data.offsetX !== undefined ? data.offsetX : this.offsetX;
    const offsetY = data.offsetY !== undefined ? data.offsetY : this.offsetY;
    
    // Calculate midpoint
    const midX = (startPos.x + endPos.x) / 2;
    const midY = (startPos.y + endPos.y) / 2;
    
    return {
      x: midX + offsetX,
      y: midY + offsetY
    };
  }
}

/**
 * Factory function to create a positioning strategy by name
 * @param {string} strategyName - Name of the strategy to create
 * @param {Object} options - Options for the strategy
 * @returns {MenuPositioningStrategy} The created strategy
 */
export function createPositioningStrategy(strategyName, options = {}) {
  const { offsetX = 8, offsetY = 8 } = options;
  
  switch (strategyName) {
    case 'top':
      return new TopCenterPositioningStrategy(offsetY);
    case 'bottom':
      return new BottomCenterPositioningStrategy(offsetY);
    case 'right':
      return new RightPositioningStrategy(offsetX);
    case 'left':
      return new LeftPositioningStrategy(offsetX);
    case 'branchEndpoint':
      return new BranchEndpointPositioningStrategy(offsetX, offsetY);
    case 'edgeMidpoint':
      return new EdgeMidpointPositioningStrategy(offsetX, offsetY);
    default:
      return new BottomCenterPositioningStrategy(offsetY);
  }
}