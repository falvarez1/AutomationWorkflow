import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Initial state
const initialState = {
  workflowSteps: [],
  selectedNodeId: null,
  menuState: { isOpen: false },
  // ...other state
};

// Action types
const ActionTypes = {
  UPDATE_NODE: 'UPDATE_NODE',
  SELECT_NODE: 'SELECT_NODE',
  ADD_NODE: 'ADD_NODE',
  DELETE_NODE: 'DELETE_NODE',
  OPEN_MENU: 'OPEN_MENU',
  CLOSE_MENU: 'CLOSE_MENU',
  // ...other actions
};

// Reducer function
function workflowReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SELECT_NODE:
      return { ...state, selectedNodeId: action.payload };
    // ...other cases
    default:
      return state;
  }
}

// Create context
const WorkflowContext = createContext();

// Enhanced provider component with actions
export const WorkflowProvider = ({ children, initialWorkflowSteps = [], commandManager }) => {
  const [state, dispatch] = useReducer(workflowReducer, {
    ...initialState,
    workflowSteps: initialWorkflowSteps,
    workflowGraph: null, // Will be initialized separately
  });
  
  // Node selection action
  const selectNode = useCallback((nodeId) => {
    dispatch({ type: ActionTypes.SELECT_NODE, payload: nodeId });
  }, []);
  
  // Node update action
  const updateNode = useCallback((nodeId, propertyId, value) => {
    dispatch({ 
      type: ActionTypes.UPDATE_NODE, 
      payload: { nodeId, propertyId, value } 
    });
    // Could also integrate with commandManager here
  }, []);
  
  // Add more actions here...
  
  const contextValue = {
    ...state,
    // Actions
    selectNode,
    updateNode,
    // More actions...
  };
  
  return (
    <WorkflowContext.Provider value={contextValue}>
      {children}
    </WorkflowContext.Provider>
  );
};

// Custom hook for using the context
export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};