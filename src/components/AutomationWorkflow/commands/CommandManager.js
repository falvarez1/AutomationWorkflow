/**
 * CommandManager class that handles execution, undo, and redo of commands
 * Maintains the undo and redo stacks
 */
export class CommandManager {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = [];
  }

  /**
   * Execute a command and add it to the undo stack
   * @param {Command} command - The command to execute
   * @returns {any} The result of executing the command
   */
  executeCommand(command) {
    const result = command.execute();
    this.undoStack.push(command);
    // Clear redo stack when a new command is executed
    this.redoStack = [];
    this.notifyListeners();
    return result;
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
    const result = command.undo();
    this.redoStack.push(command);
    this.notifyListeners();
    return result;
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
    this.undoStack.push(command);
    this.notifyListeners();
    return result;
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
export default commandManager;