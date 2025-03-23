import React, { useState } from 'react';
import { rules } from './components/AutomationWorkflow/validation';

/**
 * Simple validation test component
 */
const SimpleValidationTest = () => {
  const [values, setValues] = useState({
    name: '',
    email: '',
    age: '',
    options: '',
    accept: false
  });
  
  const [errors, setErrors] = useState({
    name: null,
    email: null,
    age: null,
    options: null,
    accept: null
  });
  
  const validateField = (field, value) => {
    let error = null;
    
    switch (field) {
      case 'name':
        // Use our rule builder to create validation rules
        const nameRules = rules()
          .required('Name is required')
          .minLength(3, 'Name must be at least 3 characters')
          .build();
          
        if (!value) {
          error = nameRules.required.message;
        } else if (value.length < 3) {
          error = nameRules.minLength.message;
        }
        break;
        
      case 'email':
        const emailRules = rules()
          .required('Email is required')
          .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address')
          .build();
          
        if (!value) {
          error = emailRules.required.message;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = emailRules.pattern.message;
        }
        break;
        
      case 'age':
        const ageRules = rules()
          .required('Age is required')
          .min(18, 'You must be at least 18 years old')
          .max(100, 'Age cannot exceed 100')
          .build();
        
        if (!value) {
          error = ageRules.required.message;
        } else {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            error = 'Please enter a valid number';
          } else if (numValue < 18) {
            error = ageRules.min.message;
          } else if (numValue > 100) {
            error = ageRules.max.message;
          }
        }
        break;
        
      case 'options':
        const optionsRules = rules()
          .required('Please select an option')
          .build();
          
        if (!value) {
          error = optionsRules.required.message;
        }
        break;
        
      case 'accept':
        const acceptRules = rules()
          .boolean(true, 'You must accept the terms')
          .build();
          
        if (!value) {
          error = acceptRules.boolean.message;
        }
        break;
        
      default:
        break;
    }
    
    return error;
  };
  
  const handleChange = (field, value) => {
    setValues(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Validate on change
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {};
    let hasErrors = false;
    
    Object.keys(values).forEach(field => {
      const error = validateField(field, values[field]);
      newErrors[field] = error;
      if (error) hasErrors = true;
    });
    
    setErrors(newErrors);
    
    if (!hasErrors) {
      alert('Form is valid! Data: ' + JSON.stringify(values, null, 2));
    } else {
      alert('Form has errors. Please fix them before submitting.');
    }
  };
  
  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Simple Validation Test</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={values.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={values.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`w-full p-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="age">
            Age
          </label>
          <input
            id="age"
            type="number"
            value={values.age}
            onChange={(e) => handleChange('age', e.target.value)}
            className={`w-full p-2 border rounded ${errors.age ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.age && (
            <p className="text-red-500 text-sm mt-1">{errors.age}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="options">
            Select an option
          </label>
          <select
            id="options"
            value={values.options}
            onChange={(e) => handleChange('options', e.target.value)}
            className={`w-full p-2 border rounded ${errors.options ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">-- Select --</option>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
          </select>
          {errors.options && (
            <p className="text-red-500 text-sm mt-1">{errors.options}</p>
          )}
        </div>
        
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={values.accept}
              onChange={(e) => handleChange('accept', e.target.checked)}
              className={`mr-2 ${errors.accept ? 'border-red-500' : ''}`}
            />
            <span>I accept the terms and conditions</span>
          </label>
          {errors.accept && (
            <p className="text-red-500 text-sm mt-1">{errors.accept}</p>
          )}
        </div>
        
        <div>
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default SimpleValidationTest;