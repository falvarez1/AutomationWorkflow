import React from 'react';
import AddNodeButton from '../ui/AddNodeButton';
import { calculateConnectionPoints, calculateBranchConnectionPoints } from '../utils/positionUtils';
import { LAYOUT } from '../constants';

/**
 * Component responsible for rendering all add node buttons
 */
const AddNodeButtonRenderer = ({
  workflowGraph,
  menuState,
  handleShowAddMenu,
  handleShowBranchEdgeMenu,
  handleShowBranchEndpointMenu,
  pluginRegistry,
  edgeInputYOffset,
  edgeOutputYOffset
}) => {
  const renderAddNodeButtons = () => {
    const buttons = [];
    
    // Render a button on each edge connection line (midway between source and target)
    workflowGraph.getAllEdges().forEach((edge) => {
      const sourceNode = workflowGraph.getNode(edge.sourceId);
      const targetNode = workflowGraph.getNode(edge.targetId);
      
      if (!sourceNode || !targetNode) return;
      
      let connectionPoints;
      
      // Calculate connection points based on the edge type
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
      }
      
      if (connectionPoints && connectionPoints.startPos && connectionPoints.endPos) {
        // Calculate midpoint of the edge for button placement
        const midX = (connectionPoints.startPos.x + connectionPoints.endPos.x) / 2;
        const midY = (connectionPoints.startPos.y + connectionPoints.endPos.y) / 2;
        
        const buttonPosition = { x: midX, y: midY };
        
        // For branch edges, use handleShowBranchEdgeMenu instead
        const onAddHandler = edge.type === 'branch'
          ? (e, buttonRect) => handleShowBranchEdgeMenu(edge.sourceId, edge.label, e, buttonRect)
          : (e, buttonRect) => handleShowAddMenu(edge.sourceId, e, buttonRect);
        
        const isHighlighted = edge.type === 'branch'
          ? menuState.activeNodeId === edge.sourceId && 
            menuState.activeBranch === edge.label &&
            (menuState.menuType === 'branch' || menuState.menuType === 'branchEdge')
          : menuState.activeNodeId === edge.sourceId && menuState.menuType === 'add';
        
        const showMenu = edge.type === 'branch'
          ? menuState.activeNodeId === edge.sourceId && 
            menuState.activeBranch === edge.label &&
            (menuState.menuType === 'branch' || menuState.menuType === 'branchEdge')
          : menuState.activeNodeId === edge.sourceId && menuState.menuType === 'add';
                    
        buttons.push(
          <AddNodeButton
            key={`add-button-edge-${edge.sourceId}-${edge.targetId}-${edge.type}-${edge.label || 'default'}`}
            position={buttonPosition}
            nodeWidth={0} // Not node-relative anymore
            buttonSize={LAYOUT.BUTTON.SIZE}
            onAdd={onAddHandler}
            isHighlighted={isHighlighted}
            showMenu={showMenu}
            sourceNodeId={edge.sourceId}
            sourceType={edge.type === 'branch' ? "branch" : "standard"}
          />
        );
      }
    });
    
    // Add buttons at branch endpoints (if/else and split flow nodes)
    workflowGraph.getAllNodes().forEach(node => {
      // Only handle nodes with branches (ifelse, splitflow)
      if (node.type === 'ifelse' || node.type === 'splitflow') {
        const branches = [];
        
        // Get branch information based on node type
        if (node.type === 'ifelse') {
          branches.push({ id: 'yes', label: 'Yes' });
          branches.push({ id: 'no', label: 'No' });
        } else if (node.type === 'splitflow') {
          const nodeType = pluginRegistry.getNodeType('splitflow');
          if (nodeType && nodeType.getBranches) {
            branches.push(...nodeType.getBranches(node.properties));
          }
        }
        
        // For each branch, add a button at its endpoint
        branches.forEach(branch => {
          // Skip branches that already have connections
          const hasExistingConnection = workflowGraph.getBranchOutgoingEdges(node.id)
            .some(edge => edge.label === branch.id);
            
          if (!hasExistingConnection) {
            const branchEndpoint = pluginRegistry.getNodeType(node.type)
              .getBranchEndpoint(node, branch.id);
              
            if (branchEndpoint) {
              const isHighlighted = menuState.activeNodeId === node.id && 
                                    menuState.activeBranch === branch.id &&
                                    menuState.menuType === 'branch';
                                
              const showMenu = menuState.activeNodeId === node.id && 
                                menuState.activeBranch === branch.id &&
                                menuState.menuType === 'branch';
              
              buttons.push(
                <AddNodeButton
                  key={`add-button-branch-${node.id}-${branch.id}`}
                  position={branchEndpoint}
                  nodeWidth={0}
                  buttonSize={LAYOUT.BUTTON.SIZE}
                  onAdd={(e, buttonRect) => handleShowBranchEndpointMenu(node.id, branch.id, e, buttonRect)}
                  isHighlighted={isHighlighted}
                  showMenu={showMenu}
                  sourceNodeId={node.id}
                  sourceType="branch"
                />
              );
            }
          }
        });
      }
    });
    
    return buttons;
  };
  
  return <>{renderAddNodeButtons()}</>;
};

export default AddNodeButtonRenderer;