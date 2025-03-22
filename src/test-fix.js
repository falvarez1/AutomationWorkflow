// Test script to verify the DeleteNodeCommand undo fix
import React, { useState, useEffect } from 'react';
import { DeleteNodeCommand } from './components/AutomationWorkflow/commands/DeleteNodeCommand';

// This function simulates our test scenario
export function testDeleteUndoFix() {
  console.log("Starting test for DeleteNodeCommand undo fix");
  
  // Create test workflow steps
  const testSteps = [
    { id: 'node1', title: 'Node 1', type: 'trigger', position: { x: 100, y: 100 } },
    { id: 'node2', title: 'Node 2', type: 'control', position: { x: 100, y: 250 } }
  ];
  
  // Track the current state
  let workflowSteps = [...testSteps];
  
  // Create functional state setters like React would use
  const setWorkflowSteps = (updater) => {
    if (typeof updater === 'function') {
      // Handle functional updates where we pass the current state
      workflowSteps = updater(workflowSteps);
    } else {
      // Handle direct updates
      workflowSteps = updater;
    }
    console.log("Setting workflow steps:", workflowSteps);
    return workflowSteps;
  };
  
  let selectedNodeIndex = null;
  const setSelectedNodeIndex = (index) => {
    console.log("Setting selected node index:", index);
    selectedNodeIndex = index;
    return selectedNodeIndex;
  };
  
  // Test deleting and then undoing a node
  console.log("Initial workflow steps:", workflowSteps);
  
  // 1. Create a DeleteNodeCommand for node2
  const deleteCommand = new DeleteNodeCommand(
    workflowSteps,
    setWorkflowSteps,
    setSelectedNodeIndex,
    1 // index of node2
  );
  
  // 2. Execute the command (delete the node)
  console.log("Executing delete command...");
  deleteCommand.execute();
  console.log("After delete, workflow steps:", workflowSteps);
  
  // 3. Change the workflow state (to test that undo uses current state)
  console.log("Adding a new node to the workflow (simulating other changes)...");
  setWorkflowSteps(current => [
    ...current,
    {
      id: 'new_node',
      title: 'New Node',
      type: 'action',
      position: { x: 100, y: 400 }
    }
  ]);
  console.log("After adding new node, workflow steps:", workflowSteps);
  
  // 4. Undo the command (restore the node)
  console.log("Undoing delete command...");
  deleteCommand.undo();
  console.log("After undo, workflow steps:", workflowSteps);
  
  // 5. Verify no duplicate nodes were created
  const nodeIds = workflowSteps.map(node => node.id);
  const uniqueNodeIds = [...new Set(nodeIds)];
  
  if (nodeIds.length === uniqueNodeIds.length) {
    console.log("SUCCESS: No duplicate node IDs found");
  } else {
    console.log("WARNING: Duplicate node IDs found in the workflow");
    console.log("Original IDs:", nodeIds);
    console.log("Unique IDs:", uniqueNodeIds);
  }
  
  // 6. Verify the restored node has the correct properties
  const restoredNode = workflowSteps.find(node => node.id.includes('_restored_'));
  console.log("Restored node:", restoredNode);
  
  if (restoredNode && restoredNode._restoredAt) {
    console.log("SUCCESS: Restored node has the _restoredAt property");
    console.log("The fix is working correctly!");
  } else {
    console.log("WARNING: Restored node does not have the _restoredAt property");
    console.log("The fix may not be properly implemented.");
  }
  
  // 7. Check that isNew and isAnimating are reset
  if (restoredNode && restoredNode.isNew === false && restoredNode.isAnimating === false) {
    console.log("SUCCESS: UI state flags correctly reset");
  } else {
    console.log("WARNING: UI state flags not properly reset");
  }
  
  // 8. Check that the new node added after the deletion is still present
  if (workflowSteps.some(node => node.id === 'new_node')) {
    console.log("SUCCESS: New node added after deletion is still present");
  } else {
    console.log("WARNING: New node is missing after undo - the state wasn't properly preserved");
  }
  
  return "Test completed - check console for results";
}