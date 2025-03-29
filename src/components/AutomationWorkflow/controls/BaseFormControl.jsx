import React from 'react';
import PropTypes from 'prop-types';
import InfoTooltip from '../ui/InfoTooltip';

/**
 * Base form control component that provides consistent structure for all form controls
 * This component handles the common layout, labels, descriptions, and error messages
 */
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
      
      {/* Group description with info icon if provided */}
      {groupDescription && (
        <div className="mb-2 flex items-center">
          <span className="text-sm font-semibold text-gray-700 mr-1">Group Info:</span>
          <InfoTooltip tooltip={groupDescription} />
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
              {description && <InfoTooltip tooltip={description} />}
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
              {description && <InfoTooltip tooltip={description} />}
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