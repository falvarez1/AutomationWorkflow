import { useCallback } from 'react';
import { useWorkflow } from '../context/WorkflowContext';

export const useNodeEvents = (commandManager) => {
  const { workflowGraph, setWorkflowGraph, selectedNodeId, setSelectedNodeId } = useWorkflow();

  const handleNodeClick = useCallback((id, action) => {
    // ...implementation
  }, [workflowGraph, setSelectedNodeId]);

  const handleNodeDrag = useCallback((id, x, y, snapToGrid) => {
    // ...implementation
  }, [workflowGraph]);

  // ...other handlers

  return {
    handleNodeClick,
    handleNodeDrag,
    // ...other handlers
  };
};
