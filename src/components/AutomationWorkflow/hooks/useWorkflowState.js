import { useState, useMemo, useCallback, useEffect } from 'react';
import { Graph } from '../graph/Graph';
import { commandManager } from '../commands';

/**
 * Hook for managing workflow state
 * 
 * @param {Array} initialWorkflowSteps - Initial workflow steps
 * @returns {Object} Workflow state and setters
 */
export function useWorkflowState(initialWorkflowSteps) {
  const [workflowGraph, setWorkflowGraph] = useState(() => 
    Graph.fromWorkflowSteps(initialWorkflowSteps)
  );
  
  // Selection state
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [dragStartPosition, setDragStartPosition] = useState(null);
  
  // Menu state
  const [menuState, setMenuState] = useState({
    activeNodeId: null,
    activeBranch: null,
    position: null,
    menuType: null // 'add', 'branch', or 'branchEdge'
  });
  
  // Undo/redo state
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  // Derived state - all nodes in the graph
  const workflowSteps = useMemo(() => {
    return workflowGraph.getAllNodes();
  }, [workflowGraph]);
  
  // Derived state - currently selected node
  const selectedNode = useMemo(() => {
    return selectedNodeId ? workflowGraph.getNode(selectedNodeId) : null;
  }, [workflowGraph, selectedNodeId]);
  
  // Handler to close menus
  const handleCloseMenu = useCallback(() => {
    setMenuState({ activeNodeId: null, activeBranch: null, position: null, menuType: null });
  }, []);
  
  // Initialize command manager and listen for changes
  useEffect(() => {
    // Setup command manager listener to update undo/redo state
    const handleCommandStateChange = (state) => {
      setCanUndo(state.canUndo);
      setCanRedo(state.canRedo);
    };
    
    commandManager.addListener(handleCommandStateChange);
    
    // Update initial state
    setCanUndo(commandManager.canUndo());
    setCanRedo(commandManager.canRedo());
    
    return () => {
      commandManager.removeListener(handleCommandStateChange);
    };
  }, []);
  
  // Handlers for undo/redo
  const handleUndo = useCallback(() => {
    commandManager.undo();
  }, []);
  
  const handleRedo = useCallback(() => {
    commandManager.redo();
  }, []);
  
  return {
    // Graph state
    workflowGraph,
    setWorkflowGraph,
    workflowSteps,
    
    // Selection state
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    dragStartPosition,
    setDragStartPosition,
    
    // Menu state
    menuState,
    setMenuState,
    handleCloseMenu,
    
    // Undo/redo state
    canUndo,
    canRedo,
    handleUndo,
    handleRedo
  };
}