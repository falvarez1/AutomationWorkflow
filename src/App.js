import React, { useState } from 'react';
import './App.css';
import './index.css';
import AutomationWorkflow from './AutomationWorkflow';
import { testDeleteUndoFix } from './test-fix';

function App() {
  return (
    <div className="App">
      <AutomationWorkflow />
    </div>
  );
}

export default App;