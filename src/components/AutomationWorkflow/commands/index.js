import { Command } from './Command';
import commandManager from './CommandManager';

// New graph-based command pattern implementations
import { 
  AddNodeCommand,
  MoveNodeCommand,
  DeleteNodeCommand,
  UpdateNodeCommand,
  UpdateEdgeCommand
} from './GraphCommands';

import { UpdateNodeHeightCommand } from './UpdateNodeHeightCommand';
import { DuplicateNodeCommand } from './DuplicateNodeCommand';

// Export with renamed original commands for backwards compatibility
export {
  Command,
  commandManager,
  
  // New graph-based commands
  AddNodeCommand,
  MoveNodeCommand,
  DeleteNodeCommand,
  UpdateNodeCommand,
  UpdateEdgeCommand,
  UpdateNodeHeightCommand,
  DuplicateNodeCommand

};