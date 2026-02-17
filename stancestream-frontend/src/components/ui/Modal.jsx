// Enhanced Modal System - Enterprise Grade Dialog Components
import React, { useEffect, useRef } from 'react';
import Icon from '../Icon';

// Base Modal Component
export const Modal = ({
    isOpen,
    onClose,
    children,
    size = 'md',
    className = '',
    closeOnOverlay = true,
    closeOnEscape = true
}) => {
    const modalRef = useRef(null);

    const sizes = {
        sm: 'w-full max-w-md',
        md: 'w-full max-w-lg',
        lg: 'w-full max-w-2xl',
        xl: 'w-full max-w-4xl',
        full: 'w-full max-w-7xl'
    };

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && closeOnEscape) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose, closeOnEscape]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100]" onClick={closeOnOverlay ? onClose : undefined}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            
            {/* Modal Container */}
            <div className="fixed inset-0 overflow-y-auto flex items-start justify-center">
                {/* Modal Content */}
                <div
                    ref={modalRef}
                    className={`relative glass-panel rounded-modal ${sizes[size]} w-full mx-auto mt-20 bg-surface-elevated/95 border border-green-500/20 shadow-modal backdrop-blur-sm ${className}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {children}
                </div>
            </div>
        </div>
    );
};

// Modal Header
export const ModalHeader = ({
    title,
    subtitle,
    onClose,
    icon,
    className = ''
}) => {
    return (
        <div className={`flex items-center justify-between p-6 border-b border-green-500/20 ${className}`}>
            <div className="flex items-center space-x-4">
                {icon && (
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <Icon name={icon} size={24} className="text-green-400" />
                    </div>
                )}
                <div>
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                    {subtitle && (
                        <p className="text-neutral-400 text-sm mt-1">{subtitle}</p>
                    )}
                </div>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl bg-neutral-800/50 hover:bg-neutral-700/50 flex items-center justify-center transition-colors duration-150 group"
                >
                    <Icon name="x" size={20} className="text-neutral-400 group-hover:text-white" />
                </button>
            )}
        </div>
    );
};

// Modal Content
export const ModalContent = ({ children, className = '' }) => {
    return (
        <div className={`p-6 overflow-y-auto max-h-[70vh] ${className}`}>
            {children}
        </div>
    );
};

// Modal Footer
export const ModalFooter = ({ children, className = '' }) => {
    return (
        <div className={`flex items-center justify-end space-x-3 p-6 border-t border-green-500/20 ${className}`}>
            {children}
        </div>
    );
};

// Confirmation Dialog
export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary',
    icon = 'alert-triangle'
}) => {
    const variants = {
        primary: 'btn-primary',
        danger: 'btn-danger',
        warning: 'btn-warning',
        success: 'btn-success'
    };

    const iconColors = {
        primary: 'text-green-400',
        danger: 'text-red-400',
        warning: 'text-green-400',
        success: 'text-green-400'
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <ModalHeader
                title={title}
                icon={icon}
                onClose={onClose}
            />
            <ModalContent>
                <p className="text-neutral-300 leading-relaxed">{message}</p>
            </ModalContent>
            <ModalFooter>
                <button onClick={onClose} className="btn-ghost">
                    {cancelText}
                </button>
                <button
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    className={variants[variant]}
                >
                    {confirmText}
                </button>
            </ModalFooter>
        </Modal>
    );
};

// Info Dialog
export const InfoDialog = ({
    isOpen,
    onClose,
    title,
    message,
    details,
    icon = 'info',
    actions
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <ModalHeader
                title={title}
                icon={icon}
                onClose={onClose}
            />
            <ModalContent>
                <div className="space-y-4">
                    <p className="text-neutral-300 leading-relaxed">{message}</p>
                    {details && (
                        <div className="glass-card p-4 rounded-xl bg-surface-elevated">
                            <pre className="text-sm text-neutral-400 whitespace-pre-wrap font-mono overflow-x-auto">
                                {details}
                            </pre>
                        </div>
                    )}
                </div>
            </ModalContent>
            <ModalFooter>
                {actions || (
                    <button onClick={onClose} className="btn-primary">
                        OK
                    </button>
                )}
            </ModalFooter>
        </Modal>
    );
};

// Input Dialog
export const InputDialog = ({
    isOpen,
    onClose,
    onSubmit,
    title,
    label,
    placeholder,
    defaultValue = '',
    type = 'text',
    required = false,
    icon = 'edit-3'
}) => {
    const [value, setValue] = React.useState(defaultValue);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (required && !value.trim()) return;
        onSubmit(value);
        onClose();
        setValue(defaultValue);
    };

    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue);
        }
    }, [isOpen, defaultValue]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <ModalHeader
                title={title}
                icon={icon}
                onClose={onClose}
            />
            <form onSubmit={handleSubmit}>
                <ModalContent>
                    <div className="space-y-4">
                        {label && (
                            <label className="block text-sm font-medium text-neutral-300">
                                {label}
                                {required && <span className="text-red-400 ml-1">*</span>}
                            </label>
                        )}
                        <input
                            type={type}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={placeholder}
                            className="w-full px-4 py-3 bg-surface-elevated border border-green-500/20 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-150"
                            autoFocus
                            required={required}
                        />
                    </div>
                </ModalContent>
                <ModalFooter>
                    <button type="button" onClick={onClose} className="btn-ghost">
                        Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                        Submit
                    </button>
                </ModalFooter>
            </form>
        </Modal>
    );
};

export default {
    Modal,
    ModalHeader,
    ModalContent,
    ModalFooter,
    ConfirmDialog,
    InfoDialog,
    InputDialog
};
