import { createNodePlugin } from './createNodePlugin';
import { Send } from 'lucide-react';

/**
 * Action Node Plugin
 *
 * A plugin for action node types.
 */
export const ActionNodePlugin = createNodePlugin({
  // Basic node configuration
  type: 'action',
  name: 'Action',
  icon: Send,
  color: 'red',
  description: 'Performs an action',
  
  // Use common property groups and properties
  useCommonGroups: ['basic', 'advanced'],
  useCommonProperties: ['title', 'subtitle'],
  
  // Custom property overrides
  propertyOverrides: {
    title: {
      description: 'The name of this action node',
      defaultValue: 'New Action'
    }
  },
  
  // Custom property groups
  propertyGroups: [
    {
      id: 'actionConfig',
      label: 'Action Configuration',
      description: 'Configure how this action works',
      collapsed: false,
      order: 1
    }
  ],
  
  // Custom properties
  propertySchema: [
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
      order: 0,
      controlProps: {
        id: 'retry-inputbox' // User specified ID instead of auto-generated
      }
    },
    {
      id: 'notifyOnCompletion',
      type: 'checkbox',
      label: 'Notify on Completion',
      description: 'Send a notification when this action completes',
      defaultValue: false,
      required: false,
      groupId: 'advanced',
      order: 1,
      controlProps: {
        id: 'notify-completion-checkbox' // User specified ID instead of auto-generated
      }
    }
  ],
  
  // Custom validation rules
  validationRules: {
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
  
  // Initial properties
  initialProperties: {
    actionType: 'notification',
    title: 'New Action',
    subtitle: '',
    notifyOnCompletion: false
  }
});