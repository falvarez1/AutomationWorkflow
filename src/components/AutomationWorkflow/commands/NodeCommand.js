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