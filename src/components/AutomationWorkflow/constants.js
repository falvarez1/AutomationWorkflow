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
    contextMenuConfig: { position: 'right', offsetX: 10, offsetY: 0 },
    outgoingConnections: {
      default: { targetNodeId: "two-day-delay-node" }
    }
  },
  {
    id: "two-day-delay-node",
    type: 'control',
    title: 'Delay',
    subtitle: '2 days',
    position: { x: window.innerWidth / 2, y: 200 },
    height: DEFAULT_NODE_HEIGHT,
    contextMenuConfig: { position: 'right', offsetX: 10, offsetY: 0 },
    outgoingConnections: {
      default: { targetNodeId: "send-email-node" }
    }
  },
  {
    id: "send-email-node",
    type: 'action',
    title: 'Send email',
    subtitle: 'Just one more step to go',
    position: { x: window.innerWidth / 2, y: 350 },
    height: DEFAULT_NODE_HEIGHT,
    contextMenuConfig: { position: 'right', offsetX: 10, offsetY: 0 },
    outgoingConnections: {
      default: { targetNodeId: "check-clicked-node" }
    }
  },
  {
    id: "check-clicked-node",
    type: 'ifelse',
    title: 'Check if clicked',
    subtitle: 'Email link was clicked',
    position: { x: window.innerWidth / 2, y: 525 },
    height: DEFAULT_NODE_HEIGHT,
    contextMenuConfig: { position: 'right', offsetX: 10, offsetY: 0 },
    branchConnections: {}
  }
];