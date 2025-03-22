/**
 * Controls Index
 * 
 * Export all form controls for easy access throughout the application.
 * This centralized export pattern reduces import statements in components
 * that need to use multiple controls.
 */

// Base components
export { default as BaseFormControl } from './BaseFormControl';
export { createFormControl } from './createFormControl';

// Control elements
export { default as TextInputElement } from './elements/TextInputElement';
export { default as SelectElement } from './elements/SelectElement';
export { default as NumberElement } from './elements/NumberElement';
export { default as CheckboxElement } from './elements/CheckboxElement';

// Form controls
export { TextInputControl } from './TextInputControl';
export { SelectControl } from './SelectControl';
export { NumberControl } from './NumberControl';
export { CheckboxControl } from './CheckboxControl';

// Hooks
export { useValidation } from './hooks/useValidation';