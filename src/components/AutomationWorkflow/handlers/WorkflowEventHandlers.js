import { AddNodeCommand } from '../commands';
import { executeGraphCommand } from '../utils/commandUtils';
import { createNewNode } from '../utils/NodeUtils';
import { CONNECTION_TYPES } from '../constants';
import { Graph } from '../graph/Graph';

/**
 * Handles adding a new step to the workflow
 * 
 * @param {string} nodeId - Source node ID to connect from
 * @param {string} nodeType - Type of node to create 
 * @param {string} connectionType - Type of connection to create
 * @param {string|null} branchId - Optional branch ID for branch connections
 * @param {Object} workflowGraph - Current workflow graph
 * @param {Function} setWorkflowGraph - State setter for workflow graph
 * @param {Object} commandManager - Command manager instance
 * @param {Function} getBranchEndpoint - Function to get branch endpoint position
 * @param {Object} pluginRegistry - Plugin registry
 * @param {Object} layout - Layout configuration values
 * @param {Function} handleCloseMenu - Function to close active menus
 * @param {Function} onSuccessCallback - Callback after successful add
 */
export const handleAddStep = (
  nodeId, 
  nodeType, 
  connectionType = CONNECTION_TYPES.DEFAULT,
  branchId = null,
  workflowGraph,
  setWorkflowGraph,
  commandManager,
  getBranchEndpoint,
  pluginRegistry,
  layout,
  handleCloseMenu,
  onSuccessCallback = null
) => {
  const sourceNode = workflowGraph.getNode(nodeId);
  if (!sourceNode) return;
  
  // Extract layout configuration
  const { 
    standardVerticalSpacing, 
    branchVerticalSpacing, 
    branchLeftOffset, 
    branchRightOffset, 
    DEFAULT_NODE_WIDTH 
  } = layout;
  
  // Calculate position for new node
  let newPos;
  
  if (connectionType === CONNECTION_TYPES.BRANCH && branchId) {
    // For branch connections, use the branch endpoint position
    const branchEndpoint = getBranchEndpoint(sourceNode, branchId);
    const isLeftNode = branchId === 'yes' || branchId === 'path1';
    
    // Use configurable branch offset
    const branchOffset = isLeftNode ? branchLeftOffset : branchRightOffset;

    newPos = {
      x: branchEndpoint.x - (DEFAULT_NODE_WIDTH / 2) + branchOffset,
      y: branchEndpoint.y + branchVerticalSpacing
    };
  } else {
    // For standard connections, place new node below the source node
    newPos = {
      x: sourceNode.position.x,
      y: sourceNode.position.y + standardVerticalSpacing
    };
  }
  
  // Create new node
  const newNode = createNewNode(nodeType, newPos, pluginRegistry);
  
  // Create and execute the add node command
  const addNodeCommand = new AddNodeCommand(
    workflowGraph,
    newNode,
    sourceNode.id,
    connectionType,
    branchId,
    pluginRegistry // Pass the pluginRegistry to the command for branch detection
  );
  
  // Execute command with commandUtils
  executeGraphCommand(addNodeCommand, commandManager, setWorkflowGraph, {
    onExecuteSuccess: () => {
      // Call success callback if provided
      if (onSuccessCallback) {
        onSuccessCallback(newNode);
      }
    }
  });
  
  // Close menu
  handleCloseMenu();
};

/**
 * Handle undo operation with reliable graph restore
 * 
 * @param {Object} commandManager - Command manager instance
 * @param {Function} setWorkflowGraph - Function to update workflow graph
 */
export const handleUndo = (commandManager, setWorkflowGraph) => {
  console.log("[WorkflowEventHandlers] Executing undo operation");
  
  // Execute the undo operation and get result
  const result = commandManager.undo();
  
  if (!result) {
    console.log("[WorkflowEventHandlers] Undo operation failed or no commands to undo");
    return false;
  }
  
  // After undo, use the most reliable graph state available
  try {
    // Create a completely fresh graph
    const freshGraph = new Graph();
    
    // Check if we have a command to get the graph state from
    let sourceGraph = null;
    
    // Option 1: Try to get the graph from the last redone command
    if (commandManager.lastRedoneCommand?.graph) {
      console.log("[WorkflowEventHandlers] Using graph from lastRedoneCommand");
      sourceGraph = commandManager.lastRedoneCommand.graph;
    }
    // Option 2: If there are commands in the undo stack, use the top one's graph
    else if (commandManager.undoStack.length > 0) {
      console.log("[WorkflowEventHandlers] Using graph from top of undo stack");
      sourceGraph = commandManager.undoStack[commandManager.undoStack.length - 1].graph;
    }
    
    if (sourceGraph) {
      // For complete reliability, we do a full deep copy using JSON
      // This ensures all references are broken and we have a fresh graph
      // Parse and stringify breaks all object references
      const allNodes = JSON.parse(JSON.stringify(sourceGraph.getAllNodes())); 
      
      // First add all nodes to ensure they exist before adding edges
      allNodes.forEach(node => {
        freshGraph.addNode(node);
      });
      
      // Then add all valid edges (ones where both source and target nodes exist)
      sourceGraph.getAllEdges().forEach(edge => {
        if (freshGraph.getNode(edge.sourceId) && freshGraph.getNode(edge.targetId)) {
          freshGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
        }
      });
      
      // Update the UI graph
      setWorkflowGraph(freshGraph);
      
      console.log(`[WorkflowEventHandlers] Undo restored graph with ${freshGraph.getAllNodes().length} nodes and ${freshGraph.getAllEdges().length} edges`);
    } else {
      console.warn("[WorkflowEventHandlers] No valid graph source found for undo operation");
    }
  } catch (error) {
    console.error("[WorkflowEventHandlers] Error during undo graph update:", error);
  }
  
  return result;
};

/**
 * Handle redo operation with similar reliability improvements
 * 
 * @param {Object} commandManager - Command manager instance
 * @param {Function} setWorkflowGraph - Function to update workflow graph
 */
export const handleRedo = (commandManager, setWorkflowGraph) => {
  console.log("[WorkflowEventHandlers] Executing redo operation");
  
  // Execute the redo operation and get result
  const result = commandManager.redo();
  
  if (!result) {
    console.log("[WorkflowEventHandlers] Redo operation failed or no commands to redo");
    return false;
  }
  
  // After redo, use the most reliable graph state available
  try {
    // Create a completely fresh graph
    const freshGraph = new Graph();
    
    // Get the graph from the last executed command (the one we just redid)
    if (commandManager.lastExecutedCommand?.graph) {
      // Full deep copy using JSON for reliability
      const allNodes = JSON.parse(JSON.stringify(commandManager.lastExecutedCommand.graph.getAllNodes()));
      
      // First add all nodes
      allNodes.forEach(node => {
        freshGraph.addNode(node);
      });
      
      // Then add all valid edges
      commandManager.lastExecutedCommand.graph.getAllEdges().forEach(edge => {
        if (freshGraph.getNode(edge.sourceId) && freshGraph.getNode(edge.targetId)) {
          freshGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
        }
      });
      
      // Update the UI graph
      setWorkflowGraph(freshGraph);
      
      console.log(`[WorkflowEventHandlers] Redo restored graph with ${freshGraph.getAllNodes().length} nodes and ${freshGraph.getAllEdges().length} edges`);
    } else {
      console.warn("[WorkflowEventHandlers] No valid graph source found for redo operation");
    }
  } catch (error) {
    console.error("[WorkflowEventHandlers] Error during redo graph update:", error);
  }
  
  return result;
};