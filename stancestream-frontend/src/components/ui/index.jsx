// UI Component Library Index - Enterprise Grade Component System
// Centralized export for all UI components
/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import Icon from '../Icon';

// Core Components
export { default as ViewModeSelector } from '../ViewModeSelector';
export { default as Navigation } from './Navigation';
export {
    Container,
    Section,
    Grid,
    Flex,
    Stack,
    Hero,
    CardGrid,
    SidebarLayout,
    DashboardLayout
} from './Layout';

// Feedback Components
export { default as Loading } from './Loading';
export { default as Toast, ToastProvider, useToast, useNotification } from './Toast';

// Individual component exports for convenience
export {
    // Buttons
    Button,
    FloatingActionButton,
    ToggleButton,
    GradientButton,
    IconButton,
    ButtonGroup
} from './Button';

export {
    // Cards
    Card,
    CardHeader,
    CardContent,
    CardFooter,
    MetricCard,
    StatusCard,
    LoadingCard,
    FeatureCard
} from './Card';

export {
    // Inputs
    Input,
    SearchInput,
    Textarea,
    Select,
    Toggle,
    RadioGroup,
    Checkbox
} from './Input';

export {
    // Loading States
    CardSkeleton,
    MessageSkeleton,
    Spinner,
    LoadingOverlay,
    ProgressBar,
    DotLoader
} from './Loading';

export {
    // Modals
    Modal,
    ModalHeader,
    ModalContent,
    ModalFooter,
    ConfirmDialog,
    InfoDialog,
    InputDialog
} from './Modal';

export {
    // Navigation
    TabNavigation,
    Breadcrumb,
    SidebarNav,
    Pagination,
    StepNavigation
} from './Navigation';

// Component variants and configurations
export const componentVariants = {
    button: {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        ghost: 'btn-ghost',
        danger: 'btn-danger',
        success: 'btn-success',
        warning: 'btn-warning'
    },
    card: {
        default: 'glass-panel',
        elevated: 'glass-card',
        feature: 'feature-card',
        metric: 'metric-card'
    },
    loading: {
        spinner: 'animate-spin',
        pulse: 'animate-pulse',
        bounce: 'animate-bounce',
        ping: 'animate-ping'
    }
};

// Common size configurations
export const sizeVariants = {
    xs: { padding: 'px-2 py-1', text: 'text-xs', icon: 12 },
    sm: { padding: 'px-3 py-2', text: 'text-sm', icon: 16 },
    md: { padding: 'px-4 py-3', text: 'text-base', icon: 20 },
    lg: { padding: 'px-6 py-4', text: 'text-lg', icon: 24 },
    xl: { padding: 'px-8 py-5', text: 'text-xl', icon: 28 }
};

// Theme configuration for consistent styling
export const theme = {
    colors: {
        primary: {
            50: '#eff6ff',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8'
        },
        purple: {
            500: '#8b5cf6',
            600: '#7c3aed'
        },
        slate: {
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a'
        },
        status: {
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6'
        }
    },
    shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
    },
    animations: {
        fadeIn: 'fadeIn 0.3s ease-out',
        slideUp: 'slideUp 0.3s ease-out',
        scaleIn: 'scaleIn 0.2s ease-out'
    }
};

// Utility functions for component styling
export const cn = (...classes) => {
    return classes.filter(Boolean).join(' ');
};

export const getVariantClasses = (component, variant) => {
    return componentVariants[component]?.[variant] || '';
};

export const getSizeClasses = (size = 'md') => {
    return sizeVariants[size] || sizeVariants.md;
};

// Component composition helpers
// eslint-disable-next-line no-unused-vars
export const withLoading = (WrappedComponent) => {
    return ({ loading, ...props }) => {
        if (loading) {
            return <Spinner className="mx-auto" />;
        }
        return <WrappedComponent {...props} />;
    };
};

// eslint-disable-next-line no-unused-vars
export const withTooltip = (WrappedComponent) => {
    return ({ tooltip, ...props }) => {
        if (!tooltip) return <WrappedComponent {...props} />;

        return (
            <div className="relative group">
                <WrappedComponent {...props} />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    {tooltip}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                </div>
            </div>
        );
    };
};

// Pre-built component combinations for common use cases
export const StatusBadge = ({ status, label, className = '' }) => {
    const statusColors = {
        success: 'bg-green-500/20 text-green-400 border-green-500/30',
        warning: 'bg-green-500/20 text-green-400 border-green-500/30',
        error: 'bg-red-500/20 text-red-400 border-red-500/30',
        info: 'bg-green-500/20 text-green-400 border-green-500/30',
        neutral: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    };

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusColors[status] || statusColors.neutral} ${className}`}>
            {label}
        </span>
    );
};

export const DataTable = ({ columns, data, loading = false }) => {
    if (loading) {
        return (
            <div className="glass-panel rounded-xl p-6">
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex space-x-4">
                            {columns.map((_, j) => (
                                <div key={j} className="h-4 bg-slate-700/50 rounded animate-pulse flex-1" />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="glass-panel rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-800/50 border-b border-slate-700/50">
                        <tr>
                            {columns.map((col, index) => (
                                <th key={index} className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {data.map((row, index) => (
                            <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                                {columns.map((col, colIndex) => (
                                    <td key={colIndex} className="px-6 py-4 text-sm text-slate-300">
                                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Export everything as default for convenience
export default {
    // Utilities
    theme,
    cn,
    getVariantClasses,
    getSizeClasses,
    withLoading,
    withTooltip,

    // Compositions
    StatusBadge,
    DataTable
};
