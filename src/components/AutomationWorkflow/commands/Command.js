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