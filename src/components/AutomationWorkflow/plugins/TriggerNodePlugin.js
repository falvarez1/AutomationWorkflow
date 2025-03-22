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