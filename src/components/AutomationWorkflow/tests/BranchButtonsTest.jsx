import React from 'react';
import AutomationWorkflow from '../../../AutomationWorkflow';

/**
 * A test component for showcasing the specialized "Add Path" buttons
 * for If/Else and SplitFlow nodes
 */
const BranchButtonsTest = () => {
  // Simple test data with isolated If/Else and SplitFlow nodes
  const testWorkflow = [
    {
      id: 'if-else-node',
      type: 'ifelse',
      position: { x: 250, y: 200 },
      title: 'If/Else Branch Node',
      subtitle: 'Demonstrates True/False path buttons',
      properties: {
        conditionField: 'user_attribute',
        operator: 'equals',
        value: 'test'
      }
    },
    {
      id: 'split-flow-node',
      type: 'splitflow',
      position: { x: 550, y: 200 },
      title: 'Split Flow Node',
      subtitle: 'Demonstrates branch-specific buttons',
      properties: {
        pathCount: '3',
        splitAttribute: 'segment',
        path1Name: 'Path A',
        path2Name: 'Path B',
        path3Name: 'Path C'
      }
    }
  ];

  return (
    <div className="h-screen">
      <div className="p-4 bg-blue-100 text-blue-800 font-medium">
        <h1 className="text-xl mb-2">Specialized Branch Buttons Test</h1>
        <p>This test demonstrates the specialized "Add Path" buttons for If/Else and SplitFlow nodes:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>If/Else nodes now have "Add True Path" and "Add False Path" buttons</li>
          <li>SplitFlow nodes have buttons for each configured path (e.g., "Add Path A")</li>
        </ul>
        <p className="mt-2">
          These specialized buttons make it clearer which branch you're adding a node to, 
          compared to the generic "Add a step" button.
        </p>
      </div>

      <div className="h-full w-full border-t border-gray-300 mt-4">
        <AutomationWorkflow initialWorkflowSteps={testWorkflow} />
      </div>
    </div>
  );
};

export default BranchButtonsTest;