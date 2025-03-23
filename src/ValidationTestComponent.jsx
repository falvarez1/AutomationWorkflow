import React, { useState } from 'react';
import { 
  useFormValidation, 
  useFieldValidation, 
  rules 
} from './components/AutomationWorkflow/validation';

// Import the direct UI element components instead of the controls
import TextInputElement from './components/AutomationWorkflow/controls/elements/TextInputElement';
import NumberElement from './components/AutomationWorkflow/controls/elements/NumberElement';
import SelectElement from './components/AutomationWorkflow/controls/elements/SelectElement';
import CheckboxElement from './components/AutomationWorkflow/controls/elements/CheckboxElement';

/**
 * Test component for validating the validation framework
 */
export const ValidationTestComponent = () => {
  // Field-level validation example
  const nameValidation = useFieldValidation('', 
    rules()
      .required('Name is required')
      .minLength(3, 'Name must be at least 3 characters')
      .build()
  );

  const ageValidation = useFieldValidation('', 
    rules()
      .required('Age is required')
      .min(18, 'Must be at least 18')
      .max(100, 'Must be no more than 100')
      .build()
  );

  // Form-level validation example
  const formSchema = [
    { id: 'email', type: 'text', label: 'Email' },
    { id: 'password', type: 'text', label: 'Password' },
    { id: 'confirmPassword', type: 'text', label: 'Confirm Password' }
  ];

  const formValidationRules = {
    email: rules().required('Email is required').email('Invalid email format').build(),
    password: rules().required('Password is required').minLength(8, 'Password must be at least 8 characters').build(),
    confirmPassword: rules().required('Please confirm your password').build()
  };

  const { 
    values: formValues, 
    errors: formErrors, 
    setValue: setFormValue, 
    handleSubmit
  } = useFormValidation(formSchema, {}, formValidationRules);

  // For rendering the custom controls
  const [valueStates, setValueStates] = useState({
    text: '',
    number: 0,
    select: '',
    checkbox: false
  });

  const [errorStates, setErrorStates] = useState({
    text: null,
    number: null,
    select: null,
    checkbox: null
  });

  // Handle changes for the control examples
  const handleControlChange = (controlType, value) => {
    setValueStates(prev => ({
      ...prev,
      [controlType]: value
    }));

    // Validate based on control type
    let error = null;
    switch (controlType) {
      case 'text':
        if (!value) error = 'This field is required';
        else if (value.length < 3) error = 'Must be at least 3 characters';
        break;
      case 'number':
        if (value < 0) error = 'Must be a positive number';
        break;
      case 'select':
        if (!value) error = 'Please select an option';
        break;
      case 'checkbox':
        if (!value) error = 'This must be checked';
        break;
      default:
        break;
    }

    setErrorStates(prev => ({
      ...prev,
      [controlType]: error
    }));
  };

  // Handle form submission
  const onSubmit = (data) => {
    alert('Form submitted with: ' + JSON.stringify(data, null, 2));
  };

  // Helper function to create a form field with label and error
  const FormField = ({ label, children, error, description }) => (
    <div className="mb-4">
      <label className="block mb-1 font-medium text-gray-700">{label}</label>
      {description && <p className="text-sm text-gray-500 mb-1">{description}</p>}
      {children}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Validation Framework Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Field-level validation examples */}
        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-3">Field-Level Validation</h2>
          
          <div className="mb-4">
            <label className="block mb-1">Name:</label>
            <input
              className={`border p-2 w-full rounded ${nameValidation.error ? 'border-red-500' : 'border-gray-300'}`}
              type="text"
              {...nameValidation.getInputProps()}
            />
            {nameValidation.error && (
              <p className="text-red-500 text-sm mt-1">{nameValidation.error}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-1">Age:</label>
            <input
              className={`border p-2 w-full rounded ${ageValidation.error ? 'border-red-500' : 'border-gray-300'}`}
              type="number"
              {...ageValidation.getInputProps()}
            />
            {ageValidation.error && (
              <p className="text-red-500 text-sm mt-1">{ageValidation.error}</p>
            )}
          </div>

          <button 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => {
              nameValidation.validate();
              ageValidation.validate();
              
              if (nameValidation.isValid && ageValidation.isValid) {
                alert(`Valid! Name: ${nameValidation.value}, Age: ${ageValidation.value}`);
              }
            }}
          >
            Validate Fields
          </button>
        </div>

        {/* Form-level validation examples */}
        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-3">Form-Level Validation</h2>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4">
              <label className="block mb-1">Email:</label>
              <input
                className={`border p-2 w-full rounded ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                type="email"
                value={formValues.email || ''}
                onChange={(e) => setFormValue('email', e.target.value)}
              />
              {formErrors.email && (
                <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block mb-1">Password:</label>
              <input
                className={`border p-2 w-full rounded ${formErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                type="password"
                value={formValues.password || ''}
                onChange={(e) => setFormValue('password', e.target.value)}
              />
              {formErrors.password && (
                <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block mb-1">Confirm Password:</label>
              <input
                className={`border p-2 w-full rounded ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                type="password"
                value={formValues.confirmPassword || ''}
                onChange={(e) => setFormValue('confirmPassword', e.target.value)}
              />
              {formErrors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{formErrors.confirmPassword}</p>
              )}
              {formValues.password && formValues.confirmPassword && 
                formValues.password !== formValues.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
              )}
            </div>

            <button 
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Submit Form
            </button>
          </form>
        </div>
      </div>

      {/* Control examples */}
      <div className="mt-8 border p-4 rounded">
        <h2 className="text-lg font-semibold mb-3">Control Components</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField 
            label="Text Input" 
            error={errorStates.text}
            description="Enter at least 3 characters"
          >
            <TextInputElement
              id="text-input-test"
              value={valueStates.text}
              onChange={(value) => handleControlChange('text', value)}
              error={errorStates.text}
              className={`w-full p-2 border ${errorStates.text ? 'border-red-500' : 'border-gray-300'} rounded-md`}
            />
          </FormField>
          
          <FormField 
            label="Number Input" 
            error={errorStates.number}
            description="Enter a positive number"
          >
            <NumberElement
              id="number-input-test"
              value={valueStates.number}
              onChange={(value) => handleControlChange('number', value)}
              error={errorStates.number}
              className={`w-full p-2 border ${errorStates.number ? 'border-red-500' : 'border-gray-300'} rounded-md`}
            />
          </FormField>
          
          <FormField 
            label="Select Input" 
            error={errorStates.select}
            description="Select an option"
          >
            <SelectElement
              id="select-input-test"
              value={valueStates.select}
              onChange={(value) => handleControlChange('select', value)}
              error={errorStates.select}
              options={[
                { value: "option1", label: "Option 1" },
                { value: "option2", label: "Option 2" },
                { value: "option3", label: "Option 3" }
              ]}
              className={`w-full p-2 border ${errorStates.select ? 'border-red-500' : 'border-gray-300'} rounded-md`}
            />
          </FormField>
          
          <FormField 
            label="Checkbox Input" 
            error={errorStates.checkbox}
            description="This must be checked"
          >
            <CheckboxElement
              id="checkbox-input-test"
              checked={valueStates.checkbox}
              onChange={(value) => handleControlChange('checkbox', value)}
              error={errorStates.checkbox}
              className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded`}
            />
          </FormField>
        </div>
      </div>
    </div>
  );
};

export default ValidationTestComponent;