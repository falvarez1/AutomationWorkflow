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
   * @param {Array} workflowSteps - Current workflow steps array (for capturing moved nodes)
   */
  constructor(
    setWorkflowSteps,
    setSelectedNodeIndex,
    setAnimatingNodes,
    newNode,
    insertIndex,
    connectionsToUpdate = {},
    workflowSteps = []
  ) {
    super(setWorkflowSteps, setSelectedNodeIndex, newNode.id);
    
    this.setAnimatingNodes = setAnimatingNodes;
    this.newNode = this._createNodeCopy(newNode);
    this.connectionsToUpdate = { ...connectionsToUpdate };
    this.nodeVerticalSpacing = 150;
    this.insertIndex = insertIndex;
    
    // Track which nodes we are pushing down (if workflowSteps were provided)
    this.movedNodes = workflowSteps.length > 0
      ? workflowSteps
          .slice(insertIndex)
          .map(step => ({
            id: step.id,
            oldY: step.position.y
          }))
      : [];
  }

  /**
   * Execute the command to add the node
   */
  execute() {
    // Add node and update positions
    this._updateWorkflow(currentSteps => {
      // Store the nodes we're moving for undo if we haven't already
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