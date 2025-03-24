# Frontend Component Contract

This document outlines the frontend component interfaces, props, and state management for the workflow automation system.

## Core Components

### AutomationWorkflow

The main component that renders the workflow editor.

#### Props

```typescript
interface AutomationWorkflowProps {
  // Workflow configuration
  initialWorkflowSteps?: WorkflowStep[];
  workflowId?: string;
  readonly?: boolean;
  
  // UI configuration
  gridOptions?: GridOptions;
  nodePlacementOptions?: NodePlacementOptions;
  
  // Event handlers
  onExecutionStatusChange?: (status: ExecutionStatus) => void;
  onSave?: (workflow: WorkflowData) => void;
  onError?: (error: Error) => void;
}

interface GridOptions {
  showGrid?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
  gridColor?: string;
  gridDotSize?: number;
}

interface NodePlacementOptions {
  standardVerticalSpacing?: number;
  branchVerticalSpacing?: number;
  branchLeftOffset?: number;
  branchRightOffset?: number;
}
```

#### Usage Example

```jsx
<AutomationWorkflow
  workflowId="workflow-123"
  gridOptions={{
    showGrid: true,
    snapToGrid: true,
    gridColor: '#e5e7eb'
  }}
  onExecutionStatusChange={(status) => {
    console.log('Execution status:', status);
  }}
  onSave={(workflow) => {
    console.log('Workflow saved:', workflow);
  }}
/>
```

### WorkflowStep

Represents a single node in the workflow graph.

#### Props

```typescript
interface WorkflowStepProps {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  position: { x: number; y: number };
  transform: { x: number; y: number; scale: number };
  status?: 'idle' | 'running' | 'completed' | 'failed' | 'skipped';
  statusData?: any;
  
  // Flags
  isNew?: boolean;
  isSelected?: boolean;
  
  // Configuration
  contextMenuConfig?: ContextMenuConfig;
  
  // Event handlers
  onClick: (id: string, action?: string) => void;
  onDragStart: (id: string, position: Position) => void;
  onDrag: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string) => void;
  onHeightChange?: (id: string, height: number) => void;
}
```

### ConnectionRenderer

Renders the connections between workflow nodes.

#### Props

```typescript
interface ConnectionRendererProps {
  workflowGraph: Graph;
  selectedNodeId?: string;
  pluginRegistry: PluginRegistry;
  edgeInputYOffset?: number;
  edgeOutputYOffset?: number;
}
```

### WorkflowMenuManager

Manages the menus for adding nodes and configuring branches.

#### Props

```typescript
interface WorkflowMenuManagerProps {
  menuState: MenuState;
  workflowGraph: Graph;
  transform: Transform;
  buttonYOffset?: number;
  onAddNode: (nodeId: string, nodeType: string, connectionType?: string, branchId?: string) => void;
  onCloseMenu: () => void;
}

interface MenuState {
  activeNodeId: string | null;
  activeBranch: string | null;
  position: DOMRect | null;
  menuType: 'add' | 'branch' | 'branchEdge' | null;
}
```

### NodePropertiesPanel

Renders the property editor for a selected node.

#### Props

```typescript
interface NodePropertiesPanelProps {
  node: WorkflowNode;
  registry: PluginRegistry;
  onUpdate: (nodeId: string, propertyId: string, value: any) => void;
  onClose: () => void;
}
```

### ExecuteWorkflowDialog

Dialog for collecting workflow execution inputs.

#### Props

```typescript
interface ExecuteWorkflowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (inputs: Record<string, any>) => void;
  workflowInputSchema: WorkflowInputField[];
}

interface WorkflowInputField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'date';
  required?: boolean;
  description?: string;
  placeholder?: string;
  defaultValue?: any;
  options?: { label: string; value: any }[];
}
```

### AddNodeButtonRenderer

Renders the buttons for adding new nodes to the workflow.

#### Props

```typescript
interface AddNodeButtonRendererProps {
  workflowGraph: Graph;
  menuState: MenuState;
  handleShowAddMenu: (nodeId: string, e: React.MouseEvent, buttonRect: DOMRect) => void;
  handleShowBranchEdgeMenu: (nodeId: string, branchId: string, e: React.MouseEvent, buttonRect: DOMRect) => void;
  handleShowBranchEndpointMenu: (nodeId: string, branchId: string, e: React.MouseEvent, buttonRect: DOMRect) => void;
  pluginRegistry: PluginRegistry;
  edgeInputYOffset?: number;
  edgeOutputYOffset?: number;
}
```

## Services

### workflowService

Service for interacting with the backend API.

```typescript
interface WorkflowService {
  // Connection
  init(): Promise<void>;
  isConnected(): boolean;
  onConnectionStatusChange(callback: (status: string, error?: Error) => void): () => void;
  
  // Workflow CRUD
  getWorkflows(): Promise<WorkflowSummary[]>;
  getWorkflow(id: string): Promise<WorkflowData>;
  saveWorkflow(workflow: WorkflowData): Promise<WorkflowData>;
  deleteWorkflow(id: string): Promise<void>;
  
  // Execution
  executeWorkflow(id: string, inputs?: Record<string, any>): Promise<ExecutionData>;
  cancelExecution(executionId: string): Promise<void>;
  
  // Event listeners
  onExecutionUpdate(callback: (update: ExecutionUpdate) => void): () => void;
  onNodeStatusUpdate(callback: (update: NodeStatusUpdate) => void): () => void;
}
```

### apiService

Service for making HTTP requests to the backend.

```typescript
interface ApiService {
  setAuthToken(token: string): void;
  get(endpoint: string, queryParams?: Record<string, any>): Promise<any>;
  post(endpoint: string, data?: any): Promise<any>;
  put(endpoint: string, data?: any): Promise<any>;
  delete(endpoint: string): Promise<any>;
}
```

### signalRService

Service for real-time communication with the backend.

```typescript
interface SignalRService {
  init(hubUrl: string, options?: any): Promise<void>;
  on(eventName: string, callback: (...args: any[]) => void): void;
  off(eventName: string, callback?: (...args: any[]) => void): void;
  invoke(methodName: string, ...args: any[]): Promise<any>;
  getConnectionState(): HubConnectionState;
  stop(): Promise<void>;
}
```

## Plugin System

### PluginRegistry

Registry for node types and property controls.

```typescript
interface PluginRegistry {
  registerNodeType(plugin: NodeTypePlugin): void;
  getNodeType(type: string): NodeTypePlugin;
  getAllNodeTypes(): NodeTypePlugin[];
  getNodeTypesByCategory(): Record<string, NodeTypePlugin[]>;
  
  registerPropertyControl(control: PropertyControl): void;
  getPropertyControl(type: string): PropertyControl;
}
```

### NodeTypePlugin

Plugin for defining a node type.

```typescript
interface NodeTypePlugin {
  type: string;
  name: string;
  category: string;
  description?: string;
  icon?: string;
  color?: string;
  
  // Node configuration
  getInitialProperties(): Record<string, any>;
  getPropertyGroups(): PropertyGroup[];
  getPropertySchema(): PropertyDefinition[];
  
  // For conditional nodes
  getBranches?(properties: Record<string, any>): Branch[];
  
  // For trigger nodes
  getInputSchema?(properties: Record<string, any>): WorkflowInputField[];
  
  // Validation
  validateProperties(properties: Record<string, any>): ValidationResult;
}
```

### PropertyControl

Control for editing node properties.

```typescript
interface PropertyControl {
  type: string;
  component: React.ComponentType<PropertyControlProps>;
  defaultValue?: any;
}

interface PropertyControlProps {
  id: string;
  value: any;
  onChange: (id: string, value: any) => void;
  definition: PropertyDefinition;
  disabled?: boolean;
}
```

## Data Structures

### Graph

Represents the workflow graph structure.

```typescript
interface Graph {
  addNode(node: WorkflowNode): WorkflowNode;
  getNode(id: string): WorkflowNode | undefined;
  removeNode(id: string): boolean;
  updateNode(id: string, updates: Partial<WorkflowNode>): boolean;
  getAllNodes(): WorkflowNode[];
  
  addEdge(edge: Edge): Edge;
  getEdge(id: string): Edge | undefined;
  removeEdge(id: string): boolean;
  updateEdge(id: string, updates: Partial<Edge>): boolean;
  getAllEdges(): Edge[];
  
  getOutgoingEdges(nodeId: string): Edge[];
  getIncomingEdges(nodeId: string): Edge[];
  connect(sourceId: string, targetId: string, type?: string, label?: string): Edge;
  
  static fromWorkflowSteps(steps: WorkflowStep[]): Graph;
  toWorkflowSteps(): WorkflowStep[];
}
```

### WorkflowNode

Represents a node in the workflow graph.

```typescript
interface WorkflowNode {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  position: { x: number; y: number };
  height?: number;
  status?: string;
  statusData?: any;
  isNew?: boolean;
  contextMenuConfig?: ContextMenuConfig;
  properties: Record<string, any>;
}
```

### Edge

Represents a connection between nodes.

```typescript
interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  label?: string;
}
```

### Command Pattern

Commands for modifying the workflow graph with undo/redo support.

```typescript
interface Command {
  execute(): void;
  undo(): void;
}

// Available commands
class AddNodeCommand implements Command { /* ... */ }
class MoveNodeCommand implements Command { /* ... */ }
class DeleteNodeCommand implements Command { /* ... */ }
class UpdateNodeCommand implements Command { /* ... */ }
class ConnectNodesCommand implements Command { /* ... */ }
class DisconnectNodesCommand implements Command { /* ... */ }
```

## Event Types

### Execution-Related Events

```typescript
interface ExecutionStatus {
  isExecuting: boolean;
  currentNodeId: string | null;
  progress: number; // 0-100
  startTime: Date | null;
  endTime?: Date;
  errors: ExecutionError[];
}

interface ExecutionError {
  message: string;
  nodeId?: string;
  details?: any;
}

interface NodeStatusUpdate {
  nodeId: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'skipped';
  data?: any;
  timestamp: Date;
}
```

### Connection-Related Events

```typescript
// Connection status events
type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'error';

interface ConnectionStatusEvent {
  status: ConnectionStatus;
  error?: Error;
  timestamp: Date;
}
```

## Hooks

### Core Hooks

```typescript
// Hook for dragging elements
function useDrag(options: {
  onDragStart?: (data: DragStartData) => void;
  onDragMove?: (data: DragMoveData) => void;
  onDragEnd?: (data: DragEndData) => void;
  threshold?: number;
  preventDefaultDrag?: boolean;
}): {
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void;
  };
}

// Hook for node dragging
function useNodeDrag(options: {
  id: string;
  position: { x: number; y: number };
  gridSize?: number;
  snapToGrid?: boolean;
  createMoveCommand?: (id: string, from: Position, to: Position) => Command;
  onDragStart?: (data: NodeDragStartData) => void;
  onDragEnd?: (data: NodeDragEndData) => void;
}): {
  isDragging: boolean;
  currentPosition: { x: number; y: number };
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void;
  };
}

// Hook for zoom and pan
function useZoomPan(options: {
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  initialPan?: { x: number; y: number };
  zoomSensitivity?: number;
  onZoomChange?: (zoom: number) => void;
  onPanChange?: (pan: { x: number; y: number }) => void;
}): {
  zoom: number;
  pan: { x: number; y: number };
  handlers: {
    onWheel: (e: React.WheelEvent) => void;
    onMouseDown: (e: React.MouseEvent) => void;
  };
  resetView: () => void;
  setZoomLevel: (level: number, center?: { x: number; y: number }) => void;
}

// Hook for connection drawing
function useConnectionDrawing(options: {
  workflowGraph: Graph;
  onConnectionComplete?: (sourceId: string, targetId: string, type: string, branchId?: string) => void;
  getPortPosition?: (nodeId: string, portIndex: number, isInput: boolean) => { x: number; y: number };
}): {
  activeConnection: {
    sourceId: string;
    sourcePort: number;
    targetPosition: { x: number; y: number };
    type: string;
    branchId?: string;
  } | null;
  startConnection: (sourceId: string, sourcePort: number, type: string, branchId?: string) => void;
  isDrawingConnection: boolean;
}
```

## Integration Examples

### Basic Integration with External App

```jsx
import React, { useState, useEffect } from 'react';
import { AutomationWorkflow } from './components/AutomationWorkflow';
import { configureServices } from './services';

const WorkflowEditorPage = () => {
  const [workflowId, setWorkflowId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Configure services with API base URL and auth token
    configureServices({
      apiBaseUrl: '/api',
      authToken: localStorage.getItem('authToken')
    });
  }, []);

  const handleExecutionStatusChange = (status) => {
    console.log('Execution status changed:', status);
    // Update UI based on execution status
  };

  return (
    <div className="h-screen">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <AutomationWorkflow
        workflowId={workflowId}
        onExecutionStatusChange={handleExecutionStatusChange}
        onError={setError}
      />
    </div>
  );
};

export default WorkflowEditorPage;
```

### Creating Custom Node Types

```jsx
import { createNodePlugin } from './components/AutomationWorkflow/plugins/createNodePlugin';
import { pluginRegistry } from './components/AutomationWorkflow/plugins/registry';

// Create a custom API integration node
const ApiIntegrationNodePlugin = createNodePlugin({
  type: 'api-integration',
  name: 'API Integration',
  category: 'Integrations',
  description: 'Make API requests to external services',
  icon: 'globe',
  color: '#6366F1',
  
  propertyGroups: [
    {
      id: 'general',
      label: 'General',
      expanded: true
    },
    {
      id: 'request',
      label: 'Request Configuration',
      expanded: true
    },
    {
      id: 'authentication',
      label: 'Authentication',
      expanded: false
    },
    {
      id: 'advanced',
      label: 'Advanced Options',
      expanded: false
    }
  ],
  
  propertySchema: [
    {
      id: 'url',
      label: 'API URL',
      type: 'text',
      groupId: 'request',
      required: true,
      placeholder: 'https://api.example.com/v1/resource'
    },
    {
      id: 'method',
      label: 'HTTP Method',
      type: 'select',
      groupId: 'request',
      options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' }
      ],
      defaultValue: 'GET'
    },
    {
      id: 'headers',
      label: 'Headers',
      type: 'keyvalue',
      groupId: 'request'
    },
    {
      id: 'body',
      label: 'Request Body',
      type: 'textarea',
      groupId: 'request',
      conditional: {
        property: 'method',
        operator: 'in',
        value: ['POST', 'PUT']
      }
    },
    {
      id: 'authType',
      label: 'Authentication Type',
      type: 'select',
      groupId: 'authentication',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Basic Auth', value: 'basic' },
        { label: 'Bearer Token', value: 'bearer' },
        { label: 'API Key', value: 'apikey' }
      ],
      defaultValue: 'none'
    }
  ],
  
  validationRules: {
    url: (value) => {
      if (!value) return 'API URL is required';
      try {
        new URL(value);
        return null;
      } catch (e) {
        return 'Invalid URL format';
      }
    }
  },
  
  initialProperties: {
    method: 'GET',
    authType: 'none'
  }
});

// Register the custom node type
pluginRegistry.registerNodeType(ApiIntegrationNodePlugin);
```

## Integration with ASP.NET Backend

### Backend Configuration

```typescript
interface BackendConfiguration {
  // API configuration
  apiBaseUrl: string;
  apiVersion?: string;
  
  // Authentication
  authToken?: string;
  refreshToken?: string;
  
  // SignalR configuration
  hubUrl: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  
  // Feature flags
  enableLiveUpdates?: boolean;
  enableExecutionLogging?: boolean;
  
  // Error handling
  onConnectionError?: (error: Error) => void;
}

// Configure services
function configureForASPNETBackend(config: BackendConfiguration) {
  // Set up API service
  apiService.baseUrl = config.apiBaseUrl;
  if (config.apiVersion) {
    apiService.defaultHeaders['X-API-Version'] = config.apiVersion;
  }
  if (config.authToken) {
    apiService.setAuthToken(config.authToken);
  }
  
  // Configure workflow service
  const workflowServiceOptions = {
    hubUrl: config.hubUrl,
    reconnectAttempts: config.reconnectAttempts || 5,
    reconnectInterval: config.reconnectInterval || 2000,
    enableLiveUpdates: config.enableLiveUpdates !== false,
    enableExecutionLogging: config.enableExecutionLogging !== false
  };
  
  // Initialize workflow service
  return workflowService.init(workflowServiceOptions)
    .catch(error => {
      if (config.onConnectionError) {
        config.onConnectionError(error);
      }
      throw error;
    });
}
```

## Accessibility Considerations

The workflow editor components should adhere to WCAG 2.1 AA standards, including:

1. **Keyboard Navigation**
   - All interactive elements must be focusable
   - Tab order should be logical and follow the visual flow
   - Keyboard shortcuts for common actions

2. **Screen Reader Support**
   - Proper ARIA attributes for custom UI components
   - Meaningful text alternatives for visual elements
   - Announcements for dynamic content changes

3. **Color and Contrast**
   - Sufficient contrast ratio for text and UI elements
   - Not relying solely on color to convey information
   - Support for high contrast mode

4. **Responsive Design**
   - Components adapt to different screen sizes
   - Support for zoom and text resizing
   - Touch-friendly targets for mobile devices

## Error Handling Patterns

1. **Service-Level Errors**
   - API request failures
   - SignalR connection issues
   - Authentication/authorization failures

2. **Component-Level Errors**
   - Invalid props
   - State validation failures
   - Rendering exceptions

3. **User Input Validation**
   - Property editor validation
   - Workflow structure validation
   - Execution input validation

4. **Error Boundary Implementation**
   - Each major component should be wrapped in an error boundary
   - Fallback UI for component failures
   - Error reporting to monitoring systems

## Performance Expectations

1. **Rendering Performance**
   - Initial load time < 2 seconds
   - Smooth interaction at 60 FPS
   - Efficient re-rendering with React.memo and useMemo

2. **Large Workflow Support**
   - Handle workflows with 100+ nodes
   - Virtualization for large node lists
   - Efficient SVG rendering for connections

3. **Memory Management**
   - Proper cleanup of event listeners
   - Avoid memory leaks in component lifecycle
   - Efficient state management

## Browser Compatibility

The workflow editor should support the following browsers:

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

Mobile support is considered secondary but should be functional on:
- iOS Safari
- Chrome for Android
