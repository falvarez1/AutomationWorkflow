// This is the corrected section of the file
// To fix the issue, replace lines 1402-1527 with this:

                {/* Special branching connections for If/Else and Split nodes */}
                {workflowSteps.map((step, index) => {
                  const nodePlugin = pluginRegistry.getNodeType(step.type);
                  
                  // Only process nodes that have multiple branches
                  if (!nodePlugin || !nodePlugin.hasMultipleBranches(step)) {
                    return null;
                  }
                  
                  // Get dynamic branches for this node
                  const branches = nodePlugin.getBranches(step);
                  if (!branches || branches.length < 2) {
                    return null;
                  }
                  
                  // Calculate center point of the node
                  const startX = step.position.x + (NODE_WIDTH / 2);
                  const startY = step.position.y + (step.height || DEFAULT_NODE_HEIGHT);
                  
                  // Calculate angle between branches
                  const branchCount = branches.length;
                  
                  // For If/Else nodes, always render the Yes/No branches
                  if (step.type === 'ifelse') {
                    // Yes branch (left side)
                    const yesEndX = step.position.x - 150 + (NODE_WIDTH / 2);
                    const yesEndY = startY + 100;
                    
                    // No branch (right side)
                    const noEndX = step.position.x + 150 + (NODE_WIDTH / 2);
                    const noEndY = startY + 100;
                    
                    return (
                      <React.Fragment key={`branches-${step.id}`}>
                        {/* Yes branch */}
                        <ConnectorLine
                          key={`connector-${step.id}-yes`}
                          startPos={{
                            x: startX,
                            y: startY
                          }}
                          endPos={{
                            x: yesEndX,
                            y: yesEndY
                          }}
                          isHighlighted={index === selectedNodeIndex}
                          label="Yes"
                        />
                        
                        {/* No branch */}
                        <ConnectorLine
                          key={`connector-${step.id}-no`}
                          startPos={{
                            x: startX,
                            y: startY
                          }}
                          endPos={{
                            x: noEndX,
                            y: noEndY
                          }}
                          isHighlighted={index === selectedNodeIndex}
                          label="No"
                        />
                      </React.Fragment>
                    );
                  }
                  
                  // For Split nodes, render dynamic branches
                  if (step.type === 'splitflow') {
                    // Parse branch values - handle both string and array formats
                    let branchValues = [];
                    if (step.branchValues) {
                      if (typeof step.branchValues === 'string') {
                        branchValues = step.branchValues.split(',').map(val => val.trim()).filter(val => val);
                      } else if (Array.isArray(step.branchValues)) {
                        branchValues = step.branchValues;
                      }
                    }
                    
                    // Calculate positions for branches (maximum 2 currently)
                    // In a more complete implementation, this would handle multiple branches
                    const left = {
                      x: step.position.x - 150 + (NODE_WIDTH / 2),
                      y: startY + 100
                    };
                    
                    const right = {
                      x: step.position.x + 150 + (NODE_WIDTH / 2),
                      y: startY + 100
                    };
                    
                    // Get the first branch value or default
                    const firstValue = branchValues.length > 0 ? branchValues[0] : 'Default';
                    
                    return (
                      <React.Fragment key={`branches-${step.id}`}>
                        {/* Primary branch - usually first value */}
                        <ConnectorLine
                          key={`connector-${step.id}-primary`}
                          startPos={{
                            x: startX,
                            y: startY
                          }}
                          endPos={left}
                          isHighlighted={index === selectedNodeIndex}
                          label={firstValue}
                        />
                        
                        {/* Other branch - always "All Others" */}
                        <ConnectorLine
                          key={`connector-${step.id}-other`}
                          startPos={{
                            x: startX,
                            y: startY
                          }}
                          endPos={right}
                          isHighlighted={index === selectedNodeIndex}
                          label="All Others"
                        />
                      </React.Fragment>
                    );
                  }
                  
                  return null;
                })}