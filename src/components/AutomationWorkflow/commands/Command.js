/**
 * Base Command interface to implement the Command Pattern
 * All commands should extend this base class and implement execute() and undo() methods
 */
export class Command {
  /**
   * Execute the command and return the result
   * @returns {any} The result of executing the command
   */
  execute() {
    throw new Error('Method execute() must be implemented by derived classes');
  }

  /**
   * Undo the command and return to the previous state
   * @returns {any} The result of undoing the command
   */
  undo() {
    throw new Error('Method undo() must be implemented by derived classes');
  }
}