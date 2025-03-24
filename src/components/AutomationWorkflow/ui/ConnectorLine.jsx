import React from 'react';

/**
 * Renders a connector line between two workflow nodes
 * Supports different styles for branch connections
 */
const ConnectorLine = ({
  startPos,
  endPos,
  isHighlighted = false,
  label = null,
  color = 'rgba(156, 163, 175, 0.6)' // Default light gray
}) => {
  // Safety check for missing position data
  if (!startPos || !endPos) return null;
  
  // Calculate control points for the bezier curve
  const midY = startPos.y + (endPos.y - startPos.y) / 2;
  
  // Path for the bezier curve
  const path = `
    M ${startPos.x} ${startPos.y}
    C ${startPos.x} ${midY}, ${endPos.x} ${midY}, ${endPos.x} ${endPos.y}
  `;
  
  // Dynamic styles
  const strokeWidth = isHighlighted ? 2 : 1.5;
  const strokeDasharray = isHighlighted ? '0' : '0';
  const highlightColor = isHighlighted ? 'rgba(59, 130, 246, 0.8)' : color;
  
  // Render a label if provided (for branch connections)
  const renderLabel = () => {
    if (!label) return null;
    
    // Position label at the midpoint of the curve
    const labelX = (startPos.x + endPos.x) / 2;
    const labelY = midY - 10; // Offset above the line
    
    // Determine color for the label background based on branch type
    let bgColor = 'rgba(209, 213, 219, 0.8)'; // Default gray
    
    if (label === 'yes') {
      bgColor = 'rgba(16, 185, 129, 0.2)'; // Green for "yes" branches
    } else if (label === 'no') {
      bgColor = 'rgba(239, 68, 68, 0.2)'; // Red for "no" branches
    }
    
    return (
      <g>
        <rect
          x={labelX - 18}
          y={labelY - 12}
          width={36}
          height={20}
          rx={4}
          fill={bgColor}
          stroke="rgba(209, 213, 219, 0.6)"
          strokeWidth="1"
        />
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(55, 65, 81, 0.9)"
          fontSize="10"
          fontWeight="500"
        >
          {label}
        </text>
      </g>
    );
  };
  
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible'
      }}
    >
      <path
        d={path}
        fill="none"
        stroke={highlightColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeLinecap="round"
      />
      {renderLabel()}
    </svg>
  );
};

export default ConnectorLine;