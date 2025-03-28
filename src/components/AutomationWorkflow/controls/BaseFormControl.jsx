import React from 'react';
import PropTypes from 'prop-types';

/**
 * Base form control component that provides consistent structure for all form controls
 * This component handles the common layout, labels, descriptions, and error messages
 */

// Info icon component with CSS tooltip
const InfoIcon = ({ tooltip }) => (
  <div className="relative inline-block ml-1 tooltip-container">
    <span
      className="inline-flex items-center justify-center text-s text-white bg-blue-500 rounded-full cursor-help shadow-m hover:bg-blue-600"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    </span>
    <div className="custom-tooltip">
      {tooltip}
      <div className="tooltip-arrow"></div>
    </div>
  </div>
);

InfoIcon.propTypes = {
  tooltip: PropTypes.string.isRequired
};

// Add CSS for the tooltip hover effect
const tooltipStyles = `
  .tooltip-container {
    position: relative;
  }
  
  .custom-tooltip {
    position: absolute;
    z-index: 10;
    visibility: hidden;
    opacity: 0;
    background-color: #374151;
    color: white;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    width: 200px;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: opacity 0.2s, visibility 0.2s;
  }
  
  .tooltip-arrow {
    position: absolute;
    width: 8px;
    height: 8px;
    background-color: #374151;
    transform: rotate(45deg);
    bottom: -4px;
    left: 50%;
    margin-left: -4px;
  }
  
  .tooltip-container:hover .custom-tooltip {
    visibility: visible;
    opacity: 1;
  }
`;
const BaseFormControl = ({
  id,
  label,
  description,
  error,
  renderInput,
  className = '',
  groupDescription,
  ...rest
}) => {
  return (
    <div className={`form-control mb-5 ${className}`}>
      {/* Add style tag for tooltip hover effects */}
      <style>{tooltipStyles}</style>
      
      {/* Group description with info icon if provided */}
      {groupDescription && (
        <div className="mb-2 flex items-center">
          <span className="text-sm font-semibold text-gray-700 mr-1">Group Info:</span>
          <InfoIcon tooltip={groupDescription} />
        </div>
      )}
      
      {/* Stack layout with labels above inputs */}
      <div className="flex flex-col items-start">
        {label && (
          <>
            {/* Label above input with info icon tooltip */}
            <div className="w-full text-left mb-1 flex items-center">
              <label
                htmlFor={id}
                className="text-sm font-medium text-gray-700"
              >
                {label}
              </label>
              {description && <InfoIcon tooltip={description} />}
            </div>
            {/* Input container */}
            <div className="w-full">
              {renderInput && renderInput(rest)}

              {/* Show errors in red */}
              {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
              )}
            </div>
          </>
        )}

        {!label && renderInput && (
          // Container for input when no label is present
          <div className="w-full">
            <div className="flex items-center">
              {renderInput(rest)}
              {description && <InfoIcon tooltip={description} />}
            </div>

            {error && (
              <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

BaseFormControl.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  description: PropTypes.string,
  error: PropTypes.string,
  renderInput: PropTypes.func.isRequired,
  className: PropTypes.string,
  groupDescription: PropTypes.string
};

export default BaseFormControl;