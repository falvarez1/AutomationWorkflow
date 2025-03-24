import { Command } from './Command';

/**
 * Command to update a node's height
 */
export class UpdateNodeHeightCommand extends Command {
  /**
   * @param {Graph} graph - The workflow graph
   * @param {string} nodeId - ID of the node to update
   * @param {number} newHeight - New height value
   */
  constructor(graph, nodeId, newHeight) {
    super();
    this.graph = graph;
    this.nodeId = nodeId;
    this.newHeight = newHeight;
    this.oldHeight = graph.getNode(nodeId)?.height;
  }

  execute() {
    const node = this.graph.getNode(this.nodeId);
    if (!node) return false;

    const updatedNode = {
      ...node,
      height: this.newHeight
    };

    const newGraph = this.graph.updateNode(this.nodeId, updatedNode);
    return newGraph;
  }

  undo() {
    const node = this.graph.getNode(this.nodeId);
    if (!node) return false;

    const updatedNode = {
      ...node,
      height: this.oldHeight
    };

    const newGraph = this.graph.updateNode(this.nodeId, updatedNode);
    return newGraph;
  }
}
