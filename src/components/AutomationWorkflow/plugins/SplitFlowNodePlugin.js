import { NodeTypePlugin } from './NodeTypePlugin';
import { GitMerge } from 'lucide-react';

/**
 * Split Flow Node Plugin
 *
 * A plugin for splitting the flow based on user attributes.
 */
export const SplitFlowNodePlugin = new NodeTypePlugin({
  type: 'splitflow',
  name: 'Split Flow',
  icon: GitMerge,
  color: 'green',
  description: 'Split workflow into multiple paths based on user attributes',
  
  // Dynamic branches - will be generated based on configuration
  // The base class will provide a method to get actual branches
  getBranchesFromProps: (props) => {
    // Default branches if not fully configured
    if (!props || !props.branchValues || !props.branchValues.length) {
      return [
        { id: 'default', label: 'Default Path', description: 'Default branch when no conditions matched' },
        { id: 'other', label: 'All Others', description: 'All other values' }
      ];
    }
    
    // Create branches from the configured values
    const branches = props.branchValues.map((value, index) => ({
      id: `branch_${index}`,
      label: value,
      description: `Path for ${props.splitAttribute} = ${value}`
    }));
    
    // Always add "All Others" branch as the catch-all
    branches.push({
      id: 'other',
      label: 'All Others',
      description: 'Path for all other values'
    });
    
    return branches;
  },
  
  propertyGroups: [
    {
      id: 'basic',
      label: 'Basic Information',
      description: 'Configure the basic split information',
      collapsed: false,
      order: 0
    },
    {
      id: 'splitConfig',
      label: 'Split Configuration',
      description: 'Configure how this split works',
      collapsed: false,
      order: 1
    },
    {
      id: 'branchConfig',
      label: 'Branch Configuration',
      description: 'Configure the branch values',
      collapsed: false,
      order: 2
    }
  ],
  
  propertySchema: [
    {
      id: 'title',
      type: 'text',
      label: 'Title',
      description: 'The name of this split node',
      defaultValue: 'Split flow',
      required: true,
      groupId: 'basic',
      order: 0
    },
    {
      id: 'subtitle',
      type: 'text',
      label: 'Subtitle',
      description: 'A brief description of the split',
      defaultValue: 'Split based on First name',
      required: false,
      groupId: 'basic',
      order: 1
    },
    {
      id: 'splitAttribute',
      type: 'select',
      label: 'Split Attribute',
      description: 'User attribute to split on',
      defaultValue: 'first_name',
      required: true,
      groupId: 'splitConfig',
      order: 0,
      controlProps: {
        options: [
          { value: 'first_name', label: 'First Name' },
          { value: 'last_name', label: 'Last Name' },
          { value: 'email', label: 'Email Address' },
          { value: 'country', label: 'Country' },
          { value: 'segment', label: 'Segment' },
          { value: 'custom_attribute', label: 'Custom Attribute' }
        ]
      }
    },
    {
      id: 'customAttributeName',
      type: 'text',
      label: 'Custom Attribute Name',
      description: 'Name of the custom attribute',
      defaultValue: '',
      required: false,
      groupId: 'splitConfig',
      order: 1,
      visibilityCondition: (props) => props.splitAttribute === 'custom_attribute'
    },
    {
      id: 'branchValues',
      type: 'text',
      label: 'Branch Values',
      description: 'Comma-separated list of branch values (e.g., "Fred, Jane, Bob")',
      defaultValue: 'Fred',
      required: true,
      groupId: 'branchConfig',
      order: 0
    }
  ],
  
  validationRules: {
    title: {
      required: true,
      minLength: 3,
      maxLength: 50
    },
    splitAttribute: {
      required: true
    },
    customAttributeName: {
      required: (props) => props.splitAttribute === 'custom_attribute',
      minLength: 1
    },
    branchValues: {
      required: true,
      minLength: 1
    }
  },
  
  initialProperties: {
    title: 'Split flow',
    subtitle: 'Split based on First name',
    splitAttribute: 'first_name',
    customAttributeName: '',
    branchValues: 'Fred'
  },
  
  // Custom preprocessor to convert branchValues string to array before use
  preprocessProperties: (props) => {
    if (props.branchValues && typeof props.branchValues === 'string') {
      return {
        ...props,
        branchValuesArray: props.branchValues.split(',').map(val => val.trim()).filter(val => val)
      };
    }
    return props;
  }
});