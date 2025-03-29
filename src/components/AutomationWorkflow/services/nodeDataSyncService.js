/**
 * Service for synchronizing locally stored node data with the backend
 */
import { workflowService } from '../../../services/workflowService';
import { 
  getStoredNodeIds, 
  getNodeFromLocalStorage, 
  removeNodeFromLocalStorage
} from '../utils/localStorageUtils';
import { UpdateNodeCommand } from '../commands/GraphCommands';

/**
 * Initialize the node data sync service
 * 
 * @param {Object} graph - The current workflow graph
 * @param {Function} setWorkflowGraph - Function to update the workflow graph state
 * @param {Object} commandManager - Command manager for executing commands
 * @returns {Function} Function to unsubscribe from connection status changes
 */
export const initNodeDataSyncService = (graph, setWorkflowGraph, commandManager) => {
  // Handler for connection status changes
  const handleConnectionChange = (status) => {
    // If connection is restored, sync local data
    if (status === 'connected') {
      syncLocalDataWithBackend(graph, setWorkflowGraph, commandManager);
    }
  };

  // Subscribe to connection status changes
  const unsubscribe = workflowService.onConnectionStatusChange(handleConnectionChange);
  
  // Return cleanup function
  return unsubscribe;
};

/**
 * Synchronizes locally stored node data with the backend
 * 
 * @param {Object} graph - The current workflow graph
 * @param {Function} setWorkflowGraph - Function to update the workflow graph state
 * @param {Object} commandManager - Command manager for executing commands
 */
export const syncLocalDataWithBackend = async (graph, setWorkflowGraph, commandManager) => {
  try {
    // Get list of nodes with local changes
    const nodeIds = getStoredNodeIds();
    
    if (nodeIds.length === 0) return;
    
    console.log(`Syncing ${nodeIds.length} nodes with backend...`);
    
    for (const nodeId of nodeIds) {
      // Get the local node data
      const localNodeData = getNodeFromLocalStorage(nodeId);
      
      // Get the current node from the graph
      const currentNode = graph.getNode(nodeId);
      
      // If the node exists in the graph
      if (currentNode && localNodeData) {
        // Create an update command for each property that has changed
        const differences = findPropertyDifferences(currentNode, localNodeData);
        
        if (Object.keys(differences).length > 0) {
          // Create and execute update command
          const updateCommand = new UpdateNodeCommand(graph, nodeId, differences);
          commandManager.execute(updateCommand);
          
          console.log(`Synced local changes for node ${nodeId}`);
        }
        
        // Remove from local storage since it's now synced
        removeNodeFromLocalStorage(nodeId);
      } else if (!currentNode) {
        // Node no longer exists in the graph, clean up local storage
        removeNodeFromLocalStorage(nodeId);
        console.log(`Removed local data for deleted node ${nodeId}`);
      }
    }
    
    // Update the graph state to reflect changes
    // Note: We don't need to call getCurrentState since the graph should be updated already
    // by the updateCommand execution
    if (setWorkflowGraph && graph) {
      setWorkflowGraph(graph);
    }
    
    console.log('Node data synchronization complete');
  } catch (error) {
    console.error('Error synchronizing node data:', error);
  }
};

/**
 * Find properties that differ between current node and local data
 *
 * @param {Object} currentNode - Current node from the graph
 * @param {Object} localNode - Node data from local storage
 * @returns {Object} Object containing changed properties
 */
const findPropertyDifferences = (currentNode, localNode) => {
  // We need to create a properties update
  const differences = {
    properties: {}
  };
  
  // Check if local node data has a properties object
  if (localNode.properties) {
    const currentProperties = currentNode.properties || {};
    
    // Compare each property in the local node's properties
    Object.keys(localNode.properties).forEach(propKey => {
      const localValue = localNode.properties[propKey];
      const currentValue = currentProperties[propKey];
      
      // Compare values
      const isDifferent = typeof localValue === 'object'
        ? JSON.stringify(localValue) !== JSON.stringify(currentValue)
        : localValue !== currentValue;
      
      // If different, add to differences object
      if (isDifferent) {
        differences.properties[propKey] = localValue;
      }
    });
  } else {
    // Legacy format: properties at root level
    // Handle properties directly on the local node (old format)
    Object.keys(localNode).forEach(key => {
      // Skip id, type, position, and other non-property fields
      if (key === 'id' || key === 'type' || key === 'position' ||
          key === 'sourceNodeRefs' || key === 'height') {
        return;
      }
      
      const localValue = localNode[key];
      const currentValue = (currentNode.properties || {})[key];
      
      // Compare values
      const isDifferent = typeof localValue === 'object'
        ? JSON.stringify(localValue) !== JSON.stringify(currentValue)
        : localValue !== currentValue;
      
      // If different, add to differences object
      if (isDifferent) {
        differences.properties[key] = localValue;
      }
    });
  }
  
  // Only return the differences object if there are actually properties to update
  if (Object.keys(differences.properties).length === 0) {
    return {};
  }
  
  return differences;
};