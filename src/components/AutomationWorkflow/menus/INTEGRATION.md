# Menu System Integration Guide

This document provides guidelines for integrating the refactored menu system with the AutomationWorkflow component.

## Overview

The new menu system uses an object-oriented design with clear separation of concerns:
- Core classes implement the menu behavior (Menu, MenuManager, etc.)
- Type-specific classes extend the core functionality (NodeTypeMenu, BranchMenu, etc.)
- React components provide the UI representation
- The MenuProvider context makes the system accessible throughout the component tree

## Integration Steps

### 1. Wrap AutomationWorkflow with MenuProvider

```jsx
// In App.js or parent component
import { MenuProvider } from './components/AutomationWorkflow/menus';

function App() {
  return (
    <div className="App">
      <MenuProvider>
        <AutomationWorkflow />
      </MenuProvider>
    </div>
  );
}
```

### 2. Initialize Menus in AutomationWorkflow

```jsx
// In AutomationWorkflow.jsx
import { useMenuSystem, NodeTypeMenu, NodeContextMenu, BranchMenu } from './menus';
import { menuFactory } from './menus/core/MenuFactory';

// Register menu types with the factory
menuFactory.registerMenuType('nodeType', NodeTypeMenu);
menuFactory.registerMenuType('nodeContext', NodeContextMenu);
menuFactory.registerMenuType('branch', BranchMenu);

const AutomationWorkflow = (props) => {
  const menuSystem = useMenuSystem();
  
  // Initialize menus in useEffect
  useEffect(() => {
    // Register node type menu
    menuSystem.registerMenu('nodeType', 'add-node-menu', {
      positioning: {
        type: 'bottom',
        options: { offsetY: 10 }
      }
    });
    
    // Register node context menu
    menuSystem.registerMenu('nodeContext', 'node-context-menu', {
      positioning: {
        type: 'right',
        options: { offsetX: 10 }
      }
    });
    
    // Register branch menu
    menuSystem.registerMenu('branch', 'branch-menu', {
      positioning: {
        type: 'branchEndpoint',
        options: { offsetY: 5 }
      }
    });
    
  }, [menuSystem]);
  
  // Other component logic
  // ...
};
```

### 3. Replace Direct Menu Handling with Menu System Calls

#### Before:

```jsx
const handleShowAddMenu = useCallback((nodeId, e, buttonRect) => {
  // Don't show menu if node doesn't exist
  if (!workflowGraph.getNode(nodeId)) return;
  
  // Toggle the active button - if this button is already active, close it
  setActiveAddButtonNodeId(prevId => prevId === nodeId ? null : nodeId);
  
  // If buttonRect is provided, update the menu anchor position
  if (buttonRect) {
    setMenuAnchorPosition(buttonRect);
  }
  
  // If opening, reset any active branch buttons
  if (activeAddButtonNodeId !== nodeId) {
    setActiveBranchButton(null);
    setBranchMenuAnchorPosition(null);
  }
  
  // Start the auto-hide timer when menu is opened
  if (nodeId !== null && nodeId !== activeAddButtonNodeId) {
    startMenuHideTimer();
  }
  
  e.stopPropagation();
}, [workflowGraph, activeAddButtonNodeId, startMenuHideTimer]);
```

#### After:

```jsx
const handleShowAddMenu = useCallback((nodeId, e, buttonRect) => {
  // Don't show menu if node doesn't exist
  if (!workflowGraph.getNode(nodeId)) return;
  
  const sourceNode = workflowGraph.getNode(nodeId);
  
  menuSystem.toggleMenu('add-node-menu', buttonRect, {
    sourceNodeId: nodeId,
    sourceNodeType: sourceNode.type,
    addNodeCallback: handleAddStep,
    hideOthers: true
  });
  
  e.stopPropagation();
}, [workflowGraph, menuSystem, handleAddStep]);
```

### 4. Update AddNodeButton to Work with the Menu System

```jsx
// In AddNodeButton.jsx
import { useMenuSystem } from '../menus';

const AddNodeButton = ({
  position,
  nodeWidth,
  buttonSize,
  onAdd,
  isHighlighted = false,
  showMenu = false,
  sourceNodeId = 'none',
  sourceType = 'standard'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef(null);
  const menuSystem = useMenuSystem();
  
  // Get button position and dimensions
  const getButtonRect = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
        nodeId: sourceNodeId
      };
    }
    return null;
  };
  
  const handleClick = (e) => {
    const buttonRect = getButtonRect();
    if (buttonRect) {
      menuSystem.toggleMenu('add-node-menu', buttonRect, {
        sourceNodeId,
        sourceNodeType: sourceType,
        connectionType: 'default',
        addNodeCallback: onAdd,
        hideOthers: true
      });
    }
    e.stopPropagation();
  };
  
  // Rest of the component logic
  // ...
};
```

### 5. Similar Updates for Branch Menus and Context Menus

Follow the same pattern to update branch menus and context menus, using the menu system instead of direct state management.

## Best Practices

1. **Use Menu System Commands** - Create commands for common actions:
   ```js
   const addNodeCommand = menuSystem.createCommand('addNode', {
     callback: handleAddStep,
     options: { nodeType: 'action' }
   });
   ```

2. **Centralize Menu Configuration** - Define menu configurations in a separate file:
   ```js
   // menuConfig.js
   export const MENU_CONFIGS = {
     nodeTypeMenu: {
       positioning: { type: 'bottom', options: { offsetY: 10 } },
       autoHide: true,
       autoHideTimeout: 2500
     },
     // other menu configurations...
   };
   ```

3. **Custom Positioning Strategies** - Create custom positioning strategies for specific requirements:
   ```js
   // Create and register a custom positioning strategy
   class EdgeBezierPositioningStrategy extends MenuPositioningStrategy {
     calculatePosition(menu, targetElement, data) {
       // Custom positioning logic
     }
   }
   ```

4. **Menu Registration Pattern** - Register menus when the component mounts and clean up when it unmounts:
   ```jsx
   useEffect(() => {
     // Register menus
     const menuIds = [];
     
     const nodeTypeMenuId = 'add-node-menu';
     menuSystem.registerMenu('nodeType', nodeTypeMenuId, config);
     menuIds.push(nodeTypeMenuId);
     
     // Clean up
     return () => {
       menuIds.forEach(id => menuSystem.hideMenu(id));
     };
   }, [menuSystem]);
   ```

## Benefits of the Refactored System

1. **Maintainability** - Clear separation of concerns makes the code easier to maintain
2. **Extensibility** - New menu types can be added by extending base classes
3. **Reusability** - Menu components can be reused across the application
4. **Testability** - Each piece can be tested in isolation
5. **Consistency** - Common behaviors like positioning and auto-hiding are centralized