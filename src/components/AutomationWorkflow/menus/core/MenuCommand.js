/**
 * Interface for menu commands following the Command Pattern
 * Commands encapsulate actions to be executed when menu items are clicked
 */
export class MenuCommand {
  /**
   * Execute the command with the provided data
   * @param {Object} data - Data needed to execute the command
   */
  execute(data = {}) {
    throw new Error("Method 'execute' must be implemented by subclasses");
  }
}

/**
 * Command for adding a new node
 */
export class AddNodeCommand extends MenuCommand {
  /**
   * @param {Function} addNodeCallback - Callback function for adding a node
   * @param {Object} options - Options for the command
   */
  constructor(addNodeCallback, options = {}) {
    super();
    this.addNodeCallback = addNodeCallback;
    this.options = options;
  }

  execute(data = {}) {
    const {
      nodeId,
      nodeType,
      connectionType = 'default',
      branchId = null
    } = { ...this.options, ...data };

    if (this.addNodeCallback && nodeId && nodeType) {
      return this.addNodeCallback(nodeId, nodeType, connectionType, branchId);
    }
    return false;
  }
}

/**
 * Command for deleting a node
 */
export class DeleteNodeCommand extends MenuCommand {
  /**
   * @param {Function} deleteNodeCallback - Callback function for deleting a node
   */
  constructor(deleteNodeCallback) {
    super();
    this.deleteNodeCallback = deleteNodeCallback;
  }

  execute(data = {}) {
    const { nodeId } = data;
    
    if (this.deleteNodeCallback && nodeId) {
      return this.deleteNodeCallback(nodeId);
    }
    return false;
  }
}

/**
 * Command for editing a node
 */
export class EditNodeCommand extends MenuCommand {
  /**
   * @param {Function} editNodeCallback - Callback function for editing a node
   */
  constructor(editNodeCallback) {
    super();
    this.editNodeCallback = editNodeCallback;
  }

  execute(data = {}) {
    const { nodeId } = data;
    
    if (this.editNodeCallback && nodeId) {
      return this.editNodeCallback(nodeId);
    }
    return false;
  }
}

/**
 * Command for duplicating a node
 */
export class DuplicateNodeCommand extends MenuCommand {
  /**
   * @param {Function} duplicateNodeCallback - Callback function for duplicating a node
   */
  constructor(duplicateNodeCallback) {
    super();
    this.duplicateNodeCallback = duplicateNodeCallback;
  }

  execute(data = {}) {
    const { nodeId } = data;
    
    if (this.duplicateNodeCallback && nodeId) {
      return this.duplicateNodeCallback(nodeId);
    }
    return false;
  }
}

/**
 * Command for showing/toggling a menu
 */
export class ToggleMenuCommand extends MenuCommand {
  /**
   * @param {Function} toggleMenuCallback - Callback function for showing/toggling a menu
   * @param {Object} options - Options for the command
   */
  constructor(toggleMenuCallback, options = {}) {
    super();
    this.toggleMenuCallback = toggleMenuCallback;
    this.options = options;
  }

  execute(data = {}) {
    const mergedData = { ...this.options, ...data };
    
    if (this.toggleMenuCallback) {
      return this.toggleMenuCallback(mergedData);
    }
    return false;
  }
}

/**
 * Command that executes a custom function
 */
export class FunctionCommand extends MenuCommand {
  /**
   * @param {Function} fn - Function to execute
   */
  constructor(fn) {
    super();
    this.fn = fn;
  }

  execute(data = {}) {
    if (typeof this.fn === 'function') {
      return this.fn(data);
    }
    return false;
  }
}

/**
 * Factory function to create a command by type
 * @param {string} commandType - Type of command to create
 * @param {Object} config - Configuration for the command
 * @returns {MenuCommand} The created command
 */
export function createCommand(commandType, config = {}) {
  switch (commandType) {
    case 'addNode':
      return new AddNodeCommand(config.callback, config.options);
    case 'deleteNode':
      return new DeleteNodeCommand(config.callback);
    case 'editNode':
      return new EditNodeCommand(config.callback);
    case 'duplicateNode':
      return new DuplicateNodeCommand(config.callback);
    case 'toggleMenu':
      return new ToggleMenuCommand(config.callback, config.options);
    case 'function':
      return new FunctionCommand(config.callback);
    default:
      throw new Error(`Unknown command type: ${commandType}`);
  }
}