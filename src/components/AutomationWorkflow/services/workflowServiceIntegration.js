import { workflowService } from '../../../services/workflowService';
import { Graph } from '../graph/Graph';
import { enhanceGraphWithLocalData } from '../utils/workflowLoadHelpers';

/**
 * Initialize the workflow service and set up event listeners
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.setIsLoading - State setter for loading indicator
 * @param {Function} options.setConnectionStatus - State setter for connection status
 * @param {Function} options.setExecutionStatus - State setter for execution status
 * @param {Function} options.setWorkflowGraph - State setter for workflow graph
 * @param {Function} options.onExecutionStatusChange - Optional callback for execution status changes
 * @param {Function} options.onNodeStatusUpdate - Optional callback for node status updates
 * @param {string} options.workflowId - Optional ID of workflow to load
 * @returns {Promise<Function>} A cleanup function to remove event listeners
 */
export const initWorkflowService = async (options) => {
  const {
    setIsLoading,
    setConnectionStatus,
    setExecutionStatus,
    setWorkflowGraph,
    onExecutionStatusChange,
    onNodeStatusUpdate,
    workflowId
  } = options;
  
  try {
    setIsLoading(true);
    
    // Monitor connection status
    const removeStatusListener = workflowService.onConnectionStatusChange((status, error) => {
      setConnectionStatus(status);
      if (status === 'error') {
        console.error('Connection error:', error);
      }
    });
    
    // Initialize the service
    // temporary comment out
 //   await workflowService.init();  
    console.log('Workflow service initialized');
    
    // Register for execution updates
    const removeExecutionListener = workflowService.onExecutionUpdate(update => {
      setExecutionStatus(prev => ({
        ...prev,
        ...update
      }));
      
      if (onExecutionStatusChange) {
        onExecutionStatusChange(update);
      }
    });
    
    // Register for node status updates
    const removeNodeStatusListener = workflowService.onNodeStatusUpdate(update => {
      // Update node status in the graph (e.g., highlighting active nodes)
      if (update.nodeId) {
        setWorkflowGraph(prev => {
          const newGraph = new Graph();
          
          prev.getAllNodes().forEach(node => {
            const nodeStatus = node.id === update.nodeId 
              ? update.status 
              : node.status;
            
            newGraph.addNode({
              ...node,
              status: nodeStatus,
              statusData: node.id === update.nodeId 
                ? update.data || {}
                : node.statusData
            });
          });
          
          prev.getAllEdges().forEach(edge => {
            newGraph.connect(edge.sourceId, edge.targetId, edge.type, edge.label);
          });
          
          return newGraph;
        });
      }
      
      if (onNodeStatusUpdate) {
        onNodeStatusUpdate(update);
      }
    });
    
    // Load workflow from backend if ID is provided
    if (workflowId) {
      await loadWorkflowFromBackend(workflowId, setWorkflowGraph, null, setIsLoading);
    }
    
    // Return cleanup function
    return () => {
      removeStatusListener();
      removeExecutionListener();
      removeNodeStatusListener();
    };
  } catch (error) {
    console.error('Failed to initialize workflow service:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

/**
 * Load workflow from backend
 * 
 * @param {string} id - Workflow ID to load
 * @param {Function} setWorkflowGraph - State setter for workflow graph
 * @param {Function} setWorkflowMetadata - State setter for workflow metadata
 * @param {Function} setIsLoading - State setter for loading indicator
 * @returns {Promise<Object>} The loaded workflow
 */
export const loadWorkflowFromBackend = async (
  id,
  setWorkflowGraph,
  setWorkflowMetadata,
  setIsLoading
) => {
  try {
    if (setIsLoading) setIsLoading(true);
    const workflow = await workflowService.getWorkflow(id);
    
    // Update workflow metadata if setter provided
    if (setWorkflowMetadata) {
      setWorkflowMetadata({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        lastModified: workflow.lastModified,
        status: workflow.status
      });
    }
    
    // Convert backend workflow to graph
    if (workflow.steps && workflow.steps.length > 0 && setWorkflowGraph) {
      const graph = Graph.fromWorkflowSteps(workflow.steps);
      // Enhance with any locally stored node data
      const enhancedGraph = enhanceGraphWithLocalData(graph);
      setWorkflowGraph(enhancedGraph);
    }
    
    return workflow;
  } catch (error) {
    console.error('Failed to load workflow:', error);
    throw error;
  } finally {
    if (setIsLoading) setIsLoading(false);
  }
};

/**
 * Save workflow to backend
 * 
 * @param {Object} workflowGraph - Current workflow graph
 * @param {Object} workflowMetadata - Current workflow metadata
 * @param {Function} setWorkflowMetadata - State setter for workflow metadata
 * @param {Function} setIsLoading - State setter for loading indicator
 * @returns {Promise<Object>} The saved workflow
 */
export const saveWorkflowToBackend = async (
  workflowGraph,
  workflowMetadata,
  setWorkflowMetadata,
  setIsLoading
) => {
  try {
    if (setIsLoading) setIsLoading(true);
    
    // Convert graph to backend workflow format
    const workflow = {
      id: workflowMetadata.id,
      name: workflowMetadata.name,
      description: workflowMetadata.description,
      steps: workflowGraph.toWorkflowSteps()
    };
    
    const savedWorkflow = await workflowService.saveWorkflow(workflow);
    
    // Update local state with saved data
    if (setWorkflowMetadata) {
      setWorkflowMetadata(prev => ({
        ...prev,
        id: savedWorkflow.id,
        lastModified: savedWorkflow.lastModified
      }));
    }
    
    return savedWorkflow;
  } catch (error) {
    console.error('Failed to save workflow:', error);
    throw error;
  } finally {
    if (setIsLoading) setIsLoading(false);
  }
};

/**
 * Execute workflow
 * 
 * @param {string} workflowId - ID of workflow to execute
 * @param {Object} inputs - Workflow input values
 * @param {Function} setIsLoading - State setter for loading indicator
 * @param {Function} setExecutionStatus - State setter for execution status
 * @param {Function} setActiveTab - State setter for active tab
 * @returns {Promise<void>}
 */
export const executeWorkflow = async (
  workflowId,
  inputs,
  setIsLoading,
  setExecutionStatus,
  setActiveTab
) => {
  try {
    if (setIsLoading) setIsLoading(true);
    
    await workflowService.executeWorkflow(workflowId, inputs);
    
    // Update local execution status
    if (setExecutionStatus) {
      setExecutionStatus({
        isExecuting: true,
        currentNodeId: null,
        progress: 0,
        startTime: new Date(),
        errors: []
      });
    }
    
    // Switch to execution tab to show progress
    if (setActiveTab) {
      setActiveTab('execution');
    }
  } catch (error) {
    console.error('Failed to execute workflow:', error);
    throw error;
  } finally {
    if (setIsLoading) setIsLoading(false);
  }
};

/**
 * Get workflow input schema from trigger node
 * 
 * @param {Array} workflowSteps - Array of workflow steps
 * @param {Object} pluginRegistry - Plugin registry for accessing node type info
 * @returns {Array} Array of input field definitions
 */
export const getWorkflowInputSchema = (workflowSteps, pluginRegistry) => {
  // Find trigger node (typically the first node)
  const triggerNode = workflowSteps.find(node => node.type === 'trigger');
  
  if (!triggerNode) return [];
  
  // Get input schema from the trigger node's plugin
  const triggerPlugin = pluginRegistry.getNodeType(triggerNode.type);
  return triggerPlugin.getInputSchema ? 
    triggerPlugin.getInputSchema(triggerNode.properties) : [];
};