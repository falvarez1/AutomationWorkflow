import React, { useCallback, useState, useEffect } from 'react';
import { PropertyRenderer } from './PropertyRenderer';
import { workflowService } from '../../../services/workflowService';
import { saveNodeToLocalStorage } from '../utils/localStorageUtils';

/**
 * Node Properties Panel
 *
 * Main panel component that displays properties for the selected node.
 */
const NodePropertiesPanel = React.memo(({
  node,
  onClose,
  onUpdate,
  registry
}) => {
  // State to track unsaved changes
  const [pendingChanges, setPendingChanges] = useState({});
  const [isFormValid, setIsFormValid] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'local' or 'api' or null
  const [resetFieldDirtyState, setResetFieldDirtyState] = useState(false);
  
  // Clear pending changes when node changes
  useEffect(() => {
    setPendingChanges({});
    setIsDirty(false);
    setSaveStatus(null);
    setResetFieldDirtyState(prev => !prev); // Toggle to trigger reset
  }, [node?.id]);
  
  // Clear save status after timeout
  useEffect(() => {
    if (saveStatus) {
      const timer = setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);
  
  // Collect changes instead of updating immediately
  const handlePropertyChange = useCallback((propertyId, value) => {
    if (!node) return;
    
    setPendingChanges(prev => {
      const newChanges = {
        ...prev,
        [propertyId]: value
      };
      setIsDirty(true);
      return newChanges;
    });
  }, [node]);
  
  // Stores validation state without excessive logging
  const handleValidation = useCallback((isValid, errors) => {
    // Store validation state to control save button
    setIsFormValid(isValid);
    setValidationErrors(errors || {});
    
    // Only log validation in development and only when there are errors
    if (process.env.NODE_ENV === 'development' && !isValid) {
      console.log('Validation errors:', errors);
    }
  }, []);

  // Handle save button click - apply all pending changes
  const handleSave = useCallback(() => {
    if (!node || !isFormValid) return;
    
    // For testing purposes, force local storage mode
    const isApiConnected = false; // workflowService.isConnected();
    
    // Create a log of changes for debugging
    console.log('Saving changes:', pendingChanges);
    
    if (isApiConnected) {
      // Normal flow - API is connected
      Object.entries(pendingChanges).forEach(([propertyId, value]) => {
        // Pass false for isLocalUpdate since this is going to the API
        onUpdate(node.id, propertyId, value, false);
      });
      setSaveStatus('api');
    } else {
      // Fallback to local storage
      // First update the node in the UI for immediate feedback
      Object.entries(pendingChanges).forEach(([propertyId, value]) => {
        // Pass true for isLocalUpdate to indicate this is a local storage update
        onUpdate(node.id, propertyId, value, true);
      });
      
      // Then save the fully updated node to local storage
      // This needs to happen after the updates, so we get the latest node state
      
      // Get current properties or initialize empty object
      const currentProperties = node.properties || {};
      
      // Create updated properties by merging current with pending changes
      const updatedProperties = {
        ...currentProperties
      };
      
      // Add each pending change to the properties
      Object.entries(pendingChanges).forEach(([propId, value]) => {
        updatedProperties[propId] = value;
      });
      
      // Create a node object with proper structure for local storage
      const nodeToSave = {
        id: node.id,
        type: node.type,
        properties: updatedProperties
      };
      
      // Save to local storage with enhanced debugging
      console.log('Saving node to local storage:', nodeToSave);
      const saved = saveNodeToLocalStorage(node.id, nodeToSave);
      
      if (saved) {
        console.log('Node successfully saved to local storage');
        setSaveStatus('local');
      } else {
        console.error('Failed to save node to local storage');
      }
    }
    
    // Clear pending changes
    setPendingChanges({});
    setIsDirty(false);
    setResetFieldDirtyState(prev => !prev); // Toggle to trigger reset
  }, [node, pendingChanges, isFormValid, onUpdate]);
  
  // Handle cancel/reset
  const handleCancel = useCallback(() => {
    setPendingChanges({});
    setIsDirty(false);
    setResetFieldDirtyState(prev => !prev); // Toggle to trigger reset
  }, []);

  if (!node) return null;
  
  const plugin = registry.getNodeType(node.type);
  if (!plugin) return null;
  
  const propertySchema = plugin.getPropertySchema();
  const propertyGroups = plugin.getPropertyGroups();
  
  // Create a modified node with pending changes for preview
  const nodeWithPendingChanges = {
    ...node,
    properties: {
      ...(node.properties || {}),
      ...pendingChanges
    }
  };
  
  return (
      <div id="node-properties-panel" className="relative flex flex-col h-full bg-white border-l border-gray-200">
        {/* Fixed header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 py-4 px-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full bg-${plugin.color || 'blue'}-500 mr-2`}></span>
              Node Properties
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Scrollable content area with padding for the fixed header and footer */}
        <div className="flex-grow overflow-y-auto px-4">
          <PropertyRenderer
            node={nodeWithPendingChanges}
            schema={propertySchema}
            groups={propertyGroups}
            registry={registry}
            onChange={handlePropertyChange}
            onValidate={handleValidation}
            resetDirtyState={resetFieldDirtyState}
          />
        </div>
        
        {/* Fixed footer with Apply Changes and Cancel buttons */}
        <div className="sticky bottom-0 left-0 right-0 bg-white py-4 px-4 border-t border-gray-200 z-10">
          <div className="flex items-center justify-between">
            {/* Status message */}
            <div className="flex-1">
              {saveStatus === 'local' && (
                <div className="text-amber-600 text-sm flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Changes saved locally (API disconnected)
                </div>
              )}
              {saveStatus === 'api' && (
                <div className="text-green-600 text-sm flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Changes saved to API
                </div>
              )}
              {!workflowService.isConnected() && !saveStatus && (
                <div className="text-amber-600 text-sm flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  API disconnected - changes will be saved locally
                </div>
              )}
            </div>
            
            {/* Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className={`px-5 py-2 rounded-md border ${isDirty ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-gray-200 text-gray-400 cursor-not-allowed'}`}
                disabled={!isDirty}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className={`px-5 py-2 rounded-md ${isDirty && isFormValid ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-300 text-white cursor-not-allowed'}`}
                disabled={!isDirty || !isFormValid}
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      </div>
  );
});

export default NodePropertiesPanel;