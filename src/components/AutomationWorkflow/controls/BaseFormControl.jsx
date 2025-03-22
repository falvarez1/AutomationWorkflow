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
    <div className={`form-control mb-4 ${className}`}>
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      
      {description && (
        <p className="text-sm text-gray-500 mb-2">{description}</p>
      )}
      
      {renderInput && renderInput(rest)}
      
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
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