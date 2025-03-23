import React, { useCallback } from 'react';
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
  // Defining hooks before any conditional returns
  const handlePropertyChange = useCallback((propertyId, value) => {
    if (!node) return;
    onUpdate(node.id, propertyId, value);
  }, [node, onUpdate]);
  
  // Stores validation state without excessive logging
  const handleValidation = useCallback((isValid, errors) => {
    // You can handle validation results here
    // For example, disable save button if !isValid
    
    // Only log validation in development and only when there are errors
    if (process.env.NODE_ENV === 'development' && !isValid) {
      console.log('Validation errors:', errors);
    }
  }, []);

  if (!node) return null;
  
  const plugin = registry.getNodeType(node.type);
  if (!plugin) return null;
  
  const propertySchema = plugin.getPropertySchema();
  const propertyGroups = plugin.getPropertyGroups();
  
  return (
      <div id="node-properties-panel">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            <span className={`inline-block w-3 h-3 rounded-full bg-${plugin.color}-500 mr-2`}></span>
            {plugin.name} Properties
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <PropertyRenderer
          node={node}
          schema={propertySchema}
          groups={propertyGroups}
          registry={registry}
          onChange={handlePropertyChange}
          onValidate={handleValidation}
        />
      </div>    
  );
});

export default NodePropertiesPanel;