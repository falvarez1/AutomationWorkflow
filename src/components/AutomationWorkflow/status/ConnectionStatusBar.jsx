import React from 'react';

const ConnectionStatusBar = ({ status, isLoading }) => {
  if (isLoading) {
    return (
      <div className="text-white text-sm py-1 px-4 text-center bg-blue-500 flex items-center justify-center">
        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
        Loading workflow...
      </div>
    );
  }
  
  if (status === 'connected') return null;
  
  return (
    <div className={`text-white text-sm py-1 px-4 text-center ${
      status === 'reconnecting' ? 'bg-yellow-500' :
      status === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`}>
      {status === 'reconnecting' ? 'Reconnecting to server...' :
       status === 'error' ? 'Connection error. Please refresh the page.' :
       'Connecting to server...'}
    </div>
  );
};

export default ConnectionStatusBar;
