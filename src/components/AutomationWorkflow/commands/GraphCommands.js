/**
 * Command pattern implementation for graph operations
 */
import { FORCE_NODE_VERTICAL_ADJUSTMENT, NODE_TYPES } from '../constants';
import { BranchUtils } from '../utils/BranchUtils';
import { BaseGraphCommand } from './BaseGraphCommand';
import { Graph } from '../graph/Graph';
import { cloneGraph } from '../utils/graphUtils';

class AddNodeCommand extends BaseGraphCommand {
  constructor(graph, newNode, sourceNodeId = null, connectionType = 'default', branchId = null, pluginRegistry = null) {
    super(graph);
    this.newNode = { ...newNode };
    this.sourceNodeId = sourceNodeId;
    this.connectionType = connectionType;
    this.branchId = branchId;
    this.addedNodeId = newNode.id;
    this.createdEdge = null;
    this.oldTargetNodeId = null;
    this.oldEdge = null;
    this.nodeVerticalSpacing = FORCE_NODE_VERTICAL_ADJUSTMENT;
    this.movedNodes = []; // Track nodes that were moved down
    this.pluginRegistry = pluginRegistry; // Store the plugin registry for branch detection
  }
 
  /**
   * Find nodes that should be moved down after inserting a new node
   * @returns {Array} Array of nodes to be moved with their original positions
   */
  _identifyNodesToMove() {
    const allNodes = this.graph.getAllNodes();
    const newNodeY = this.newNode.position.y;
    this.insertionY = newNodeY;
    
    // Nodes that should be considered for movement (excluding sibling branches)
    let nodesInPath = new Set();
    
    if (this.sourceNodeId) {
      // Find nodes that are in the same branch path
      nodesInPath = this._findNodesInBranchPath(this.sourceNodeId, this.branchId);
      
      // Also add the new node ID to the set
      nodesInPath.add(this.addedNodeId);
    }
    
    const nodesToMove = [];
    
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
        nodesToMove.push({
          id: node.id,
          oldY: node.position.y
        });
      }
    });
    
    return nodesToMove;
  }

  /**
   * Repositions nodes that need to be moved after insertion
   * @param {Array} nodesToMove - Array of nodes to move with their original positions
   */
  _repositionNodes(nodesToMove) {
    if (!nodesToMove || nodesToMove.length === 0) return;
    
    nodesToMove.forEach(movedNode => {
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

  /**
   * Create connection from source node to the new node
   * @returns {Object} Created edge information
   */
  _createSourceConnection() {
    if (!this.sourceNodeId) return null;
    
    const sourceNode = this.graph.getNode(this.sourceNodeId);
    if (!sourceNode) return null;
    
    let createdEdge = null;
    
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
      createdEdge = this.graph.connect(
        this.sourceNodeId,
        this.addedNodeId,
        'default'
      );
    } 
    else if (this.connectionType === 'branch' && this.branchId) {
      // For branch connections
      const existingBranchEdges = this.graph.getBranchOutgoingEdges(this.sourceNodeId);
      const existingBranchEdge = existingBranchEdges.find(edge => edge.label === this.branchId);
      
      if (existingBranchEdge) {
        this.oldTargetNodeId = existingBranchEdge.targetId;
        this.oldEdge = existingBranchEdge;
        this.graph.removeEdge(existingBranchEdge.id);
      }
      
      // Create new branch connection
      createdEdge = this.graph.connect(
        this.sourceNodeId,
        this.addedNodeId,
        'branch',
        this.branchId
      );
    }
    
    return createdEdge;
  }

  /**
   * Create connection from the new node to the old target node
   * @returns {Object} Created target edge information
   */
  _createTargetConnection() {
    if (!this.oldTargetNodeId) return null;
    
    // Get the new node and target node
    const newNode = this.graph.getNode(this.addedNodeId);
    const targetNode = this.graph.getNode(this.oldTargetNodeId);
    
    if (!newNode || !targetNode) return null;

    // Use the standardized method to determine the best branch ID
    const { isBranchNode, branchId } = BranchUtils.getBestBranchId(newNode, targetNode, this.pluginRegistry, this.graph);
    
    let createdTargetEdge = null;
    
    if (isBranchNode && branchId) {
      // For branch-based nodes, connect using the selected branch handle
      createdTargetEdge = this.graph.connect(
        this.addedNodeId,
        this.oldTargetNodeId,
        'branch',
        branchId
      );
    } else {
      // For non-branch nodes, use default connection
      createdTargetEdge = this.graph.connect(
        this.addedNodeId,
        this.oldTargetNodeId,
        'default'
      );
    }
    
    return createdTargetEdge;
  }

  /**
   * Find nodes that are in the same branch path as the new node
   * Excludes sibling branches (other branches from the same parent)
   * @param {string} startNodeId - The source node ID
   * @param {string} branchId - The branch ID being added to
   * @returns {Set} Set of node IDs that should be considered for movement
   */
  _findNodesInBranchPath(startNodeId, branchId) {
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
    
    return nodesInPath;
  }

  execute() {
    // First identify nodes that need to be moved
    this.movedNodes = this._identifyNodesToMove();
    
    // Add the node to the graph
    this.graph.addNode(this.newNode);

    // Create connections if there's a source node
    if (this.sourceNodeId) {
      // Connect source node to new node
      this.createdEdge = this._createSourceConnection();
      
      // Connect new node to previous target if it existed
      if (this.oldTargetNodeId) {
        this.createdTargetEdge = this._createTargetConnection();
      }
    } 
    
    // Move identified nodes down
    this._repositionNodes(this.movedNodes);
    
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

class MoveNodeCommand extends BaseGraphCommand {
  constructor(graph, nodeId, oldPosition, newPosition) {
    super(graph);
    this.nodeId = nodeId;
    // Record deep copies of positions
    this.oldPosition = JSON.parse(JSON.stringify(oldPosition));
    this.newPosition = JSON.parse(JSON.stringify(newPosition));
  }

  execute() {
    const node = this.graph.getNode(this.nodeId);
    if (!node) return false;
    return this.graph.updateNode(this.nodeId, { position: this.newPosition });
  }

  undo() {
    const node = this.graph.getNode(this.nodeId);
    if (!node) {
      console.error(`MoveNodeCommand.undo(): Node ${this.nodeId} not found`);
      return false;
    }
    return this.graph.updateNode(this.nodeId, { position: this.oldPosition });
  }
}

class DeleteNodeCommand extends BaseGraphCommand {
  constructor(graph, nodeId, pluginRegistry = null) {
    super(graph);
    this.nodeId = nodeId;
    this.deletedNode = null;
    this.incomingEdges = [];
    this.outgoingEdges = [];
    this.reconnectedEdges = [];
    this.pluginRegistry = pluginRegistry;
    this.executionId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    this.originalGraph = null; // Store the original state for undo
    this.previousMoves = new Map(); // Track previous move operations on the same node
  }

  /**
   * Creates a deep copy of node or edge objects to prevent reference issues
   * @param {Object} obj - Object to copy
   * @returns {Object} Deep copy of the object
   */
  _deepCopy(obj) {
    if (!obj) return null;
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Create a snapshot of the entire graph before making changes
   */
  _createBackup() {
    this.originalGraph = cloneGraph(this.graph);
    console.log(`[DeleteNodeCommand] Created backup with ${this.originalGraph.getAllNodes().length} nodes and ${this.originalGraph.getAllEdges().length} edges`);
  }

  // Modified execute: remove reconnection logic, just backup and delete the node
  execute() {
    try {
      console.log(`[DeleteNodeCommand] Executing deletion of node: ${this.nodeId}`);
      
      // Create backup of original state
      this._createBackup();
      
      // Cancel any pending commands
      if (window._pendingCommands) {
        console.log(`[DeleteNodeCommand] Canceling ${window._pendingCommands.length} pending commands`);
        window._pendingCommands.forEach(cmd => {
          if (typeof cmd.cancel === 'function') {
            cmd.cancel();
          }
        });
        window._pendingCommands = [];
      }
      
      // Store the node to be deleted for reference
      const originalNode = this.graph.getNode(this.nodeId);
      if (!originalNode) {
        console.warn(`Delete command: Node ${this.nodeId} not found, but proceeding with cleanup`);
        return true;
      }
      this.deletedNode = this._deepCopy(originalNode);
      
      // Save all connected edges (incoming & outgoing) for fallback if needed
      this.incomingEdges = this._deepCopy(this.graph.getIncomingEdges(this.nodeId));
      this.outgoingEdges = this._deepCopy(this.graph.getOutgoingEdges(this.nodeId));
      
      // Directly remove the node; let graph.removeNode remove its incident edges
      const nodeRemoved = this.graph.removeNode(this.nodeId);
      if (!nodeRemoved) {
        console.error(`Failed to remove node ${this.nodeId}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error in DeleteNodeCommand.execute():`, error);
      return true;
    }
  }
  
  // Modified undo: restore full graph using the backup snapshot
  undo() {
    try {
      console.log(`[DeleteNodeCommand] Undoing deletion of node: ${this.nodeId}`);
      
      if (this.originalGraph) {
        // Clear current graph completely
        const currentNodes = [...this.graph.getAllNodes()];
        currentNodes.forEach(node => this.graph.removeNode(node.id));
        
        // Restore from backup via our cloneGraph utility
        const backupSnapshot = cloneGraph(this.originalGraph);
        backupSnapshot.getAllNodes().forEach(node => {
          this.graph.addNode(JSON.parse(JSON.stringify(node)));
        });
        backupSnapshot.getAllEdges().forEach(edge => {
          if (this.graph.getNode(edge.sourceId) && this.graph.getNode(edge.targetId)) {
            this.graph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
          }
        });
        console.log(`[DeleteNodeCommand] Undo restored ${this.graph.getAllNodes().length} nodes and ${this.graph.getAllEdges().length} edges`);
        return true;
      }
      
      // Fallback manual restoration if backup is absent
      if (!this.deletedNode) {
        console.warn(`Cannot undo: No deleted node stored for ${this.nodeId}`);
        return false;
      }
      
      // ...existing fallback code...
      return true;
    } catch (error) {
      console.error(`Error in DeleteNodeCommand.undo():`, error);
      return false;
    }
  }
}

class UpdateNodeCommand extends BaseGraphCommand {
  constructor(graph, nodeId, properties) {
    super(graph);
    this.nodeId = nodeId;
    this.newProperties = { ...properties };
    this.oldProperties = {};
    this.isPropertyUpdate = true; // Flag to identify this as a property update
  }

  execute() {
    const node = this.graph.getNode(this.nodeId);
    if (!node) {
      console.error(`Node ${this.nodeId} not found in graph`);
      return false;
    }
    
    // Save old values for undo
    Object.keys(this.newProperties).forEach(key => {
      this.oldProperties[key] = node[key];
    });
    
    console.log(`UpdateNodeCommand: Updating node ${this.nodeId} with properties:`, this.newProperties);
    
    // Update the node
    const result = this.graph.updateNode(this.nodeId, this.newProperties);
    
    // Verify the update worked
    if (result) {
      const updatedNode = this.graph.getNode(this.nodeId);
      console.log(`Node ${this.nodeId} after update:`, updatedNode);
    } else {
      console.error(`Failed to update node ${this.nodeId}`);
    }
    
    return result;
  }

  undo() {
    // Restore the previous values
    console.log(`UpdateNodeCommand: Undoing node ${this.nodeId} update, restoring:`, this.oldProperties);
    return this.graph.updateNode(this.nodeId, this.oldProperties);
  }
}

class UpdateEdgeCommand extends BaseGraphCommand {
  constructor(graph, edgeId, properties) {
    super(graph);
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