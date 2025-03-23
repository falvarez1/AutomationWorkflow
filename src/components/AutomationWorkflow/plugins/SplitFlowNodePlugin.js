import { createNodePlugin } from './createNodePlugin';
import { GitMerge } from 'lucide-react';

/**
 * Split Flow Node Plugin
 *
 * A plugin for splitting the workflow into multiple parallel paths.
 */
export const SplitFlowNodePlugin = createNodePlugin({
  // Basic node configuration
  type: 'splitflow',
  name: 'Split Flow',
  icon: GitMerge,
  color: 'green',
  description: 'Split workflow into multiple parallel paths',
  
  // Use common property groups and properties
  useCommonGroups: ['basic'],
  useCommonProperties: ['title', 'subtitle'],
  
  // Custom property overrides
  propertyOverrides: {
    title: {
      description: 'The name of this split flow node',
      defaultValue: 'Split flow'
    },
    subtitle: {
      description: 'A brief description of the parallel paths',
      defaultValue: 'Execute multiple paths in parallel'
    }
  },
  
  // Custom property groups
  propertyGroups: [
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
      description: 'Configure the branch paths',
      collapsed: false,
      order: 2
    }
  ],
  
  // Custom properties
  propertySchema: [
    {
      id: 'pathCount',
      type: 'select',
      label: 'Number of Parallel Paths',
      description: 'How many parallel paths to create',
      defaultValue: '2',
      required: true,
      groupId: 'splitConfig',
      order: 0,
      controlProps: {
        options: [
          { value: '2', label: '2 Paths' },
          { value: '3', label: '3 Paths' }
        ]
      }
    },
    {
      id: 'splitAttribute',
      type: 'select',
      label: 'Split Attribute',
      description: 'User attribute to split on',
      defaultValue: 'first_name',
      required: true,
      groupId: 'splitConfig',
      order: 1,
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
      order: 2,
      visibilityCondition: (props) => props.splitAttribute === 'custom_attribute'
    },
    {
      id: 'path1Name',
      type: 'text',
      label: 'Path 1 Name',
      description: 'Name for parallel path 1',
      defaultValue: 'Path 1',
      required: true,
      groupId: 'branchConfig',
      order: 0
    },
    {
      id: 'path2Name',
      type: 'text',
      label: 'Path 2 Name',
      description: 'Name for parallel path 2',
      defaultValue: 'Path 2',
      required: true,
      groupId: 'branchConfig',
      order: 1
    },
    {
      id: 'path3Name',
      type: 'text',
      label: 'Path 3 Name',
      description: 'Name for parallel path 3',
      defaultValue: 'Path 3',
      required: false,
      groupId: 'branchConfig',
      order: 2,
      visibilityCondition: (props) => props.pathCount === '3'
    }
  ],
  
  // Define the branches generation function for this node type
  getBranchesFromProps: (props) => {
    // Create branches based on pathCount
    const branches = [];
    
    // Add Path 1
    branches.push({
      id: 'path1',
      label: props.path1Name || 'Path 1',
      description: `Parallel path 1`
    });
    
    // Add Path 2
    branches.push({
      id: 'path2',
      label: props.path2Name || 'Path 2',
      description: `Parallel path 2`
    });
    
    // Add Path 3 if configured
    if (props.pathCount === '3') {
      branches.push({
        id: 'path3',
        label: props.path3Name || 'Path 3',
        description: `Parallel path 3`
      });
    }
    
    return branches;
  },
  
  // Custom validation rules (inherits common ones for title/subtitle)
  validationRules: {
    pathCount: {
      required: true
    },
    splitAttribute: {
      required: true
    },
    customAttributeName: {
      required: (props) => props.splitAttribute === 'custom_attribute',
      minLength: 1
    },
    path1Name: {
      required: true,
      minLength: 1
    },
    path2Name: {
      required: true,
      minLength: 1
    },
    path3Name: {
      required: (props) => props.pathCount === '3',
      minLength: 1
    }
  },
  
  // Initial properties (will be merged with defaults for common properties)
  initialProperties: {
    title: 'Split flow',
    subtitle: 'Execute multiple paths in parallel',
    pathCount: '2',
    splitAttribute: 'first_name',
    customAttributeName: '',
    path1Name: 'Path 1',
    path2Name: 'Path 2',
    path3Name: 'Path 3'
  },
  
  // Custom preprocessor for properties
  preprocessProperties: (props) => {
    // Ensure pathCount is treated as a string for consistency
    const pathCount = typeof props.pathCount === 'number'
      ? String(props.pathCount)
      : (props.pathCount || '2');
    
    return {
      ...props,
      pathCount
    };
  }
});