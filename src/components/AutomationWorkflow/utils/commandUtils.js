import { Graph } from '../graph/Graph';

/**
 * Updates the workflow graph state after a command has been executed or undone
 * 
 * This consolidates the repetitive graph update pattern that appears
 * multiple times in the original AutomationWorkflow component
 * 
 * @param {Object} commandInstance - The command that was executed
 * @param {Function} setWorkflowGraph - React state setter for workflow graph
 */
export const updateGraphFromCommand = (commandInstance, setWorkflowGraph) => {
  setWorkflowGraph(() => {
    const newGraph = new Graph();
    commandInstance.graph.getAllNodes().forEach(node => newGraph.addNode({ ...node }));
    commandInstance.graph.getAllEdges().forEach(edge => {
      newGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
    });
    return newGraph;
  });
};

/**
 * Execute a command and update the graph state
 * 
 * @param {Command} command - The command to execute
 * @param {CommandManager} commandManager - Command manager instance
 * @param {Function} setWorkflowGraph - Function to update the workflow graph
 * @param {Object} options - Additional options
 * @param {Function} options.onExecuteSuccess - Callback on successful execution
 * @param {Function} options.onExecuteError - Callback on execution error
 */
export const executeGraphCommand = (
  command, 
  commandManager, 
  setWorkflowGraph, 
  options = {}
) => {
  try {
    // Special handling for DeleteNodeCommand to guarantee node removal
    if (command.constructor.name === 'DeleteNodeCommand') {
      const nodeId = command.nodeId;
      
      // Try executing the command
      const result = commandManager.executeCommand(command);
      
      // Update UI regardless of command success
      setTimeout(() => {
        setWorkflowGraph(currentGraph => {
          const freshGraph = new Graph();
          
          // Add all nodes except the deleted one
          currentGraph.getAllNodes().forEach(node => {
            if (node.id !== nodeId) {
              freshGraph.addNode({...node});
            }
          });
          
          // Add all edges except those connected to deleted node
          currentGraph.getAllEdges().forEach(edge => {
            if (edge.sourceId !== nodeId && edge.targetId !== nodeId) {
              freshGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
            }
          });
          
          return freshGraph;
        });
      }, 0);
      
      // Call appropriate callbacks
      if (result && options.onExecuteSuccess) {
        options.onExecuteSuccess(result);
      } else if (!result && options.onExecuteError) {
        options.onExecuteError(new Error('Delete command execution failed'));
      }
      
      return result;
    }
    
    // Regular command execution
    const result = commandManager.executeCommand(command);
    
    if (result) {
      // Create a proper graph instance from the command's graph
      setWorkflowGraph(() => {
        const freshGraph = new Graph();
        
        // Add all nodes to the fresh graph
        command.graph.getAllNodes().forEach(node => {
          freshGraph.addNode({...node});
        });
        
        // Add all edges to the fresh graph
        command.graph.getAllEdges().forEach(edge => {
          if (freshGraph.getNode(edge.sourceId) && freshGraph.getNode(edge.targetId)) {
            freshGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
          }
        });
        
        return freshGraph;
      });
      
      // Call success callback if provided
      if (options.onExecuteSuccess) {
        options.onExecuteSuccess(result);
      }
    } else if (options.onExecuteError) {
      options.onExecuteError(new Error('Command execution failed'));
    }
    
    return result;
  } catch (error) {
    console.error('Error executing graph command:', error);
    
    if (options.onExecuteError) {
      options.onExecuteError(error);
    }
    
    return false;
  }
}