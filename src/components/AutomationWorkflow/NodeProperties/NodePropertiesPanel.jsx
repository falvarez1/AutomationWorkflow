import React, { useCallback, useState, useEffect } from 'react';
import { PropertyRenderer } from './PropertyRenderer';

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
  
  // Clear pending changes when node changes
  useEffect(() => {
    setPendingChanges({});
    setIsDirty(false);
  }, [node?.id]);
  
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
    
    // Apply all pending changes
    Object.entries(pendingChanges).forEach(([propertyId, value]) => {
      onUpdate(node.id, propertyId, value);
    });
    
    // Clear pending changes
    setPendingChanges({});
    setIsDirty(false);
  }, [node, pendingChanges, isFormValid, onUpdate]);
  
  // Handle cancel/reset
  const handleCancel = useCallback(() => {
    setPendingChanges({});
    setIsDirty(false);
  }, []);

  if (!node) return null;
  
  const plugin = registry.getNodeType(node.type);
  if (!plugin) return null;
  
  const propertySchema = plugin.getPropertySchema();
  const propertyGroups = plugin.getPropertyGroups();
  
  // Create a modified node with pending changes for preview
  const nodeWithPendingChanges = {
    ...node,
    ...pendingChanges
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
          />
        </div>
        
        {/* Fixed footer with Apply Changes and Cancel buttons */}
        <div className="sticky bottom-0 left-0 right-0 bg-white py-4 px-4 border-t border-gray-200 z-10 flex justify-end space-x-3">
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
  );
});

export default NodePropertiesPanel;