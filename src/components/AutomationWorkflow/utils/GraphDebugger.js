import { Graph } from '../graph/Graph';

/**
 * Utility class for debugging graph state
 * Provides methods for pretty-printing graph structure
 */
export class GraphDebugger {
  /**
   * Generate a detailed formatted representation of the graph
   * @param {Graph} graph - The graph to debug
   * @returns {string} Formatted string representation
   */
  static formatGraph(graph) {
    if (!graph) return 'Graph is null or undefined';
    
    const nodes = graph.getAllNodes();
    const edges = graph.getAllEdges();
    
    let output = '\n=== GRAPH DEBUG INFORMATION ===\n\n';
    
    // Summary
    output += `Total nodes: ${nodes.length}\n`;
    output += `Total edges: ${edges.length}\n\n`;
    
    // Node details
    output += '=== NODES ===\n';
    nodes.forEach((node, index) => {
      output += `Node ${index + 1}: id=${node.id}, type=${node.type}, title=${node.title || 'Untitled'}\n`;
      output += `    position: x=${node.position.x.toFixed(2)}, y=${node.position.y.toFixed(2)}\n`;
      output += `    properties: ${JSON.stringify(node.properties)}\n`;
      output += `    connections: incoming=${graph.getIncomingEdges(node.id).length}, outgoing=${graph.getOutgoingEdges(node.id).length}\n`;
      output += '\n';
    });
    
    // Edge details
    output += '=== EDGES ===\n';
    edges.forEach((edge, index) => {
      output += `Edge ${index + 1}: id=${edge.id}\n`;
      output += `    From: ${edge.sourceId} → To: ${edge.targetId}\n`;
      output += `    Type: ${edge.type}${edge.label ? ', Label: ' + edge.label : ''}\n`;
      output += '\n';
    });
    
    return output;
  }
  
  /**
   * Print graph info to console
   * @param {Graph} graph - The graph to debug
   */
  static logGraph(graph) {
    console.log(this.formatGraph(graph));
  }
  
  /**
   * Create a summarized object representation of the graph for console output
   * @param {Graph} graph - The graph to summarize
   * @returns {Object} Object suitable for console.table()
   */
  static summarizeGraph(graph) {
    if (!graph) return {};
    
    const nodes = graph.getAllNodes();
    const edges = graph.getAllEdges();
    
    return {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: `(${node.position.x.toFixed(0)},${node.position.y.toFixed(0)})`,
        inEdges: graph.getIncomingEdges(node.id).length,
        outEdges: graph.getOutgoingEdges(node.id).length
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.sourceId,
        target: edge.targetId,
        type: edge.type,
        label: edge.label || ''
      }))
    };
  }
  
  /**
   * Print a table view of nodes and edges to console
   * @param {Graph} graph - The graph to visualize
   */
  static tableView(graph) {
    if (!graph) {
      console.warn('Graph is null or undefined');
      return;
    }
    
    const summary = this.summarizeGraph(graph);
    
    console.group('Graph Summary');
    console.log(`Total nodes: ${summary.nodes.length}`);
    console.log(`Total edges: ${summary.edges.length}`);
    console.groupEnd();
    
    console.group('Nodes');
    console.table(summary.nodes);
    console.groupEnd();
    
    console.group('Edges');
    console.table(summary.edges);
    console.groupEnd();
  }

  /**
   * Find all possible sources of a ghost node
   * @param {string} nodeId - The node ID to track
   * @returns {Array} Sources containing references to this node
   */
  static findNodeReferences(nodeId) {
    const sources = [];
    
    // Check if it's the currently selected node
    if (window.__workflowState?.selectedNodeId === nodeId) {
      sources.push({source: 'selectedNodeId', ref: window.__workflowState.selectedNodeId});
    }
    
    // Check workflowGraph
    const workflowGraph = window.__workflowState?.workflowGraph;
    if (workflowGraph && workflowGraph.getNode(nodeId)) {
      sources.push({source: 'workflowGraph', ref: workflowGraph.getNode(nodeId)});
    }
    
    // Check workflowSteps
    const workflowSteps = window.__workflowState?.workflowSteps;
    if (workflowSteps) {
      const step = workflowSteps.find(s => s.id === nodeId);
      if (step) {
        sources.push({source: 'workflowSteps', ref: step});
      }
      
      // Also check connections in steps that might point to this node
      workflowSteps.forEach(s => {
        // Check default connections
        if (s.outgoingConnections?.default?.targetNodeId === nodeId) {
          sources.push({
            source: `workflowSteps[${s.id}].outgoingConnections.default`,
            ref: s.outgoingConnections.default
          });
        }
        
        // Check branch connections
        if (s.branchConnections) {
          Object.entries(s.branchConnections).forEach(([branchId, connection]) => {
            if (connection.targetNodeId === nodeId) {
              sources.push({
                source: `workflowSteps[${s.id}].branchConnections[${branchId}]`,
                ref: connection
              });
            }
          });
        }
      });
    }
    
    // Check command stacks for references
    const commandManager = window.__workflowState?.commandManager;
    if (commandManager) {
      // Check undo stack
      commandManager.undoStack.forEach((cmd, i) => {
        if (cmd.nodeId === nodeId) {
          sources.push({source: `commandManager.undoStack[${i}]`, ref: cmd});
        }
      });
      
      // Check redo stack
      commandManager.redoStack.forEach((cmd, i) => {
        if (cmd.nodeId === nodeId) {
          sources.push({source: `commandManager.redoStack[${i}]`, ref: cmd});
        }
      });
    }
    
    return sources;
  }

  /**
   * Attach debugger to window globally 
   * @param {Object} workflowGraph - The workflow graph
   * @param {Object} commandManager - The command manager
   * @param {Function} setWorkflowGraph - Function to update workflow graph
   * @param {Function} setWorkflowSteps - Function to update workflow steps
   */
  static setupDebugger(workflowGraph, commandManager, setWorkflowGraph, setWorkflowSteps = null) {
    // Add debug helpers to track state
    window.__workflowState = {
      workflowGraph,
      commandManager,
      setWorkflowGraph,
      setWorkflowSteps, // Store the workflowSteps setter
      get selectedNodeId() {
        return window._selectedNodeId || null;
      },
      set selectedNodeId(value) {
        window._selectedNodeId = value;
      },
      workflowSteps: null // Will be populated by component
    };
    
    // Create debugging tools
    const debugTools = {
      getGraph: () => workflowGraph,
      logGraph: () => GraphDebugger.logGraph(workflowGraph),
      tableGraph: () => GraphDebugger.tableView(workflowGraph),
      showNodeDetails: (nodeId) => {
        const node = workflowGraph.getNode(nodeId);
        if (node) {
          console.log('Node details:', node);
          console.log('Incoming edges:', workflowGraph.getIncomingEdges(nodeId));
          console.log('Outgoing edges:', workflowGraph.getOutgoingEdges(nodeId));
        } else {
          console.warn(`Node ${nodeId} not found`);
        }
        return node;
      },
      getCommandHistory: () => ({

        undoStack: window.commandManager.undoStack.map(cmd => ({
            operationSequence: cmd._operationSequence,
            operationType: cmd._operationType,
            preExecutionGraph: cmd._preExecutionGraph || null
          })),
          redoStack: window.commandManager.redoStack.map(cmd => ({
            operationSequence: cmd._operationSequence,
            operationType: cmd._operationType,
            preExecutionGraph: cmd._preExecutionGraph || null
          }))
      }),
      validateGraph: () => {
        const result = workflowGraph.verifyIntegrity ? 
          workflowGraph.verifyIntegrity() : 
          { isValid: true, errors: [] };
          
        console.log(`Graph integrity: ${result.isValid ? 'Valid' : 'Invalid'}`);
        if (!result.isValid) {
          console.error('Errors:', result.errors);
        }
        return result;
      },
      // Add a function to manually force refresh the graph
      forceRefresh: () => {
        if (setWorkflowGraph) {
          console.log('Forcing graph refresh...');
          setWorkflowGraph(currentGraph => {
            const refreshed = new Graph();
            
            // Create deep copies of all nodes and edges
            const nodesCopy = JSON.parse(JSON.stringify(currentGraph.getAllNodes()));
            nodesCopy.forEach(node => refreshed.addNode(node));
            
            // Reconnect all edges
            currentGraph.getAllEdges().forEach(edge => {
              refreshed.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
            });
            
            return refreshed;
          });
          return true;
        }
        return false;
      },
      // Add ghost node finder
      findNodeReferences: (nodeId) => {
        return GraphDebugger.findNodeReferences(nodeId);
      },
      
      // Add command to list all deleted node IDs still referenced
      findGhostNodes: () => {
        // Get the set of nodes that should exist
        const validNodeIds = new Set(workflowGraph.getAllNodes().map(node => node.id));
        const ghostNodes = [];
        
        // Check workflowSteps for ghost references
        if (window.__workflowState?.workflowSteps) {
          window.__workflowState.workflowSteps.forEach(step => {
            if (!validNodeIds.has(step.id)) {
              ghostNodes.push({
                id: step.id,
                source: 'workflowSteps',
                references: GraphDebugger.findNodeReferences(step.id)
              });
            }
          });
        }
        
        // Check command history for ghost references
        if (commandManager) {
          // Check deleted nodes in undo commands
          commandManager.undoStack.forEach((cmd, i) => {
            if (cmd.nodeId && !validNodeIds.has(cmd.nodeId)) {
              ghostNodes.push({
                id: cmd.nodeId,
                source: `commandManager.undoStack[${i}]`,
                type: cmd.constructor.name
              });
            }
          });
          
          // Check deleted nodes in redo commands
          commandManager.redoStack.forEach((cmd, i) => {
            if (cmd.nodeId && !validNodeIds.has(cmd.nodeId)) {
              ghostNodes.push({
                id: cmd.nodeId,
                source: `commandManager.redoStack[${i}]`,
                type: cmd.constructor.name
              });
            }
          });
        }
        
        console.table(ghostNodes);
        return ghostNodes;
      },
      
      // Add a function to purge ghost nodes
      purgeGhostNodes: () => {
        console.log('Starting comprehensive ghost node cleanup...');
        
        // Get valid node IDs
        const validNodeIds = new Set(workflowGraph.getAllNodes().map(node => node.id));
        let purgedCount = 0;
        
        // 1. First purge from the graph itself
        if (setWorkflowGraph) {
          setWorkflowGraph(currentGraph => {
            const cleanGraph = new Graph();
            
            // Only include valid nodes
            currentGraph.getAllNodes().forEach(node => {
              if (validNodeIds.has(node.id)) {
                cleanGraph.addNode(JSON.parse(JSON.stringify(node)));
              } else {
                console.log(`Purged ghost node: ${node.id}`);
                purgedCount++;
              }
            });
            
            // Only include valid edges
            currentGraph.getAllEdges().forEach(edge => {
              if (validNodeIds.has(edge.sourceId) && validNodeIds.has(edge.targetId)) {
                cleanGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
              }
            });
            
            return cleanGraph;
          });
        }
        
        // 2. Clean up workflowSteps if available
        if (window.__workflowState?.workflowSteps && window.__workflowState.setWorkflowSteps) {
          // Get the setter function if available
          const setWorkflowSteps = window.__workflowState.setWorkflowSteps;
          
          // Filter out ghost nodes and connections
          const cleanSteps = window.__workflowState.workflowSteps.filter(step => 
            validNodeIds.has(step.id)
          ).map(step => {
            // Clean any outgoing connections to deleted nodes
            const cleanStep = {...step};
            
            // Clean default connections
            if (cleanStep.outgoingConnections?.default?.targetNodeId) {
              if (!validNodeIds.has(cleanStep.outgoingConnections.default.targetNodeId)) {
                delete cleanStep.outgoingConnections.default;
              }
            }
            
            // Clean branch connections
            if (cleanStep.branchConnections) {
              Object.entries(cleanStep.branchConnections).forEach(([branchId, connection]) => {
                if (!validNodeIds.has(connection.targetNodeId)) {
                  delete cleanStep.branchConnections[branchId];
                }
              });
            }
            
            return cleanStep;
          });
          
          // Update workflowSteps state
          setWorkflowSteps(cleanSteps);
          console.log(`Cleaned ghost nodes from workflowSteps: ${window.__workflowState.workflowSteps.length - cleanSteps.length}`);
        } else {
          console.log('WorkflowSteps not available for cleaning');
        }

        // 3. Clean up command stacks
        if (commandManager) {
          // Create fresh stacks without ghost node references
          const cleanUndoStack = [];
          const cleanRedoStack = [];
          
          // Process undo stack
          for (const cmd of commandManager.undoStack) {
            // Skip commands that reference deleted nodes
            if (cmd.nodeId && !validNodeIds.has(cmd.nodeId)) {
              console.log(`Skipping undo command with ghost node: ${cmd.nodeId} (${cmd.constructor.name})`);
              purgedCount++;
              continue;
            }
            
            // For commands with a graph, ensure the graph is clean
            if (cmd.graph) {
              // Clean the command's graph if possible
              const dirtyNodeIds = [];
              cmd.graph.getAllNodes().forEach(node => {
                if (!validNodeIds.has(node.id)) {
                  dirtyNodeIds.push(node.id);
                }
              });
              
              if (dirtyNodeIds.length > 0) {
                console.log(`Command contains ghost nodes: [${dirtyNodeIds.join(', ')}]`);
                continue; // Skip commands with ghost nodes in their graph
              }
            }
            
            // Only keep clean commands
            cleanUndoStack.push(cmd);
          }
          
          // Process redo stack
          for (const cmd of commandManager.redoStack) {
            // Skip commands that reference deleted nodes
            if (cmd.nodeId && !validNodeIds.has(cmd.nodeId)) {
              console.log(`Skipping redo command with ghost node: ${cmd.nodeId}`);
              purgedCount++;
              continue;
            }
            
            // For commands with a graph, ensure the graph is clean
            if (cmd.graph) {
              // Check for ghost nodes
              const dirtyNodeIds = [];
              cmd.graph.getAllNodes().forEach(node => {
                if (!validNodeIds.has(node.id)) {
                  dirtyNodeIds.push(node.id);
                }
              });
              
              if (dirtyNodeIds.length > 0) {
                console.log(`Command contains ghost nodes: [${dirtyNodeIds.join(', ')}]`);
                continue; // Skip commands with ghost nodes in their graph
              }
            }
            
            // Only keep clean commands
            cleanRedoStack.push(cmd);
          }
          
          // Log the cleanup results
          console.log(`Cleaned command stacks: removed ${commandManager.undoStack.length - cleanUndoStack.length} from undo stack, ${commandManager.redoStack.length - cleanRedoStack.length} from redo stack`);
          
          // Replace the command stacks
          commandManager.undoStack = cleanUndoStack;
          commandManager.redoStack = cleanRedoStack;
          
          // Update the command manager state
          commandManager.notifyListeners();
        }
        
        // 4. Clear the last deleted node tracker
        if (window._lastDeletedNodeId) {
          console.log(`Clearing last deleted node ID: ${window._lastDeletedNodeId}`);
          window._lastDeletedNodeId = null;
        }
        
        // 5. Force a re-render of the component to make sure UI is updated
        if (setWorkflowGraph) {
          setTimeout(() => {
            setWorkflowGraph(graph => {
              // Create a fresh copy to trigger a re-render
              const freshGraph = new Graph();
              graph.getAllNodes().forEach(node => {
                freshGraph.addNode({...node});
              });
              graph.getAllEdges().forEach(edge => {
                freshGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
              });
              return freshGraph;
            });
          }, 50);
        }
        
        console.log(`Cleanup complete. Purged total of ${purgedCount} ghost node references.`);
        return purgedCount;
      },
      
      // Add a function to cleanup the graph
      cleanupGraph: () => {
        console.log('Starting deep graph cleanup...');
        
        // First identify ghost nodes using the deleted node registry
        if (window.__workflowState?.workflowGraph) {
          const graph = window.__workflowState.workflowGraph;
          
          // Clean from command manager history first
          if (commandManager) {
            console.log('Cleaning command stacks...');
            
            // Reset command stacks completely - this is a radical solution
            commandManager.undoStack = [];
            commandManager.redoStack = [];
            commandManager.notifyListeners();
          }
          
          // Now create a completely fresh graph using createCleanCopy
          if (setWorkflowGraph) {
            console.log('Creating fresh graph instance...');
            setWorkflowGraph(graph.createCleanCopy());
          }
          
          // Purge state in workflowSteps
          if (setWorkflowSteps) {
            console.log('Resetting workflow steps from clean graph...');
            
            const cleanGraph = graph.createCleanCopy();
            const nodes = cleanGraph.getAllNodes();
            
            // Convert Graph to Steps format
            const cleanSteps = nodes.map(node => {
              const outgoingEdges = cleanGraph.getOutgoingEdges(node.id);
              
              // Process outgoing connections
              const outgoingConnections = {};
              const branchConnections = {};
              
              outgoingEdges.forEach(edge => {
                if (edge.type === 'default') {
                  outgoingConnections.default = { targetNodeId: edge.targetId };
                } else if (edge.type === 'branch' && edge.label) {
                  branchConnections[edge.label] = { targetNodeId: edge.targetId };
                }
              });
              
              // Create step with consistent structure
              return {
                ...node,
                outgoingConnections,
                branchConnections
              };
            });
            
            setWorkflowSteps(cleanSteps);
          }
          
          // Force garbage collection of any stale references
          setTimeout(() => {
            console.log('Finished graph cleanup process');
          }, 100);
          
          return 'Graph cleanup process completed';
        }
        
        return 'No graph available to clean';
      },
      
      help: () => {
        console.log(
          '%cWorkflow Debugger Commands',
          'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 2px; font-weight: bold;',
          '\n- workflowDebugger.logGraph() - Print formatted graph info',
          '\n- workflowDebugger.tableGraph() - Show nodes and edges in table format',
          '\n- workflowDebugger.showNodeDetails(nodeId) - Show details for a specific node',
          '\n- workflowDebugger.getCommandHistory() - Show undo/redo stack contents', 
          '\n- workflowDebugger.validateGraph() - Check graph integrity',
          '\n- workflowDebugger.forceRefresh() - Force a complete refresh of the graph UI',
          '\n- workflowDebugger.findNodeReferences(nodeId) - Find all references to a node',
          '\n- workflowDebugger.findGhostNodes() - Find deleted nodes still referenced',
          '\n- workflowDebugger.purgeGhostNodes() - Purge any ghost nodes from the workflow state',
          '\n- workflowDebugger.cleanupGraph() - Complete graph reset and cleanup',
          '\n- workflowDebugger.help() - Show this help message'
        );
      }
    };
    
    // Attach to window for console access
    window.workflowDebugger = debugTools;
    
    // Show help message
    debugTools.help();
    
    return debugTools;
  }
}

// Initialize the debugger if we're in a browser environment
if (typeof window !== 'undefined') {
  // Create a minimal initial version that will be replaced when the component mounts
  window.workflowDebugger = {
    help: () => console.log('The workflow component has not mounted yet. Tools will be available soon.'),
    status: 'initializing'
  };
}