
/**
 * CommandManager class that handles execution, undo, and redo of commands
 * Maintains the undo and redo stacks
 */
export class CommandManager {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = [];
    this.lastExecutedCommand = null;
    this.lastRedoneCommand = null;
    this.operationSequence = 0; // Track operation sequence for debugging
  }

  /**
   * Execute a command and add it to the undo stack
   * @param {Command} command - The command to execute
   * @returns {any} The result of executing the command
   */
  executeCommand(command) {
    // Track sequence number for debugging
    this.operationSequence++;
    command._operationSequence = this.operationSequence;
    command._operationType = command.constructor.name;
    
    // Store the current graph state before execution for reference
    if (command.graph) {
      // Create a snapshot of the graph before execution
      command._preExecutionGraph = this._createGraphSnapshot(command.graph);
    }
    
    const result = command.execute();
    
    if (result) {
      this.undoStack.push(command);
      this.lastExecutedCommand = command;
      // Clear redo stack when a new command is executed
      this.redoStack = [];
      this.lastRedoneCommand = null;
      this.notifyListeners();
    }
    
    return result;
  }

  /**
   * Creates a snapshot of a graph (just nodes and edges)
   * @private
   */
  _createGraphSnapshot(graph) {
    if (!graph) return null;
    
    // Only store the structure we need for reference
    return {
      nodes: graph.getAllNodes().map(node => ({
        id: node.id,
        type: node.type,
        position: {...node.position}
      })),
      edges: graph.getAllEdges().map(edge => ({
        sourceId: edge.sourceId,
        targetId: edge.targetId,
        type: edge.type,
        label: edge.label
      }))
    };
  }

  /**
   * Undo the last command
   * @returns {any} The result of undoing the command
   */
  undo() {
    if (this.undoStack.length === 0) {
      return null;
    }

    const command = this.undoStack.pop();
    
    // Log operation for debugging
    console.log(`Undoing ${command._operationType} (sequence: ${command._operationSequence})`);
    
    const result = command.undo();
    
    if (result === true) {
      this.redoStack.push(command);
      this.lastRedoneCommand = command;
      this.notifyListeners();
      return result;
    } else {
      // If undo fails, restore command to undo stack
      this.undoStack.push(command);
      return false;
    }
  }

  /**
   * Redo the last undone command
   * @returns {any} The result of redoing the command
   */
  redo() {
    if (this.redoStack.length === 0) {
      return null;
    }

    const command = this.redoStack.pop();
    const result = command.execute();
    
    if (result === true) {
      this.undoStack.push(command);
      this.lastExecutedCommand = command;
      this.notifyListeners();
      return result;
    } else {
      // If redo fails, keep command in redo stack
      this.redoStack.push(command);
      return false;
    }
  }

  /**
   * Get the most recently executed command
   * @returns {Command} The last executed command
   */
  getLastExecutedCommand() {
    return this.lastExecutedCommand;
  }
  
  /**
   * Get the most recently redone command
   * @returns {Command} The last redone command
   */
  getLastRedoneCommand() {
    return this.lastRedoneCommand;
  }

  /**
   * Check if undo can be performed
   * @returns {boolean} True if there are commands in the undo stack
   */
  canUndo() {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo can be performed
   * @returns {boolean} True if there are commands in the redo stack
   */
  canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Add a listener for command stack changes
   * @param {Function} listener - The listener function to add
   */
  addListener(listener) {
    this.listeners.push(listener);
  }

  /**
   * Remove a listener
   * @param {Function} listener - The listener function to remove
   */
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners of changes to the undo/redo stacks
   */
  notifyListeners() {
    const state = {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    };
    this.listeners.forEach(listener => listener(state));
  }
}

// Create a singleton instance
const commandManager = new CommandManager();

// Make command manager available for debugging and cross-references
window.commandManager = commandManager;

export default commandManager;