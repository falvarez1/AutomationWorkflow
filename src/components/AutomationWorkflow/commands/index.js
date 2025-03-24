import { Command } from './Command';
import commandManager from './CommandManager';

// Original command pattern implementations 
import { DeleteNodeCommand as OriginalDeleteNodeCommand } from './DeleteNodeCommand';
import { MoveNodeCommand as OriginalMoveNodeCommand } from './MoveNodeCommand';
import { AddNodeCommand as OriginalAddNodeCommand } from './AddNodeCommand';

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
  DuplicateNodeCommand,
  
  // Original commands (renamed for backwards compatibility)
  OriginalAddNodeCommand,
  OriginalMoveNodeCommand,
  OriginalDeleteNodeCommand
};