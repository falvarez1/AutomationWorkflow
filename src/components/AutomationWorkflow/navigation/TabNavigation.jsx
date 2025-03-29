import React from 'react';

const TabNavigation = ({ 
  activeTab, 
  setActiveTab, 
  readonly,
  connectionStatus,
  isExecuting,
  workflowMetadata = { name: 'New Workflow', lastModified: null },
  onSave,
  onExecute
}) => {
  return (
    <div className="flex border-b border-gray-200 bg-white shadow-sm">
      <button
        className={`px-5 py-4 text-sm font-medium focus:outline-none ${
          activeTab === 'flow'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => setActiveTab('flow')}
      >
        Workflow Editor
      </button>
      
      <button
        className={`px-5 py-4 text-sm font-medium focus:outline-none ${
          activeTab === 'execution'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => setActiveTab('execution')}
      >
        Execution
      </button>
      
      {/* Workflow metadata display */}
      <div className="ml-auto flex items-center pr-4">
        <span className="text-sm text-gray-500 mr-4">
          {workflowMetadata.name}
          {workflowMetadata.lastModified && 
            ` • Last saved: ${new Date(workflowMetadata.lastModified).toLocaleString()}`}
        </span>
        
        {/* Save button */}
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
          onClick={onSave}
          disabled={readonly || connectionStatus !== 'connected'}
        >
          Save
        </button>
        
        {/* Execute button */}
        <button
          className={`ml-2 px-4 py-2 rounded focus:outline-none ${
            isExecuting || connectionStatus !== 'connected'
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
          onClick={onExecute}
          disabled={isExecuting || readonly || connectionStatus !== 'connected'}
        >
          {isExecuting ? 'Executing...' : 'Execute'}
        </button>
      </div>
    </div>
  );
};

export default TabNavigation;
