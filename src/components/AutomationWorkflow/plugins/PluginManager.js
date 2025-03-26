export class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.controls = new Map();
  }
  
  registerPlugin(plugin) {
    if (!plugin.type) {
      throw new Error('Plugin must have a type');
    }
    this.plugins.set(plugin.type, plugin);
    return this;
  }
  
  registerControl(control) {
    if (!control.type) {
      throw new Error('Control must have a type');
    }
    this.controls.set(control.type, control);
    return this;
  }
  
  getPlugin(type) {
    return this.plugins.get(type);
  }
  
  getControl(type) {
    return this.controls.get(type);
  }
  
  // Method to register multiple plugins at once
  registerPlugins(plugins) {
    plugins.forEach(plugin => this.registerPlugin(plugin));
    return this;
  }
  
  // Method to register multiple controls at once
  registerControls(controls) {
    controls.forEach(control => this.registerControl(control));
    return this;
  }
  
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }
  
  getAllControls() {
    return Array.from(this.controls.values());
  }
}

export const createPluginManager = (plugins = [], controls = []) => {
  const manager = new PluginManager();
  manager.registerPlugins(plugins);
  manager.registerControls(controls);
  return manager;
};
