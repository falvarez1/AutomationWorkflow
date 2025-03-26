import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  RotateCw,
  Grid
} from 'lucide-react';
import ConnectionRenderer from '../components/ConnectionRenderer';
import WorkflowStep from '../ui/WorkflowStep';

const WorkflowEditorView = ({
  canvasRef,
  transform,
  isPanning,
  showGrid,
  gridColor,
  gridDotSize,
  GRID_SIZE,
  handleCanvasMouseDown,
  workflowGraph,
  workflowSteps,
  selectedNodeId,
  handleZoom,
  resetView,
  snapToGrid,
  setSnapToGrid,
  canUndo,
  canRedo,
  handleUndoEvent,
  handleRedoEvent,
  menuState,
  WorkflowMenuManager,
  handleStepClick,
  handleNodeDragStart,
  handleNodeDrag,
  handleNodeDragEnd,
  handleNodeHeightChange,
  edgeInputYOffset,
  edgeOutputYOffset,
  buttonYOffset,
  animatingNodes,
  pluginRegistry,
  // Add the missing handlers for buttons
  AddNodeButtonRenderer, // Component reference
  handleShowAddMenu,
  handleShowBranchEdgeMenu,
  handleShowBranchEndpointMenu,
  handleCloseMenu,
  handleAddNode
}) => {
  return (
    <div
      ref={canvasRef}
      id="workflow-canvas"
      className="relative flex-grow overflow-hidden"
      style={{
        cursor: isPanning ? 'grabbing' : 'default',
        backgroundColor: '#F9FAFB',
        backgroundImage: showGrid ? `radial-gradient(circle, ${gridColor} ${gridDotSize}px, transparent 1px)` : 'none',
        backgroundSize: `${GRID_SIZE * transform.scale}px ${GRID_SIZE * transform.scale}px`,
        backgroundPosition: `${transform.x}px ${transform.y}px`
      }}
      onMouseDown={handleCanvasMouseDown}
    >
      {/* Canvas content with transform */}
      <div
        className="absolute top-0 left-0 w-full h-full transform-gpu"
        id="canvas-content"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
          overflow: 'visible' // Allow elements to extend outside container boundaries
        }}
      >
        {/* SVG for connection lines */}
        <svg
          width="100%"
          height="100%"
          className="absolute top-0 left-0 pointer-events-none"
          style={{ zIndex: 0, overflow: "visible" }}
          preserveAspectRatio="none"
        >
          <ConnectionRenderer
            workflowGraph={workflowGraph}
            selectedNodeId={selectedNodeId}
            pluginRegistry={pluginRegistry}
            edgeInputYOffset={edgeInputYOffset}
            edgeOutputYOffset={edgeOutputYOffset}
          />
        </svg>

        {/* Workflow step nodes */}
        {workflowSteps.map(step => {
          // Get the complete node data from the graph to access sourceNodeRefs
          const node = workflowGraph.getNode(step.id);
          const sourceNodeRefs = node ? (node.sourceNodeRefs || []) : [];
          
          return (
            <WorkflowStep
              key={step.id}
              id={step.id}
              type={step.type}
              title={step.title}
              subtitle={step.subtitle}
              position={step.position}
              transform={transform}
              onClick={handleStepClick}
              onDragStart={handleNodeDragStart}
              onDrag={handleNodeDrag}
              onDragEnd={handleNodeDragEnd}
              onHeightChange={handleNodeHeightChange}
              isNew={step.isNew || animatingNodes.includes(step.id)}
              isSelected={selectedNodeId === step.id}
              sourceNodeRefs={sourceNodeRefs}
              contextMenuConfig={step.contextMenuConfig}
              className="draggable-node"
            />
          );
        })}

        {/* Add Node Button Renderer - This was missing */}
        {AddNodeButtonRenderer && (
          <AddNodeButtonRenderer
            workflowGraph={workflowGraph}
            menuState={menuState}
            handleShowAddMenu={handleShowAddMenu}
            handleShowBranchEdgeMenu={handleShowBranchEdgeMenu}
            handleShowBranchEndpointMenu={handleShowBranchEndpointMenu}
            pluginRegistry={pluginRegistry}
            edgeInputYOffset={edgeInputYOffset}
            edgeOutputYOffset={edgeOutputYOffset}
          />
        )}
      </div>

      {/* Floating controls for zoom and reset (fixed position) */}
      <div className="absolute bottom-4 left-4 flex space-x-2">
        <button
          className="p-2 bg-white rounded-full shadow hover:bg-gray-50 focus:outline-none"
          onClick={() => handleZoom(1.2)}
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5 text-gray-700" />
        </button>
        <button
          className="p-2 bg-white rounded-full shadow hover:bg-gray-50 focus:outline-none"
          onClick={() => handleZoom(0.8)}
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5 text-gray-700" />
        </button>
        <button
          className="p-2 bg-white rounded-full shadow hover:bg-gray-50 focus:outline-none"
          onClick={resetView}
          title="Reset View"
        >
          <Maximize className="w-5 h-5 text-gray-700" />
        </button>
        
        {/* Add Snap to Grid toggle button */}
        <button
          className={`p-2 rounded-full shadow focus:outline-none ${
            snapToGrid ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setSnapToGrid(!snapToGrid)}
          title={snapToGrid ? "Snap to Grid: On" : "Snap to Grid: Off"}
        >
          <Grid className="w-5 h-5" />
        </button>
      </div>

      {/* Undo/Redo controls */}
      <div className="absolute top-4 left-4 flex space-x-2">
        <button
          className={`p-2 rounded-full shadow focus:outline-none ${
            canUndo ? 'bg-white hover:bg-gray-50 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          onClick={handleUndoEvent}
          disabled={!canUndo}
          title="Undo"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          className={`p-2 rounded-full shadow focus:outline-none ${
            canRedo ? 'bg-white hover:bg-gray-50 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          onClick={handleRedoEvent}
          disabled={!canRedo}
          title="Redo"
        >
          <RotateCw className="w-5 h-5" />
        </button>
      </div>

      {/* Menu manager */}
      {WorkflowMenuManager && menuState && (
        <WorkflowMenuManager
          menuState={menuState}
          workflowGraph={workflowGraph}
          transform={transform}
          buttonYOffset={buttonYOffset}
          onCloseMenu={handleCloseMenu}
          onAddNode={handleAddNode}
        />
      )}
    </div>
  );
};

export default WorkflowEditorView;
