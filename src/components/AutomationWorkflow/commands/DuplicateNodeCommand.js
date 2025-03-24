import { Command } from './Command';

/**
 * Command to duplicate an existing node
 */
export class DuplicateNodeCommand extends Command {
  /**
   * @param {Graph} graph - The workflow graph
   * @param {string} nodeId - ID of the node to duplicate
   * @param {Function} generateUniqueId - Function to generate a new unique ID
   * @param {number} offsetX - X offset for the duplicated node position
   * @param {number} offsetY - Y offset for the duplicated node position
   */
  constructor(graph, nodeId, generateUniqueId, offsetX = 50, offsetY = 50) {
    super();
    this.graph = graph;
    this.nodeId = nodeId;
    this.generateUniqueId = generateUniqueId;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.newNodeId = null;
  }

  execute() {
    const sourceNode = this.graph.getNode(this.nodeId);
    if (!sourceNode) return false;

    // Create a new ID for the duplicated node
    this.newNodeId = this.generateUniqueId();

    // Create duplicated node with new ID and offset position
    const duplicatedNode = {
      ...sourceNode,
      id: this.newNodeId,
      position: {
        x: sourceNode.position.x + this.offsetX,
        y: sourceNode.position.y + this.offsetY
      },
      title: `${sourceNode.title} (Copy)`,
      isNew: true // Mark as new for animation
    };

    // Add the duplicated node to the graph
    const newGraph = this.graph.addNode(duplicatedNode);
    return newGraph;
  }

  undo() {
    if (!this.newNodeId) return false;
    
    // Remove the duplicated node
    const newGraph = this.graph.removeNode(this.newNodeId);
    return newGraph;
  }
}
