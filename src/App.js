import React, { useState } from 'react';
import './App.css';
import './index.css';
import AutomationWorkflow from './AutomationWorkflow';
import SimpleValidationTest from './tests/SimpleValidationTest';

function App() {
  const [showTestComponent, setShowTestComponent] = useState(false);

  return (
    <div className="App">
      <div className="p-4 bg-gray-100 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Automation Workflow</h1>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => setShowTestComponent(!showTestComponent)}
        >
          {showTestComponent ? 'Show Workflow' : 'Test Validation'}
        </button>
      </div>

      {showTestComponent ? (
        <SimpleValidationTest />
      ) : (
        <AutomationWorkflow />
      )}
    </div>
  );
}

export default App;