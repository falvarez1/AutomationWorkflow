import React from 'react';

const ExecutionView = ({ executionStatus, workflowGraph }) => {
  return (
    <div className="p-6 w-full overflow-auto">
      <h2 className="text-xl font-semibold mb-4">Workflow Execution</h2>
      
      {executionStatus?.isExecuting ? (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between mb-4">
            <span className="font-medium">Status: Running</span>
            <span className="text-gray-500">
              Started: {executionStatus.startTime && new Date(executionStatus.startTime).toLocaleTimeString()}
            </span>
          </div>
          
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${executionStatus.progress || 0}%` }}
              ></div>
            </div>
          </div>
          
          {executionStatus.currentNodeId && (
            <div className="text-sm text-gray-600">
              Executing node: {
                workflowGraph?.getNode?.(executionStatus.currentNodeId)?.title || 
                executionStatus.currentNodeId
              }
            </div>
          )}
          
          {executionStatus.errors?.length > 0 && (
            <div className="mt-4">
              <h3 className="text-red-600 font-medium mb-2">Errors</h3>
              <ul className="bg-red-50 p-3 rounded border border-red-200">
                {executionStatus.errors.map((error, index) => (
                  <li key={index} className="text-red-700">{error.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-gray-500">No active execution. Click "Execute" to run this workflow.</p>
        </div>
      )}
    </div>
  );
};

export default ExecutionView;
