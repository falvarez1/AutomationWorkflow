import { DEFAULT_NODE_HEIGHT } from '../../AutomationWorkflow/constants';

/**
 * Edge class representing a connection between nodes
 */
class Edge {
  constructor(id, sourceId, targetId, type = 'default', label = null) {
    this.id = id;
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.type = type; // 'default' or 'branch'
    this.label = label; // Used for branch labels like 'yes', 'no', etc.
  }
}

/**
 * Graph class for managing nodes and edges in a workflow
 * Provides methods for adding, removing, and querying nodes and edges
 */
class Graph {
  constructor() {
    this.nodes = new Map(); // Map of node ID to node object for O(1) lookups
    this.edges = new Map(); // Map of edge ID to edge object
  }

  /**
   * Add a node to the graph
   * @param {Object} node - The node to add
   * @returns {Object} The added node
   */
  addNode(node) {
    this.nodes.set(node.id, node);
    return node;
  }

  /**
   * Get a node by ID
   * @param {string} id - The node ID
   * @returns {Object|undefined} The node or undefined if not found
   */
  getNode(id) {
    return this.nodes.get(id);
  }

  /**
   * Remove a node and all its connected edges
   * @param {string} id - The node ID
   * @returns {boolean} True if node was removed
   */
  removeNode(id) {
    if (!this.nodes.has(id)) return false;
    
    // Remove any edges connected to this node
    const edgesToRemove = [];
    this.edges.forEach((edge, edgeId) => {
      if (edge.sourceId === id || edge.targetId === id) {
        edgesToRemove.push(edgeId);
      }
    });
    
    edgesToRemove.forEach(edgeId => this.edges.delete(edgeId));
    return this.nodes.delete(id);
  }

  /**
   * Update a node with new properties
   * @param {string} id - The node ID
   * @param {Object} updates - Properties to update
   * @returns {boolean} True if update was successful
   */
  updateNode(id, updates) {
    const node = this.getNode(id);
    if (!node) return false;
    this.nodes.set(id, { ...node, ...updates });
    return true;
  }

  /**
   * Get all nodes in the graph
   * @returns {Array} Array of all nodes
   */
  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  /**
   * Add an edge to the graph
   * @param {Edge} edge - The edge to add
   * @returns {Edge} The added edge
   */
  addEdge(edge) {
    this.edges.set(edge.id, edge);
    return edge;
  }

  /**
   * Get an edge by ID
   * @param {string} id - The edge ID
   * @returns {Edge|undefined} The edge or undefined if not found
   */
  getEdge(id) {
    return this.edges.get(id);
  }

  /**
   * Remove an edge
   * @param {string} id - The edge ID
   * @returns {boolean} True if edge was removed
   */
  removeEdge(id) {
    return this.edges.delete(id);
  }

  /**
   * Update an edge with new properties
   * @param {string} id - The edge ID
   * @param {Object} updates - Properties to update
   * @returns {boolean} True if update was successful
   */
  updateEdge(id, updates) {
    const edge = this.getEdge(id);
    if (!edge) return false;
    this.edges.set(id, { ...edge, ...updates });
    return true;
  }

  /**
   * Get all edges in the graph
   * @returns {Array} Array of all edges
   */
  getAllEdges() {
    return Array.from(this.edges.values());
  }

  /**
   * Get outgoing edges for a node
   * @param {string} nodeId - The node ID
   * @returns {Array} Array of outgoing edges
   */
  getOutgoingEdges(nodeId) {
    return Array.from(this.edges.values()).filter(edge => edge.sourceId === nodeId);
  }

  /**
   * Get incoming edges for a node
   * @param {string} nodeId - The node ID
   * @returns {Array} Array of incoming edges
   */
  getIncomingEdges(nodeId) {
    return Array.from(this.edges.values()).filter(edge => edge.targetId === nodeId);
  }

  /**
   * Connect two nodes with an edge
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID
   * @param {string} type - Edge type ('default' or 'branch')
   * @param {string|null} label - Optional edge label (for branches)
   * @returns {Edge} The created edge
   */
  connect(sourceId, targetId, type = 'default', label = null) {
    const edgeId = `${sourceId}_to_${targetId}_${type}${label ? `_${label}` : ''}`;
    const edge = new Edge(edgeId, sourceId, targetId, type, label);
    this.addEdge(edge);
    return edge;
  }

  /**
   * Check if adding this edge would create a cycle (for DAG validation)
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID
   * @returns {boolean} True if a cycle would be created
   */
  wouldCreateCycle(sourceId, targetId) {
    if (sourceId === targetId) return true;
    
    // Simple DFS to check for cycles
    const visited = new Set();
    
    const dfs = (currentId) => {
      if (currentId === sourceId) return true; // Found a cycle
      if (visited.has(currentId)) return false; // Already checked this branch
      
      visited.add(currentId);
      
      const outgoing = this.getOutgoingEdges(currentId);
      for (const edge of outgoing) {
        if (dfs(edge.targetId)) return true;
      }
      
      return false;
    };
    
    return dfs(targetId);
  }

  /**
   * Get the default outgoing edge for a node
   * @param {string} nodeId - The node ID
   * @returns {Edge|null} The default edge or null if none exists
   */
  getDefaultOutgoingEdge(nodeId) {
    const outgoingEdges = this.getOutgoingEdges(nodeId);
    return outgoingEdges.find(edge => edge.type === 'default') || null;
  }

  /**
   * Get branch outgoing edges for a node
   * @param {string} nodeId - The node ID
   * @returns {Array} Array of branch edges
   */
  getBranchOutgoingEdges(nodeId) {
    const outgoingEdges = this.getOutgoingEdges(nodeId);
    return outgoingEdges.filter(edge => edge.type === 'branch');
  }

  /**
   * Convert from the old format (array of workflow steps) to Graph
   * @param {Array} workflowSteps - Array of workflow step objects
   * @returns {Graph} New Graph instance
   */
  static fromWorkflowSteps(workflowSteps) {
    const graph = new Graph();
    
    // First add all nodes
    workflowSteps.forEach(step => {
      const node = {
        id: step.id,
        type: step.type,
        title: step.title,
        subtitle: step.subtitle,
        position: { ...step.position },
        height: step.height || DEFAULT_NODE_HEIGHT,
        contextMenuConfig: step.contextMenuConfig,
        isNew: step.isNew,
        properties: step.properties || {}
      };
      graph.addNode(node);
    });
    
    // Then add all edges
    workflowSteps.forEach(step => {
      // Add standard connections
      if (step.outgoingConnections && step.outgoingConnections.default) {
        const targetId = step.outgoingConnections.default.targetNodeId;
        if (targetId && graph.getNode(targetId)) {
          graph.connect(step.id, targetId, 'default');
        }
      }
      
      // Add branch connections
      if (step.branchConnections) {
        Object.entries(step.branchConnections).forEach(([branchId, connection]) => {
          const targetId = connection.targetNodeId;
          if (targetId && graph.getNode(targetId)) {
            graph.connect(step.id, targetId, 'branch', branchId);
          }
        });
      }
    });
    
    return graph;
  }

  /**
   * Convert to the old format (array of workflow steps) for compatibility
   * @returns {Array} Array of workflow step objects
   */
  toWorkflowSteps() {
    const nodes = this.getAllNodes();
    const edges = this.getAllEdges();
    
    // Convert to backend format
    return nodes.map(node => {
      // Find connections where this node is the source
      const outgoingConnections = edges
        .filter(edge => edge.sourceId === node.id)
        .map(edge => ({
          targetId: edge.targetId,
          type: edge.type,
          branchId: edge.branchId || null
        }));
      
      // Return formatted node with connections
      return {
        id: node.id,
        type: node.type,
        position: node.position,
        properties: node.properties || {},
        connections: outgoingConnections
      };
    });
  }
}

export { Graph, Edge };