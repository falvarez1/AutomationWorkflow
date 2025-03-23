# Command Pattern Refactoring - Implementation Plan

## Overview

The current Command Pattern implementation in the Automation Workflow codebase shows significant code duplication across different command classes. This plan outlines a comprehensive approach to refactor the command architecture to improve code reuse and maintainability.

## Current Issues

After analyzing the code, we've identified these key issues:

1. Each command duplicates workflow state management logic
2. Common operations like finding nodes by ID are reimplemented
3. `setWorkflowSteps` with functional updates is duplicated
4. State cloning and manipulation follows similar patterns
5. Node selection logic is duplicated across commands

## Implementation Plan

### 1. Enhance the Base Command Class

First, we'll enhance the base `Command` class with shared functionality that all commands can use:

```javascript
// src/components/AutomationWorkflow/commands/Command.js
/**
 * Base Command interface to implement the Command Pattern
 * All commands should extend this base class and implement execute() and undo() methods
 */
export class Command {
  /**
   * Create a new Command
   * @param {Function} setWorkflowSteps - Function to update workflow steps
   */
  constructor(setWorkflowSteps) {
    this.setWorkflowSteps = setWorkflowSteps;
  }

  /**
   * Execute the command and return the result
   * @returns {any} The result of executing the command
   */
  execute() {
    throw new Error('Method execute() must be implemented by derived classes');
  }

  /**
   * Undo the command and return to the previous state
   * @returns {any} The result of undoing the command
   */
  undo() {
    throw new Error('Method undo() must be implemented by derived classes');
  }

  /**
   * Helper method for updating workflow with functional update pattern
   * @param {Function} updater - Function to update workflow steps
   * @returns {Array} Updated workflow steps
   */
  _updateWorkflow(updater) {
    let result;
    this.setWorkflowSteps(currentSteps => {
      result = updater(currentSteps);
      return result;
    });
    return result;
  }

  /**
   * Find a node in the workflow by ID
   * @param {Array} steps - The workflow steps array
   * @param {string} nodeId - The ID of the node to find
   * @returns {Object} The found node and its index, or null if not found
   */
  _findNodeById(steps, nodeId) {
    const index = steps.findIndex(step => step.id === nodeId);
    if (index === -1) return { node: null, index: -1 };
    return { node: steps[index], index };
  }

  /**
   * Create a deep copy of a node
   * @param {Object} node - The node to copy
   * @returns {Object} A deep copy of the node
   */
  _createNodeCopy(node) {
    return JSON.parse(JSON.stringify(node));
  }

  /**
   * Update a specific node in the workflow by its ID
   * @param {Array} steps - Current workflow steps
   * @param {string} nodeId - ID of the node to update
   * @param {Function} updater - Function to update the node
   * @returns {Array} Updated workflow steps
   */
  _updateNodeById(steps, nodeId, updater) {
    return steps.map(step => {
      if (step.id === nodeId) {
        return updater(step);
      }
      return step;
    });
  }
}
```

### 2. Create an Intermediate NodeCommand Class

Next, we'll create a `NodeCommand` class that extends `Command` and adds node-specific functionality:

```javascript
// src/components/AutomationWorkflow/commands/NodeCommand.js
import { Command } from './Command';

/**
 * Base class for commands that operate on specific nodes
 * Extends Command with node-specific functionality
 */
export class NodeCommand extends Command {
  /**
   * Create a new NodeCommand
   * @param {Function} setWorkflowSteps - Function to update workflow steps
   * @param {Function} setSelectedNodeIndex - Function to update selected node index
   * @param {string} nodeId - ID of the node
   */
  constructor(setWorkflowSteps, setSelectedNodeIndex, nodeId) {
    super(setWorkflowSteps);
    this.setSelectedNodeIndex = setSelectedNodeIndex;
    this.nodeId = nodeId;
  }
  
  /**
   * Get the index of the node in the workflow
   * @param {Array} steps - The workflow steps array
   * @returns {number} The index of the node, or -1 if not found
   */
  _getNodeIndex(steps) {
    return steps.findIndex(step => step.id === this.nodeId);
  }
  
  /**
   * Select a node by its index
   * @param {number} index - The index of the node to select
   */
  _selectNode(index) {
    if (this.setSelectedNodeIndex) {
      this.setSelectedNodeIndex(index);
    }
  }
  
  /**
   * Deselect the currently selected node
   */
  _deselectNode() {
    if (this.setSelectedNodeIndex) {
      this.setSelectedNodeIndex(null);
    }
  }

  /**
   * Select the node associated with this command
   * @param {Array} steps - The workflow steps array
   */
  _selectThisNode(steps) {
    const index = this._getNodeIndex(steps);
    if (index !== -1) {
      this._selectNode(index);
    }
  }
}
```

### 3. Refactor MoveNodeCommand

```javascript
// src/components/AutomationWorkflow/commands/MoveNodeCommand.js
import { NodeCommand } from './NodeCommand';

/**
 * Command to move a node in the workflow
 */
export class MoveNodeCommand extends NodeCommand {
  /**
   * Create a new MoveNodeCommand
   * @param {Function} setWorkflowSteps - Function to update workflow steps
   * @param {string} nodeId - ID of the node to move
   * @param {Object} oldPosition - Original position {x, y}
   * @param {Object} newPosition - New position {x, y}
   */
  constructor(setWorkflowSteps, nodeId, oldPosition, newPosition) {
    super(setWorkflowSteps, null, nodeId);
    this.oldPosition = { ...oldPosition };
    this.newPosition = { ...newPosition };
  }

  /**
   * Execute the command to move the node to the new position
   */
  execute() {
    this._updateWorkflow(currentSteps => {
      return this._updateNodeById(currentSteps, this.nodeId, (node) => ({
        ...node,
        position: { ...this.newPosition }
      }));
    });
    
    return { success: true };
  }

  /**
   * Undo the move by restoring the original position
   */
  undo() {
    this._updateWorkflow(currentSteps => {
      return this._updateNodeById(currentSteps, this.nodeId, (node) => ({
        ...node,
        position: { ...this.oldPosition }
      }));
    });
    
    return { success: true };
  }
}
```

### 4. Refactor AddNodeCommand

```javascript
// src/components/AutomationWorkflow/commands/AddNodeCommand.js
import { NodeCommand } from './NodeCommand';

/**
 * Command to add a node to the workflow
 */
export class AddNodeCommand extends NodeCommand {
  /**
   * Create a new AddNodeCommand
   * @param {Function} setWorkflowSteps - Function to update workflow steps
   * @param {Function} setSelectedNodeIndex - Function to update selected node index
   * @param {Function} setAnimatingNodes - Function to update animating nodes
   * @param {Object} newNode - The node to add
   * @param {number} insertIndex - Index where the node should be inserted
   * @param {Object} connectionsToUpdate - Object containing connections to update (if any)
   */
  constructor(
    setWorkflowSteps,
    setSelectedNodeIndex,
    setAnimatingNodes,
    newNode,
    insertIndex,
    connectionsToUpdate = {}
  ) {
    super(setWorkflowSteps, setSelectedNodeIndex, newNode.id);
    
    this.setAnimatingNodes = setAnimatingNodes;
    this.newNode = this._createNodeCopy(newNode);
    this.connectionsToUpdate = { ...connectionsToUpdate };
    this.nodeVerticalSpacing = 150;
    this.insertIndex = insertIndex;
    
    // We'll initialize this later in execute() to capture the current state
    this.movedNodes = [];
  }

  /**
   * Execute the command to add the node
   */
  execute() {
    // Add node and update positions
    this._updateWorkflow(currentSteps => {
      // Store the nodes we're moving for undo
      if (this.movedNodes.length === 0) {
        this.movedNodes = currentSteps
          .slice(this.insertIndex)
          .map(step => ({
            id: step.id,
            oldY: step.position.y
          }));
      }

      // Create a copy of the current workflow steps
      const updatedSteps = [...currentSteps];

      // Add the new node at the specified index
      updatedSteps.splice(this.insertIndex, 0, this.newNode);

      // Move all nodes below the insertion point down
      for (let i = this.insertIndex + 1; i < updatedSteps.length; i++) {
        const step = updatedSteps[i];
        updatedSteps[i] = {
          ...step,
          position: {
            ...step.position,
            y: step.position.y + this.nodeVerticalSpacing
          }
        };
      }

      // Update connections if needed
      this._updateConnections(updatedSteps);

      return updatedSteps;
    });

    // Select the newly added node
    this._updateWorkflow(currentSteps => {
      this._selectThisNode(currentSteps);
      return currentSteps; // Return unchanged
    });

    // Handle animations
    this._handleAnimation();

    return { success: true };
  }

  /**
   * Undo the addition by removing the node and restoring positions
   */
  undo() {
    this._updateWorkflow(currentSteps => {
      const updatedSteps = [...currentSteps];

      // Remove the new node by ID
      const removeIndex = this._getNodeIndex(updatedSteps);
      if (removeIndex !== -1) {
        updatedSteps.splice(removeIndex, 1);
      }

      // Restore original positions
      this._restorePositions(updatedSteps);

      return updatedSteps;
    });

    return { success: true };
  }

  /**
   * Update connections between nodes
   * @param {Array} steps - The workflow steps array
   * @returns {Array} Updated workflow steps
   * @private
   */
  _updateConnections(steps) {
    if (this.connectionsToUpdate.sourceNodeIndex !== undefined) {
      const { sourceNodeIndex, branchId, targetNodeId } = this.connectionsToUpdate;

      if (sourceNodeIndex >= 0 && sourceNodeIndex < steps.length) {
        const sourceNode = steps[sourceNodeIndex];

        // Create or update branch connections
        steps[sourceNodeIndex] = {
          ...sourceNode,
          branchConnections: {
            ...(sourceNode.branchConnections || {}),
            [branchId]: { targetNodeId }
          }
        };
      }
    }

    if (this.connectionsToUpdate.targetNodeIndex !== undefined) {
      const { targetNodeIndex, newPosition } = this.connectionsToUpdate;

      if (targetNodeIndex >= 0 && targetNodeIndex < steps.length) {
        steps[targetNodeIndex] = {
          ...steps[targetNodeIndex],
          position: { ...newPosition }
        };
      }
    }

    return steps;
  }

  /**
   * Restore node positions to their original values
   * @param {Array} steps - The workflow steps array
   * @returns {Array} Updated workflow steps
   * @private
   */
  _restorePositions(steps) {
    this.movedNodes.forEach(mNode => {
      const idx = steps.findIndex(step => step.id === mNode.id);
      if (idx !== -1) {
        steps[idx] = {
          ...steps[idx],
          position: {
            ...steps[idx].position,
            y: mNode.oldY
          }
        };
      }
    });
    return steps;
  }

  /**
   * Handle node animation effects
   * @private
   */
  _handleAnimation() {
    // Set animation state for new node
    this.setAnimatingNodes(prev => [...prev, this.nodeId]);

    // Clear animation state after a delay
    setTimeout(() => {
      this.setAnimatingNodes(prev => 
        prev.filter(id => id !== this.nodeId)
      );
    }, 300);
  }
}
```

### 5. Update Command Usage in Components

Finally, we need to update how commands are created and used in the components:

```javascript
// Example of creating a MoveNodeCommand in a component
const handleMoveNode = (nodeId, oldPosition, newPosition) => {
  const moveCommand = new MoveNodeCommand(
    setWorkflowSteps,
    nodeId, 
    oldPosition, 
    newPosition
  );
  commandManager.executeCommand(moveCommand);
};

// Example of creating an AddNodeCommand in a component
const handleAddNode = (newNode, insertIndex, connectionsToUpdate) => {
  const addCommand = new AddNodeCommand(
    setWorkflowSteps,
    setSelectedNodeIndex,
    setAnimatingNodes, 
    newNode, 
    insertIndex, 
    connectionsToUpdate
  );
  commandManager.executeCommand(addCommand);
};
```

## Implementation Order

To implement these changes effectively, we should follow this sequence:

1. Update the base `Command` class with the enhanced functionality
2. Create the new `NodeCommand` class
3. Refactor the `MoveNodeCommand` (simpler implementation)
4. Test that the `MoveNodeCommand` works correctly
5. Refactor the `AddNodeCommand` (more complex implementation)
6. Test that the `AddNodeCommand` works correctly
7. Refactor any additional command classes
8. Update component code that creates and uses commands

## Testing Strategy

For each part of the implementation, we should:

1. Verify that existing functionality works as expected
2. Test edge cases (e.g., empty workflow, invalid node IDs)
3. Ensure that undo/redo operations restore the state correctly
4. Check that animations and selection behavior remain unchanged

## Expected Benefits

This refactoring will provide several key benefits:

1. **Code Reuse**: Common functionality is now defined once in the base classes
2. **Maintainability**: Changes to core behavior only need to be made in one place
3. **Readability**: Individual command classes focus on their specific responsibilities
4. **Extensibility**: Creating new command types is simpler and more consistent
5. **Reliability**: Centralized logic reduces the risk of bugs and inconsistencies
6. **Testing**: Smaller, more focused responsibilities are easier to test