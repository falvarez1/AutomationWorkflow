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
      id: 'emailSubject',
      type: 'text',
      label: 'Email Subject',
      description: 'Subject of the email',
      defaultValue: '',
      required: true,
      groupId: 'actionConfig',
      order: 1,
      dependencies: [
        { sourceId: 'actionType', condition: 'equals', value: 'email' }
      ]
    },
    {
      id: 'emailBody',
      type: 'text',
      label: 'Email Body',
      description: 'Content of the email',
      defaultValue: '',
      required: true,
      groupId: 'actionConfig',
      order: 2,
      dependencies: [
        { sourceId: 'actionType', condition: 'equals', value: 'email' }
      ]
    },
    {
      id: 'webhookUrl',
      type: 'text',
      label: 'Webhook URL',
      description: 'URL to call',
      defaultValue: '',
      required: true,
      groupId: 'actionConfig',
      order: 1,
      dependencies: [
        { sourceId: 'actionType', condition: 'equals', value: 'webhook' }
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
    },
    emailSubject: {
      required: true,
      dependency: {
        field: 'actionType',
        value: 'email'
      }
    },
    emailBody: {
      required: true,
      dependency: {
        field: 'actionType',
        value: 'email'
      }
    },
    webhookUrl: {
      required: true,
      dependency: {
        field: 'actionType',
        value: 'webhook'
      }
    }
  },
  
  initialProperties: {
    actionType: 'notification',
    title: 'New Action',
    subtitle: ''
  }
});