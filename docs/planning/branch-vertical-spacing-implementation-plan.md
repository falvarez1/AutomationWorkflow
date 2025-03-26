# Branch Vertical Spacing Implementation Plan

## Problem Summary

There is a conflation of terminology and configuration with `BRANCH_VERTICAL_SPACING`, where in some cases it represents the distance that new nodes should render vertically, and in other cases, it represents where the edge line starts.

## Current Usage

From examining the codebase, we found:

1. In **constants.js**:
   - `BRANCH_VERTICAL_SPACING: 130` defined in `LAYOUT.NODE_PLACEMENT`
   - Exported as a standalone constant via `export const BRANCH_VERTICAL_SPACING = LAYOUT.NODE_PLACEMENT.BRANCH_VERTICAL_SPACING`

2. In **BranchUtils.js**:
   - Used to calculate branch connection endpoints: `return { x: startX - 65, y: startY + BRANCH_VERTICAL_SPACING }`
   - Primarily controlling where branch edge lines begin visually

3. In **AddNodeButtonRenderer.jsx**:
   - Set to 0 when calculating branch endpoints for buttons: `BRANCH_VERTICAL_SPACING: 0`
   - This shows it's being used for positioning rather than actual node spacing

4. In **GraphCommands.js**:
   - Hardcoded different value for actual node spacing: `this.nodeVerticalSpacing = 150`
   - Used for the actual positioning of nodes in the workflow

## Visual Representation

```
┌─────────────────────┐
│                     │
│    Parent Node      │
│                     │
└─────────────────────┘
           │
           │ BRANCH_VERTICAL_SPACING = 130px
           │ (Used for visual edge line)
           ▼
      ┌─────────┐
      │         │
   ┌──┴──┐   ┌──┴──┐
   │     │   │     │
   │ Yes │   │ No  │
   │     │   │     │
   └─────┘   └─────┘

↕️ Nodes positioned with nodeVerticalSpacing = 150px (hardcoded)
```

## Solution Approach

We will disambiguate by:

1. Renaming `BRANCH_VERTICAL_SPACING` to `BRANCH_EDGE_OFFSET` to clearly indicate its purpose
2. Adding a new `NODE_BRANCH_VERTICAL_SPACING` constant for node positioning
3. Maintaining backward compatibility

## Implementation Steps

### 1. Update constants.js

```javascript
// BEFORE
export const LAYOUT = {
  // ... other layout sections
  
  NODE_PLACEMENT: {
    STANDARD_VERTICAL_SPACING: 175,
    BRANCH_VERTICAL_SPACING: 130,  // Ambiguous purpose
    BRANCH_LEFT_OFFSET: -120,
    BRANCH_RIGHT_OFFSET: 120
  }
};

export const BRANCH_VERTICAL_SPACING = LAYOUT.NODE_PLACEMENT.BRANCH_VERTICAL_SPACING;
```

```javascript
// AFTER
export const LAYOUT = {
  // ... other layout sections
  
  NODE_PLACEMENT: {
    STANDARD_VERTICAL_SPACING: 175,
    NODE_BRANCH_VERTICAL_SPACING: 150,  // Clear: controls node position
    BRANCH_LEFT_OFFSET: -120,
    BRANCH_RIGHT_OFFSET: 120
  },
  
  EDGE: {
    INPUT_Y_OFFSET: 0,
    OUTPUT_Y_OFFSET: 0,
    BRANCH_EDGE_OFFSET: 130  // Clear: controls where edge lines start
  }
};

// Keep for backward compatibility
export const BRANCH_VERTICAL_SPACING = LAYOUT.EDGE.BRANCH_EDGE_OFFSET;

// New exports for clearer usage
export const BRANCH_EDGE_OFFSET = LAYOUT.EDGE.BRANCH_EDGE_OFFSET;
export const NODE_BRANCH_VERTICAL_SPACING = LAYOUT.NODE_PLACEMENT.NODE_BRANCH_VERTICAL_SPACING;
```

### 2. Update BranchUtils.js

```javascript
// BEFORE
getBranchEndpoint: (node, branchId, pluginRegistry, defaults= {}) => {
  const { 
    DEFAULT_NODE_WIDTH = LAYOUT.NODE.DEFAULT_WIDTH, 
    DEFAULT_NODE_HEIGHT = LAYOUT.NODE.DEFAULT_HEIGHT,
    BRANCH_VERTICAL_SPACING = 0
  } = defaults;

  // ...
  
  return { x: startX - 65, y: startY + BRANCH_VERTICAL_SPACING };
}
```

```javascript
// AFTER
getBranchEndpoint: (node, branchId, pluginRegistry, defaults= {}) => {
  const { 
    DEFAULT_NODE_WIDTH = LAYOUT.NODE.DEFAULT_WIDTH, 
    DEFAULT_NODE_HEIGHT = LAYOUT.NODE.DEFAULT_HEIGHT,
    BRANCH_EDGE_OFFSET = LAYOUT.EDGE.BRANCH_EDGE_OFFSET  // Updated parameter name
  } = defaults;

  // ...
  
  return { x: startX - 65, y: startY + BRANCH_EDGE_OFFSET };  // Updated usage
}
```

### 3. Update AddNodeButtonRenderer.jsx

```javascript
// BEFORE
const branchEndpoint = BranchUtils.getBranchEndpoint(node, branch.id, pluginRegistry, {
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
  BRANCH_VERTICAL_SPACING: 0
});
```

```javascript
// AFTER
const branchEndpoint = BranchUtils.getBranchEndpoint(node, branch.id, pluginRegistry, {
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
  BRANCH_EDGE_OFFSET: 0  // Updated parameter name
});
```

### 4. Update GraphCommands.js

```javascript
// BEFORE
constructor(graph, newNode, sourceNodeId = null, connectionType = 'default', branchId = null) {
  // ...
  this.nodeVerticalSpacing = 150; // Hardcoded vertical spacing between nodes
}
```

```javascript
// AFTER
constructor(graph, newNode, sourceNodeId = null, connectionType = 'default', branchId = null) {
  // ...
  this.nodeVerticalSpacing = LAYOUT.NODE_PLACEMENT.NODE_BRANCH_VERTICAL_SPACING; // Use constant
}
```

## Testing Plan

After implementation, we should test:

1. **Visualization Testing**:
   - Verify that branch edges are rendered correctly
   - Ensure vertical positioning of branch nodes is consistent
   - Test with both If/Else and Split Flow node types

2. **Functionality Testing**:
   - Create new branch nodes to ensure they're positioned correctly
   - Check that add node buttons appear in the right locations
   - Verify connection lines between nodes are drawn correctly

3. **Backward Compatibility**:
   - Test any components that might rely on the original BRANCH_VERTICAL_SPACING constant

## Expected Result After Implementation

```
┌─────────────────────┐
│                     │
│    Parent Node      │
│                     │
└─────────────────────┘
           │
           │ BRANCH_EDGE_OFFSET = 130px
           │ (Clearly indicates visual edge offset)
           ▼
      ┌─────────┐
      │         │
   ┌──┴──┐   ┌──┴──┐
   │     │   │     │
   │ Yes │   │ No  │
   │     │   │     │
   └─────┘   └─────┘

↕️ Nodes positioned with NODE_BRANCH_VERTICAL_SPACING = 150px
   (Clearly indicates node spacing)
```

This implementation will provide clear, unambiguous naming that correctly represents the purpose of each constant, making the code more maintainable and easier to understand.