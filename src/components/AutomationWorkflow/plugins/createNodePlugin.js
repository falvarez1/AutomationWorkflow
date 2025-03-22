import { NodeTypePlugin } from './NodeTypePlugin';
import { commonPropertyGroups } from './common/propertyGroups';
import { commonProperties } from './common/propertyDefinitions';
import { commonValidationRules } from './common/validationRules';

/**
 * Factory function to create a node plugin with common functionality
 * @param {Object} config - Plugin configuration
 * @returns {NodeTypePlugin} A configured NodeTypePlugin instance
 */
export function createNodePlugin(config) {
  // Process common property groups to include
  const propertyGroups = [
    // Include requested common groups
    ...(config.useCommonGroups || []).map(groupId => commonPropertyGroups[groupId]),
    // Include custom groups
    ...(config.propertyGroups || [])
  ].filter(Boolean); // Filter out any undefined groups

  // Process common properties to include
  const propertySchema = [
    // Include requested common properties
    ...(config.useCommonProperties || []).map(propId => {
      // Allow customizing common properties by merging
      if (config.propertyOverrides && config.propertyOverrides[propId]) {
        return {
          ...commonProperties[propId],
          ...config.propertyOverrides[propId]
        };
      }
      return commonProperties[propId];
    }),
    // Include custom properties
    ...(config.propertySchema || [])
  ].filter(Boolean); // Filter out any undefined properties

  // Process validation rules
  const validationRules = {
    // Include validation rules for common properties
    ...(config.useCommonProperties || []).reduce((rules, propId) => {
      if (commonValidationRules[propId]) {
        rules[propId] = commonValidationRules[propId];
      }
      return rules;
    }, {}),
    // Include custom validation rules (will override common ones if same property)
    ...(config.validationRules || {})
  };

  // Set default initialProperties if using common properties
  const initialProperties = config.initialProperties || {};
  if (config.useCommonProperties && config.useCommonProperties.includes('title')) {
    initialProperties.title = initialProperties.title || 'New Node';
  }

  // Create the plugin with merged configuration
  return new NodeTypePlugin({
    ...config,
    propertyGroups,
    propertySchema,
    validationRules,
    initialProperties
  });
}