import React from 'react';
import { BRANCH_EDGE_COLORS } from '../constants';
import ConnectorLine from '../ui/ConnectorLine';
import { calculateConnectionPoints, calculateBranchConnectionPoints } from '../utils/positionUtils';

/**
 * Component responsible for rendering all connector lines between nodes
 */
const ConnectionRenderer = ({
  workflowGraph,
  selectedNodeId,
  pluginRegistry,
  edgeInputYOffset,
  edgeOutputYOffset
}) => {
  const renderConnections = () => {
    const connectors = [];
    
    workflowGraph.getAllEdges().forEach(edge => {
      const sourceNode = workflowGraph.getNode(edge.sourceId);
      const targetNode = workflowGraph.getNode(edge.targetId);
      
      if (!sourceNode || !targetNode) return;
      
      let connectionPoints;
      let edgeColor = BRANCH_EDGE_COLORS.DEFAULT; // Default gray color
      
      if (edge.type === 'default') {
        connectionPoints = calculateConnectionPoints(
          sourceNode, 
          targetNode,
          edgeInputYOffset,
          edgeOutputYOffset
        );
      } else if (edge.type === 'branch') {
        connectionPoints = calculateBranchConnectionPoints(
          sourceNode, 
          targetNode, 
          edge.label,
          pluginRegistry,
          edgeInputYOffset
        );
        
        // Apply color based on node type and branch label
        if (sourceNode.type === 'ifelse') {
          if (edge.label === 'yes') {
            edgeColor = BRANCH_EDGE_COLORS.IFELSE.YES;
          } else if (edge.label === 'no') {
            edgeColor = BRANCH_EDGE_COLORS.IFELSE.NO;
          }
        } else if (sourceNode.type === 'splitflow') {
          // For split flow, use branch-specific colors or default
          const branchKey = `BRANCH_${edge.label}`;
          edgeColor = BRANCH_EDGE_COLORS.SPLITFLOW[branchKey] || BRANCH_EDGE_COLORS.SPLITFLOW.DEFAULT;
        }
      }
      
      // Check if this edge is connected to the selected node
      const isConnectedToSelectedNode = selectedNodeId &&
        (edge.sourceId === selectedNodeId || edge.targetId === selectedNodeId);
      
      if (connectionPoints && connectionPoints.startPos && connectionPoints.endPos) {
        connectors.push(
          <ConnectorLine
            key={`${edge.sourceId}-${edge.targetId}-${edge.type}-${edge.label || 'default'}`}
            startPos={connectionPoints.startPos}
            endPos={connectionPoints.endPos}
            isHighlighted={isConnectedToSelectedNode}
            label={edge.type === 'branch' ? edge.label : null}
            color={edgeColor}
          />
        );
      }
    });
    
    return connectors;
  };
  
  return <>{renderConnections()}</>;
};

export default ConnectionRenderer;