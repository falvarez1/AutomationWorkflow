# AutomationWorkflow.jsx Refactoring Plan

This document outlines the anti-patterns, code issues, and specific fixes for the AutomationWorkflow.jsx component.

## Issues Identified

1. **Unused imports and variables**: Multiple unused imports and state variables
2. **React Hook dependency issues**: Improper useCallback dependencies
3. **Console.log statements**: Debug statements left in production code
4. **Duplicate logic**: ConnectorLine component is defined but unused
5. **Magic numbers**: Hardcoded values that should be constants
6. **Direct DOM manipulation**: Using document.querySelector instead of refs
7. **Redundant state management**: State variables that aren't needed

## 1. Fixing Unused Imports

```jsx
// BEFORE
import {
  ArrowLeft,
  Pause,
  Edit2,
  Play,
  MoreHorizontal,
  Send,
  Clock,
  User,
  Award,
  ThumbsUp,
  CheckCircle,
  Plus,
  ChevronRight,
  Hexagon,
  Zap,
  ZoomIn,
  ZoomOut,
  Maximize,
  Move
} from 'lucide-react';

// AFTER
import {
  ArrowLeft,
  Edit2,
  Send,
  Plus,
  ChevronRight,
  Hexagon,
  Zap,
  ZoomIn,
  ZoomOut,
  Maximize,
  Move
} from 'lucide-react';
```

## 2. Fixing Unused Variables

```jsx
// BEFORE - WorkflowStep component
const [nodeHeight, setNodeHeight] = useState(90); // Default height
const [contextMenuConfig, setContextMenuConfig] = useState(propContextMenuConfig || {
  position: 'right', // default position - now on the right
  offsetX: 10,
  offsetY: 0
});

// AFTER - WorkflowStep component
const [, setNodeHeight] = useState(90); // Only setNodeHeight is used
const [contextMenuConfig] = useState(propContextMenuConfig || {
  position: 'right', // default position - now on the right
  offsetX: 10,
  offsetY: 0
});

// BEFORE - NodeContextMenu component
const getMenuStyles = () => {
  const nodeWidth = 300; // This is unused
  // ...rest of the function
};

// AFTER - NodeContextMenu component
const getMenuStyles = () => {
  // Remove unused nodeWidth constant
  // ...rest of the function
};

// BEFORE - AutomationWorkflow component
// Unused state variables and functions
const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
const [highlightedConnection, setHighlightedConnection] = useState(null);

// Unused adjustment functions
const adjustButtonOffset = (newOffset) => {
  setButtonYOffset(newOffset);
};

const adjustEdgeInputOffset = (newOffset) => {
  setEdgeInputOffset(newOffset);
};

const adjustEdgeOutputOffset = (newOffset) => {
  setEdgeOutputOffset(newOffset);
};

// AFTER - AutomationWorkflow component
// Remove unused state variables and adjustment functions completely
```

## 3. Fixing useCallback Dependency Issue

```jsx
// BEFORE
const handleAddNodeFromButton = (index, nodeType) => {
  handleAddStep(index, nodeType);
};

const renderMenuPortal = useCallback(() => {
  // Component logic...
}, [activeAddButtonIndex, workflowSteps, buttonYOffset, transform, NODE_WIDTH, handleMenuMouseEnter, handleMenuMouseLeave, handleAddNodeFromButton]);

// AFTER
const handleAddNodeFromButton = useCallback((index, nodeType) => {
  handleAddStep(index, nodeType);
}, [handleAddStep]);

const renderMenuPortal = useCallback(() => {
  // Component logic...
}, [activeAddButtonIndex, workflowSteps, buttonYOffset, transform, NODE_WIDTH, handleMenuMouseEnter, handleMenuMouseLeave, handleAddNodeFromButton]);
```

## 4. Removing Console.log Statements

```jsx
// BEFORE
const handleContextMenuAction = (actionId) => {
  console.log(`Action ${actionId} triggered for node ${id}`);
  // Pass the action up to parent component if needed
  if (onClick) {
    onClick(id, actionId);
  }
};

// AFTER
const handleContextMenuAction = (actionId) => {
  // Pass the action up to parent component if needed
  if (onClick) {
    onClick(id, actionId);
  }
};

// Other console.log statements to remove:
// In AutomationWorkflow component:
// Line 631: console.log('Starting menu hide timer...');
// Line 634: console.log('Hiding menu due to inactivity...');
// Line 668: console.log('Mouse left menu or button');
// Line 675: console.log('useEffect for click outside triggered');
// Line 712: console.log('useEffect for menu hide timer triggered');
// Line 965: console.log(`Editing step ${id}`);
// Line 1065: console.log('Rendering menu portal...');
```

## 5. Fixing ConnectorLine Component Usage

The `ConnectorLine` component is defined but never used, while similar logic is duplicated in the draw connector lines section. Two options:

### Option 1: Remove Unused Component
```jsx
// Remove the entire ConnectorLine component (lines 374-407)
```

### Option 2: Use the ConnectorLine Component
```jsx
// Replace the path implementation in workflowSteps.map (around line 1270)
// BEFORE
<path
  key={`connector-${step.id}-${workflowSteps[index + 1].id}`}
  d={(() => {
    // ... calculation code
  })()}
  style={{
    stroke: (index === selectedNodeIndex || index + 1 === selectedNodeIndex ||
        index === highlightedConnection) ? '#3B82F6' : '#D1D5DB',
    strokeWidth: (index === selectedNodeIndex || index + 1 === selectedNodeIndex ||
        index === highlightedConnection) ? 3 : 2,
    fill: 'none',
    strokeDasharray: (index === selectedNodeIndex || index + 1 === selectedNodeIndex ||
        index === highlightedConnection) ? '5,5' : 'none'
  }}
/>

// AFTER
<ConnectorLine
  key={`connector-${step.id}-${workflowSteps[index + 1].id}`}
  startPos={{
    x: step.position.x,
    y: step.position.y + (step.height || 90)
  }}
  endPos={{
    x: workflowSteps[index + 1].position.x,
    y: workflowSteps[index + 1].position.y
  }}
  isHighlighted={index === selectedNodeIndex || index + 1 === selectedNodeIndex || 
                 index === highlightedConnection}
/>
```

## 6. Extract Magic Numbers as Constants

```jsx
// Add these at the top of the file or in a separate constants.js file
const DEFAULT_NODE_HEIGHT = 90;
const DEFAULT_NODE_WIDTH = 300;
const GRID_SIZE = 20;
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 2;
const AUTO_HIDE_TIMEOUT = 2500; // 2.5 seconds

// Then use these constants throughout the code, for example:
// BEFORE
const newY = Math.round(newY / 20) * 20;
// AFTER
const newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
```

## 7. Other Improvements

### Using Proper Refs Instead of Direct DOM Queries

```jsx
// BEFORE
const headerEl = document.querySelector('.app-header');
const headerHeight = headerEl ? headerEl.offsetHeight : 0;

// AFTER
// Add a ref at the component level
const headerRef = useRef(null);

// Then use the ref instead
const headerHeight = headerRef.current ? headerRef.current.offsetHeight : 0;

// And make sure to add the ref to the header element
<header ref={headerRef} className="app-header flex items-center justify-between p-4 bg-white border-b">
```

### Optimizing the AddNodeButton Component

```jsx
// BEFORE - has unused state
const [isMenuHovered, setIsMenuHovered] = useState(false);

// useEffect depends on isMenuHovered but doesn't properly use it
useEffect(() => {
  if (isMenuHovered) {
    onMouseEnter?.();
  } else {
    onMouseLeave?.();
  }
}, [isMenuHovered, onMouseEnter, onMouseLeave]);

// AFTER - simplify the component by removing unused state
// Remove isMenuHovered state and useEffect, handle directly in event handlers
const handleMouseEnter = () => {
  setIsHovered(true);
  onMouseEnter?.();
};

const handleMouseLeave = () => {
  setIsHovered(false); 
  onMouseLeave?.();
};

// Then update the JSX
onMouseEnter={handleMouseEnter}
onMouseLeave={handleMouseLeave}
```

### Improving useEffect Dependencies

```jsx
// BEFORE - missing dependencies
useEffect(() => {
  // Effect using 'transform' but not listed in dependencies
}, [isPanning, startPanPos]);

// AFTER - complete dependencies
useEffect(() => {
  // Same effect code
}, [isPanning, startPanPos, transform]);
```

### Simplify handleMenuMouseLeave

```jsx
// BEFORE
const handleMenuMouseLeave = useCallback(() => {
  console.log('Mouse left menu or button');
  setIsMouseOverMenuOrButton(false);
  //startMenuHideTimer(); // Commented out but left in code
}, []);

// AFTER
const handleMenuMouseLeave = useCallback(() => {
  setIsMouseOverMenuOrButton(false);
}, []);
```

## Implementation Strategy

1. **First Phase**: Address ESLint warnings and basic cleanup
   - Remove unused imports
   - Fix unused variables 
   - Fix useCallback dependencies
   - Remove console.log statements

2. **Second Phase**: Optimize component performance
   - Memoize functions with proper dependencies
   - Fix useEffect dependency arrays
   - Use ConnectorLine component consistently

3. **Third Phase**: Architecture improvements
   - Extract constants
   - Consider splitting the component into smaller components in separate files
   - Create custom hooks for related functionality

## Next Steps: Component Architecture Restructuring

For a more significant refactoring, the component could be broken down into:

```
AutomationWorkflow/
├── index.jsx              // Main entry point
├── components/
│   ├── WorkflowStep/      // Extracted component
│   ├── NodeContextMenu/   // Extracted component
│   ├── AddNodeButton/     // Extracted component
│   ├── ConnectorLine/     // Extracted and reused component
│   └── NodePropertiesPanel/
├── hooks/
│   ├── useWorkflowNodes.js    // Node state management
│   ├── useCanvasInteraction.js // Pan and zoom
│   └── useMenuManagement.js   // Context menu logic
└── constants.js           // Extracted magic numbers
```

After implementing these fixes, the code will be more maintainable, have better performance, and follow React best practices.