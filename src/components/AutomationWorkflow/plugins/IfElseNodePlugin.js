import { createNodePlugin } from './createNodePlugin';
import { GitBranch } from 'lucide-react';

/**
 * If/Else Node Plugin
 *
 * A plugin for conditional branching node types.
 */
export const IfElseNodePlugin = createNodePlugin({
  // Basic node configuration
  type: 'ifelse',
  name: 'If/Else',
  icon: GitBranch,
  color: 'indigo',
  description: 'Creates a conditional branch in the flow',
  
  // Use common property groups and properties
  useCommonGroups: ['basic'],
  useCommonProperties: ['title', 'subtitle'],
  
  // Custom property overrides
  propertyOverrides: {
    title: {
      description: 'The name of this condition node',
      defaultValue: 'If/else'
    },
    subtitle: {
      description: 'A brief description of the condition',
      defaultValue: 'Clicked link is not Something...'
    }
  },
  
  // Custom property groups
  propertyGroups: [
    {
      id: 'conditionConfig',
      label: 'Condition Configuration',
      description: 'Configure the condition for this branch',
      collapsed: false,
      order: 1
    }
  ],
  
  // Custom properties
  propertySchema: [
    {
      id: 'conditionField',
      type: 'select',
      label: 'Condition Field',
      description: 'Select field to evaluate',
      defaultValue: 'link_click',
      required: true,
      groupId: 'conditionConfig',
      order: 0,
      controlProps: {
        options: [
          { value: 'link_click', label: 'Link Click' },
          { value: 'email_open', label: 'Email Open' },
          { value: 'user_attribute', label: 'User Attribute' },
          { value: 'event', label: 'Custom Event' }
        ]
      }
    },
    {
      id: 'operator',
      type: 'select',
      label: 'Operator',
      description: 'Comparison operator',
      defaultValue: 'equals',
      required: true,
      groupId: 'conditionConfig',
      order: 1,
      controlProps: {
        options: [
          { value: 'equals', label: 'Equals' },
          { value: 'not_equals', label: 'Does not equal' },
          { value: 'contains', label: 'Contains' },
          { value: 'not_contains', label: 'Does not contain' },
          { value: 'exists', label: 'Exists' },
          { value: 'not_exists', label: 'Does not exist' }
        ]
      }
    },
    {
      id: 'value',
      type: 'text',
      label: 'Value',
      description: 'The value to compare against',
      defaultValue: '',
      required: false,
      groupId: 'conditionConfig',
      order: 2,
      visibilityCondition: (props) => ['equals', 'not_equals', 'contains', 'not_contains'].includes(props.operator)
    }
  ],
  
  // Define the branches for this node type
  branches: [
    { id: 'yes', label: 'Yes', description: 'Path taken when condition is true' },
    { id: 'no', label: 'No', description: 'Path taken when condition is false' }
  ],
  
  // Custom validation rules (inherits common ones for title/subtitle)
  validationRules: {
    conditionField: {
      required: true
    },
    operator: {
      required: true
    },
    value: {
      required: (props) => ['equals', 'not_equals', 'contains', 'not_contains'].includes(props.operator)
    }
  },
  
  // Initial properties (will be merged with defaults for common properties)
  initialProperties: {
    title: 'If/else',
    subtitle: 'Clicked link is not Something...',
    conditionField: 'link_click',
    operator: 'equals',
    value: ''
  }
});
