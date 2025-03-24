import React, { useState } from 'react';
import { X } from 'lucide-react';

/**
 * Dialog component for collecting workflow execution inputs
 */
const ExecuteWorkflowDialog = ({ 
  isOpen, 
  onClose, 
  onExecute, 
  workflowInputSchema = []
}) => {
  const [inputs, setInputs] = useState({});
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleInputChange = (id, value) => {
    setInputs(prev => ({
      ...prev,
      [id]: value
    }));
    
    // Clear error when user edits the field
    if (errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const validateInputs = () => {
    const newErrors = {};
    let isValid = true;

    workflowInputSchema.forEach(input => {
      if (input.required && !inputs[input.id]) {
        newErrors[input.id] = 'This field is required';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateInputs()) {
      onExecute(inputs);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Execute Workflow</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            {workflowInputSchema.length > 0 ? (
              <div className="space-y-4">
                {workflowInputSchema.map(input => (
                  <div key={input.id} className="space-y-1">
                    <label 
                      htmlFor={input.id} 
                      className="block text-sm font-medium text-gray-700"
                    >
                      {input.label} {input.required && <span className="text-red-500">*</span>}
                    </label>
                    
                    {input.type === 'select' ? (
                      <select
                        id={input.id}
                        value={inputs[input.id] || ''}
                        onChange={e => handleInputChange(input.id, e.target.value)}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm 
                          ${errors[input.id] ? 'border-red-500' : 'border-gray-300'}
                          focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      >
                        <option value="">Select an option</option>
                        {input.options?.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : input.type === 'textarea' ? (
                      <textarea
                        id={input.id}
                        value={inputs[input.id] || ''}
                        onChange={e => handleInputChange(input.id, e.target.value)}
                        rows={3}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm 
                          ${errors[input.id] ? 'border-red-500' : 'border-gray-300'}
                          focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                        placeholder={input.placeholder || ''}
                      />
                    ) : (
                      <input
                        id={input.id}
                        type={input.type || 'text'}
                        value={inputs[input.id] || ''}
                        onChange={e => handleInputChange(input.id, e.target.value)}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm 
                          ${errors[input.id] ? 'border-red-500' : 'border-gray-300'}
                          focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                        placeholder={input.placeholder || ''}
                      />
                    )}
                    
                    {errors[input.id] && (
                      <p className="mt-1 text-sm text-red-500">{errors[input.id]}</p>
                    )}
                    
                    {input.description && (
                      <p className="mt-1 text-sm text-gray-500">{input.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">This workflow doesn't require any inputs.</p>
            )}
          </div>
          
          <div className="p-4 border-t flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Execute
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExecuteWorkflowDialog;
