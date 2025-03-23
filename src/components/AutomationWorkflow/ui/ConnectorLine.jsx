import React from 'react';

// Connector Line Component with Bezier Curves for smoother connections
const ConnectorLine = ({ startPos, endPos, isHighlighted = false, label = null }) => {
  // Use the positions as passed in - they're already positioned correctly
  // The startPos is the center bottom of the source node
  // The endPos is the center top of the target node
  const startX = startPos.x;
  const startY = startPos.y;
  const endX = endPos.x;
  const endY = endPos.y;

  // Calculate distance and control points
  const distance = Math.abs(endY - startY);
  const curveStrength = Math.min(distance * 0.4, 100);

  const ctrl1X = startX;
  const ctrl1Y = startY + curveStrength;
  const ctrl2X = endX;
  const ctrl2Y = endY - curveStrength;

  // Calculate label placement - position it closer to the source node for branches
  // This moves it to 1/4 of the way along the connection instead of the midpoint
  const labelPosition = label ? 0.3 : 0.5; // Closer to source if it has a label
  const midX = startX + (endX - startX) * labelPosition;
  const midY = startY + (endY - startY) * labelPosition;
  
  // For branch labels, position them higher up to avoid button overlap
  const labelOffsetY = label ? -15 : 0;

  const pathStyle = {
    stroke: isHighlighted ? '#3B82F6' : '#D1D5DB',
    strokeWidth: isHighlighted ? 3 : 2,
    fill: 'none',
    strokeDasharray: isHighlighted ? '5,5' : 'none'
  };

  return (
    <>
      <path
        d={`M ${startX} ${startY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${endX} ${endY}`}
        style={pathStyle}
      />
      {label && (
        <g transform={`translate(${midX}, ${midY + labelOffsetY})`}>
          <rect
            x="-30"
            y="-12"
            width="60"
            height="24"
            rx="4"
            ry="4"
            fill="white"
            stroke={isHighlighted ? '#3B82F6' : '#D1D5DB'}
            strokeWidth="1"
          />
          <text
            x="0"
            y="5"
            textAnchor="middle"
            fontSize="12"
            fontFamily="Arial, sans-serif"
            fill={isHighlighted ? '#3B82F6' : '#6B7280'}
          >
            {label}
          </text>
        </g>
      )}
    </>
  );
};

export default ConnectorLine;