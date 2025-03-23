/**
 * Command pattern implementation for graph operations
 */

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
    this.nodeVerticalSpacing = 150; // Vertical spacing between nodes
    this.movedNodes = []; // Track nodes that were moved down
  }
  
  /**
   * Find all nodes that are connected to a source node
   * Includes both upstream and downstream nodes
   * @param {string} startNodeId - The node ID to start from
   * @returns {Set} Set of node IDs that are connected to the start node
   */
  findConnectedNodes(startNodeId) {
    const visited = new Set();
    const toVisit = [startNodeId];
    
    console.log("Finding connected nodes starting from:", startNodeId);
    
    // Use BFS to find all connected nodes (upstream and downstream)
    while (toVisit.length > 0) {
      const currentId = toVisit.shift();
      
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      
      // Check outgoing connections
      const outgoingEdges = this.graph.getOutgoingEdges(currentId);
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.targetId)) {
          toVisit.push(edge.targetId);
        }
      }
      
      // Check incoming connections
      const incomingEdges = this.graph.getIncomingEdges(currentId);
      for (const edge of incomingEdges) {
        if (!visited.has(edge.sourceId)) {
          toVisit.push(edge.sourceId);
        }
      }
    }
    
    console.log("Connected nodes:", Array.from(visited));
    return visited;
  }

  execute() {
    // We need to identify nodes below the insertion point *before* adding the node
    const allNodes = this.graph.getAllNodes();
    const newNodeY = this.newNode.position.y;
    
    // Save the current state for finding nodes later if we add a node above
    // this one in future operations
    this.insertionY = newNodeY;
    
    // Find all nodes that are below or exactly at the new node's Y position
    // except for the source node and our new node
    console.log("AddNodeCommand: Finding nodes to move down");
    console.log("New node position:", this.newNode.position);
    console.log("Source node ID:", this.sourceNodeId);
    
    // If we have a source node, we only want to move nodes that are part of
    // the same connected component (flow/tree)
    let connectedNodeIds = new Set();
    
    if (this.sourceNodeId) {
      // Find all nodes connected to the source node (part of the same flow/tree)
      connectedNodeIds = this.findConnectedNodes(this.sourceNodeId);
      
      // Also add the new node ID to the set since it will be connected
      connectedNodeIds.add(this.addedNodeId);
      console.log("Connected node IDs:", Array.from(connectedNodeIds));
    }
    
    allNodes.forEach(node => {
      // Only move nodes that:
      // 1. Are at or below the new node's Y position
      // 2. Are not the source node itself
      // 3. Are part of the same connected component (if there's a source node)
      const isConnected = this.sourceNodeId ? connectedNodeIds.has(node.id) : false;
      const shouldMove = node.position.y >= newNodeY &&
                        node.id !== this.sourceNodeId &&
                        (isConnected || !this.sourceNodeId);
      
      console.log("Node", node.id, "- Y:", node.position.y, "Connected:", isConnected, "Should move:", shouldMove);
      
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
    
    // Move all nodes from the same flow/tree below the insertion point down
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
          console.log("Moved node", movedNode.id, "from y:", movedNode.oldY, "to y:", movedNode.oldY + this.nodeVerticalSpacing);
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