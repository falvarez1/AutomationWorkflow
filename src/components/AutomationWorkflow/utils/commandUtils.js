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
  // First clear the graph (prevents stale state issues)
  setWorkflowGraph(new Graph());
  
  // Then set it to the new state from the command
  setWorkflowGraph(() => {
    const newGraph = new Graph();
    
    // Copy all nodes from the updated graph
    commandInstance.graph.getAllNodes().forEach(node => {
      newGraph.addNode({ ...node });
    });
    
    // Copy all edges from the updated graph
    commandInstance.graph.getAllEdges().forEach(edge => {
      newGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
    });
    
    return newGraph;
  });
};

/**
 * Executes a graph command with standardized execute and undo behavior
 * 
 * This centralizes the command pattern implementation and eliminates
 * the duplicate code that appears in multiple command handlers
 * 
 * @param {Object} command - The command to execute
 * @param {Object} commandManager - The command manager instance
 * @param {Function} setWorkflowGraph - React state setter
 * @param {Object} options - Additional options like callbacks
 */
export const executeGraphCommand = (
  command, 
  commandManager, 
  setWorkflowGraph, 
  options = {}
) => {
  const { onExecuteSuccess, onUndoSuccess } = options;
  
  commandManager.executeCommand({
    execute: () => {
      command.execute();
      updateGraphFromCommand(command, setWorkflowGraph);
      if (onExecuteSuccess) onExecuteSuccess(command);
      return true;
    },
    undo: () => {
      command.undo();
      updateGraphFromCommand(command, setWorkflowGraph);
      if (onUndoSuccess) onUndoSuccess(command);
      return true;
    }
  });
};