import { AddNodeCommand } from '../commands';
import { executeGraphCommand } from '../utils/commandUtils';
import { createNewNode } from '../utils/NodeUtils';
import { CONNECTION_TYPES } from '../constants';

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

console.log('branchVerticalSpacing', branchVerticalSpacing);

    newPos = {
      x: branchEndpoint.x - (DEFAULT_NODE_WIDTH / 2) + branchOffset,
      y: branchEndpoint.y + branchVerticalSpacing
    };
  } else {
    // For standard connections, place new node below the source node
    console.log('standardVerticalSpacing for standard', standardVerticalSpacing);
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
 * Handle undo operation
 * 
 * @param {Object} commandManager - Command manager instance
 */
export const handleUndo = (commandManager) => {
  commandManager.undo();
};

/**
 * Handle redo operation
 * 
 * @param {Object} commandManager - Command manager instance
 */
export const handleRedo = (commandManager) => {
  commandManager.redo();
};