/**
 * Layout constants - controls the visual appearance and sizing of the workflow elements
 */
export const LAYOUT = {
  // Node dimensions
  NODE: {
    DEFAULT_HEIGHT: 90,
    DEFAULT_WIDTH: 340,
  },
  
  // Grid settings
  GRID: {
    SIZE: 30,
    COLOR: '#E5E7EB', // Default grid color
    SHOW_GRID: true,  // Whether to show the grid
    SNAP_TO_GRID: true, // Whether to snap nodes to grid by default
    DOT_SIZE: 2 // Size of grid dots in pixels
  },
  
  // Zoom constraints
  ZOOM: {
    MIN: 0.2,
    MAX: 2,
  },
  
  // UI element sizing
  BUTTON: {
    SIZE: 40,
    Y_OFFSET: 0, // Default vertical offset for "+" buttons
  },
  
  // Edge connection positioning
  EDGE: {
    INPUT_Y_OFFSET: 0,  // Offset for input edge connections (top of node)
    OUTPUT_Y_OFFSET: 40, // Offset for output edge connections (bottom of node)
  },
  
  // Timing constants
  TIMING: {
    AUTO_HIDE_TIMEOUT: 2500, // 2.5 seconds
  },

  // Node placement configuration
  NODE_PLACEMENT: {
    // Standard connection spacing
    STANDARD_VERTICAL_SPACING: 175,
    
    // Branch connection spacing
    BRANCH_VERTICAL_SPACING: 130,
    BRANCH_LEFT_OFFSET: -120,
    BRANCH_RIGHT_OFFSET: 120
  }
};

// For backward compatibility with existing code
export const DEFAULT_NODE_HEIGHT = LAYOUT.NODE.DEFAULT_HEIGHT;
export const DEFAULT_NODE_WIDTH = LAYOUT.NODE.DEFAULT_WIDTH;
export const GRID_SIZE = LAYOUT.GRID.SIZE;
export const GRID_COLOR = LAYOUT.GRID.COLOR;
export const SHOW_GRID = LAYOUT.GRID.SHOW_GRID;
export const GRID_DOT_SIZE = LAYOUT.GRID.DOT_SIZE;
export const SNAP_TO_GRID = LAYOUT.GRID.SNAP_TO_GRID;
export const ZOOM_MIN = LAYOUT.ZOOM.MIN;
export const ZOOM_MAX = LAYOUT.ZOOM.MAX;
export const AUTO_HIDE_TIMEOUT = LAYOUT.TIMING.AUTO_HIDE_TIMEOUT;
export const BUTTON_SIZE = LAYOUT.BUTTON.SIZE;
export const BUTTON_Y_OFFSET = LAYOUT.BUTTON.Y_OFFSET;
export const EDGE_INPUT_Y_OFFSET = LAYOUT.EDGE.INPUT_Y_OFFSET;
export const EDGE_OUTPUT_Y_OFFSET = LAYOUT.EDGE.OUTPUT_Y_OFFSET;
export const STANDARD_VERTICAL_SPACING = LAYOUT.NODE_PLACEMENT.STANDARD_VERTICAL_SPACING;
export const BRANCH_VERTICAL_SPACING = LAYOUT.NODE_PLACEMENT.BRANCH_VERTICAL_SPACING;
export const BRANCH_LEFT_OFFSET = LAYOUT.NODE_PLACEMENT.BRANCH_LEFT_OFFSET;
export const BRANCH_RIGHT_OFFSET = LAYOUT.NODE_PLACEMENT.BRANCH_RIGHT_OFFSET;

/**
 * Node type definitions
 * These define the available types of nodes in the workflow system
 */
export const NODE_TYPES = Object.freeze({
  // Event-based nodes
  TRIGGER: 'trigger',   // Starting point of a workflow, triggered by an event
  
  // Flow control nodes
  CONTROL: 'control',   // Controls flow without performing actions
  IFELSE: 'ifelse',     // Conditional branching based on a condition
  SPLITFLOW: 'splitflow', // Executes multiple paths in parallel
  
  // Operation nodes
  ACTION: 'action',     // Performs a specific operation or task
});

/**
 * Connection type definitions
 * These define how nodes connect to each other in the workflow
 */
export const CONNECTION_TYPES = Object.freeze({
  DEFAULT: 'default', // Standard connection between nodes
  BRANCH: 'branch'    // Specialized connection for branching flows
});

// Color palette - centralized color definitions
export const COLORS = {
  // Primary colors
  GREEN: {
    PRIMARY: '#22C55E',
    DARK: '#059669',
    LIGHT: '#34D399',
    MEDIUM: '#10B981',
  },
  RED: {
    PRIMARY: '#EF4444',
  },
  BLUE: {
    PRIMARY: '#3B82F6',
  },
  GRAY: {
    PRIMARY: '#D1D5DB',
  }
};

// Branch edge colors - using semantic color references
export const BRANCH_EDGE_COLORS = {
  // If/Else branch colors
  IFELSE: {
    YES: COLORS.GREEN.PRIMARY, // Green - intuitive color for "yes" branch (success/approval)
    NO: COLORS.RED.PRIMARY,    // Red - intuitive color for "no" branch (rejection/negative)
  },
  // Split flow branch colors
  SPLITFLOW: {
    DEFAULT: COLORS.GREEN.MEDIUM, // Green - matches Split Flow node color
    BRANCH_1: COLORS.GREEN.DARK,  // Darker green for first branch
    BRANCH_2: COLORS.GREEN.LIGHT, // Lighter green for second branch
    // Add more branch colors as needed
  },
  // Default connection color
  DEFAULT: COLORS.GRAY.PRIMARY,    // Gray
  // Highlighted connection color
  HIGHLIGHTED: COLORS.BLUE.PRIMARY // Blue
};

// Add this to your BRANCH_EDGE_COLORS object or create a new config section

export const EDGE_HIGHLIGHT_CONFIG = {
  PRESERVE_COLOR: true, // When true, highlighted edges maintain their color
  INCREASE_WIDTH: true, // Increase stroke width on highlight
  USE_DASHED_LINE: true, // Use dashed lines to indicate highlight
};

/**
 * Default context menu configuration
 * Provides consistent menu positioning across nodes
 */
export const DEFAULT_CONTEXT_MENU_CONFIG = Object.freeze({
  position: 'right',
  offsetX: -5,
  offsetY: 0,
  orientation: 'vertical'
});

/**
 * Menu placement configuration
 * Controls how add step menus are displayed relative to buttons
 */
export const MENU_PLACEMENT = {
  
  // Vertical offset for menus from their anchor points
  MENU_VERTICAL_OFFSET: 10,

  // Horizontal offset for menus from their anchor points
  MENU_HORIZONTAL_OFFSET: 0,
  
  // Whether clicking outside the menu automatically closes it
  CLICK_OUTSIDE_CLOSES_MENU: true,
  
  // Animation settings
  ANIMATE_MENUS: true,
  
  // Z-index for menus
  MENU_Z_INDEX: 55,
  
  // Width of node type buttons in the menu
  NODE_BUTTON_WIDTH: 20,
  
  // Height of node type buttons in the menu
  NODE_BUTTON_HEIGHT: 20
};

/**
 * Mouse controls configuration
 * Controls how mouse interactions behave with the canvas
 */
export const MOUSE_CONTROLS = {
  // Whether mouse wheel should zoom by default (without modifier keys)
  WHEEL_ZOOMS: true,
  
  // Whether to invert the zoom direction
  INVERT_ZOOM: false,
  
  // Sensitivity for zoom operations (lower = less sensitive)
  ZOOM_SENSITIVITY: 0.0009,
  
  // Minimum zoom change per scroll event
  MIN_ZOOM_CHANGE: 0.01,
  
  // Maximum zoom change per scroll event
  MAX_ZOOM_CHANGE: 0.05,
  
  // Modifier key to toggle between zoom and scroll behaviors
  // If WHEEL_ZOOMS is true, holding this key will cause the wheel to scroll
  // If WHEEL_ZOOMS is false, holding this key will cause the wheel to zoom
  TOGGLE_KEY: 'Alt', // 'Alt', 'Shift', 'Control', or null for no toggle
  
  // Whether to maintain the mouse position as the zoom center
  ZOOM_TO_CURSOR: true
};


/**
 * Safely get window dimensions with fallback values for SSR environments
 * @returns {{width: number, height: number}} Dimensions object
 */
const getSafeWindowDimensions = () => {
  try {
    if (typeof window !== 'undefined' && window.innerWidth) {
      return {
        width: window.innerWidth,
        height: window.innerHeight
      };
    }
  } catch (e) {
    console.warn('Window object not available, using default dimensions');
  }
  
  // Default fallback values if window is not available (SSR)
  return { width: 1200, height: 800 };
};

/**
 * Initial workflow steps for demo/testing
 * This provides a complete example workflow with various node types
 * @type {Array<Object>}
 */
export const INITIAL_WORKFLOW_STEPS = Object.freeze([
  // Trigger node - starting point of the workflow
  {
    id: "customer-joins-node",
    type: NODE_TYPES.TRIGGER,
    title: 'Customer joins Segment',
    subtitle: 'Not onboarded',
    position: { x: getSafeWindowDimensions().width / 2, y: 25 },
    height: LAYOUT.NODE.DEFAULT_HEIGHT,
    contextMenuConfig: DEFAULT_CONTEXT_MENU_CONFIG,
    outgoingConnections: {
      default: { targetNodeId: "check-clicked-node" }
    }
  },
  
  // If/Else conditional node
  {
    id: "check-clicked-node",
    type: NODE_TYPES.IFELSE,
    title: 'Check if clicked',
    subtitle: 'Email link was clicked',
    position: { x: getSafeWindowDimensions().width / 2, y: 225 },
    height: LAYOUT.NODE.DEFAULT_HEIGHT,
    contextMenuConfig: DEFAULT_CONTEXT_MENU_CONFIG,
    branchConnections: {
      "yes": { targetNodeId: "yes-branch-node" }, // YES branch
      "no": { targetNodeId: "no-branch-node" }    // NO branch
    }
  },
  
  // "Yes" branch action node
  {
    id: "yes-branch-node",
    type: NODE_TYPES.ACTION,
    title: 'Yes Branch Action',
    subtitle: 'When email was clicked',
    position: { x: getSafeWindowDimensions().width / 2 - 190, y: 450 },
    height: LAYOUT.NODE.DEFAULT_HEIGHT,
    contextMenuConfig: DEFAULT_CONTEXT_MENU_CONFIG,
    outgoingConnections: {
      default: { targetNodeId: "split-flow-node" }
    }
  },
  
  // "No" branch action node
  {
    id: "no-branch-node",
    type: NODE_TYPES.ACTION,
    title: 'No Branch Action',
    subtitle: 'When email was not clicked',
    position: { x: getSafeWindowDimensions().width / 2 + 190, y: 450 },
    height: LAYOUT.NODE.DEFAULT_HEIGHT,
    contextMenuConfig: DEFAULT_CONTEXT_MENU_CONFIG,
    outgoingConnections: {
      default: { targetNodeId: null }
    }
  },
  
  // Split flow node - for parallel processing
  {
    id: "split-flow-node",
    type: NODE_TYPES.SPLITFLOW,
    title: 'Split Flow',
    subtitle: 'Execute multiple paths in parallel',
    position: { x: getSafeWindowDimensions().width / 2 - 190, y: 675 },
    height: LAYOUT.NODE.DEFAULT_HEIGHT,
    contextMenuConfig: DEFAULT_CONTEXT_MENU_CONFIG,
    branchConnections: {
      "path1": { targetNodeId: "path1-action-node" },
      "path2": { targetNodeId: "path2-control-node" }
    }
  },
  
  // Path 1 action node
  {
    id: "path1-action-node",
    type: NODE_TYPES.ACTION,
    title: 'Path 1 Action',
    subtitle: 'First parallel process',
    position: { x: getSafeWindowDimensions().width / 2 - 380, y: 900 },
    height: LAYOUT.NODE.DEFAULT_HEIGHT,
    contextMenuConfig: DEFAULT_CONTEXT_MENU_CONFIG,
    outgoingConnections: {
      default: { targetNodeId: null }
    }
  },
  
  // Path 2 control node
  {
    id: "path2-control-node",
    type: NODE_TYPES.CONTROL,
    title: 'Path 2 Control',
    subtitle: 'Second parallel process',
    position: { x: getSafeWindowDimensions().width / 2, y: 900 },
    height: LAYOUT.NODE.DEFAULT_HEIGHT,
    contextMenuConfig: DEFAULT_CONTEXT_MENU_CONFIG,
    outgoingConnections: {
      default: { targetNodeId: null }
    }
  }
]);