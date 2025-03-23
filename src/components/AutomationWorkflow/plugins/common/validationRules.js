/**
 * Common validation rules used across node plugins
 */
export const commonValidationRules = {
  // Title validation rules
  title: {
    required: true,
    minLength: 3,
    maxLength: 50
  },
  
  // Subtitle validation rules
  subtitle: {
    maxLength: 100
  },
  
  // Helper to create dynamic dependency validation
  createDependentRequiredRule: (fieldName, fieldValue) => ({
    required: true,
    dependency: {
      field: fieldName,
      value: fieldValue
    }
  })
};