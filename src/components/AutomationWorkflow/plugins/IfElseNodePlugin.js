import { NodeTypePlugin } from './NodeTypePlugin';
import { GitBranch } from 'lucide-react';

/**
 * If/Else Node Plugin
 * 
 * A plugin for conditional branching node types.
 */
export const IfElseNodePlugin = new NodeTypePlugin({
  type: 'ifelse',
  name: 'If/Else',
  icon: GitBranch,
  color: 'indigo',
  description: 'Creates a conditional branch in the flow',
  
  // Define the branches for this node type
  branches: [
    { id: 'yes', label: 'Yes', description: 'Path taken when condition is true' },
    { id: 'no', label: 'No', description: 'Path taken when condition is false' }
  ],
  
  propertyGroups: [
    {
      id: 'basic',
      label: 'Basic Information',
      description: 'Configure the basic information',
      collapsed: false,
      order: 0
    },
    {
      id: 'conditionConfig',
      label: 'Condition Configuration',
      description: 'Configure the condition for this branch',
      collapsed: false,
      order: 1
    }
  ],
  
  propertySchema: [
    {
      id: 'title',
      type: 'text',
      label: 'Title',
      description: 'The name of this condition node',
      defaultValue: 'If/else',
      required: true,
      groupId: 'basic',
      order: 0
    },
    {
      id: 'subtitle',
      type: 'text',
      label: 'Subtitle',
      description: 'A brief description of the condition',
      defaultValue: 'Clicked link is not Something...',
      required: false,
      groupId: 'basic',
      order: 1
    },
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
  
  validationRules: {
    title: {
      required: true,
      minLength: 3,
      maxLength: 50
    },
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
  
  initialProperties: {
    title: 'If/else',
    subtitle: 'Clicked link is not Something...',
    conditionField: 'link_click',
    operator: 'equals',
    value: ''
  }
});
