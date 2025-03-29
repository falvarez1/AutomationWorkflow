import { Graph } from '../graph/Graph';

/**
 * Creates a fresh clone of a graph with no shared references
 * @param {Graph} sourceGraph - The source graph to clone
 * @returns {Graph} A new graph instance with copied nodes and edges
 */
export const cloneGraph = (sourceGraph) => {
  if (!sourceGraph) return new Graph();
  
  const newGraph = new Graph();
  
  try {
    // First serialize then deserialize all nodes to break any references
    const serializedNodes = JSON.stringify(sourceGraph.getAllNodes());
    const freshNodes = JSON.parse(serializedNodes);
    
    // Add all nodes to the new graph
    freshNodes.forEach(node => {
      newGraph.addNode(node);
    });
    
    // Then add all edges
    const edges = sourceGraph.getAllEdges();
    edges.forEach(edge => {
      if (newGraph.getNode(edge.sourceId) && newGraph.getNode(edge.targetId)) {
        newGraph.connect(
          edge.sourceId,
          edge.targetId,
          edge.type,
          edge.label
        );
      }
    });
  } catch (error) {
    console.error('Error cloning graph:', error);
  }
  
  return newGraph;
};

/**
 * Creates a graph snapshot suitable for serialization
 * @param {Graph} graph - The graph to snapshot
 * @returns {Object} Serializable graph snapshot
 */
export const createGraphSnapshot = (graph) => {
  return {
    nodes: graph.getAllNodes(),
    edges: graph.getAllEdges()
  };
};

/**
 * Restores a graph from a snapshot
 * @param {Object} snapshot - The snapshot to restore from
 * @returns {Graph} The restored graph
 */
export const restoreGraphFromSnapshot = (snapshot) => {
  const restoredGraph = new Graph();
  
  if (snapshot && snapshot.nodes) {
    // Add all nodes
    snapshot.nodes.forEach(node => {
      restoredGraph.addNode({...node});
    });
    
    // Add all edges
    if (snapshot.edges) {
      snapshot.edges.forEach(edge => {
        restoredGraph.connect(
          edge.sourceId,
          edge.targetId,
          edge.type,
          edge.label
        );
      });
    }
  }
  
  return restoredGraph;
};
