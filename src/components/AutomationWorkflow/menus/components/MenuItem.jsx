import React from 'react';

/**
 * Renders a single menu item with icon and label
 */
const MenuItem = ({ id, icon, label, onClick, disabled = false, className = '', iconClassName = '' }) => {
  // Determine icon content - can be a React component, string, or null
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      // If it's a React element, clone it with additional classes
      return React.cloneElement(icon, { 
        className: `w-5 h-5 ${iconClassName}`
      });
    } else if (typeof icon === 'string') {
      // If it's a string, assume it's a custom icon name or class
      return <span className={`${icon} ${iconClassName}`} />;
    }
    return null;
  };

  return (
    <button
      id={`menu-item-${id}`}
      className={`flex items-center px-3 py-2 text-sm rounded-md w-full text-left
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'}
        ${className}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {icon && (
        <span className="mr-2 flex-shrink-0">
          {renderIcon()}
        </span>
      )}
      <span className="flex-grow">{label}</span>
    </button>
  );
};

export default MenuItem;