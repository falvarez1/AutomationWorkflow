import React from 'react';
import { BRANCH_EDGE_COLORS, EDGE_HIGHLIGHT_CONFIG } from '../constants';

const ConnectorLine = ({ 
  startPos, 
  endPos, 
  isHighlighted, 
  label, 
  color = BRANCH_EDGE_COLORS.DEFAULT // Default color if not specified
}) => {
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
  const labelPosition = label ? 0.3 : 0.5; // Closer to source if it has a label
  const midX = startX + (endX - startX) * labelPosition;
  const midY = startY + (endY - startY) * labelPosition;
  
  // For branch labels, position them higher up to avoid button overlap
  const labelOffsetY = label ? -15 : 0;

  // Use the appropriate highlight color based on settings
  const highlightStroke = EDGE_HIGHLIGHT_CONFIG.PRESERVE_COLOR ? color : BRANCH_EDGE_COLORS.HIGHLIGHTED;
  
  // Build path style with configuration options
  const pathStyle = {
    stroke: isHighlighted ? highlightStroke : color,
    strokeWidth: isHighlighted && EDGE_HIGHLIGHT_CONFIG.INCREASE_WIDTH ? 3 : 2,
    fill: 'none',
    strokeDasharray: isHighlighted && EDGE_HIGHLIGHT_CONFIG.USE_DASHED_LINE ? '5,5' : 'none'
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
            stroke={isHighlighted ? highlightStroke : color}
            strokeWidth="1"
          />
          <text
            x="0"
            y="5"
            textAnchor="middle"
            fontSize="12"
            fontFamily="Arial, sans-serif"
            fill={isHighlighted ? (EDGE_HIGHLIGHT_CONFIG.PRESERVE_COLOR ? '#6B7280' : highlightStroke) : '#6B7280'}
          >
            {label}
          </text>
        </g>
      )}
    </>
  );
};

export default ConnectorLine;