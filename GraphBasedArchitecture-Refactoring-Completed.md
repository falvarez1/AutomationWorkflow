# Graph-Based Architecture Refactoring

This document outlines the refactoring of the AutomationWorkflow component to adopt a more robust graph-based architecture as requested.

## Key Changes Implemented

### 1. Decoupled Nodes and Edges

- Created a separate `Edge` class in `Graph.js` to store connection details (source and target node IDs, labels, etc.)
- Edges now exist independently from nodes, allowing for more flexible relationship management
- Each edge has a unique ID and can store its type (default or branch) and any additional metadata

### 2. Map-Based Node Storage

- Replaced the array-based node storage with a `Map` keyed by node IDs
- This improves lookup efficiency from O(n) to O(1) when retrieving nodes by ID
- The `Graph` class provides methods to add, update, and remove nodes, as well as query nodes by various criteria

### 3. Normalized Connection Handling

- Unified the handling of standard outgoing connections and branch connections
- All connections are managed as edges with a consistent API
- Removed redundant logic by standardizing on the edge-based representation
- Edge types distinguish between default connections and branch connections

### 4. Graph Utility Functions

- Implemented a comprehensive `Graph` class that encapsulates node and edge management
- Added utility methods such as:
  - `addNode`, `removeNode`, `updateNode`, `getNode`, `getAllNodes`
  - `addEdge`, `removeEdge`, `updateEdge`, `getEdge`, `getAllEdges`
  - `connect` - To create edges between nodes
  - `getOutgoingEdges`, `getIncomingEdges`
  - `getDefaultOutgoingEdge`, `getBranchOutgoingEdges`
  - Conversion methods to/from the old format for backward compatibility

### 5. Graph Constraints and Validation

- Added cycle detection to prevent creating cycles in the directed graph
- The `wouldCreateCycle` method can be used to validate potential connections before adding them
- This ensures the workflow remains a Directed Acyclic Graph (DAG)

### 6. Refactored Command Pattern

- Updated command implementations to work with the graph-based structure
- Each command now operates on the graph directly
- Commands include:
  - `AddNodeCommand`
  - `MoveNodeCommand`
  - `DeleteNodeCommand`
  - `UpdateNodeCommand`
  - `UpdateEdgeCommand`

### 7. Centralized Constants

- Created a constants file to centralize configuration values
- This improves maintainability by having a single source of truth for constants
- Includes values for node dimensions, grid size, zoom limits, etc.

## Benefits of the New Architecture

1. **Improved Performance**: O(1) lookups for nodes and edges with the Map-based structure
2. **Enhanced Maintainability**: Clear separation of concerns between nodes and edges
3. **Better Extensibility**: Easier to add new node types and edge behaviors
4. **Simplified Logic**: Unified handling of different connection types
5. **More Robust**: Better validation to maintain graph integrity
6. **Easier Traversal**: Graph algorithms can be more easily implemented

## Files Created/Modified

1. `src/components/AutomationWorkflow/graph/Graph.js` - Core graph data structure
2. `src/components/AutomationWorkflow/commands/GraphCommands.js` - Updated command implementations
3. `src/components/AutomationWorkflow/constants.js` - Centralized constants
4. `src/components/AutomationWorkflow/commands/index.js` - Updated exports
5. `src/AutomationWorkflow.jsx` - Refactored component to use the new architecture

## Future Improvements

The following improvements could further enhance the graph-based architecture:

1. **Optimized Rendering**: Implement virtual rendering for large workflows
2. **Advanced Graph Algorithms**: Add pathfinding, topological sorting, etc.
3. **Serialization**: Add more robust serialization/deserialization for saving and loading workflows
4. **Edge Customization**: Allow custom edge styles and behaviors
5. **Grouping**: Support for grouping nodes to create sub-workflows