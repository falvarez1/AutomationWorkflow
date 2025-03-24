import { apiService } from './apiService';
import { signalRService } from './signalRService';
import { workflowService } from './workflowService';

// Configure services based on environment
const configureServices = (config = {}) => {
  // Set base URL for API if provided
  if (config.apiBaseUrl) {
    apiService.baseUrl = config.apiBaseUrl;
  }
  
  // Set auth token if available
  if (config.authToken) {
    apiService.setAuthToken(config.authToken);
  }
  
  // Return services for use
  return {
    apiService,
    signalRService,
    workflowService
  };
};

export {
  apiService,
  signalRService,
  workflowService,
  configureServices
};
