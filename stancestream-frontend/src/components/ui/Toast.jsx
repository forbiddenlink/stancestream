// Enhanced Toast Notification System - Professional User Feedback
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Icon from '../Icon';

// Toast Context
const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Toast Provider
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((toast) => {
        const id = Date.now() + Math.random();
        const newToast = {
            id,
            type: 'info',
            duration: 5000,
            ...toast
        };

        setToasts(prev => [...prev, newToast]);

        if (newToast.duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, newToast.duration);
        }

        return id;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const toast = {
        success: (message, options = {}) => addToast({ ...options, type: 'success', message }),
        error: (message, options = {}) => addToast({ ...options, type: 'error', message }),
        warning: (message, options = {}) => addToast({ ...options, type: 'warning', message }),
        info: (message, options = {}) => addToast({ ...options, type: 'info', message }),
        loading: (message, options = {}) => addToast({ ...options, type: 'loading', message, duration: 0 }),
        custom: addToast,
        remove: removeToast
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

// Toast Container
const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
            {toasts.map(toast => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onRemove={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
};

// Individual Toast Item
const ToastItem = ({ toast, onRemove }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const handleRemove = () => {
        setIsLeaving(true);
        setTimeout(onRemove, 300);
    };

    const getToastConfig = (type) => {
        const configs = {
            success: {
                icon: 'check-circle',
                iconColor: 'text-green-400',
                bgColor: 'from-green-500/20 to-emerald-500/20',
                borderColor: 'border-green-500/30'
            },
            error: {
                icon: 'x-circle',
                iconColor: 'text-red-400',
                bgColor: 'from-red-500/20 to-pink-500/20',
                borderColor: 'border-red-500/30'
            },
            warning: {
                icon: 'alert-triangle',
                        iconColor: 'text-green-400',
        bgColor: 'from-green-500/20 to-emerald-500/20',
        borderColor: 'border-green-500/30'
            },
            info: {
                icon: 'info',
                iconColor: 'text-green-400',
                bgColor: 'from-green-500/20 to-emerald-500/20',
                borderColor: 'border-green-500/30'
            },
            loading: {
                icon: 'loader-2',
                iconColor: 'text-green-400',
                bgColor: 'from-green-500/20 to-emerald-500/20',
                borderColor: 'border-green-500/30'
            }
        };

        return configs[type] || configs.info;
    };

    const config = getToastConfig(toast.type);

    return (
        <div
            className={`
                transform transition-all duration-300 ease-out
                ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
                ${isLeaving ? 'scale-95' : 'scale-100'}
            `}
        >
            <div className={`
                glass-panel rounded-xl p-4 border backdrop-blur-xl
                bg-gradient-to-r ${config.bgColor} ${config.borderColor}
                shadow-lg hover:shadow-xl transition-shadow
            `}>
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                        <Icon
                            name={config.icon}
                            size={20}
                            className={`${config.iconColor} ${toast.type === 'loading' ? 'animate-spin' : ''}`}
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        {toast.title && (
                            <h4 className="text-sm font-semibold text-white mb-1">
                                {toast.title}
                            </h4>
                        )}
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {toast.message}
                        </p>
                        {toast.action && (
                            <button
                                onClick={toast.action.onClick}
                                className="text-xs text-green-400 hover:text-green-300 font-medium mt-2 underline"
                            >
                                {toast.action.label}
                            </button>
                        )}
                    </div>

                    {toast.type !== 'loading' && (
                        <button
                            onClick={handleRemove}
                            className="flex-shrink-0 w-6 h-6 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center transition-colors group"
                        >
                            <Icon
                                name="x"
                                size={14}
                                className="text-slate-400 group-hover:text-white"
                            />
                        </button>
                    )}
                </div>

                {toast.progress !== undefined && (
                    <div className="mt-3">
                        <div className="w-full bg-slate-700/50 rounded-full h-1">
                            <div
                                className={`h-1 rounded-full bg-gradient-to-r ${config.bgColor} transition-all duration-300`}
                                style={{ width: `${toast.progress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Pre-built Toast Hooks for Common Use Cases
export const useNotification = () => {
    const toast = useToast();

    return {
        // AI Operations
        aiGenerating: (message = 'AI is generating response...') =>
            toast.loading(message, { title: 'Processing' }),

        aiSuccess: (message = 'Response generated successfully') =>
            toast.success(message, { title: 'AI Complete' }),

        aiError: (message = 'Failed to generate response') =>
            toast.error(message, { title: 'AI Error' }),

        // Redis Operations
        redisConnecting: () =>
            toast.loading('Connecting to Redis...', { title: 'Database' }),

        redisConnected: () =>
            toast.success('Connected to Redis', { title: 'Database' }),

        redisError: (message) =>
            toast.error(message, { title: 'Redis Error' }),

        // Debate Operations
        debateStarted: (topic) =>
            toast.success(`Debate started: ${topic}`, { title: 'New Debate' }),

        debateEnded: () =>
            toast.info('Debate session ended', { title: 'Session Complete' }),

        // System Notifications
        systemUpdate: (message) =>
            toast.info(message, { title: 'System Update' }),

        networkError: () =>
            toast.error('Network connection lost', {
                title: 'Connection Error',
                action: { label: 'Retry', onClick: () => window.location.reload() }
            }),

        // Generic operations
        ...toast
    };
};

export default {
    ToastProvider,
    useToast,
    useNotification
};
