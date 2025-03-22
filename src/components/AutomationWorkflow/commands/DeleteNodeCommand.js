import { Command } from './Command';

/**
 * Command to delete a node from the workflow
 */
export class DeleteNodeCommand extends Command {
  /**
   * Create a new DeleteNodeCommand
   * @param {Array} workflowSteps - Current workflow steps array
   * @param {Function} setWorkflowSteps - Function to update workflow steps
   * @param {Function} setSelectedNodeIndex - Function to update selected node index
   * @param {number} nodeIndex - Index of the node to delete
   */
  constructor(workflowSteps, setWorkflowSteps, setSelectedNodeIndex, nodeIndex) {
    super();
    // Store only what we need, not the entire workflow
    this.setWorkflowSteps = setWorkflowSteps;
    this.setSelectedNodeIndex = setSelectedNodeIndex;
    this.nodeIndex = nodeIndex;
    
    // Store the deleted node (not the entire workflow)
    this.deletedNode = { ...workflowSteps[nodeIndex] };
    
    // Store node connections info for restoration
    this.connectionInfo = this.getNodeConnectionInfo(workflowSteps);
  }

  /**
   * Get information about node connections
   * @param {Array} workflowSteps - The current workflow steps array
   * @returns {Object} Connection information for restoration
   */
  getNodeConnectionInfo(workflowSteps) {
    // Store info about upstream and downstream connections
    const info = {
      incomingConnections: [],
      outgoingConnections: [],
      branchConnections: {}
    };

    // Find incoming connections to this node
    workflowSteps.forEach((step, index) => {
      // Check for branch connections pointing to this node
      if (step.branchConnections) {
        Object.entries(step.branchConnections).forEach(([branchId, connection]) => {
          if (connection.targetNodeId === this.deletedNode.id) {
            info.incomingConnections.push({
              sourceNodeIndex: index,
              sourceNodeId: step.id,
              branchId
            });
          }
        });
      }
    });

    // Store branch connections from this node
    if (this.deletedNode.branchConnections) {
      info.branchConnections = {...this.deletedNode.branchConnections};
    }

    return info;
  }

  /**
   * Execute the command to delete the node
   */
  execute() {
    // Get the current workflow state - don't use stored state
    this.setWorkflowSteps(currentWorkflowSteps => {
      // Create a copy of the current workflow steps
      const updatedSteps = [...currentWorkflowSteps];
      
      // Remove the node
      updatedSteps.splice(this.nodeIndex, 1);
      
      // Remove any branch connections pointing to this node
      const nodeId = this.deletedNode.id;
      updatedSteps.forEach(step => {
        if (step.branchConnections) {
          Object.entries(step.branchConnections).forEach(([branchId, connection]) => {
            if (connection.targetNodeId === nodeId) {
              // Remove this connection
              const newBranchConnections = {...step.branchConnections};
              delete newBranchConnections[branchId];
              step.branchConnections = newBranchConnections;
            }
          });
        }
      });
      
      return updatedSteps;
    });
    
    // Deselect the node
    this.setSelectedNodeIndex(null);
    
    return { success: true };
  }

  /**
   * Undo the deletion by restoring the node and its connections
   */
  undo() {
    // Get the current workflow state - don't use stored state
    this.setWorkflowSteps(currentWorkflowSteps => {
      // Create a copy of the current workflow steps
      const updatedSteps = [...currentWorkflowSteps];
      
      // Generate a completely new ID for the restored node to ensure
      // React reconciliation treats it as a completely new node
      const newNodeId = this.deletedNode.id; //`${this.deletedNode.id}_restored_${Date.now()}`;
      
      // Create a completely new node object with the new ID
      const restoredNode = {
        ...this.deletedNode,
        id: newNodeId,
        // Ensure any UI state flags are reset
        isNew: false,
        isAnimating: false,
        key: Date.now(), // Add a unique key for React
        _restoredAt: Date.now(), // Explicitly add this property for testing
        // Force position recalculation
        position: {
          ...this.deletedNode.position,
          _updated: Date.now()
        }
      };
      
      // Insert the restored node back at its original position
      updatedSteps.splice(this.nodeIndex, 0, restoredNode);
      
      // Map of old ID to new ID for updating connections
      const idMap = { [this.deletedNode.id]: newNodeId };
      
      // Update incoming connections to point to the new ID
      this.connectionInfo.incomingConnections.forEach(conn => {
        const sourceNodeIndex = updatedSteps.findIndex(step => step.id === conn.sourceNodeId);
        if (sourceNodeIndex >= 0 && updatedSteps[sourceNodeIndex].branchConnections) {
          // Clone the branch connections to avoid reference issues
          updatedSteps[sourceNodeIndex] = {
            ...updatedSteps[sourceNodeIndex],
            branchConnections: {
              ...updatedSteps[sourceNodeIndex].branchConnections,
              [conn.branchId]: { targetNodeId: newNodeId }
            }
          };
        }
      });
      
      // Restore branch connections from this node if any, updating any target IDs that might refer to the old node ID
      if (Object.keys(this.connectionInfo.branchConnections).length > 0) {
        const updatedBranchConnections = {};
        
        // Update any target IDs that might be the same as the deleted node's ID
        Object.entries(this.connectionInfo.branchConnections).forEach(([branchId, connection]) => {
          const targetId = connection.targetNodeId;
          updatedBranchConnections[branchId] = {
            targetNodeId: idMap[targetId] || targetId
          };
        });
        
        updatedSteps[this.nodeIndex].branchConnections = updatedBranchConnections;
      }
      
      return updatedSteps;
    });
    
    // Select the restored node
    this.setSelectedNodeIndex(this.nodeIndex);
    
    return { success: true };
  }
}