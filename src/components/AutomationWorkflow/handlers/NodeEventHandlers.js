import { Graph } from '../graph/Graph';
import { 
  MoveNodeCommand, 
  UpdateNodeCommand, 
  DeleteNodeCommand,
  DuplicateNodeCommand,
  UpdateNodeHeightCommand
} from '../commands';
import { executeGraphCommand } from '../utils/commandUtils';
import { ensureElementVisibility } from '../utils/positionUtils';
import { animationManager } from '../utils/AnimationManager';
import { GRID_SIZE, DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT } from '../constants';

/**
 * Handles node height changes
 *
 * @param {string} id - Node ID
 * @param {number} height - New height value
 * @param {Object} workflowGraph - Current graph state
 * @param {Object} setWorkflowGraph - State setter function
 * @param {Object} commandManager - Command manager instance - not used, height changes bypass undo stack
 */
export const handleNodeHeightChange = (id, height, workflowGraph, setWorkflowGraph, commandManager) => {
  // Direct update without creating a command
  // This prevents height changes from being added to the undo/redo stack
  
  // Update the node height directly in the graph state
  setWorkflowGraph(prevGraph => {
    const newGraph = new Graph();
    
    // Copy all nodes with updated height for the target node
    prevGraph.getAllNodes().forEach(node => {
      if (node.id === id) {
        const updatedNode = {
          ...node,
          height: height
        };
        newGraph.addNode(updatedNode);
      } else {
        newGraph.addNode({ ...node });
      }
    });
    
    // Copy all edges
    prevGraph.getAllEdges().forEach(edge => {
      newGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
    });
    
    return newGraph;
  });
};

/**
 * Handles node click for editing or action execution
 * 
 * @param {string} id - Node ID
 * @param {string} action - Optional action to perform
 * @param {Object} workflowGraph - Current graph state
 * @param {Function} setWorkflowGraph - State setter function
 * @param {Function} setSelectedNodeId - State setter for selected node
 * @param {Object} transform - Current canvas transform
 * @param {Function} setTransform - State setter for transform
 * @param {Object} references - React refs needed for tracking state
 * @param {Function} handleDeleteNode - Function to delete a node
 * @param {Object} commandManager - Command manager instance
 * @param {Function} generateUniqueId - Function to generate unique IDs
 */
export const handleStepClick = (
  id, 
  action, 
  workflowGraph, 
  setWorkflowGraph, 
  setSelectedNodeId, 
  transform, 
  setTransform, 
  references, 
  handleDeleteNode,
  commandManager,
  generateUniqueId
) => {
  if (!id) return;
  
  // If an action is provided, handle the context menu action
  if (action) {
    switch (action) {
      case 'delete':
        handleDeleteNode(id);
        return;
      case 'duplicate':
        // Implement duplicate functionality
        const duplicateCommand = new DuplicateNodeCommand(
          workflowGraph,
          id,
          generateUniqueId, // Using imported util function
          50, // X offset
          50  // Y offset
        );
        
        executeGraphCommand(duplicateCommand, commandManager, setWorkflowGraph, {
          onExecuteSuccess: (result) => {
            if (result && duplicateCommand.newNodeId) {
              // Start animation for the new node
              animationManager.startAnimation(
                duplicateCommand.newNodeId,
                'nodeAdd'
              );
            }
          }
        });
        return;
      case 'edit':
        // Already handled by selecting the node
        break;
      default:
        // Handle other node-specific actions
        break;
    }
  }
  
  // Get the node info to check if it would be occluded
  const node = workflowGraph.getNode(id);
  if (node) {
    // Create a rectangle representing the node's boundaries
    const nodeRect = {
      left: node.position.x,
      right: node.position.x + DEFAULT_NODE_WIDTH,
      top: node.position.y,
      bottom: node.position.y + (node.height || DEFAULT_NODE_HEIGHT)
    };
    
    // Check if node would be occluded and pan if needed
    // Pass true for propertyPanelOpen since selecting the node will open the panel
    ensureElementVisibility(nodeRect, transform, setTransform, true);
  }
  
  // Always select the node on click (no toggling anymore)
  setSelectedNodeId(id);
  
  // We still set justClickedNodeRef for actual clicks (not for drag operations)
  // This helps prevent node deselection on legitimate clicks
  references.justClickedNodeRef.current = true;
  
  // Clear this flag after a short delay
  setTimeout(() => {
    references.justClickedNodeRef.current = false;
  }, 200);
};

/**
 * Handles node dragging with optional grid snapping
 *
 * @param {string} id - Node ID
 * @param {number} x - New X position
 * @param {number} y - New Y position
 * @param {boolean} snapToGrid - Whether to snap to grid
 * @param {Object} workflowGraph - Current graph state
 * @param {Function} setWorkflowGraph - State setter function
 */
export const handleNodeDrag = (id, x, y, snapToGrid, workflowGraph, setWorkflowGraph) => {
  let newX = x;
  let newY = y;
  
  // No special handling needed during drag - nodes move freely with the cursor
  // Grid snapping will be applied at the end of the drag if the global setting is enabled
  
  // Update the node position in the graph
  setWorkflowGraph(prevGraph => {
    const newGraph = new Graph();
    
    // Copy all nodes with updated position for the dragged node
    prevGraph.getAllNodes().forEach(node => {
      if (node.id === id) {
        // Store the current drag position on the node temporarily
        const updatedNode = {
          ...node,
          position: { x: newX, y: newY },
          _currentDragPosition: { x: newX, y: newY }, // Store for use in handleNodeDragEnd
          _gridOffset: node._gridOffset // Preserve the grid offset
        };
        newGraph.addNode(updatedNode);
      } else {
        newGraph.addNode({ ...node });
      }
    });
    
    // Copy all edges
    prevGraph.getAllEdges().forEach(edge => {
      newGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
    });
    
    return newGraph;
  });
};

/**
 * Handles start of node dragging
 * 
 * @param {string} id - Node ID
 * @param {Object} position - Current node position
 * @param {Function} setDragStartPosition - State setter for drag start position
 * @param {Function} handleCloseMenu - Function to close active menus
 */
export const handleNodeDragStart = (id, position, setDragStartPosition, handleCloseMenu) => {
  // Save the start position for the move command
  setDragStartPosition({ ...position });
  
  // Explicitly close the menu when drag starts
  handleCloseMenu();
};

/**
 * Handles end of node dragging
 *
 * @param {string} id - Node ID
 * @param {Object} dragStartPosition - Starting position of drag
 * @param {Object} workflowGraph - Current graph state
 * @param {Function} setWorkflowGraph - State setter function
 * @param {Function} setDragStartPosition - State setter for drag position
 * @param {Object} commandManager - Command manager instance
 * @param {boolean} globalSnapToGrid - Current global snap to grid setting
 */
export const handleNodeDragEnd = (id, dragStartPosition, workflowGraph, setWorkflowGraph, setDragStartPosition, commandManager, globalSnapToGrid) => {
  if (!dragStartPosition) return;
  
  const node = workflowGraph.getNode(id);
  if (!node) return;
  
  // Get final position from the temp drag position we stored
  let currentPosition = node._currentDragPosition || node.position;
  
  // Apply grid snapping at the end of dragging if needed
  if (globalSnapToGrid) {
    // Apply grid snapping to the final position
    currentPosition = {
      x: Math.round(currentPosition.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(currentPosition.y / GRID_SIZE) * GRID_SIZE
    };
  }
  
  // Only create a command if the position actually changed
  if (dragStartPosition.x !== currentPosition.x || dragStartPosition.y !== currentPosition.y) {
    // Create a move command
    const moveNodeCommand = new MoveNodeCommand(
      workflowGraph,
      id,
      { ...dragStartPosition },
      { ...currentPosition }
    );
    
    // Execute command with commandUtils
    executeGraphCommand(moveNodeCommand, commandManager, setWorkflowGraph);
  } else {
    // If position didn't change, ensure the graph state is updated with the final position
    // This handles the case where the drag was cancelled or didn't result in movement
    setWorkflowGraph(prevGraph => {
      const newGraph = new Graph();
      
      prevGraph.getAllNodes().forEach(node => {
        // Remove any temporary drag properties
        const cleanedNode = { ...node };
        delete cleanedNode._currentDragPosition;
        newGraph.addNode(cleanedNode);
      });
      
      prevGraph.getAllEdges().forEach(edge => {
        newGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
      });
      
      return newGraph;
    });
  }
  
  // Reset the start position
  setDragStartPosition(null);
};

/**
 * Handles node property updates
 * 
 * @param {string} nodeId - Node ID
 * @param {string} propertyId - Property name to update
 * @param {any} value - New property value
 * @param {Object} workflowGraph - Current graph state
 * @param {Function} setWorkflowGraph - State setter function
 * @param {Object} commandManager - Command manager instance
 */
export const handleUpdateNodeProperty = (nodeId, propertyId, value, workflowGraph, setWorkflowGraph, commandManager) => {
  if (!nodeId) return;
  
  // Get the current node
  const node = workflowGraph.getNode(nodeId);
  if (!node) return;
  
  // Create a command to update the property
  const updateCommand = new UpdateNodeCommand(
    workflowGraph,
    nodeId,
    {
      properties: {
        ...node.properties,
        [propertyId]: value
      }
    }
  );
  
  // Execute command with commandUtils
  executeGraphCommand(updateCommand, commandManager, setWorkflowGraph);
};

/**
 * Handles deleting a node
 * 
 * @param {string} nodeId - Node ID to delete
 * @param {Object} workflowGraph - Current graph state
 * @param {Function} setWorkflowGraph - State setter function
 * @param {string} selectedNodeId - Currently selected node ID
 * @param {Function} setSelectedNodeId - State setter for selected node
 * @param {Object} commandManager - Command manager instance
 */
export const handleDeleteNode = (nodeId, workflowGraph, setWorkflowGraph, selectedNodeId, setSelectedNodeId, commandManager) => {
  if (!nodeId) return;
  
  // Create delete command
  const deleteNodeCommand = new DeleteNodeCommand(workflowGraph, nodeId);
  
  // Execute command with commandUtils
  executeGraphCommand(deleteNodeCommand, commandManager, setWorkflowGraph, {
    onExecuteSuccess: () => {
      // Clear selected node if it was deleted
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
    }
  });
};