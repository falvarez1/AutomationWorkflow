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