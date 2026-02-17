// Enhanced Button Components - Professional Grade UI Elements
import React from 'react';
import Icon from '../Icon';

// Base Button Component with Multiple Variants
export const Button = ({
    variant = 'primary',
    size = 'md',
    children,
    icon,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    className = '',
    ...props
}) => {
    const baseClasses = 'professional-button focus-ring';

    const variants = {
        primary: 'button-primary',
        secondary: 'button-secondary',
        ghost: 'button-ghost',
        danger: 'button-danger',
        success: 'bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/30 hover:border-green-500/50 hover:scale-[1.01] active:scale-[0.98]',
        warning: 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 border border-yellow-500/30 hover:border-yellow-500/50 hover:scale-[1.01] active:scale-[0.98]'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm rounded-xl',
        md: 'px-4 py-2 text-sm rounded-xl',
        lg: 'px-6 py-3 text-base rounded-xl',
        xl: 'px-8 py-4 text-lg rounded-xl'
    };

    const variantClass = variants[variant] || variants.primary;
    const sizeClass = sizes[size] || sizes.md;

    return (
        <button
            className={`${baseClasses} ${variantClass} ${sizeClass} ${className} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <Icon name="loader-2" size={16} className="animate-spin mr-2" />
            )}
            {icon && iconPosition === 'left' && !loading && (
                <Icon name={icon} size={16} className="mr-2" />
            )}
            {children}
            {icon && iconPosition === 'right' && !loading && (
                <Icon name={icon} size={16} className="ml-2" />
            )}
        </button>
    );
};

// Floating Action Button
export const FloatingActionButton = ({ icon, onClick, className = '', ...props }) => {
    return (
        <button
            onClick={onClick}
            className={`fixed bottom-6 right-6 w-14 h-14 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 hover:border-green-500/50 rounded-xl shadow-card hover:shadow-glow flex items-center justify-center text-green-400 transition-all duration-150 hover:scale-105 active:scale-95 z-50 ${className}`}
            {...props}
        >
            <Icon name={icon} size={24} />
        </button>
    );
};

// Toggle Button
export const ToggleButton = ({ pressed, onToggle, children, icon, className = '' }) => {
    return (
        <button
            onClick={onToggle}
            className={`professional-button px-4 py-2 text-sm rounded-xl transition-all duration-150 focus-ring ${pressed
                    ? 'bg-green-500/30 text-green-300 border border-green-500/50 shadow-glow'
                    : 'bg-surface-card hover:bg-surface-elevated text-green-300 border border-green-500/20 hover:border-green-500/40'
                } ${className}`}
        >
            {icon && <Icon name={icon} size={16} className="mr-2" />}
            {children}
        </button>
    );
};

// Gradient Button with Shine Effect
export const GradientButton = ({ children, gradient = 'hero', className = '', ...props }) => {
    const gradients = {
        hero: 'from-green-600/80 to-green-500/80',
        success: 'from-green-600/80 to-green-500/80',
        warning: 'from-yellow-600/80 to-yellow-500/80',
        danger: 'from-red-600/80 to-red-500/80'
    };

    return (
        <button
            className={`relative professional-button px-6 py-3 text-base rounded-xl text-green-100 font-semibold font-mono shadow-card hover:shadow-glow transition-all duration-150 overflow-hidden group border border-green-500/30 ${className}`}
            {...props}
        >
            <div className={`absolute inset-0 bg-gradient-to-r ${gradients[gradient]} transition-all duration-150 group-hover:opacity-90`}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
            <span className="relative z-10">{children}</span>
        </button>
    );
};

// Icon Button
export const IconButton = ({ icon, size = 'md', variant = 'ghost', className = '', ...props }) => {
    const sizes = {
        sm: 'w-8 h-8 p-1',
        md: 'w-10 h-10 p-2',
        lg: 'w-12 h-12 p-3'
    };

    const variants = {
        ghost: 'hover:bg-green-500/10 text-green-300',
        primary: 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30',
        secondary: 'bg-surface-card hover:bg-surface-elevated text-green-300 border border-green-500/20'
    };

    return (
        <button
            className={`professional-button rounded-xl transition-all duration-150 focus-ring hover:scale-[1.01] active:scale-[0.98] ${sizes[size]} ${variants[variant]} ${className}`}
            {...props}
        >
            <Icon name={icon} size={size === 'sm' ? 16 : size === 'md' ? 20 : 24} />
        </button>
    );
};

// Button Group
export const ButtonGroup = ({ children, className = '' }) => {
    return (
        <div className={`flex rounded-xl overflow-hidden border border-green-500/20 ${className}`}>
            {React.Children.map(children, (child, index) =>
                React.cloneElement(child, {
                    className: `${child.props.className || ''} ${index > 0 ? 'border-l border-green-500/20' : ''} rounded-none`
                })
            )}
        </div>
    );
};

export default {
    Button,
    FloatingActionButton,
    ToggleButton,
    GradientButton,
    IconButton,
    ButtonGroup
};
