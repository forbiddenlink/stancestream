// Enhanced Input Components - Professional Form Elements
import React, { useState } from 'react';
import Icon from '../Icon';

// Base Input Component
export const Input = ({
    label,
    error,
    icon,
    iconPosition = 'left',
    className = '',
    ...props
}) => {
    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-neutral-300">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && iconPosition === 'left' && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon name={icon} size={20} className="text-neutral-400" />
                    </div>
                )}
                <input
                    className={`input-professional ${icon && iconPosition === 'left' ? 'pl-10' : ''
                        } ${icon && iconPosition === 'right' ? 'pr-10' : ''
                        } ${error ? 'border-red-500 focus:ring-red-500' : ''
                        } ${className}`}
                    {...props}
                />
                {icon && iconPosition === 'right' && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Icon name={icon} size={20} className="text-neutral-400" />
                    </div>
                )}
            </div>
            {error && (
                <p className="text-red-400 text-sm">{error}</p>
            )}
        </div>
    );
};

// Search Input
export const SearchInput = ({
    placeholder = 'Search...',
    onSearch,
    className = '',
    ...props
}) => {
    const [value, setValue] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch?.(value);
    };

    return (
        <form onSubmit={handleSubmit} className={`relative ${className}`}>
            <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="search" size={20} className="text-neutral-400" />
                </div>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="input-professional pl-10 pr-4"
                    {...props}
                />
            </div>
        </form>
    );
};

// Textarea Component
export const Textarea = ({
    label,
    error,
    rows = 4,
    className = '',
    ...props
}) => {
    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-neutral-300">
                    {label}
                </label>
            )}
            <textarea
                rows={rows}
                className={`input-professional resize-none ${error ? 'border-red-500 focus:ring-red-500' : ''
                    } ${className}`}
                {...props}
            />
            {error && (
                <p className="text-red-400 text-sm">{error}</p>
            )}
        </div>
    );
};

// Select Component
export const Select = ({
    label,
    error,
    options = [],
    placeholder = 'Select option...',
    className = '',
    ...props
}) => {
    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-neutral-300">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    className={`input-professional appearance-none pr-10 ${error ? 'border-red-500 focus:ring-red-500' : ''
                        } ${className}`}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Icon name="chevron-down" size={20} className="text-neutral-400" />
                </div>
            </div>
            {error && (
                <p className="text-red-400 text-sm">{error}</p>
            )}
        </div>
    );
};

// Toggle Switch
export const Toggle = ({
    label,
    description,
    checked,
    onChange,
    className = '',
    ...props
}) => {
    return (
        <div className={`flex items-center justify-between ${className}`}>
            <div className="flex-1 mr-4">
                {label && (
                    <label className="block text-sm font-medium text-neutral-300">
                        {label}
                    </label>
                )}
                {description && (
                    <p className="text-sm text-neutral-400 mt-1">{description}</p>
                )}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange?.(!checked)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black ${checked ? 'bg-green-600' : 'bg-neutral-600'
                    }`}
                {...props}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-150 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                />
            </button>
        </div>
    );
};

// Radio Group
export const RadioGroup = ({
    label,
    options = [],
    value,
    onChange,
    className = '',
    ...props
}) => {
    return (
        <div className={`space-y-3 ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-neutral-300">
                    {label}
                </label>
            )}
            <div className="space-y-2">
                {options.map((option) => (
                    <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="radio"
                            name={props.name}
                            value={option.value}
                            checked={value === option.value}
                            onChange={(e) => onChange?.(e.target.value)}
                            className="w-4 h-4 text-green-600 bg-neutral-700 border-neutral-600 focus:ring-green-500 focus:ring-2"
                        />
                        <span className="text-neutral-300">{option.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

// Checkbox
export const Checkbox = ({
    label,
    description,
    checked,
    onChange,
    className = '',
    ...props
}) => {
    return (
        <label className={`flex items-start space-x-3 cursor-pointer ${className}`}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange?.(e.target.checked)}
                className="w-4 h-4 text-green-600 bg-neutral-700 border-neutral-600 rounded focus:ring-green-500 focus:ring-2 mt-0.5"
                {...props}
            />
            <div className="flex-1">
                {label && (
                    <span className="text-sm font-medium text-neutral-300">{label}</span>
                )}
                {description && (
                    <p className="text-sm text-neutral-400 mt-1">{description}</p>
                )}
            </div>
        </label>
    );
};

export default {
    Input,
    SearchInput,
    Textarea,
    Select,
    Toggle,
    RadioGroup,
    Checkbox
};
