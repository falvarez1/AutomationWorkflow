/**
 * Property Control
 * 
 * Base class for property controls that defines the structure and behavior.
 */
export class PropertyControl {
  /**
   * Create a new property control
   * 
   * @param {Object} config - Control configuration
   * @param {string} config.type - The type of control (e.g., 'text', 'number')
   * @param {Function|React.Component} config.component - The component to render
   * @param {Object} config.defaultProps - Default props for the component
   * @param {Function} config.validate - Validation function
   * @param {Function} config.getValidationRules - Function to generate validation rules
   */
  constructor(config) {
    this.type = config.type;
    this.component = config.component;
    this.defaultProps = config.defaultProps || {};
    this.validate = config.validate || (() => null);
    this.getValidationRules = config.getValidationRules || (config => ({}));
  }

  /**
   * Get validation rules for this control
   * 
   * @param {Object} config - Control configuration
   * @returns {Object} Validation rules
   */
  getValidationRules(config) {
    return {};
  }
}