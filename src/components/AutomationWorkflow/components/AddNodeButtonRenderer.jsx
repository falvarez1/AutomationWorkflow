import React from 'react';
import { Plus } from 'lucide-react';
import AddNodeButton from '../ui/AddNodeButton';
import { calculateConnectionPoints, getBranchEndpoint, calculateBranchConnectionPoints } from '../utils/positionUtils';
import { LAYOUT, DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT, NODE_TYPES } from '../constants';
import { BranchUtils } from '../utils/BranchUtils';

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
    
    // Add dashed edge and button for nodes that don't have outgoing edges
    workflowGraph.getAllNodes().forEach((node) => {
      const hasOutgoingEdge = workflowGraph.getOutgoingEdges(node.id).length > 0;
      
      // Only add a dashed edge and button if there are no outgoing edges
      if (!hasOutgoingEdge) {
        // Use DEFAULT_NODE constants directly to avoid undefined values
        const startPos = {
          x: node.position.x + (DEFAULT_NODE_WIDTH / 2),
          y: node.position.y + (node.height || DEFAULT_NODE_HEIGHT)
        };
        
        const endPos = {
          x: startPos.x,
          y: startPos.y + 70 // Distance for dashed edge
        };
        
        const buttonPosition = {
          x: endPos.x,
          y: endPos.y
        };
                       
        // Add "Add a step" button at end of dashed line, but only for nodes that are not ifelse or splitflow
        // Branch-specific nodes will get specialized buttons instead
        if (node.type !== NODE_TYPES.IFELSE && node.type !== NODE_TYPES.SPLITFLOW) {
          // Add dashed edge
          buttons.push(
            <svg
              key={`dashed-edge-${node.id}`}
              className="absolute pointer-events-none"
              style={{
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflow: 'visible',
                zIndex: 4 // Between edges (0) and nodes (10+)
              }}
            >
              <path
                d={`M ${startPos.x} ${startPos.y} L ${endPos.x} ${endPos.y}`}
                stroke="#D1D5DB"
                strokeWidth="2"
                strokeDasharray="5,5"
                fill="none"
              />
            </svg>
          );

          buttons.push(
            <div
              key={`add-step-button-${node.id}`}
              className="absolute flex items-center justify-center"
              style={{
                top: buttonPosition.y - 10, // Adjust to center it
                left: buttonPosition.x - 70, // Adjust to center it
                width: 140,
                borderRadius: 20,
                zIndex: 5
              }}
            >
              <button
                className="flex items-center justify-center gap-2 bg-white border border-blue-300 text-blue-500 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all"
                onClick={(e) => {
                  // Get button position
                  const rect = e.currentTarget.getBoundingClientRect();
                  const buttonRect = {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                    width: rect.width,
                    height: rect.height
                  };
                  handleShowAddMenu(node.id, e, buttonRect);
                }}
              >
                <Plus size={16} className="text-blue-500" />
                <span>Add a step</span>
              </button>
            </div>
          );
        }
      }
      
      // Add branch endpoint buttons for IF/ELSE and SPLIT FLOW nodes
      if (node.type === NODE_TYPES.IFELSE || node.type === NODE_TYPES.SPLITFLOW) {
        // Get the branch configuration based on node type
        let branches = [];
        
        if (node.type === NODE_TYPES.IFELSE) {
          branches = [
            { id: 'yes', label: 'True Path' },
            { id: 'no', label: 'False Path' }
          ];
        } else if (node.type === NODE_TYPES.SPLITFLOW) {
          // Get branches from BranchUtils
          branches = BranchUtils.getNodeBranches(node, pluginRegistry);
          
          // If no branches were returned, use default 3 paths
          if (!branches || branches.length === 0) {
            branches = [
              { id: '1', label: 'Path 1' },
              { id: '2', label: 'Path 2' }, 
              { id: '3', label: 'Path 3' }
            ];
          }
        }
        
        // Render a button for each branch endpoint
        branches.forEach(branch => {
          // Use BranchUtils with fallback to handle positioning consistently
          const branchEndpoint = BranchUtils.getBranchEndpoint(node, branch.id, {
            DEFAULT_NODE_WIDTH,
            DEFAULT_NODE_HEIGHT,
            BRANCH_VERTICAL_SPACING: 40
          });
          
          if (!branchEndpoint) return;
          
          // Check if there's already a connection from this branch
          const hasBranchConnection = workflowGraph.getOutgoingEdges(node.id)
            .some(edge => edge.type === 'branch' && edge.label === branch.id);
          
          // Only render endpoint button if no connection exists
          if (!hasBranchConnection) {
            const buttonPosition = {
              x: branchEndpoint.x,
              y: branchEndpoint.y + 20  // Position below the branch endpoint
            };
            
            // Determine button color based on node type
            let buttonStyle = '';
            if (node.type === NODE_TYPES.IFELSE) {
              buttonStyle = branch.id === 'yes' ?
                'bg-indigo-50 border-indigo-200 text-indigo-500 hover:bg-indigo-100' :
                'bg-purple-50 border-purple-200 text-purple-500 hover:bg-purple-100';
            } else if (node.type === NODE_TYPES.SPLITFLOW) {
              buttonStyle = 'bg-green-50 border-green-200 text-green-500 hover:bg-green-100';
            }
            
            // Add specialized branch endpoint button
            buttons.push(
              <div
                key={`branch-endpoint-${node.id}-${branch.id}`}
                className="absolute flex items-center justify-center"
                style={{
                  top: buttonPosition.y - 10,
                  left: buttonPosition.x - 65,
                  width: 130,
                  zIndex: 5
                }}
              >
                <button
                  className={`flex items-center justify-center gap-1 ${buttonStyle} border px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all text-sm`}
                  onClick={(e) => {
                    // Get button position
                    const rect = e.currentTarget.getBoundingClientRect();
                    const buttonRect = {
                      x: rect.left + rect.width / 2,
                      y: rect.top + rect.height / 2,
                      width: rect.width,
                      height: rect.height
                    };
                    handleShowBranchEndpointMenu(node.id, branch.id, e, buttonRect);
                  }}
                >
                  <Plus size={14} />
                  <span>{branch.label}</span>
                </button>
              </div>
            );
          }
        });
      }
    });
    
    return buttons;
  };
  
  return <>{renderAddNodeButtons()}</>;
};

export default AddNodeButtonRenderer;