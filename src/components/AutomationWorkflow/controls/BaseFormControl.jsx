import React from 'react';
import PropTypes from 'prop-types';

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
  ...rest
}) => {
  return (
    <div className={`form-control mb-5 ${className}`}>
      {/* Stack layout with labels above inputs */}
      <div className="flex flex-col items-start">
        {label && (
          <>
            {/* Label above input */}
            <div className="w-full text-left mb-1">
              <label
                htmlFor={id}
                className="block text-sm font-medium text-gray-700"
              >
                {label}
              </label>
            </div>
            {/* Input container */}
            <div className="w-full">
              {renderInput && renderInput(rest)}

              {/* Add the description below the input */}
              {description && (
                <p className="text-xs text-gray-500 mt-1">{description}</p>
              )}

              {/* Show errors in red below the description */}
              {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
              )}
            </div>
          </>
        )}

        {!label && renderInput && (
          // Container for input when no label is present
          <div className="w-full">
            {renderInput(rest)}

            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}

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
  className: PropTypes.string
};

export default BaseFormControl;