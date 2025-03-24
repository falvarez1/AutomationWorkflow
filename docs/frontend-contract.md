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
