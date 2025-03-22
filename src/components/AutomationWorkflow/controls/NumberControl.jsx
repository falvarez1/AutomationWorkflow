import React from 'react';
import { PropertyControl } from './PropertyControl';

/**
 * Number Control
 *
 * A control for numeric input properties.
 */
export const NumberControl = new PropertyControl({
  type: 'number',
  component: ({ value, onChange, label, error, description, controlProps, ...props }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {description && <p className="text-sm text-gray-500 mb-2">{description}</p>}
      <input
        type="number"
        value={value !== undefined ? value : ''}
        className={`w-full p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md`}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  ),
  validate: (value, rules) => {
    if (rules.required && (value === undefined || value === null || value === '')) {
      return 'This field is required';
    }
    if (rules.min !== undefined && value < rules.min) {
      return `Must be at least ${rules.min}`;
    }
    if (rules.max !== undefined && value > rules.max) {
      return `Must be no more than ${rules.max}`;
    }
    return null;
  }
});