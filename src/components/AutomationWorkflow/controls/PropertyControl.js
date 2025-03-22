/**
 * Property Control
 * 
 * Base class for property controls that defines the structure and behavior.
 */
export class PropertyControl {
  constructor(config) {
    this.type = config.type;
    this.component = config.component;
    this.defaultProps = config.defaultProps || {};
    this.validate = config.validate || (() => true);
  }
}