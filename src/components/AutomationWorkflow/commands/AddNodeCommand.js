import { Command } from './Command';

/**
 * Command to add a node to the workflow
 */
export class AddNodeCommand extends Command {
  /**
   * Create a new AddNodeCommand
   * @param {Array} workflowSteps - Current workflow steps array (used only for reference)
   * @param {Function} setWorkflowSteps - Function to update workflow steps
   * @param {Function} setSelectedNodeIndex - Function to update selected node index
   * @param {Function} setAnimatingNodes - Function to update animating nodes
   * @param {Object} newNode - The node to add
   * @param {number} insertIndex - Index where the node should be inserted
   * @param {Object} connectionsToUpdate - Object containing connections to update (if any)
   */
  constructor(
    workflowSteps,
    setWorkflowSteps,
    setSelectedNodeIndex,
    setAnimatingNodes,
    newNode,
    insertIndex,
    connectionsToUpdate = {}
  ) {
    super();
  
    this.setWorkflowSteps = setWorkflowSteps;
    this.setSelectedNodeIndex = setSelectedNodeIndex;
    this.setAnimatingNodes = setAnimatingNodes;
    this.newNode = { ...newNode };
    this.connectionsToUpdate = { ...connectionsToUpdate };
  
    // Minimal info for undoing the "push-down"
    this.nodeVerticalSpacing = 150;
    this.insertIndex = insertIndex;
  
    // Store the ID of the new node so we can remove it later
    this.newNodeId = newNode.id;
  
    // Track which nodes we are pushing down
    this.movedNodes = workflowSteps
      .slice(insertIndex) // nodes at or below insertIndex
      .map(step => ({
        id: step.id,
        oldY: step.position.y
      }));
  }
  

  /**
   * Execute the command to add the node
   */
  execute() {
    // Use functional update pattern to ensure we always work with the latest state
    this.setWorkflowSteps(currentSteps => {
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
      if (this.connectionsToUpdate.sourceNodeIndex !== undefined) {
        const { sourceNodeIndex, branchId, targetNodeId } = this.connectionsToUpdate;

        if (sourceNodeIndex >= 0 && sourceNodeIndex < updatedSteps.length) {
          const sourceNode = updatedSteps[sourceNodeIndex];

          // Create or update branch connections
          updatedSteps[sourceNodeIndex] = {
            ...sourceNode,
            branchConnections: {
              ...(sourceNode.branchConnections || {}),
              [branchId]: { targetNodeId }
            }
          };
        }
      }

      // Update any additional node positions if needed
      if (this.connectionsToUpdate.targetNodeIndex !== undefined) {
        const { targetNodeIndex, newPosition } = this.connectionsToUpdate;

        if (targetNodeIndex >= 0 && targetNodeIndex < updatedSteps.length) {
          updatedSteps[targetNodeIndex] = {
            ...updatedSteps[targetNodeIndex],
            position: { ...newPosition }
          };
        }
      }

      return updatedSteps;
    });

    // Use functional update to get the latest state for finding the index
    this.setWorkflowSteps(currentSteps => {
      // Update selected node to the new node
      const newNodeIndex = currentSteps.findIndex(step => step.id === this.newNode.id);
      if (newNodeIndex !== -1) {
        this.setSelectedNodeIndex(newNodeIndex);
      }
      return currentSteps; // Return unchanged
    });

    // Set animation state for new node
    this.setAnimatingNodes(prev => [...prev, this.newNode.id]);

    // Clear animation state after a delay
    setTimeout(() => {
      this.setAnimatingNodes(prev => prev.filter(id => id !== this.newNode.id));
    }, 300);

    return { success: true };
  }

  /**
   * Undo the addition by restoring the original workflow exactly as it was
   */
  undo() {
    this.setWorkflowSteps(currentSteps => {
      const updatedSteps = [...currentSteps];

      // 1) Remove the new node by ID
      const removeIndex = updatedSteps.findIndex(step => step.id === this.newNodeId);
      if (removeIndex !== -1) {
        updatedSteps.splice(removeIndex, 1);
      }

      // 2) Shift the nodes that were originally moved down back up
      //    We know which ones got moved from this.movedNodes
      //    We revert them to their original Y (or do a relative shift, your choice).
      this.movedNodes.forEach(mNode => {
        const idx = updatedSteps.findIndex(step => step.id === mNode.id);
        if (idx !== -1) {
          updatedSteps[idx] = {
            ...updatedSteps[idx],
            position: {
              ...updatedSteps[idx].position,
              y: mNode.oldY
            }
          };
        }
      });

      return updatedSteps;
    });

    return { success: true };
  }

}