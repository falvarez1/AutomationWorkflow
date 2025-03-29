/**
 * Helper functions for loading workflow data with local storage integration
 */
import {
  getStoredNodeIds,
  getNodeFromLocalStorage,
  nodeExistsInLocalStorage
} from './localStorageUtils';
import { Graph } from '../graph/Graph';

/**
 * Enhances a loaded workflow graph with any locally stored node data
 *
 * This is useful when there were unsaved changes from a previous session
 * or when changes were made while the API was disconnected.
 *
 * @param {Object} graph - The workflow graph loaded from the backend
 * @returns {Object} The enhanced graph with locally stored properties
 */
export const enhanceGraphWithLocalData = (graph) => {
  try {
    if (!graph) return graph;
    
    // Get all nodes with locally stored data
    const storedNodeIds = getStoredNodeIds();
    
    // If no locally stored nodes, return original graph
    if (storedNodeIds.length === 0) return graph;
    
    console.log(`Found ${storedNodeIds.length} nodes with locally stored data`);
    
    // For each node in the graph, check if there's local data
    const nodes = graph.getAllNodes();
    
    for (const node of nodes) {
      if (nodeExistsInLocalStorage(node.id)) {
        const localData = getNodeFromLocalStorage(node.id);
        
        if (localData) {
          // Check if the local data has a nested properties object
          if (localData.properties) {
            console.log(`Enhancing node ${node.id} with locally stored properties:`, localData.properties);
            
            // Create a merged properties object with current and stored properties
            const mergedProperties = {
              ...(node.properties || {}),
              ...localData.properties
            };
            
            // Update the node with the merged properties
            graph.updateNode(node.id, {
              properties: mergedProperties
            });
          } else {
            // Legacy format: properties at root level
            console.log(`Enhancing node ${node.id} with legacy format locally stored properties`);
            
            // Update node with locally stored properties
            // Skip id, type and position which shouldn't be overridden
            const propertiesToUpdate = {};
            Object.keys(localData).forEach(key => {
              if (key !== 'id' && key !== 'type' && key !== 'position' &&
                  key !== 'sourceNodeRefs' && key !== 'height') {
                propertiesToUpdate[key] = localData[key];
              }
            });
            
            // Only update if we have properties to update
            if (Object.keys(propertiesToUpdate).length > 0) {
              graph.updateNode(node.id, {
                properties: {
                  ...(node.properties || {}),
                  ...propertiesToUpdate
                }
              });
            }
          }
          
          console.log(`Enhanced node ${node.id} with locally stored data`);
        }
      }
    }
    
    return graph;
  } catch (error) {
    console.error('Error enhancing graph with local data:', error);
    return graph;
  }
};

/**
 * Enhances a single node with locally stored data if available
 * 
 * This function is useful when selecting nodes, to ensure any locally 
 * stored properties are applied to the node.
 * 
 * @param {Object} node - The node to enhance
 * @returns {Object} The enhanced node with any locally stored properties applied
 */
export const enhanceNodeWithLocalData = (node) => {
  if (!node || !node.id) {
    console.log('Cannot enhance node: Invalid node provided');
    return node;
  }
  
  try {
    console.log(`Checking for local storage data for node ${node.id}`);
    
    // Check if the node has local storage data
    if (nodeExistsInLocalStorage(node.id)) {
      const localData = getNodeFromLocalStorage(node.id);
      
      // Found local data, enhance the node
      if (localData) {
        console.log(`Found local data for node ${node.id}:`, localData);
        
        // Create a new node object with the original node data
        const enhancedNode = { ...node };
        
        // Initialize properties object if it doesn't exist
        if (!enhancedNode.properties) {
          enhancedNode.properties = {};
        }
        
        // Apply locally stored properties
        if (localData.properties) {
          enhancedNode.properties = {
            ...enhancedNode.properties,
            ...localData.properties
          };
          console.log(`Enhanced node ${node.id} with local properties:`, enhancedNode.properties);
        } else {
          // Legacy format: properties at root level
          const propertiesToUpdate = {};
          Object.keys(localData).forEach(key => {
            if (key !== 'id' && key !== 'type' && key !== 'position' &&
                key !== 'sourceNodeRefs' && key !== 'height') {
              propertiesToUpdate[key] = localData[key];
            }
          });
          
          // Only update if we have properties to update
          if (Object.keys(propertiesToUpdate).length > 0) {
            enhancedNode.properties = {
              ...enhancedNode.properties,
              ...propertiesToUpdate
            };
          }
        }
        
        return enhancedNode;
      }
    } else {
      console.log(`No local storage data found for node ${node.id}`);
    }
    
    return node;
  } catch (error) {
    console.error('Error enhancing node with local data:', error);
    return node;
  }
};