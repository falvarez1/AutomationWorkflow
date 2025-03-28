import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { ValidationEngine } from '../validation/ValidationEngine';

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
  onValidate
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
    
    // Check if any property values have changed
    const prevProps = Object.entries(prevNode);
    const currentProps = Object.entries(currentNode);
    
    // Quick check if property count changed
    if (prevProps.length !== currentProps.length) return true;
    
    // Check for value changes in properties that matter for validation
    for (const [key, value] of currentProps) {
      // Skip internal/metadata properties
      if (key === 'id' || key === 'type' || key === 'position' || key === 'height' ||
          key === 'isNew' || key === 'isAnimating' || key === 'contextMenuConfig') {
        continue;
      }
      
      // Check if property value changed
      if (prevNode[key] !== value) {
        return true;
      }
    }
    
    return false;
  }, []);
  
  // Debounced validation timer
  const validationTimerRef = useRef(null);
  
  // Validate properties with optimization
  useEffect(() => {
    // Only validate if properties actually changed
    if (!hasNodePropertiesChanged(prevNodeRef.current, node)) {
      return;
    }
    
    // Clear any pending validation
    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
    }
    
    // Debounce validation (wait 300ms between changes)
    validationTimerRef.current = setTimeout(() => {
      const validationEngine = new ValidationEngine(registry);
      const newErrors = validationEngine.validateNodeProperties(node.type, node);
      if (JSON.stringify(errors) !== JSON.stringify(newErrors)) {
        setErrors(newErrors);
        if (onValidate) {
          onValidate(Object.keys(newErrors).length === 0, newErrors);
        }
      }
      
      // Update ref for next comparison
      prevNodeRef.current = { ...node };
    }, 300);
    
    return () => {
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }
    };
  }, [node, registry, onValidate, hasNodePropertiesChanged, errors]);
  
  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };
  
  const handlePropertyValueChange = useCallback((propId, newValue) => {
    // Always call onChange to update pending changes
    onChange(propId, newValue);
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
            <h3 className="font-medium text-gray-900">{group.label}</h3>
            <ChevronRight
              className={`w-5 h-5 transition-transform duration-200 ${expandedGroups[group.id] ? 'transform rotate-90' : ''}`}
            />
          </div>
          
          {expandedGroups[group.id] && (
            <div className="px-4 py-3 border-t border-gray-200">
              {group.description && (
                <p className="text-sm text-gray-500 mb-4">{group.description}</p>
              )}
              
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
      const value = node[prop.id];
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
      const sourceValue = nodeData[dep.sourceId];
      
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
      const value = nodeData[condition.propertyId];
      
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