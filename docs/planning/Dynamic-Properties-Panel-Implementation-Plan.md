# Dynamic Properties Panel Implementation Plan

This document outlines the step-by-step implementation plan for building the dynamic properties panel architecture described in the architecture document.

## Phase 1: Core Framework Implementation

### Step 1: Create Folder Structure

First, let's set up the project structure:

```
src/
  components/
    AutomationWorkflow/
      NodeProperties/
        index.js                  // Main entry point
        NodePropertiesPanel.jsx   // Main panel component
        PropertyRenderer.jsx      // Component to render properties
      plugins/
        registry.js               // Plugin registry
        NodeTypePlugin.js         // Base plugin class
      controls/
        index.js                  // Export all controls
        PropertyControl.js        // Base control class
        TextInputControl.jsx      // Text input control
        SelectControl.jsx         // Select control
        NumberControl.jsx         // Number input control
      validation/
        ValidationEngine.js       // Validation logic
```

### Step 2: Implement Plugin Registry

Create the central registry that will manage node type plugins, property controls, and validators.

**File: src/components/AutomationWorkflow/plugins/registry.js**

```javascript
/**
 * Plugin Registry
 * 
 * A central repository for node type plugins, property controls, and validators.
 */
class PluginRegistry {
  constructor() {
    this.nodeTypes = {};
    this.propertyControls = {};
    this.validators = {};
  }
  
  registerNodeType(plugin) {
    if (this.nodeTypes[plugin.type]) {
      console.warn(`Node type '${plugin.type}' is already registered. Overriding.`);
    }
    this.nodeTypes[plugin.type] = plugin;
    return this;
  }
  
  registerPropertyControl(control) {
    if (this.propertyControls[control.type]) {
      console.warn(`Property control '${control.type}' is already registered. Overriding.`);
    }
    this.propertyControls[control.type] = control;
    return this;
  }
  
  registerValidator(validator) {
    if (this.validators[validator.type]) {
      console.warn(`Validator '${validator.type}' is already registered. Overriding.`);
    }
    this.validators[validator.type] = validator;
    return this;
  }
  
  getNodeType(type) {
    return this.nodeTypes[type] || null;
  }
  
  getPropertyControl(type) {
    return this.propertyControls[type] || null;
  }
  
  getValidator(type) {
    return this.validators[type] || null;
  }
  
  getAllNodeTypes() {
    return Object.values(this.nodeTypes);
  }
}

// Create and export a singleton instance
export const pluginRegistry = new PluginRegistry();
```

### Step 3: Implement Node Type Plugin Base Class

Create the base class for node type plugins.

**File: src/components/AutomationWorkflow/plugins/NodeTypePlugin.js**

```javascript
/**
 * Node Type Plugin
 * 
 * Base class for node type plugins that defines the structure and behavior.
 */
export class NodeTypePlugin {
  constructor(config) {
    this.type = config.type;
    this.name = config.name;
    this.icon = config.icon;
    this.color = config.color;
    this.description = config.description;
    this.propertySchema = config.propertySchema || [];
    this.propertyGroups = config.propertyGroups || [];
    this.validationRules = config.validationRules || {};
    this.renderer = config.renderer;
    this.initialProperties = config.initialProperties || {};
    this.initialize = config.initialize || (() => {});
  }
  
  /**
   * Get the property schema for this node type
   */
  getPropertySchema() {
    return this.propertySchema;
  }
  
  /**
   * Get the property groups for this node type
   */
  getPropertyGroups() {
    return this.propertyGroups;
  }
  
  /**
   * Get the initial properties for a new node of this type
   */
  getInitialProperties() {
    return typeof this.initialProperties === 'function' 
      ? this.initialProperties() 
      : { ...this.initialProperties };
  }
  
  /**
   * Get the validation rules for this node type
   */
  getValidationRules() {
    return this.validationRules;
  }
}
```

### Step 4: Implement Property Control Base Class

Create the base class for property controls.

**File: src/components/AutomationWorkflow/controls/PropertyControl.js**

```javascript
/**
 * Property Control
 * 
 * Base class for property controls that defines the structure and behavior.
 */
export class PropertyControl {
  constructor(config) {
    this.type = config.type;
    this.component = config.component;
    this.defaultProps = config.defaultProps || {};
    this.validate = config.validate || (() => true);
  }
}
```

### Step 5: Implement Basic Controls

Create basic controls for common property types.

**File: src/components/AutomationWorkflow/controls/TextInputControl.jsx**

```jsx
import React from 'react';
import { PropertyControl } from './PropertyControl';

/**
 * Text Input Control
 * 
 * A control for text input properties.
 */
export const TextInputControl = new PropertyControl({
  type: 'text',
  component: ({ value, onChange, label, error, description, ...props }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {description && <p className="text-sm text-gray-500 mb-2">{description}</p>}
      <input
        type="text"
        value={value || ''}
        className={`w-full p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md`}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  ),
  validate: (value, rules) => {
    if (rules.required && (!value || value.trim() === '')) {
      return 'This field is required';
    }
    if (rules.minLength && value.length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters`;
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      return `Must be no more than ${rules.maxLength} characters`;
    }
    if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
      return rules.patternMessage || 'Invalid format';
    }
    return null;
  }
});
```

**File: src/components/AutomationWorkflow/controls/SelectControl.jsx**

```jsx
import React from 'react';
import { PropertyControl } from './PropertyControl';

/**
 * Select Control
 * 
 * A control for select/dropdown properties.
 */
export const SelectControl = new PropertyControl({
  type: 'select',
  component: ({ value, onChange, label, error, description, controlProps, ...props }) => {
    const options = controlProps?.options || [];
    
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {description && <p className="text-sm text-gray-500 mb-2">{description}</p>}
        <select
          value={value || ''}
          className={`w-full p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md`}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        >
          <option value="">Select an option</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  },
  validate: (value, rules) => {
    if (rules.required && (!value || value === '')) {
      return 'This field is required';
    }
    return null;
  }
});
```

**File: src/components/AutomationWorkflow/controls/NumberControl.jsx**

```jsx
import React from 'react';
import { PropertyControl } from './PropertyControl';

/**
 * Number Control
 * 
 * A control for numeric input properties.
 */
export const NumberControl = new PropertyControl({
  type: 'number',
  component: ({ value, onChange, label, error, description, ...props }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {description && <p className="text-sm text-gray-500 mb-2">{description}</p>}
      <input
        type="number"
        value={value || ''}
        className={`w-full p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md`}
        onChange={(e) => onChange(Number(e.target.value))}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  ),
  validate: (value, rules) => {
    if (rules.required && (value === undefined || value === null || value === '')) {
      return 'This field is required';
    }
    if (rules.min !== undefined && value < rules.min) {
      return `Must be at least ${rules.min}`;
    }
    if (rules.max !== undefined && value > rules.max) {
      return `Must be no more than ${rules.max}`;
    }
    return null;
  }
});
```

**File: src/components/AutomationWorkflow/controls/index.js**

```javascript
export { PropertyControl } from './PropertyControl';
export { TextInputControl } from './TextInputControl';
export { SelectControl } from './SelectControl';
export { NumberControl } from './NumberControl';
```

### Step 6: Implement Validation Engine

Create the validation engine to validate property values against rules.

**File: src/components/AutomationWorkflow/validation/ValidationEngine.js**

```javascript
/**
 * Validation Engine
 * 
 * Handles validation of property values against rules.
 */
export class ValidationEngine {
  constructor(registry) {
    this.registry = registry;
  }
  
  /**
   * Validate a single property value against rules
   */
  validateProperty(propertyId, value, rules) {
    if (!rules) return null;
    
    for (const [ruleType, params] of Object.entries(rules)) {
      // Skip dependency rules - they're handled separately
      if (ruleType === 'dependency') continue;
      
      // Check for custom validator
      const validator = this.registry.getValidator(ruleType);
      if (validator) {
        const error = validator.validate(value, params);
        if (error) return error;
      }
      
      // Check for built-in validator in the control
      if (value !== undefined && value !== null) {
        const propertySchema = this.getPropertySchemaById(propertyId);
        if (propertySchema) {
          const control = this.registry.getPropertyControl(propertySchema.type);
          if (control && control.validate) {
            const error = control.validate(value, { [ruleType]: params });
            if (error) return error;
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Get property schema by ID
   */
  getPropertySchemaById(propertyId) {
    // This is a simplification - in a real implementation,
    // we would need to pass the full property schema
    return null;
  }
  
  /**
   * Validate all properties for a node
   */
  validateNodeProperties(nodeType, properties) {
    const plugin = this.registry.getNodeType(nodeType);
    if (!plugin) return {};
    
    const schema = plugin.getPropertySchema();
    const validationRules = plugin.getValidationRules();
    const errors = {};
    
    schema.forEach(propSchema => {
      const propertyId = propSchema.id;
      const value = properties[propertyId];
      const rules = validationRules[propertyId];
      
      if (rules) {
        // Check if this property should be validated based on dependencies
        const shouldValidate = this.shouldValidateProperty(propSchema, properties);
        
        if (shouldValidate) {
          const error = this.validateProperty(propertyId, value, rules);
          if (error) errors[propertyId] = error;
        }
      }
    });
    
    return errors;
  }
  
  /**
   * Check if a property should be validated based on its dependencies
   */
  shouldValidateProperty(propSchema, properties) {
    if (!propSchema.dependencies || propSchema.dependencies.length === 0) {
      return true;
    }
    
    return propSchema.dependencies.every(dep => {
      const sourceValue = properties[dep.sourceId];
      
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
  }
}
```

### Step 7: Implement Property Renderer

Create the component responsible for rendering properties based on the schema.

**File: src/components/AutomationWorkflow/NodeProperties/PropertyRenderer.jsx**

```jsx
import React, { useState, useEffect } from 'react';
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
  
  // Validate properties
  useEffect(() => {
    const validationEngine = new ValidationEngine(registry);
    const validationErrors = validationEngine.validateNodeProperties(node.type, node);
    setErrors(validationErrors);
    if (onValidate) {
      onValidate(Object.keys(validationErrors).length === 0, validationErrors);
    }
  }, [node, registry, onValidate]);
  
  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };
  
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
        <div key={group.id} className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
          <div 
            className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
            onClick={() => toggleGroup(group.id)}
          >
            <h3 className="font-medium text-gray-900">{group.label}</h3>
            <ChevronRight 
              className={`w-4 h-4 transition-transform duration-200 ${expandedGroups[group.id] ? 'transform rotate-90' : ''}`} 
            />
          </div>
          
          {expandedGroups[group.id] && (
            <div className="p-3">
              {group.description && (
                <p className="text-sm text-gray-500 mb-3">{group.description}</p>
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
          onChange={(newValue) => onChange(prop.id, newValue)}
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
```

### Step 8: Implement Node Properties Panel

Create the main properties panel component.

**File: src/components/AutomationWorkflow/NodeProperties/NodePropertiesPanel.jsx**

```jsx
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
  if (!node) return null;
  
  const plugin = registry.getNodeType(node.type);
  if (!plugin) return null;
  
  const propertySchema = plugin.getPropertySchema();
  const propertyGroups = plugin.getPropertyGroups();
  
  const handlePropertyChange = useCallback((propertyId, value) => {
    onUpdate(node.id, propertyId, value);
  }, [node.id, onUpdate]);
  
  const handleValidation = useCallback((isValid, errors) => {
    // You can handle validation results here
    // For example, disable save button if !isValid
  }, []);
  
  return (
    <div className="w-80 border-l bg-white overflow-y-auto animate-slideIn">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            <span className={`inline-block w-3 h-3 rounded-full bg-${plugin.color}-500 mr-2`}></span>
            {plugin.name} Properties
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
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
    </div>
  );
});

export default NodePropertiesPanel;
```

**File: src/components/AutomationWorkflow/NodeProperties/index.js**

```javascript
export { default as NodePropertiesPanel } from './NodePropertiesPanel';
export { PropertyRenderer } from './PropertyRenderer';
```

### Step 9: Implement Trigger Node Plugin

Create the first node type plugin for trigger nodes.

**File: src/components/AutomationWorkflow/plugins/TriggerNodePlugin.js**

```javascript
import { NodeTypePlugin } from './NodeTypePlugin';
import { Zap } from 'lucide-react';

/**
 * Trigger Node Plugin
 * 
 * A plugin for trigger node types.
 */
export const TriggerNodePlugin = new NodeTypePlugin({
  type: 'trigger',
  name: 'Trigger',
  icon: Zap,
  color: 'blue',
  description: 'Starts the workflow',
  
  propertyGroups: [
    {
      id: 'basic',
      label: 'Basic Information',
      description: 'Configure the basic trigger information',
      collapsed: false,
      order: 0
    },
    {
      id: 'triggerConfig',
      label: 'Trigger Configuration',
      description: 'Configure how this trigger works',
      collapsed: false,
      order: 1
    },
    {
      id: 'advanced',
      label: 'Advanced Settings',
      description: 'Configure advanced trigger options',
      collapsed: true,
      order: 2,
      conditions: [
        { propertyId: 'triggerType', operator: 'notEquals', value: 'simple' }
      ]
    }
  ],
  
  propertySchema: [
    {
      id: 'title',
      type: 'text',
      label: 'Title',
      description: 'The name of this trigger node',
      defaultValue: 'New Trigger',
      required: true,
      groupId: 'basic',
      order: 0
    },
    {
      id: 'subtitle',
      type: 'text',
      label: 'Subtitle',
      description: 'A brief description',
      defaultValue: '',
      required: false,
      groupId: 'basic',
      order: 1
    },
    {
      id: 'triggerType',
      type: 'select',
      label: 'Trigger Type',
      description: 'What type of trigger is this',
      defaultValue: 'segment',
      required: true,
      groupId: 'triggerConfig',
      order: 0,
      controlProps: {
        options: [
          { value: 'segment', label: 'Segment Membership' },
          { value: 'event', label: 'Event Occurred' },
          { value: 'schedule', label: 'Time Schedule' },
          { value: 'api', label: 'API Call' },
          { value: 'simple', label: 'Simple Trigger' }
        ]
      }
    },
    {
      id: 'segmentId',
      type: 'select',
      label: 'Segment',
      description: 'Which user segment triggers this flow',
      defaultValue: '',
      required: true,
      groupId: 'triggerConfig',
      order: 1,
      dependencies: [
        { sourceId: 'triggerType', condition: 'equals', value: 'segment' }
      ],
      controlProps: {
        options: [
          { value: 'new_users', label: 'New Users' },
          { value: 'power_users', label: 'Power Users' },
          { value: 'inactive', label: 'Inactive Users' }
        ]
      }
    },
    {
      id: 'eventName',
      type: 'text',
      label: 'Event Name',
      description: 'Name of the event that triggers this flow',
      defaultValue: '',
      required: true,
      groupId: 'triggerConfig',
      order: 1,
      dependencies: [
        { sourceId: 'triggerType', condition: 'equals', value: 'event' }
      ]
    },
    {
      id: 'throttling',
      type: 'number',
      label: 'Throttle Rate (per minute)',
      description: 'Limit how many times this trigger can fire',
      defaultValue: 0,
      required: false,
      groupId: 'advanced',
      order: 0
    }
  ],
  
  validationRules: {
    title: {
      required: true,
      minLength: 3,
      maxLength: 50
    },
    segmentId: {
      required: true,
      dependency: {
        field: 'triggerType',
        value: 'segment'
      }
    },
    eventName: {
      required: true,
      dependency: {
        field: 'triggerType',
        value: 'event'
      }
    }
  },
  
  initialProperties: {
    triggerType: 'segment',
    title: 'New Trigger',
    subtitle: ''
  }
});
```

### Step 10: Update AutomationWorkflow Component

Update the main component to use the new properties panel.

**File: src/AutomationWorkflow.jsx (partial update)**

```jsx
// Import the plugin registry and plugins
import { pluginRegistry } from './components/AutomationWorkflow/plugins/registry';
import { TriggerNodePlugin } from './components/AutomationWorkflow/plugins/TriggerNodePlugin';

// Import the NodePropertiesPanel
import { NodePropertiesPanel } from './components/AutomationWorkflow/NodeProperties';

// Import built-in controls
import { 
  TextInputControl, 
  SelectControl, 
  NumberControl 
} from './components/AutomationWorkflow/controls';

// Register node types
pluginRegistry.registerNodeType(TriggerNodePlugin);

// Register property controls
pluginRegistry.registerPropertyControl(TextInputControl);
pluginRegistry.registerPropertyControl(SelectControl);
pluginRegistry.registerPropertyControl(NumberControl);

// In the AutomationWorkflow component:

// Generic node update handler
const handleUpdateNodeProperty = (nodeId, propertyId, value) => {
  setWorkflowSteps(prevSteps => {
    const nodeIndex = prevSteps.findIndex(step => step.id === nodeId);
    if (nodeIndex === -1) return prevSteps;
    
    // Only create a new array if we're actually changing something
    if (prevSteps[nodeIndex][propertyId] === value) return prevSteps;
    
    const newSteps = [...prevSteps];
    newSteps[nodeIndex] = {
      ...newSteps[nodeIndex],
      [propertyId]: value
    };
    return newSteps;
  });
};

// Then in the render function:
{selectedNodeIndex !== null && (
  <NodePropertiesPanel
    node={workflowSteps[selectedNodeIndex]}
    onClose={() => setSelectedNodeIndex(null)}
    onUpdate={handleUpdateNodeProperty}
    registry={pluginRegistry}
  />
)}
```

## Phase 2: Implement Control and Action Node Types

### Step 1: Create Control Node Plugin

Create a plugin for control nodes.

**File: src/components/AutomationWorkflow/plugins/ControlNodePlugin.js**

```javascript
import { NodeTypePlugin } from './NodeTypePlugin';
import { Hexagon } from 'lucide-react';

/**
 * Control Node Plugin
 * 
 * A plugin for control node types.
 */
export const ControlNodePlugin = new NodeTypePlugin({
  type: 'control',
  name: 'Control',
  icon: Hexagon,
  color: 'purple',
  description: 'Controls flow with conditions',
  
  propertyGroups: [
    {
      id: 'basic',
      label: 'Basic Information',
      description: 'Configure the basic control information',
      collapsed: false,
      order: 0
    },
    {
      id: 'controlConfig',
      label: 'Control Configuration',
      description: 'Configure how this control works',
      collapsed: false,
      order: 1
    }
  ],
  
  propertySchema: [
    {
      id: 'title',
      type: 'text',
      label: 'Title',
      description: 'The name of this control node',
      defaultValue: 'New Control',
      required: true,
      groupId: 'basic',
      order: 0
    },
    {
      id: 'subtitle',
      type: 'text',
      label: 'Subtitle',
      description: 'A brief description',
      defaultValue: '',
      required: false,
      groupId: 'basic',
      order: 1
    },
    {
      id: 'conditionType',
      type: 'select',
      label: 'Condition Type',
      description: 'How to evaluate conditions',
      defaultValue: 'and',
      required: true,
      groupId: 'controlConfig',
      order: 0,
      controlProps: {
        options: [
          { value: 'and', label: 'All conditions must match (AND)' },
          { value: 'or', label: 'Any condition can match (OR)' }
        ]
      }
    }
  ],
  
  validationRules: {
    title: {
      required: true,
      minLength: 3,
      maxLength: 50
    }
  },
  
  initialProperties: {
    conditionType: 'and',
    title: 'New Control',
    subtitle: ''
  }
});
```

### Step 2: Create Action Node Plugin

Create a plugin for action nodes.

**File: src/components/AutomationWorkflow/plugins/ActionNodePlugin.js**

```javascript
import { NodeTypePlugin } from './NodeTypePlugin';
import { Send } from 'lucide-react';

/**
 * Action Node Plugin
 * 
 * A plugin for action node types.
 */
export const ActionNodePlugin = new NodeTypePlugin({
  type: 'action',
  name: 'Action',
  icon: Send,
  color: 'red',
  description: 'Performs an action',
  
  propertyGroups: [
    {
      id: 'basic',
      label: 'Basic Information',
      description: 'Configure the basic action information',
      collapsed: false,
      order: 0
    },
    {
      id: 'actionConfig',
      label: 'Action Configuration',
      description: 'Configure how this action works',
      collapsed: false,
      order: 1
    },
    {
      id: 'advanced',
      label: 'Advanced Settings',
      description: 'Configure advanced action options',
      collapsed: true,
      order: 2
    }
  ],
  
  propertySchema: [
    {
      id: 'title',
      type: 'text',
      label: 'Title',
      description: 'The name of this action node',
      defaultValue: 'New Action',
      required: true,
      groupId: 'basic',
      order: 0
    },
    {
      id: 'subtitle',
      type: 'text',
      label: 'Subtitle',
      description: 'A brief description',
      defaultValue: '',
      required: false,
      groupId: 'basic',
      order: 1
    },
    {
      id: 'actionType',
      type: 'select',
      label: 'Action Type',
      description: 'What type of action to perform',
      defaultValue: 'notification',
      required: true,
      groupId: 'actionConfig',
      order: 0,
      controlProps: {
        options: [
          { value: 'notification', label: 'Send Notification' },
          { value: 'email', label: 'Send Email' },
          { value: 'webhook', label: 'Call Webhook' }
        ]
      }
    },
    {
      id: 'message',
      type: 'text',
      label: 'Message',
      description: 'The message to send',
      defaultValue: '',
      required: true,
      groupId: 'actionConfig',
      order: 1,
      dependencies: [
        { sourceId: 'actionType', condition: 'equals', value: 'notification' }
      ]
    },
    {
      id: 'retry',
      type: 'number',
      label: 'Retry Attempts',
      description: 'Number of retry attempts if the action fails',
      defaultValue: 0,
      required: false,
      groupId: 'advanced',
      order: 0
    }
  ],
  
  validationRules: {
    title: {
      required: true,
      minLength: 3,
      maxLength: 50
    },
    message: {
      required: true,
      dependency: {
        field: 'actionType',
        value: 'notification'
      }
    }
  },
  
  initialProperties: {
    actionType: 'notification',
    title: 'New Action',
    subtitle: ''
  }
});
```

### Step 3: Update AutomationWorkflow Component

Register the new node type plugins.

```jsx
// Import the new plugins
import { ControlNodePlugin } from './components/AutomationWorkflow/plugins/ControlNodePlugin';
import { ActionNodePlugin } from './components/AutomationWorkflow/plugins/ActionNodePlugin';

// Register node types
pluginRegistry.registerNodeType(TriggerNodePlugin);
pluginRegistry.registerNodeType(ControlNodePlugin);
pluginRegistry.registerNodeType(ActionNodePlugin);
```

## Phase 3: Implement Advanced Features

### Step 1: Create Condition Builder Control

Create a more complex control for building conditions.

**File: src/components/AutomationWorkflow/controls/ConditionBuilderControl.jsx**

```jsx
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { PropertyControl } from './PropertyControl';

/**
 * Condition Builder Control
 * 
 * A control for building complex conditions.
 */
export const ConditionBuilderControl = new PropertyControl({
  type: 'conditionBuilder',
  component: ({ value = [], onChange, label, error, description }) => {
    const [conditions, setConditions] = useState(value);
    
    const addCondition = () => {
      setConditions([...conditions, { field: '', operator: 'equals', value: '' }]);
    };
    
    const updateCondition = (index, field, newValue) => {
      const newConditions = [...conditions];
      newConditions[index] = { ...newConditions[index], [field]: newValue };
      setConditions(newConditions);
      onChange(newConditions);
    };
    
    const removeCondition = (index) => {
      const newConditions = conditions.filter((_, i) => i !== index);
      setConditions(newConditions);
      onChange(newConditions);
    };
    
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {description && <p className="text-sm text-gray-500 mb-2">{description}</p>}
        
        {conditions.map((condition, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <input
              type="text"
              placeholder="Field"
              value={condition.field}
              onChange={(e) => updateCondition(index, 'field', e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-md"
            />
            
            <select
              value={condition.operator}
              onChange={(e) => updateCondition(index, 'operator', e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="equals">Equals</option>
              <option value="notEquals">Not Equals</option>
              <option value="contains">Contains</option>
              <option value="greaterThan">Greater Than</option>
              <option value="lessThan">Less Than</option>
            </select>
            
            <input
              type="text"
              placeholder="Value"
              value={condition.value}
              onChange={(e) => updateCondition(index, 'value', e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-md"
            />
            
            <button
              type="button"
              onClick={() => removeCondition(index)}
              className="p-1 text-red-500 hover:bg-red-50 rounded"
            >
              ×
            </button>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addCondition}
          className="mt-2 flex items-center text-sm text-blue-500 hover:text-blue-700"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Condition
        </button>
        
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
});
```

### Step 2: Update Controls Index

Add the new control to the index.

**File: src/components/AutomationWorkflow/controls/index.js**

```javascript
export { PropertyControl } from './PropertyControl';
export { TextInputControl } from './TextInputControl';
export { SelectControl } from './SelectControl';
export { NumberControl } from './NumberControl';
export { ConditionBuilderControl } from './ConditionBuilderControl';
```

### Step 3: Update Node Type Plugins

Update the control node plugin to use the condition builder.

**File: src/components/AutomationWorkflow/plugins/ControlNodePlugin.js (partial update)**

```javascript
// Add to the propertySchema array
{
  id: 'conditions',
  type: 'conditionBuilder',
  label: 'Conditions',
  description: 'Define the conditions for this control',
  defaultValue: [],
  required: true,
  groupId: 'controlConfig',
  order: 1
}
```

## Phase 4: Add Third-Party Plugin Support

### Step 1: Create Plugin Loader

Create a loader for external plugins.

**File: src/components/AutomationWorkflow/plugins/pluginLoader.js**

```javascript
import { pluginRegistry } from './registry';

/**
 * Load an external plugin from a URL
 */
export const loadExternalPlugin = async (url) => {
  try {
    // Dynamically import the plugin module
    const module = await import(/* webpackIgnore: true */ url);
    
    if (!module.default) {
      throw new Error('Plugin must export a default export');
    }
    
    // Validate plugin structure
    const plugin = module.default;
    if (!plugin.type || !plugin.name) {
      throw new Error('Plugin must have type and name properties');
    }
    
    // Register the plugin
    pluginRegistry.registerNodeType(plugin);
    
    return {
      success: true,
      plugin
    };
  } catch (error) {
    console.error('Failed to load plugin:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
```

### Step 2: Create a Plugin Manager Component

Create a component to manage plugins.

**File: src/components/AutomationWorkflow/PluginManager.jsx**

```jsx
import React, { useState } from 'react';
import { loadExternalPlugin } from './plugins/pluginLoader';

/**
 * Plugin Manager
 * 
 * A component for managing plugins.
 */
export const PluginManager = ({ onPluginLoaded }) => {
  const [pluginUrl, setPluginUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadedPlugins, setLoadedPlugins] = useState([]);
  
  const handleLoadPlugin = async () => {
    if (!pluginUrl) return;
    
    setLoading(true);
    setError('');
    
    try {
      const result = await loadExternalPlugin(pluginUrl);
      
      if (result.success) {
        setLoadedPlugins([...loadedPlugins, result.plugin]);
        setPluginUrl('');
        if (onPluginLoaded) {
          onPluginLoaded(result.plugin);
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-4 border rounded-lg bg-white mb-4">
      <h3 className="text-lg font-medium mb-2">Plugin Manager</h3>
      
      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Plugin URL"
          value={pluginUrl}
          onChange={(e) => setPluginUrl(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-l-md"
          disabled={loading}
        />
        <button
          onClick={handleLoadPlugin}
          className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600"
          disabled={loading || !pluginUrl}
        >
          {loading ? 'Loading...' : 'Load Plugin'}
        </button>
      </div>
      
      {error && (
        <p className="text-red-500 mb-4">{error}</p>
      )}
      
      {loadedPlugins.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Loaded Plugins:</h4>
          <ul className="list-disc pl-5">
            {loadedPlugins.map((plugin, index) => (
              <li key={index}>
                {plugin.name} ({plugin.type})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

## Next Steps: Implementation

To implement this architecture, I recommend following these steps:

1. Create the folder structure as outlined above
2. Implement the core components in Phase 1
3. Test the basic functionality with the Trigger node type
4. Add the Control and Action node types (Phase 2)
5. Implement the advanced features (Phase 3)
6. Add third-party plugin support (Phase 4)

With this approach, you'll have a working implementation after Phase 1, and can gradually add more features in subsequent phases.

I recommend switching to Code mode to implement this architecture, as it will involve creating multiple files and components.