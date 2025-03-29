/**
 * Node Type Plugin
 *
 * Base class for node type plugins that defines the structure and behavior.
 */
export class NodeTypePlugin {
  constructor(config) {
    this.type = config.type;
    this.name = config.name;
    this.icon = config.icon;
    this.color = config.color;
    this.description = config.description;
    this.propertySchema = config.propertySchema || [];
    this.propertyGroups = config.propertyGroups || [];
    this.validationRules = config.validationRules || {};
    this.renderer = config.renderer;
    this.initialProperties = config.initialProperties || {};
    this.initialize = config.initialize || (() => {});
    this.branches = config.branches || [];
    this.getBranchesFromProps = config.getBranchesFromProps;
    this.preprocessProperties = config.preprocessProperties || ((props) => props);
  }
  
  /**
   * Get the property schema for this node type
   */
  getPropertySchema() {
    return this.propertySchema;
  }
  
  /**
   * Get the property groups for this node type
   */
  getPropertyGroups() {
    return this.propertyGroups;
  }
  
  /**
   * Get the initial properties for a new node of this type
   */
  getInitialProperties() {
    return typeof this.initialProperties === 'function'
      ? this.initialProperties()
      : { ...this.initialProperties };
  }
  
  /**
   * Get the validation rules for this node type
   */
  getValidationRules() {
    return this.validationRules;
  }
  
  /**
   * Get the branches for this node type
   * @param {Object} nodeProperties - Optional properties of the node to generate dynamic branches
   */
  getBranches(nodeProperties) {
    // Make sure we have valid properties object
    let propsToUse = nodeProperties;
    
    // Handle case where properties might be nested in a 'properties' field
    // This helps compatibility between different ways nodes may be structured
    if (nodeProperties && nodeProperties.properties && typeof nodeProperties.properties === 'object') {
      console.info("Using nested properties field");
      propsToUse = nodeProperties.properties;
    }
    
    // If we have a dynamic branch generator and node properties, use that
    if (this.getBranchesFromProps && propsToUse) {
      // Preprocess properties if needed
      const processedProps = this.preprocessProperties(propsToUse);
    //  console.log("After preprocessing:", processedProps);
      return this.getBranchesFromProps(processedProps);
    }
    
    // Otherwise, return static branches
    return this.branches;
  }
  
  /**
   * Check if the node type has multiple branches
   * @param {Object} nodeProperties - Optional properties of the node
   */
  hasMultipleBranches(nodeProperties) {
    const branches = this.getBranches(nodeProperties);
    return branches && branches.length > 1;
  }
}