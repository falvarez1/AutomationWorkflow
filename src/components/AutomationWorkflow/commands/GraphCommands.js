/**
 * Command pattern implementation for graph operations
 */
import { LAYOUT, NODE_BRANCH_VERTICAL_SPACING, FORCE_NODE_VERTICAL_ADJUSTMENT } from '../constants';

class AddNodeCommand {
  constructor(graph, newNode, sourceNodeId = null, connectionType = 'default', branchId = null) {
    this.graph = graph;
    this.newNode = { ...newNode };
    this.sourceNodeId = sourceNodeId;
    this.connectionType = connectionType;
    this.branchId = branchId;
    this.addedNodeId = newNode.id;
    this.createdEdge = null;
    this.oldTargetNodeId = null;
    this.oldEdge = null;
    this.nodeVerticalSpacing = FORCE_NODE_VERTICAL_ADJUSTMENT; //  Adjusts how far to move the nodes down when adding a new node
    this.movedNodes = []; // Track nodes that were moved down
  }
  
  /**
   * Find nodes that are in the same branch path as the new node
   * Excludes sibling branches (other branches from the same parent)
   * @param {string} startNodeId - The source node ID
   * @param {string} branchId - The branch ID being added to
   * @returns {Set} Set of node IDs that should be considered for movement
   */
  findNodesInBranchPath(startNodeId, branchId) {
    const nodesInPath = new Set();
    
    // If we're adding to a branch, first get the existing target node (if any)
    let targetNodeId = null;
    
    if (this.connectionType === 'branch' && branchId) {
      const existingBranchEdges = this.graph.getBranchOutgoingEdges(startNodeId);
      const existingBranchEdge = existingBranchEdges.find(edge => edge.label === branchId);
      
      if (existingBranchEdge) {
        targetNodeId = existingBranchEdge.targetId;
      }
    } else if (this.connectionType === 'default') {
      const existingDefaultEdge = this.graph.getDefaultOutgoingEdge(startNodeId);
      if (existingDefaultEdge) {
        targetNodeId = existingDefaultEdge.targetId;
      }
    }
    
    // If we found a target node, add it and all its descendants
    if (targetNodeId) {
      // Use DFS to find all descendants
      const toVisit = [targetNodeId];
      
      while (toVisit.length > 0) {
        const currentId = toVisit.pop();
        
        if (nodesInPath.has(currentId)) continue;
        nodesInPath.add(currentId);
        
        // Add all outgoing connections to the visit queue
        const outgoingEdges = this.graph.getOutgoingEdges(currentId);
        for (const edge of outgoingEdges) {
          toVisit.push(edge.targetId);
        }
      }
    }
    
    console.log("Nodes in branch path:", Array.from(nodesInPath));
    return nodesInPath;
  }

  execute() {
    // We need to identify nodes below the insertion point *before* adding the node
    const allNodes = this.graph.getAllNodes();
    const newNodeY = this.newNode.position.y;
    
    // Save the current state for finding nodes later
    this.insertionY = newNodeY;
    
    console.log("AddNodeCommand: Finding nodes to move down");
    console.log("New node position:", this.newNode.position);
    console.log("Source node ID:", this.sourceNodeId);
    
    // Nodes that should be considered for movement (excluding sibling branches)
    let nodesInPath = new Set();
    
    if (this.sourceNodeId) {
      // Find nodes that are in the same branch path
      nodesInPath = this.findNodesInBranchPath(this.sourceNodeId, this.branchId);
      
      // Also add the new node ID to the set
      nodesInPath.add(this.addedNodeId);
    }
    
    allNodes.forEach(node => {
      // Only move nodes that:
      // 1. Are at or below the new node's Y position
      // 2. Are not the source node itself
      // 3. Are in the same branch path (or all nodes if no source node)
      const isInPath = this.sourceNodeId ? nodesInPath.has(node.id) : true;
      const shouldMove = node.position.y >= newNodeY &&
                        node.id !== this.sourceNodeId &&
                        isInPath;
      
      if (shouldMove) {
        // Save original position for undo
        this.movedNodes.push({
          id: node.id,
          oldY: node.position.y
        });
      }
    });
    
    console.log("Nodes to be moved:", this.movedNodes);

    // If there's a source node, create the connection
    if (this.sourceNodeId) {
      const sourceNode = this.graph.getNode(this.sourceNodeId);
      if (sourceNode) {
        // Check if source node already has a connection
        if (this.connectionType === 'default') {
          // Get the existing default edge if any
          const existingDefaultEdge = this.graph.getDefaultOutgoingEdge(this.sourceNodeId);
          
          if (existingDefaultEdge) {
            // Save the old target for undo purposes
            this.oldTargetNodeId = existingDefaultEdge.targetId;
            this.oldEdge = existingDefaultEdge;
            
            // Remove the old edge
            this.graph.removeEdge(existingDefaultEdge.id);
          }
          
          // Create the new connection
          this.createdEdge = this.graph.connect(
            this.sourceNodeId,
            this.addedNodeId,
            'default'
          );
          
          // If there was a previous target, connect the new node to it
          if (this.oldTargetNodeId) {
            this.graph.connect(
              this.addedNodeId,
              this.oldTargetNodeId,
              'default'
            );
          }
        } else if (this.connectionType === 'branch' && this.branchId) {
          // For branch connections, similar process
          const existingBranchEdges = this.graph.getBranchOutgoingEdges(this.sourceNodeId);
          const existingBranchEdge = existingBranchEdges.find(edge => edge.label === this.branchId);
          
          if (existingBranchEdge) {
            this.oldTargetNodeId = existingBranchEdge.targetId;
            this.oldEdge = existingBranchEdge;
            this.graph.removeEdge(existingBranchEdge.id);
          }
          
          // Create new branch connection
          this.createdEdge = this.graph.connect(
            this.sourceNodeId,
            this.addedNodeId,
            'branch',
            this.branchId
          );
          
          // Connect to previous target if it existed
          if (this.oldTargetNodeId) {
            this.graph.connect(
              this.addedNodeId,
              this.oldTargetNodeId,
              'default'
            );
          }
        }
      }
    }
    
    // Add the node to the graph
    this.graph.addNode(this.newNode);
    
    // Move all identified nodes down
    if (this.movedNodes.length > 0) {
      console.log("Moving nodes down by", this.nodeVerticalSpacing, "pixels");
      this.movedNodes.forEach(movedNode => {
        const node = this.graph.getNode(movedNode.id);
        if (node) {
          // Update with the correct spacing from the original position
          this.graph.updateNode(movedNode.id, {
            position: {
              ...node.position,
              y: movedNode.oldY + this.nodeVerticalSpacing
            }
          });
        }
      });
    }
    
    return true;
  }

  undo() {
    // Restore the original positions of nodes that were moved down
    if (this.movedNodes.length > 0) {
      this.movedNodes.forEach(movedNode => {
        const node = this.graph.getNode(movedNode.id);
        if (node) {
          this.graph.updateNode(movedNode.id, {
            position: {
              ...node.position,
              y: movedNode.oldY
            }
          });
        }
      });
    }
    
    // First restore any edges that were removed
    if (this.oldEdge) {
      // Recreate the original connection
      this.graph.connect(
        this.sourceNodeId,
        this.oldTargetNodeId,
        this.oldEdge.type,
        this.oldEdge.label
      );
    }
    
    // Remove the created edge
    if (this.createdEdge) {
      this.graph.removeEdge(this.createdEdge.id);
    }
    
    // Remove any edges from the new node to the old target
    if (this.oldTargetNodeId) {
      const newNodeOutgoingEdges = this.graph.getOutgoingEdges(this.addedNodeId);
      newNodeOutgoingEdges.forEach(edge => {
        if (edge.targetId === this.oldTargetNodeId) {
          this.graph.removeEdge(edge.id);
        }
      });
    }
    
    // Finally, remove the node
    this.graph.removeNode(this.addedNodeId);
    
    return true;
  }
}

class MoveNodeCommand {
  constructor(graph, nodeId, oldPosition, newPosition) {
    this.graph = graph;
    this.nodeId = nodeId;
    this.oldPosition = { ...oldPosition };
    this.newPosition = { ...newPosition };
  }

  execute() {
    const node = this.graph.getNode(this.nodeId);
    if (!node) return false;
    
    return this.graph.updateNode(this.nodeId, { position: this.newPosition });
  }

  undo() {
    const node = this.graph.getNode(this.nodeId);
    if (!node) return false;
    
    return this.graph.updateNode(this.nodeId, { position: this.oldPosition });
  }
}

class DeleteNodeCommand {
  constructor(graph, nodeId) {
    this.graph = graph;
    this.nodeId = nodeId;
    this.deletedNode = null;
    this.incomingEdges = [];
    this.outgoingEdges = [];
    this.reconnectedEdges = [];
  }

  execute() {
    // Store the node before deletion for undo
    this.deletedNode = this.graph.getNode(this.nodeId);
    if (!this.deletedNode) return false;
    
    // Save all incoming and outgoing edges
    this.incomingEdges = this.graph.getIncomingEdges(this.nodeId);
    this.outgoingEdges = this.graph.getOutgoingEdges(this.nodeId);
    
    // Attempt to reconnect incoming edges to outgoing edges
    // This ensures workflow continuity when a node is deleted
    const defaultOutgoingEdge = this.graph.getDefaultOutgoingEdge(this.nodeId);
    
    if (defaultOutgoingEdge) {
      const targetNodeId = defaultOutgoingEdge.targetId;
      
      // For each incoming edge, create a new edge that bypasses the deleted node
      this.incomingEdges.forEach(incomingEdge => {
        const sourceNodeId = incomingEdge.sourceId;
        const edgeType = incomingEdge.type;
        const edgeLabel = incomingEdge.label;
        
        // Create a new edge from the source of the incoming edge to the target of the outgoing edge
        const newEdge = this.graph.connect(
          sourceNodeId,
          targetNodeId,
          edgeType,
          edgeLabel
        );
        
        this.reconnectedEdges.push(newEdge);
      });
    }
    
    // Finally, remove the node which will also remove all its connected edges
    return this.graph.removeNode(this.nodeId);
  }

  undo() {
    if (!this.deletedNode) return false;
    
    // First remove any reconnected edges
    this.reconnectedEdges.forEach(edge => {
      this.graph.removeEdge(edge.id);
    });
    
    // Add the node back
    this.graph.addNode(this.deletedNode);
    
    // Restore all original edges
    this.incomingEdges.forEach(edge => {
      this.graph.connect(
        edge.sourceId,
        edge.targetId,
        edge.type,
        edge.label
      );
    });
    
    this.outgoingEdges.forEach(edge => {
      this.graph.connect(
        edge.sourceId,
        edge.targetId,
        edge.type,
        edge.label
      );
    });
    
    return true;
  }
}

class UpdateNodeCommand {
  constructor(graph, nodeId, properties) {
    this.graph = graph;
    this.nodeId = nodeId;
    this.newProperties = { ...properties };
    this.oldProperties = {};
  }

  execute() {
    const node = this.graph.getNode(this.nodeId);
    if (!node) return false;
    
    // Save old values for undo
    Object.keys(this.newProperties).forEach(key => {
      this.oldProperties[key] = node[key];
    });
    
    // Update the node
    return this.graph.updateNode(this.nodeId, this.newProperties);
  }

  undo() {
    // Restore the previous values
    return this.graph.updateNode(this.nodeId, this.oldProperties);
  }
}

class UpdateEdgeCommand {
  constructor(graph, edgeId, properties) {
    this.graph = graph;
    this.edgeId = edgeId;
    this.newProperties = { ...properties };
    this.oldProperties = {};
  }

  execute() {
    const edge = this.graph.getEdge(this.edgeId);
    if (!edge) return false;
    
    // Save old values for undo
    Object.keys(this.newProperties).forEach(key => {
      this.oldProperties[key] = edge[key];
    });
    
    // Update the edge
    return this.graph.updateEdge(this.edgeId, this.newProperties);
  }

  undo() {
    // Restore the previous values
    return this.graph.updateEdge(this.edgeId, this.oldProperties);
  }
}

// Export the commands
export { 
  AddNodeCommand, 
  MoveNodeCommand, 
  DeleteNodeCommand, 
  UpdateNodeCommand,
  UpdateEdgeCommand
};