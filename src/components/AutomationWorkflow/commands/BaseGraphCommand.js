import { Command } from './Command';

/**
 * Base class for all graph-based commands
 * Provides common structure and utilities for commands
 */
export class BaseGraphCommand  extends Command {
  /**
   * Create a new graph command
   * @param {Graph} graph - The workflow graph to operate on
   */
  constructor(graph) {
    super();
    if (!graph) {
      throw new Error('Graph is required for BaseGraphCommand');
    }
    this.graph = graph;
  }

  /**
   * Execute the command and return the result
   * All commands must implement this method
   * @returns {boolean} True if execution succeeded, false otherwise
   */
  execute() {
    throw new Error('Method execute() must be implemented by derived classes');
  }

  /**
   * Undo the command and return to the previous state
   * All commands must implement this method
   * @returns {boolean} True if undo succeeded, false otherwise
   */
  undo() {
    throw new Error('Method undo() must be implemented by derived classes');
  }
  
  /**
   * Helper to validate nodes exist in the graph
   * @param {...string} nodeIds - One or more node IDs to validate
   * @returns {boolean} True if all nodes exist
   */
  validateNodesExist(...nodeIds) {
    return nodeIds.every(id => id && this.graph.getNode(id));
  }
  
  /**
   * Helper to validate edges exist in the graph
   * @param {...string} edgeIds - One or more edge IDs to validate
   * @returns {boolean} True if all edges exist
   */
  validateEdgesExist(...edgeIds) {
    return edgeIds.every(id => id && this.graph.getEdge(id));
  }
  
  /**
   * Helper to log command execution details in debug mode
   * @param {string} commandName - Name of the command being executed
   * @param {Object} params - Command parameters to log
   */
  logDebug(commandName, params) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`Executing ${commandName}:`, params);
    }
  }
}
