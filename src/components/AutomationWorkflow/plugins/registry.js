/**
 * Plugin Registry
 * 
 * A central repository for node type plugins, property controls, and validators.
 */
class PluginRegistry {
  constructor() {
    this.nodeTypes = {};
    this.propertyControls = {};
    this.validators = {};
  }
  
  registerNodeType(plugin) {
    if (this.nodeTypes[plugin.type]) {
      console.warn(`Node type '${plugin.type}' is already registered. Overriding.`);
    }
    this.nodeTypes[plugin.type] = plugin;
    return this;
  }
  
  registerPropertyControl(control) {
    if (this.propertyControls[control.type]) {
      console.warn(`Property control '${control.type}' is already registered. Overriding.`);
    }
    this.propertyControls[control.type] = control;
    return this;
  }
  
  registerValidator(validator) {
    if (this.validators[validator.type]) {
      console.warn(`Validator '${validator.type}' is already registered. Overriding.`);
    }
    this.validators[validator.type] = validator;
    return this;
  }
  
  getNodeType(type) {
    return this.nodeTypes[type] || null;
  }
  
  getPropertyControl(type) {
    return this.propertyControls[type] || null;
  }
  
  getValidator(type) {
    return this.validators[type] || null;
  }
  
  getAllNodeTypes() {
    return Object.values(this.nodeTypes);
  }
}

// Create and export a singleton instance
export const pluginRegistry = new PluginRegistry();