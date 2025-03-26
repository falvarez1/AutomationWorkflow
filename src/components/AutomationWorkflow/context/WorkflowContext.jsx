import React, { createContext, useContext, useReducer } from 'react';

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

// Provider component
export const WorkflowProvider = ({ children, initialWorkflowSteps = [] }) => {
  const [state, dispatch] = useReducer(workflowReducer, {
    ...initialState,
    workflowSteps: initialWorkflowSteps
  });
  
  // Actions
  const selectNode = (nodeId) => {
    dispatch({ type: ActionTypes.SELECT_NODE, payload: nodeId });
  };
  
  // ...other action creators
  
  return (
    <WorkflowContext.Provider value={{
      ...state,
      selectNode,
      // ...other actions
    }}>
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
