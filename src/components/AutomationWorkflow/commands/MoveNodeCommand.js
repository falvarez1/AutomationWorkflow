import { Command } from './Command';

/**
 * Command to move a node in the workflow
 */
export class MoveNodeCommand extends Command {
  /**
   * Create a new MoveNodeCommand
   * @param {Array} workflowSteps - Current workflow steps array
   * @param {Function} setWorkflowSteps - Function to update workflow steps
   * @param {number} nodeId - ID of the node to move
   * @param {Object} oldPosition - Original position {x, y}
   * @param {Object} newPosition - New position {x, y}
   */
  constructor(workflowSteps, setWorkflowSteps, nodeId, oldPosition, newPosition) {
    super();
    // Don't store the entire workflow steps array, only what we need
    this.setWorkflowSteps = setWorkflowSteps;
    this.nodeId = nodeId;
    this.oldPosition = { ...oldPosition };
    this.newPosition = { ...newPosition };
  }

  /**
   * Execute the command to move the node to the new position
   */
  execute() {
    // Use functional update pattern to ensure we always work with the latest state
    this.setWorkflowSteps(currentSteps => {
      return currentSteps.map(step => {
        if (step.id === this.nodeId) {
          return {
            ...step,
            position: { ...this.newPosition }
          };
        }
        return step;
      });
    });
    
    return { success: true };
  }

  /**
   * Undo the move by restoring the original position
   */
  undo() {
    // Use functional update pattern to ensure we always work with the latest state
    this.setWorkflowSteps(currentSteps => {
      return currentSteps.map(step => {
        if (step.id === this.nodeId) {
          return {
            ...step,
            position: { ...this.oldPosition }
          };
        }
        return step;
      });
    });
    
    return { success: true };
  }
}