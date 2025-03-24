import * as signalR from '@microsoft/signalr';

/**
 * Service for handling SignalR communication with the ASP.NET backend
 */
class SignalRService {
  constructor() {
    this.connection = null;
    this.connectionPromise = null;
    this.eventHandlers = new Map();
  }

  /**
   * Initialize the SignalR connection
   * @param {string} hubUrl - URL to the SignalR hub
   * @param {Object} options - Connection options
   * @returns {Promise<void>}
   */
  async init(hubUrl, options = {}) {
    if (this.connection) {
      return this.connectionPromise;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Setup reconnection handling
    this.connection.onreconnecting(error => {
      console.log('SignalR reconnecting:', error);
      this._triggerEvent('reconnecting', error);
    });

    this.connection.onreconnected(connectionId => {
      console.log('SignalR reconnected with ID:', connectionId);
      this._triggerEvent('reconnected', connectionId);
    });

    this.connection.onclose(error => {
      console.log('SignalR connection closed:', error);
      this._triggerEvent('disconnected', error);
    });

    // Start the connection
    this.connectionPromise = this.connection.start()
      .then(() => {
        console.log('SignalR connected');
        this._triggerEvent('connected');
        return this.connection;
      })
      .catch(err => {
        console.error('SignalR connection error:', err);
        this._triggerEvent('error', err);
        throw err;
      });

    return this.connectionPromise;
  }

  /**
   * Register a handler for a SignalR event
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Event handler
   */
  on(eventName, callback) {
    if (!this.connection) {
      throw new Error('SignalR connection not initialized');
    }

    // Register with SignalR connection
    this.connection.on(eventName, (...args) => {
      console.log(`SignalR event received: ${eventName}`, args);
      callback(...args);
    });

    // Store in our local event registry
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName).push(callback);
  }

  /**
   * Remove a handler for a SignalR event
   * @param {string} eventName - Name of the event
   * @param {Function} [callback] - Specific callback to remove (removes all if not provided)
   */
  off(eventName, callback) {
    if (!this.connection) return;

    if (callback && this.eventHandlers.has(eventName)) {
      // Remove specific handler
      const handlers = this.eventHandlers.get(eventName);
      const index = handlers.indexOf(callback);
      if (index !== -1) {
        handlers.splice(index, 1);
      }

      // Update SignalR
      this.connection.off(eventName, callback);
    } else {
      // Remove all handlers for this event
      this.eventHandlers.delete(eventName);
      this.connection.off(eventName);
    }
  }

  /**
   * Invoke a method on the SignalR hub
   * @param {string} methodName - Hub method to call
   * @param {...any} args - Arguments to pass to the method
   * @returns {Promise<any>} Result from the hub method
   */
  async invoke(methodName, ...args) {
    if (!this.connection) {
      throw new Error('SignalR connection not initialized');
    }

    try {
      // Ensure connection is established before invoking methods
      await this.connectionPromise;
      return await this.connection.invoke(methodName, ...args);
    } catch (error) {
      console.error(`Error invoking ${methodName}:`, error);
      throw error;
    }
  }

  /**
   * Get the connection state
   * @returns {signalR.HubConnectionState} Current connection state
   */
  getConnectionState() {
    return this.connection ? this.connection.state : 'disconnected';
  }

  /**
   * Close the SignalR connection
   * @returns {Promise<void>}
   */
  async stop() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.connectionPromise = null;
      this.eventHandlers.clear();
    }
  }

  /**
   * Trigger a local event
   * @param {string} eventName - Name of the event
   * @param {any} data - Event data
   * @private
   */
  _triggerEvent(eventName, data) {
    if (this.eventHandlers.has(eventName)) {
      for (const handler of this.eventHandlers.get(eventName)) {
        handler(data);
      }
    }
  }
}

export const signalRService = new SignalRService();
