/**
 * Service for handling API communication with the ASP.NET backend
 */
class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || '/api';
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Sets the authorization token for API requests
   * @param {string} token - JWT or other auth token
   */
  setAuthToken(token) {
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders['Authorization'];
    }
  }

  /**
   * Performs a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} queryParams - Query parameters
   * @returns {Promise<any>} Response data
   */
  async get(endpoint, queryParams = {}) {
    const url = new URL(`${this.baseUrl}/${endpoint}`, window.location.origin);
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] !== undefined && queryParams[key] !== null) {
        url.searchParams.append(key, queryParams[key]);
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.defaultHeaders,
    });

    return this._handleResponse(response);
  }

  /**
   * Performs a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @returns {Promise<any>} Response data
   */
  async post(endpoint, data = {}) {
    const url = `${this.baseUrl}/${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    return this._handleResponse(response);
  }

  /**
   * Performs a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @returns {Promise<any>} Response data
   */
  async put(endpoint, data = {}) {
    const url = `${this.baseUrl}/${endpoint}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    return this._handleResponse(response);
  }

  /**
   * Performs a DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<any>} Response data
   */
  async delete(endpoint) {
    const url = `${this.baseUrl}/${endpoint}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.defaultHeaders,
    });

    return this._handleResponse(response);
  }

  /**
   * Handles the API response
   * @param {Response} response - Fetch API response
   * @returns {Promise<any>} Parsed response data
   * @private
   */
  async _handleResponse(response) {
    const contentType = response.headers.get('Content-Type') || '';
    
    // Parse the response body based on content type
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle error responses
    if (!response.ok) {
      const error = new Error(data.message || 'API request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }
}

export const apiService = new ApiService();
