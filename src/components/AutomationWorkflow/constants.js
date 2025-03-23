// Workflow constants
export const DEFAULT_NODE_HEIGHT = 90;
export const DEFAULT_NODE_WIDTH = 300;
export const GRID_SIZE = 20;
export const ZOOM_MIN = 0.2;
export const ZOOM_MAX = 2;
export const AUTO_HIDE_TIMEOUT = 2500; // 2.5 seconds
export const BUTTON_SIZE = 40;

// Edge connection offsets
export const EDGE_INPUT_Y_OFFSET = 0; // Offset for input edge connections (top of node)
export const EDGE_OUTPUT_Y_OFFSET = 40; // Offset for output edge connections (bottom of node)
export const BUTTON_Y_OFFSET = 0; // Default vertical offset for "+" buttons

// Node types
export const NODE_TYPES = {
  TRIGGER: 'trigger',
  CONTROL: 'control',
  ACTION: 'action',
  IFELSE: 'ifelse',
  SPLITFLOW: 'splitflow'
};

// Connection types
export const CONNECTION_TYPES = {
  DEFAULT: 'default',
  BRANCH: 'branch'
};

// Initial workflow steps for demo/testing
export const INITIAL_WORKFLOW_STEPS = [
  {
    id: "customer-joins-node",
    type: 'trigger',
    title: 'Customer joins Segment',
    subtitle: 'Not onboarded',
    position: { x: window.innerWidth / 2, y: 25 },
    height: DEFAULT_NODE_HEIGHT,
    contextMenuConfig: { position: 'right', offsetX: -5, offsetY: 0, orientation: 'vertical' },
    outgoingConnections: {
      default: { targetNodeId: "check-clicked-node" }
    }
  },  
  {
    id: "check-clicked-node",
    type: 'ifelse',
    title: 'Check if clicked',
    subtitle: 'Email link was clicked',
    position: { x: window.innerWidth / 2, y: 225 },
    height: DEFAULT_NODE_HEIGHT,
    contextMenuConfig: { position: 'right', offsetX: -5, offsetY: 0, orientation: 'vertical' },
    branchConnections: {
      // Add connections to "yes" and "no" branches
      "yes": { targetNodeId: "yes-branch-node" },
      "no": { targetNodeId: "no-branch-node" }
    }
  },
  // Add the "yes" branch node
  {
    id: "yes-branch-node",
    type: 'action',
    title: 'Yes Branch Action',
    subtitle: 'When email was clicked',
    // Position to the left based on getBranchEndpoint function
    position: { x: window.innerWidth / 2 - 190, y: 450 },
    height: DEFAULT_NODE_HEIGHT,
    contextMenuConfig: { position: 'right', offsetX: -5, offsetY: 0, orientation: 'vertical' },
    outgoingConnections: {
      default: { targetNodeId: "split-flow-node" } // Connect to our new splitflow node
    }
  },
  // Add the "no" branch node
  {
    id: "no-branch-node",
    type: 'action',
    title: 'No Branch Action',
    subtitle: 'When email was not clicked',
    // Position to the right based on getBranchEndpoint function
    position: { x: window.innerWidth / 2 + 190, y: 450 },
    height: DEFAULT_NODE_HEIGHT,
    contextMenuConfig: { position: 'right', offsetX: -5, offsetY: 0, orientation: 'vertical' },
    outgoingConnections: {
      default: { targetNodeId: null } // Can connect to another node if needed
    }
  },
  // Add new splitflow node
  {
    id: "split-flow-node",
    type: 'splitflow',
    title: 'Split Flow',
    subtitle: 'Execute multiple paths in parallel',
    position: { x: window.innerWidth / 2 - 190, y: 675 },
    height: DEFAULT_NODE_HEIGHT,
    contextMenuConfig: { position: 'right', offsetX: -5, offsetY: 0, orientation: 'vertical' },
    branchConnections: {
      "path1": { targetNodeId: "path1-action-node" },
      "path2": { targetNodeId: "path2-control-node" }
    }
  },
  // Add path1 child node
  {
    id: "path1-action-node",
    type: 'action',
    title: 'Path 1 Action',
    subtitle: 'First parallel process',
    position: { x: window.innerWidth / 2 - 380, y: 900 },
    height: DEFAULT_NODE_HEIGHT,
    contextMenuConfig: { position: 'right', offsetX: -5, offsetY: 0, orientation: 'vertical' },
    outgoingConnections: {
      default: { targetNodeId: null }
    }
  },
  // Add path2 child node
  {
    id: "path2-control-node",
    type: 'control',
    title: 'Path 2 Control',
    subtitle: 'Second parallel process',
    position: { x: window.innerWidth / 2, y: 900 },
    height: DEFAULT_NODE_HEIGHT,
    contextMenuConfig: { position: 'right', offsetX: -5, offsetY: 0, orientation: 'vertical' },
    outgoingConnections: {
      default: { targetNodeId: null }
    }
  }
];