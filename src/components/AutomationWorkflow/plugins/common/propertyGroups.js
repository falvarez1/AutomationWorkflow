/**
 * Common property groups used across node plugins
 */
export const commonPropertyGroups = {
  // Basic information group used in most node types
  basic: {
    id: 'basic',
    label: 'Basic Information',
    description: 'Configure the basic information',
    collapsed: false,
    order: 0
  },
  
  // Advanced settings group
  advanced: {
    id: 'advanced',
    label: 'Advanced Settings',
    description: 'Configure advanced options',
    collapsed: true,
    order: 10
  }
};