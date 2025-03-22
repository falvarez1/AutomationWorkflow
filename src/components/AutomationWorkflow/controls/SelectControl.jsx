import React from 'react';
import { PropertyControl } from './PropertyControl';

/**
 * Select Control
 * 
 * A control for select/dropdown properties.
 */
export const SelectControl = new PropertyControl({
  type: 'select',
  component: ({ value, onChange, label, error, description, controlProps, ...props }) => {
    const options = controlProps?.options || [];
    
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {description && <p className="text-sm text-gray-500 mb-2">{description}</p>}
        <select
          value={value || ''}
          className={`w-full p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md`}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        >
          <option value="">Select an option</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  },
  validate: (value, rules) => {
    if (rules.required && (!value || value === '')) {
      return 'This field is required';
    }
    return null;
  }
});