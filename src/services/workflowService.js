import { apiService } from './apiService';
import { signalRService } from './signalRService';

/**
 * Service for managing workflow operations with the backend
 */
class WorkflowService {
  constructor(options = {}) {
    this.options = {
      hubUrl: '/workflowhub',
      reconnectAttempts: 5,
      reconnectInterval: 2000,
      ...options
    };
    this.connectionStatus = 'disconnected';
    this.connectionListeners = [];
  }

  /**
   * Initialize the workflow service with SignalR
   * @returns {Promise<void>}
   */
  async init() {
    try {
      // Initialize SignalR connection with retry logic
      await this._connectWithRetry();
      
      // Register for workflow execution updates
      signalRService.on('workflowExecutionUpdate', this._handleExecutionUpdate);
      signalRService.on('nodeStatusUpdate', this._handleNodeStatusUpdate);
      
      // Monitor connection state
      signalRService.on('connected', () => this._updateConnectionStatus('connected'));
      signalRService.on('disconnected', () => this._updateConnectionStatus('disconnected'));
      signalRService.on('reconnecting', () => this._updateConnectionStatus('reconnecting'));
    } catch (error) {
      console.error('Failed to initialize workflow service:', error);
      this._updateConnectionStatus('error', error);
      throw error;
    }
  }
  
  /**
   * Connect to SignalR hub with retry logic
   * @private
   */
  async _connectWithRetry(attempt = 0) {
    try {
      await signalRService.init(this.options.hubUrl);
      this._updateConnectionStatus('connected');
    } catch (error) {
      if (attempt < this.options.reconnectAttempts) {
        this._updateConnectionStatus('reconnecting');
        console.log(`Retrying connection (${attempt + 1}/${this.options.reconnectAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, this.options.reconnectInterval));
        return this._connectWithRetry(attempt + 1);
      } else {
        this._updateConnectionStatus('error', error);
        throw new Error(`Failed to connect after ${this.options.reconnectAttempts} attempts: ${error.message}`);
      }
    }
  }
  
  /**
   * Update connection status and notify listeners
   * @param {string} status - New connection status
   * @param {Error} [error] - Optional error object
   * @private
   */
  _updateConnectionStatus(status, error = null) {
    this.connectionStatus = status;
    
    // Notify all connection status listeners
    for (const listener of this.connectionListeners) {
      listener(status, error);
    }
  }
  
  /**
   * Register for connection status updates
   * @param {Function} callback - Function to call when connection status changes
   * @returns {Function} Function to remove the listener
   */
  onConnectionStatusChange(callback) {
    this.connectionListeners.push(callback);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Check if the service is connected to the backend
   * @returns {boolean} True if connected
   */
  isConnected() {
    return this.connectionStatus === 'connected';
  }

  /**
   * Retrieve all workflows from the backend
   * @returns {Promise<Array>} List of workflows
   */
  async getWorkflows() {
    return apiService.get('workflows');
  }

  /**
   * Get a specific workflow by ID
   * @param {string} id - Workflow ID
   * @returns {Promise<Object>} Workflow object
   */
  async getWorkflow(id) {
    return apiService.get(`workflows/${id}`);
  }

  /**
   * Save a workflow to the backend
   * @param {Object} workflow - Workflow data
   * @returns {Promise<Object>} Saved workflow with server-assigned ID
   */
  async saveWorkflow(workflow) {
    if (workflow.id) {
      return apiService.put(`workflows/${workflow.id}`, workflow);
    } else {
      return apiService.post('workflows', workflow);
    }
  }

  /**
   * Delete a workflow
   * @param {string} id - Workflow ID
   * @returns {Promise<void>}
   */
  async deleteWorkflow(id) {
    return apiService.delete(`workflows/${id}`);
  }

  /**
   * Execute a workflow
   * @param {string} id - Workflow ID
   * @param {Object} [inputs] - Initial inputs for the workflow
   * @returns {Promise<Object>} Execution details
   */
  async executeWorkflow(id, inputs = {}) {
    return apiService.post(`workflows/${id}/execute`, { inputs });
  }

  /**
   * Handle workflow execution update from SignalR
   * @param {Object} update - Execution update data
   * @private
   */
  _handleExecutionUpdate = (update) => {
    // Dispatch event for components to respond to
    const event = new CustomEvent('workflow-execution-update', { 
      detail: update 
    });
    window.dispatchEvent(event);
  }

  /**
   * Handle node status update from SignalR
   * @param {Object} update - Node status update data
   * @private
   */
  _handleNodeStatusUpdate = (update) => {
    // Dispatch event for components to respond to
    const event = new CustomEvent('node-status-update', { 
      detail: update 
    });
    window.dispatchEvent(event);
  }

  /**
   * Register listener for workflow execution updates
   * @param {Function} callback - Event handler
   * @returns {Function} Function to remove the listener
   */
  onExecutionUpdate(callback) {
    const handler = (event) => callback(event.detail);
    window.addEventListener('workflow-execution-update', handler);
    return () => window.removeEventListener('workflow-execution-update', handler);
  }

  /**
   * Register listener for node status updates
   * @param {Function} callback - Event handler
   * @returns {Function} Function to remove the listener
   */
  onNodeStatusUpdate(callback) {
    const handler = (event) => callback(event.detail);
    window.addEventListener('node-status-update', handler);
    return () => window.removeEventListener('node-status-update', handler);
  }
}

export const workflowService = new WorkflowService();
