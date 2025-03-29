import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

/**
 * InfoTooltip component
 * Provides a reusable info icon with a tooltip on hover that uses React Portal
 * to prevent cutoff issues with parent containers
 */
const InfoTooltip = ({ tooltip, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const iconRef = useRef(null);

  // Update tooltip position when it becomes visible
  useEffect(() => {
    if (isVisible && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 10, // Position above the icon with some padding
        left: rect.left + rect.width / 2
      });
    }
  }, [isVisible]);

  const handleMouseEnter = () => setIsVisible(true);
  const handleMouseLeave = () => setIsVisible(false);

  const tooltipContent = isVisible && ReactDOM.createPortal(
    <div 
      className="fixed z-50 transform -translate-x-1/2 translate-y-[-100%] bg-gray-800 text-white 
                 rounded-md py-2 px-3 text-sm min-w-[200px] max-w-[350px] shadow-lg"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        maxHeight: '300px',
        overflowY: 'hidden',
        lineHeight: '1.4',
        wordWrap: 'break-word'
      }}
    >
      {tooltip}
      <div 
        className="absolute bottom-[-6px] left-1/2 ml-[-6px] w-3 h-3 bg-gray-800 transform rotate-45"
      />
    </div>,
    document.body
  );

  return (
    <div 
      className={`inline-block ml-1 ${className}`}
      ref={iconRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span 
        className="inline-flex items-center justify-center text-xs text-white bg-blue-300 
                  rounded-full cursor-help hover:bg-blue-600"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            fillRule="evenodd" 
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" 
            clipRule="evenodd" 
          />
        </svg>
      </span>
      {tooltipContent}
    </div>
  );
};

InfoTooltip.propTypes = {
  tooltip: PropTypes.string.isRequired,
  className: PropTypes.string
};

export default InfoTooltip;