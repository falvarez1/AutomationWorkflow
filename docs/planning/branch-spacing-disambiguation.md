# Branch Spacing Disambiguation

## Current Issue Visualized

```
┌───────────────────────┐
│                       │
│    Parent Node        │
│                       │
└───────────────────────┘
           │
           │ BRANCH_VERTICAL_SPACING (130px)
           │ (Used for edge line starting point)
           ▼
      ┌─────────┐
      │         │
   ┌──┴──┐   ┌──┴──┐
   │     │   │     │
   │ Yes │   │ No  │
   │     │   │     │
   └─────┘   └─────┘

   Branch nodes positioned with hardcoded spacing (150px in AddNodeCommand)
```

In the current implementation, there's a confusion between:
- Where branch connection lines start (BRANCH_VERTICAL_SPACING = 130px)
- How far to position branch nodes vertically (hardcoded 150px)

## Solution Visualized

```
┌───────────────────────┐
│                       │
│    Parent Node        │
│                       │
└───────────────────────┘
           │
           │ BRANCH_EDGE_OFFSET (130px)
           │ (Clearly indicates the visual edge offset)
           ▼
      ┌─────────┐
      │         │
   ┌──┴──┐   ┌──┴──┐
   │     │   │     │
   │ Yes │   │ No  │
   │     │   │     │
   └─────┘   └─────┘

   Branch nodes positioned with NODE_BRANCH_VERTICAL_SPACING (150px)
   (Clearly indicates the node positioning)
```

By separating these concepts with distinct names:
- BRANCH_EDGE_OFFSET: Controls where the connection lines visually start 
- NODE_BRANCH_VERTICAL_SPACING: Controls the actual vertical positioning of nodes

## Implementation Details

### 1. Update constants.js

```javascript
// Before:
export const LAYOUT = {
  // ... other layout sections
  
  // Node placement configuration
  NODE_PLACEMENT: {
    // Standard connection spacing when adding new nodes
    STANDARD_VERTICAL_SPACING: 175,
    
    // Branch connection spacing
    BRANCH_VERTICAL_SPACING: 130,
    BRANCH_LEFT_OFFSET: -120,
    BRANCH_RIGHT_OFFSET: 120
  }
};

export const BRANCH_VERTICAL_SPACING = LAYOUT.NODE_PLACEMENT.BRANCH_VERTICAL_SPACING;
```

```javascript
// After:
export const LAYOUT = {
  // ... other layout sections
  
  // Node placement configuration
  NODE_PLACEMENT: {
    // Standard connection spacing when adding new nodes
    STANDARD_VERTICAL_SPACING: 175,
    
    // Vertical spacing between nodes in branch paths
    NODE_BRANCH_VERTICAL_SPACING: 150,
    
    // Horizontal offsets for branch nodes
    BRANCH_LEFT_OFFSET: -120,
    BRANCH_RIGHT_OFFSET: 120
  },
  
  // Edge connection positioning
  EDGE: {
    INPUT_Y_OFFSET: 0,  // Offset for input edge connections (top of node)
    OUTPUT_Y_OFFSET: 0, // Offset for output edge connections (bottom of node)
    
    // Where branch connection lines visually start from a node
    BRANCH_EDGE_OFFSET: 130
  }
};

// For backward compatibility, though deprecated - new code should use BRANCH_EDGE_OFFSET
export const BRANCH_VERTICAL_SPACING = LAYOUT.EDGE.BRANCH_EDGE_OFFSET;
export const BRANCH_EDGE_OFFSET = LAYOUT.EDGE.BRANCH_EDGE_OFFSET;
export const NODE_BRANCH_VERTICAL_SPACING = LAYOUT.NODE_PLACEMENT.NODE_BRANCH_VERTICAL_SPACING;
```

### 2. Update BranchUtils.js

```javascript
// Before:
getBranchEndpoint: (node, branchId, pluginRegistry, defaults= {}) => {
  const { 
    DEFAULT_NODE_WIDTH = LAYOUT.NODE.DEFAULT_WIDTH, 
    DEFAULT_NODE_HEIGHT = LAYOUT.NODE.DEFAULT_HEIGHT,
    BRANCH_VERTICAL_SPACING = 0
  } = defaults;

  // ...
  
  if (node.type === NODE_TYPES.IFELSE) {
    if (branchId === 'yes') {
      return { x: startX - 65, y: startY + BRANCH_VERTICAL_SPACING };
    } else if (branchId === 'no') {
      return { x: startX + 65, y: startY + BRANCH_VERTICAL_SPACING };
    } else {
      // Return null for invalid branch IDs
      return null;
    }
  } else if (node.type === NODE_TYPES.SPLITFLOW) {
    // ... logic for split flow
    return { x: startX + xOffset, y: startY + BRANCH_VERTICAL_SPACING };
  }
  
  // Default return for other node types
  return { x: startX, y: startY + BRANCH_VERTICAL_SPACING };
}
```

```javascript
// After:
getBranchEndpoint: (node, branchId, pluginRegistry, defaults= {}) => {
  const { 
    DEFAULT_NODE_WIDTH = LAYOUT.NODE.DEFAULT_WIDTH, 
    DEFAULT_NODE_HEIGHT = LAYOUT.NODE.DEFAULT_HEIGHT,
    BRANCH_EDGE_OFFSET = LAYOUT.EDGE.BRANCH_EDGE_OFFSET
  } = defaults;

  // ...
  
  if (node.type === NODE_TYPES.IFELSE) {
    if (branchId === 'yes') {
      return { x: startX - 65, y: startY + BRANCH_EDGE_OFFSET };
    } else if (branchId === 'no') {
      return { x: startX + 65, y: startY + BRANCH_EDGE_OFFSET };
    } else {
      // Return null for invalid branch IDs
      return null;
    }
  } else if (node.type === NODE_TYPES.SPLITFLOW) {
    // ... logic for split flow
    return { x: startX + xOffset, y: startY + BRANCH_EDGE_OFFSET };
  }
  
  // Default return for other node types
  return { x: startX, y: startY + BRANCH_EDGE_OFFSET };
}
```

### 3. Update AddNodeButtonRenderer.jsx

```javascript
// Before:
const branchEndpoint = BranchUtils.getBranchEndpoint(node, branch.id, pluginRegistry, {
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
  BRANCH_VERTICAL_SPACING: 0
});
```

```javascript
// After:
const branchEndpoint = BranchUtils.getBranchEndpoint(node, branch.id, pluginRegistry, {
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
  BRANCH_EDGE_OFFSET: 0
});
```

### 4. Update GraphCommands.js

```javascript
// Before:
constructor(graph, newNode, sourceNodeId = null, connectionType = 'default', branchId = null) {
  // ...
  this.nodeVerticalSpacing = 150; // Vertical spacing between nodes
  // ...
}
```

```javascript
// After:
constructor(graph, newNode, sourceNodeId = null, connectionType = 'default', branchId = null) {
  // ...
  this.nodeVerticalSpacing = LAYOUT.NODE_PLACEMENT.NODE_BRANCH_VERTICAL_SPACING;
  // ...
}
```

## Benefits of this Approach

1. **Clarity**: Each constant now has a clear, single responsibility
2. **Maintainability**: Future developers can easily understand and modify the correct value
3. **Consistency**: Using constants throughout the codebase ensures consistent spacing
4. **Backward Compatibility**: Keeping the original BRANCH_VERTICAL_SPACING as a reference to the new constant ensures no breaking changes

## Implementation Steps

1. Make the changes to constants.js first
2. Update BranchUtils.js to use the new terminology
3. Update AddNodeButtonRenderer.jsx
4. Update GraphCommands.js
5. Test thoroughly to ensure all node positioning and edge rendering works correctly