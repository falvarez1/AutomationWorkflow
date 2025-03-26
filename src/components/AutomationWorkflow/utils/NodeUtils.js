import { NODE_TYPES } from '../constants';
import { generateUniqueId } from './GeneralUtils';
import { LAYOUT } from '../constants';

/**
 * Get default title for a node based on its type
 * 
 * @param {string} nodeType - Type of the node
 * @returns {string} Default title
 */
export const getDefaultTitle = (nodeType) => {
  switch (nodeType) {
    case NODE_TYPES.TRIGGER:
      return 'New Trigger';
    case NODE_TYPES.CONTROL:
      return 'New Control';
    case NODE_TYPES.ACTION:
      return 'New Action';
    case NODE_TYPES.IFELSE:
      return 'New If/Else';
    case NODE_TYPES.SPLITFLOW:
      return 'New Split Flow';
    default:
      return 'New Step';
  }
};

/**
 * Get default subtitle for a node based on its type
 * 
 * @param {string} nodeType - Type of the node
 * @returns {string} Default subtitle
 */
export const getDefaultSubtitle = (nodeType) => {
  switch (nodeType) {
    case NODE_TYPES.TRIGGER:
      return 'Configure this trigger';
    case NODE_TYPES.CONTROL:
      return 'Configure this control';
    case NODE_TYPES.ACTION:
      return 'Configure this action';
    case NODE_TYPES.IFELSE:
      return 'Configure condition';
    case NODE_TYPES.SPLITFLOW:
      return 'Configure split conditions';
    default:
      return 'Configure properties';
  }
};

/**
 * Create a new node with the specified properties
 *
 * @param {string} nodeType - Type of node to create
 * @param {Object} position - Position {x, y} for the new node
 * @param {Object} pluginRegistry - Plugin registry for looking up node type metadata
 * @param {Object} overrides - Optional property overrides
 * @returns {Object} New node object
 */
export const createNewNode = (nodeType, position, pluginRegistry, overrides = {}) => {
  // Get any initial properties from the node plugin
  const nodePlugin = pluginRegistry.getNodeType(nodeType);
  const initialProps = nodePlugin.getInitialProperties ? nodePlugin.getInitialProperties() : {};
  
  // Create base node
  const newNode = {
    id: generateUniqueId(),
    type: nodeType,
    position,
    height: LAYOUT.NODE.DEFAULT_HEIGHT,
    isNew: true,
    contextMenuConfig: { position: 'right', offsetX: -5, offsetY: 0, orientation: 'vertical' },
    title: getDefaultTitle(nodeType),
    subtitle: getDefaultSubtitle(nodeType),
    sourceNodeRefs: [], // Initialize empty sourceNodeRefs array
    ...initialProps,
    ...overrides
  };
  
  // For splitflow nodes, ensure properties are properly initialized
  if (nodeType === NODE_TYPES.SPLITFLOW) {
    // Make sure properties needed for branches exist
    newNode.properties = {
      pathCount: '2',
      path1Name: 'Path 1',
      path2Name: 'Path 2',
      path3Name: 'Path 3',
      splitAttribute: 'first_name',
      ...initialProps,
      ...(overrides.properties || {})
    };
  }
  
  return newNode;
};