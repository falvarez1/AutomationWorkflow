/**
 * Common property definitions used across node plugins
 */
export const commonProperties = {
  // Title property used in all node types
  title: {
    id: 'title',
    type: 'text',
    label: 'Title',
    description: 'The name of this node',
    required: true,
    groupId: 'basic',
    order: 0
  },
  
  // Subtitle property used in most node types
  subtitle: {
    id: 'subtitle',
    type: 'text',
    label: 'Subtitle',
    description: 'A brief description',
    required: false,
    groupId: 'basic',
    order: 1
  }
};