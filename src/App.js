import React, { useState } from 'react';
import './App.css';
import './index.css';
import AutomationWorkflow from './AutomationWorkflow';
import { testDeleteUndoFix } from './test-fix';

function App() {
  const [testResult, setTestResult] = useState(null);

  const runTest = () => {
    const result = testDeleteUndoFix();
    setTestResult(result);
    console.log("Test completed - check console logs for details");
  };

  return (
    <div className="App">
      <div style={{ padding: '10px', background: '#f0f0f0', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
        <h3>Automation Workflow</h3>
        <div>
          <button
            onClick={runTest}
            style={{ padding: '5px 10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Run Delete Undo Test
          </button>
          {testResult && (
            <div style={{ marginTop: '10px', padding: '5px', background: '#e6f7ff', borderRadius: '4px' }}>
              <p>{testResult}</p>
              <p>Check browser console for detailed test results</p>
            </div>
          )}
        </div>
      </div>
      <AutomationWorkflow />
    </div>
  );
}

export default App;