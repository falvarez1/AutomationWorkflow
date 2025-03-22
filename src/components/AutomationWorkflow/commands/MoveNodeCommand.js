import { NodeCommand } from './NodeCommand';

/**
 * Command to move a node in the workflow
 */
export class MoveNodeCommand extends NodeCommand {
  /**
   * Create a new MoveNodeCommand
   * @param {Function} setWorkflowSteps - Function to update workflow steps
   * @param {Function} setSelectedNodeIndex - Function to update selected node index (optional)
   * @param {string} nodeId - ID of the node to move
   * @param {Object} oldPosition - Original position {x, y}
   * @param {Object} newPosition - New position {x, y}
   */
  constructor(setWorkflowSteps, setSelectedNodeIndex, nodeId, oldPosition, newPosition) {
    super(setWorkflowSteps, setSelectedNodeIndex, nodeId);
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