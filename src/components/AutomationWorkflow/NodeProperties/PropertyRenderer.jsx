import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { ValidationEngine } from '../validation/ValidationEngine';
import InfoTooltip from '../ui/InfoTooltip';

/**
 * Property Renderer
 * 
 * Renders property groups and controls based on schema.
 */
export const PropertyRenderer = ({
  node,
  schema,
  groups,
  registry,
  onChange,
  onValidate,
  resetDirtyState
}) => {
  const [errors, setErrors] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  
  // Initialize expanded groups
  useEffect(() => {
    const expanded = {};
    groups.forEach(group => {
      expanded[group.id] = !group.collapsed;
    });
    setExpandedGroups(expanded);
  }, [groups]);
  
  // Store previous node values for comparison
  const prevNodeRef = useRef(null);
  
  // Helper to detect actual property changes
  const hasNodePropertiesChanged = useCallback((prevNode, currentNode) => {
    if (!prevNode || !currentNode) return true;
    
    // Function to extract a property value accounting for both structures
    const getPropertyValue = (node, propId) => {
      // First check properties object, then direct property
      return node.properties && node.properties[propId] !== undefined
        ? node.properties[propId]
        : node[propId];
    };
    
    // Get all property IDs from schema
    const propIds = schema.map(prop => prop.id);
    
    // Check if any property values have changed
    for (const propId of propIds) {
      const prevValue = getPropertyValue(prevNode, propId);
      const currentValue = getPropertyValue(currentNode, propId);
      
      // Deep comparison for objects and arrays, strict comparison for primitives
      if (JSON.stringify(prevValue) !== JSON.stringify(currentValue)) {
        return true;
      }
    }
    
    return false;
  }, [schema]);
  
  // Debounced validation timer
  const validationTimerRef = useRef(null);
  
  // Validation state tracking
  const [isDirty, setIsDirty] = useState({});
  
  // Effect to reset dirty state when requested
  useEffect(() => {
    if (resetDirtyState) {
      setIsDirty({});
    }
  }, [resetDirtyState]);
  
  // Mark fields as dirty when they change
  useEffect(() => {
    if (hasNodePropertiesChanged(prevNodeRef.current, node)) {
      // Determine which fields have changed
      schema.forEach(prop => {
        const propId = prop.id;
        const prevValue = prevNodeRef.current?.properties?.[propId] ?? prevNodeRef.current?.[propId];
        const currentValue = node?.properties?.[propId] ?? node?.[propId];
        
        if (JSON.stringify(prevValue) !== JSON.stringify(currentValue)) {
          setIsDirty(prev => ({...prev, [propId]: true}));
        }
      });
      
      // Update ref for next comparison
      prevNodeRef.current = { ...node };
    }
  }, [node, schema, hasNodePropertiesChanged]);
  
  // Custom validation function to override engine behavior for required fields
  const validateNodeFields = useCallback(() => {
    const validationEngine = new ValidationEngine(registry);
    const plugin = registry.getNodeType(node.type);
    if (!plugin) return {};
    
    const validationRules = plugin.getValidationRules();
    const results = {};
    
    // Check each field for validation issues
    schema.forEach(propSchema => {
      const propId = propSchema.id;
      const rules = validationRules[propId];
      
      if (!rules) return; // No rules, no validation needed
      
      // Get value from properties or direct access
      const value = node.properties && node.properties[propId] !== undefined
        ? node.properties[propId]
        : node[propId];
      
      // Skip validation if field has a value and "required" is the only rule
      if (value !== undefined && value !== null && value !== '' &&
          Object.keys(rules).length === 1 && rules.required) {
        return; // Field has value, don't apply required validation
      }
      
      // For other cases, use the validation engine
      const error = validationEngine.validateProperty(propId, value, rules, propSchema);
      if (error) {
        results[propId] = error;
      }
    });
    
    return results;
  }, [node, registry, schema]);
  
  // Validate properties with optimization
  useEffect(() => {
    // Clear any pending validation
    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
    }
    
    // Debounce validation (wait 300ms between changes)
    validationTimerRef.current = setTimeout(() => {
      // Get validation results with our custom logic
      const validationResults = validateNodeFields();
      
      // Only show errors for fields that have been interacted with
      const filteredErrors = {};
      Object.entries(validationResults).forEach(([propId, error]) => {
        // Always show errors for dirty fields
        if (isDirty[propId]) {
          filteredErrors[propId] = error;
        }
      });
      
      // Update errors if they've changed
      if (JSON.stringify(errors) !== JSON.stringify(filteredErrors)) {
        setErrors(filteredErrors);
        if (onValidate) {
          // Pass the full validation state for form validity
          // but only show filtered errors in the UI
          onValidate(Object.keys(validationResults).length === 0, filteredErrors);
        }
      }
    }, 300);
    
    return () => {
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }
    };
  }, [node, registry, onValidate, isDirty, errors, schema, validateNodeFields]);
  
  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };
  
  const handlePropertyValueChange = useCallback((propId, newValue) => {
    // Mark field as dirty when user changes value
    setIsDirty(prev => ({...prev, [propId]: true}));
    
    // Normalize empty strings to null to avoid validation issues with required fields
    // This helps when a field is considered "empty" but still has a value
    const normalizedValue = newValue === '' ? null : newValue;
    
    // Immediately validate this field
    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
    }
    
    // Clear the error for this field temporarily to prevent flicker
    setErrors(prev => {
      const updated = {...prev};
      delete updated[propId];
      return updated;
    });
    
    // Always call onChange to update pending changes
    onChange(propId, normalizedValue);
  }, [onChange]);
  
  // Render property groups
  const renderGroups = () => {
    // Sort groups by order
    const sortedGroups = [...groups].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    return sortedGroups.map(group => {
      // Check if group should be visible based on conditions
      const isVisible = evaluateGroupConditions(group, node);
      if (!isVisible) return null;
      
      // Get properties for this group
      const groupProperties = schema.filter(prop => prop.groupId === group.id);
      
      return (
        <div key={group.id} className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
          <div
            className="flex justify-between items-center px-4 py-3 bg-white cursor-pointer"
            onClick={() => toggleGroup(group.id)}
          >
            <div className="flex items-center">
              <h3 className="font-medium text-gray-900">{group.label}</h3>
              {group.description && <InfoTooltip tooltip={group.description} />}
            </div>
            <ChevronRight
              className={`w-5 h-5 transition-transform duration-200 ${expandedGroups[group.id] ? 'transform rotate-90' : ''}`}
            />
          </div>
          
          {expandedGroups[group.id] && (
            <div className="px-4 py-3 border-t border-gray-200">
              {renderProperties(groupProperties)}
            </div>
          )}
        </div>
      );
    });
  };
  
  // Render individual properties
  const renderProperties = (properties) => {
    // Sort properties by order
    const sortedProps = [...properties].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    return sortedProps.map(prop => {
      // Check if property should be visible based on dependencies
      const isVisible = evaluatePropertyDependencies(prop, node);
      if (!isVisible) return null;
      
      // Get the appropriate control component
      const control = registry.getPropertyControl(prop.type);
      if (!control) return null;
      
      const ControlComponent = control.component;
      
      // First check if the property is in the properties object
      // If not, fall back to direct property on the node (for backward compatibility)
      let value = node.properties && node.properties[prop.id] !== undefined
        ? node.properties[prop.id]
        : node[prop.id];
      
      // Handle null/undefined values consistently for display
      // This prevents the "required" error when there's actually a value
      if (value === null || value === undefined) {
        // Use empty string for display but track as null internally
        value = '';
      }
      
      const error = errors[prop.id];
      
      // Render the control
      return (
        <ControlComponent
          key={prop.id}
          label={prop.label}
          description={prop.description}
          value={value}
          onChange={(newValue) => handlePropertyValueChange(prop.id, newValue)}
          error={error}
          controlProps={prop.controlProps}
        />
      );
    });
  };
  
  // Function to evaluate if a property should be visible based on its dependencies
  const evaluatePropertyDependencies = (prop, nodeData) => {
    if (!prop.dependencies || prop.dependencies.length === 0) return true;
    
    return prop.dependencies.every(dep => {
      // Check in properties object first, then fallback to direct property
      const sourceValue = nodeData.properties && nodeData.properties[dep.sourceId] !== undefined
        ? nodeData.properties[dep.sourceId]
        : nodeData[dep.sourceId];
      
      switch (dep.condition) {
        case 'equals':
          return sourceValue === dep.value;
        case 'notEquals':
          return sourceValue !== dep.value;
        case 'contains':
          return Array.isArray(sourceValue) && sourceValue.includes(dep.value);
        case 'notEmpty':
          return sourceValue !== undefined && sourceValue !== null && sourceValue !== '';
        default:
          return true;
      }
    });
  };
  
  // Function to evaluate if a group should be visible based on its conditions
  const evaluateGroupConditions = (group, nodeData) => {
    if (!group.conditions || group.conditions.length === 0) return true;
    
    return group.conditions.every(condition => {
      // Check in properties object first, then fallback to direct property
      const value = nodeData.properties && nodeData.properties[condition.propertyId] !== undefined
        ? nodeData.properties[condition.propertyId]
        : nodeData[condition.propertyId];
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'notEquals':
          return value !== condition.value;
        case 'contains':
          return Array.isArray(value) && value.includes(condition.value);
        case 'notEmpty':
          return value !== undefined && value !== null && value !== '';
        default:
          return true;
      }
    });
  };
  
  return (
    <div className="properties-renderer">
      {renderGroups()}
    </div>
  );
};