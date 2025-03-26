# Branch Spacing Refactoring Plan

## Problem Statement

Currently, there is a conflation of terminology and configuration with `BRANCH_VERTICAL_SPACING`. In some cases, it represents the distance that new nodes should render vertically, and in other cases, it represents where the edge line starts. This ambiguity leads to confusion and potential inconsistencies in the code.

## Solution Approach

We will:
1. Rename the existing `BRANCH_VERTICAL_SPACING` to `BRANCH_EDGE_OFFSET` to clearly indicate its primary purpose: specifying where branch connection lines visually start from a node
2. Add a new `NODE_BRANCH_VERTICAL_SPACING` constant to specifically handle the vertical spacing between nodes in branch paths
3. Update all relevant code to use the correct constants based on their intended purpose

## Implementation Details

### 1. Update constants.js

```javascript
// Current:
NODE_PLACEMENT: {
  // Standard connection spacing when adding new nodes
  STANDARD_VERTICAL_SPACING: 175,
  
  // Branch connection spacing
  BRANCH_VERTICAL_SPACING: 130,
  BRANCH_LEFT_OFFSET: -120,
  BRANCH_RIGHT_OFFSET: 120
}

// Change to:
NODE_PLACEMENT: {
  // Standard connection spacing when adding new nodes
  STANDARD_VERTICAL_SPACING: 175,
  
  // Vertical spacing between nodes in branch paths
  NODE_BRANCH_VERTICAL_SPACING: 150,
  
  // Horizontal offsets for branch nodes
  BRANCH_LEFT_OFFSET: -120,
  BRANCH_RIGHT_OFFSET: 120
},

EDGE: {
  INPUT_Y_OFFSET: 0,  // Offset for input edge connections (top of node)
  OUTPUT_Y_OFFSET: 0, // Offset for output edge connections (bottom of node)
  
  // Where branch connection lines visually start from a node
  BRANCH_EDGE_OFFSET: 130
}

// For backward compatibility
export const BRANCH_VERTICAL_SPACING = LAYOUT.EDGE.BRANCH_EDGE_OFFSET;
```

### 2. Update BranchUtils.js

```javascript
// Current:
getBranchEndpoint: (node, branchId, pluginRegistry, defaults= {}) => {
  const { 
    DEFAULT_NODE_WIDTH = LAYOUT.NODE.DEFAULT_WIDTH, 
    DEFAULT_NODE_HEIGHT = LAYOUT.NODE.DEFAULT_HEIGHT,
    BRANCH_VERTICAL_SPACING = 0
  } = defaults;

  // ...
  
  return { x: startX - 65, y: startY + BRANCH_VERTICAL_SPACING };
  // ...
}

// Change to:
getBranchEndpoint: (node, branchId, pluginRegistry, defaults= {}) => {
  const { 
    DEFAULT_NODE_WIDTH = LAYOUT.NODE.DEFAULT_WIDTH, 
    DEFAULT_NODE_HEIGHT = LAYOUT.NODE.DEFAULT_HEIGHT,
    BRANCH_EDGE_OFFSET = 0
  } = defaults;

  // ...
  
  return { x: startX - 65, y: startY + BRANCH_EDGE_OFFSET };
  // ...
}
```

### 3. Update AddNodeButtonRenderer.jsx

```javascript
// Current:
const branchEndpoint = BranchUtils.getBranchEndpoint(node, branch.id, pluginRegistry, {
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
  BRANCH_VERTICAL_SPACING: 0
});

// Change to:
const branchEndpoint = BranchUtils.getBranchEndpoint(node, branch.id, pluginRegistry, {
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
  BRANCH_EDGE_OFFSET: 0
});
```

### 4. Update GraphCommands.js

```javascript
// Current:
constructor(graph, newNode, sourceNodeId = null, connectionType = 'default', branchId = null) {
  // ...
  this.nodeVerticalSpacing = 150; // Vertical spacing between nodes
  // ...
}

// Change to:
constructor(graph, newNode, sourceNodeId = null, connectionType = 'default', branchId = null) {
  // ...
  this.nodeVerticalSpacing = LAYOUT.NODE_PLACEMENT.NODE_BRANCH_VERTICAL_SPACING; // Use constant
  // ...
}
```

## Implementation Sequence

1. Update constants.js first to define the new constants
2. Update BranchUtils.js to use the new BRANCH_EDGE_OFFSET
3. Update AddNodeButtonRenderer.jsx to use the new constant name
4. Update GraphCommands.js to use NODE_BRANCH_VERTICAL_SPACING
5. Ensure backward compatibility is maintained
6. Test the application to verify that:
   - Branch connections are drawn correctly
   - Nodes are positioned with appropriate spacing
   - Add buttons appear in the correct locations

## Testing Considerations

- Test the creation of new standard nodes
- Test the creation of new branch nodes (if/else, split flow)
- Test the rendering of branch connections
- Test the positioning of add node buttons
- Ensure consistent spacing across all types of node connections