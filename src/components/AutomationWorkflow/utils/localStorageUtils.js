/**
 * Local storage utilities for workflow data persistence
 */

const LOCAL_STORAGE_PREFIX = 'workflow_';

/**
 * Generate a storage key for a node
 * @param {string} nodeId - The ID of the node
 * @returns {string} The local storage key for the node
 */
const getNodeStorageKey = (nodeId) => `${LOCAL_STORAGE_PREFIX}node_${nodeId}`;

/**
 * Save node properties to local storage
 * @param {string} nodeId - The ID of the node
 * @param {Object} data - The node properties to store
 */
export const saveNodeToLocalStorage = (nodeId, data) => {
  try {
    const key = getNodeStorageKey(nodeId);
    
    // Ensure we're storing with the right structure (properties object)
    const storageData = {
      id: data.id,
      type: data.type,
      // Make sure properties are in a nested object
      properties: data.properties || {}
    };
    
    // If properties were directly on the node, move them to the nested properties object
    if (!data.properties) {
      Object.keys(data).forEach(key => {
        // Skip id, type, position, and some standard fields
        if (!['id', 'type', 'position', 'sourceNodeRefs', 'height'].includes(key)) {
          storageData.properties[key] = data[key];
        }
      });
    }
    
    // Debug data being saved
    console.log('Saving node to local storage with structure:', {
      ...storageData,
      properties: { ...storageData.properties }
    });
    
    // Stringify and save to localStorage
    const jsonData = JSON.stringify(storageData);
    localStorage.setItem(key, jsonData);
    
    // Verify data was saved by reading it back
    const savedData = localStorage.getItem(key);
    if (savedData) {
      console.log('Verified data in localStorage:', savedData);
    } else {
      console.error('Failed to save data to localStorage!');
    }
    
    // Update the index of stored nodes
    const storedNodes = getStoredNodeIds();
    if (!storedNodes.includes(nodeId)) {
      storedNodes.push(nodeId);
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}node_index`, JSON.stringify(storedNodes));
    }
    
    console.log(`Node ${nodeId} saved to local storage`);
    return true;
  } catch (error) {
    console.error('Failed to save node to local storage:', error);
    return false;
  }
};

/**
 * Get node properties from local storage
 * @param {string} nodeId - The ID of the node
 * @returns {Object|null} The stored node properties or null if not found
 */
export const getNodeFromLocalStorage = (nodeId) => {
  try {
    const key = getNodeStorageKey(nodeId);
    const data = localStorage.getItem(key);
    
    if (!data) {
      console.log(`No data found in localStorage for node ${nodeId}`);
      return null;
    }
    
    try {
      console.log(`Raw data from localStorage for node ${nodeId}:`, data);
      const parsedData = JSON.parse(data);
      console.log(`Successfully retrieved from localStorage for node ${nodeId}:`, parsedData);
      
      // Make sure properties is always an object
      if (parsedData && !parsedData.properties) {
        parsedData.properties = {};
      }
      
      return parsedData;
    } catch (parseError) {
      console.error(`Error parsing JSON from localStorage for node ${nodeId}:`, parseError);
      return null;
    }
  } catch (error) {
    console.error('Failed to get node from local storage:', error);
    return null;
  }
};

/**
 * Get list of all stored node IDs
 * @returns {Array} Array of node IDs that have been stored
 */
export const getStoredNodeIds = () => {
  try {
    const index = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}node_index`);
    return index ? JSON.parse(index) : [];
  } catch (error) {
    console.error('Failed to get stored node IDs:', error);
    return [];
  }
};

/**
 * Remove node properties from local storage
 * @param {string} nodeId - The ID of the node
 */
export const removeNodeFromLocalStorage = (nodeId) => {
  try {
    const key = getNodeStorageKey(nodeId);
    localStorage.removeItem(key);
    
    // Update the index of stored nodes
    const storedNodes = getStoredNodeIds();
    const updatedNodes = storedNodes.filter(id => id !== nodeId);
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}node_index`, JSON.stringify(updatedNodes));
    
    return true;
  } catch (error) {
    console.error('Failed to remove node from local storage:', error);
    return false;
  }
};

/**
 * Check if node exists in local storage
 * @param {string} nodeId - The ID of the node
 * @returns {boolean} True if node exists in local storage
 */
export const nodeExistsInLocalStorage = (nodeId) => {
  const key = getNodeStorageKey(nodeId);
  return localStorage.getItem(key) !== null;
};

/**
 * Save entire workflow graph to local storage
 * @param {Object} graph - The workflow graph object
 */
export const saveWorkflowToLocalStorage = (graph) => {
  try {
    if (!graph) return false;
    
    // Save all nodes
    graph.getAllNodes().forEach(node => {
      saveNodeToLocalStorage(node.id, node);
    });
    
    // Save graph structure (edges)
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}edges`, JSON.stringify(graph.getAllEdges()));
    
    console.log('Workflow saved to local storage');
    return true;
  } catch (error) {
    console.error('Failed to save workflow to local storage:', error);
    return false;
  }
};