/**
 * General utility functions for the Automation Workflow
 */

/**
 * Generates a unique ID combining timestamp and random string
 * @returns {string} Unique identifier
 */
export const generateUniqueId = () => 
  `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;