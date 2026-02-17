// Enhanced Card Components - Professional Container Elements
import React from 'react';
import Icon from '../Icon';

// Base Card Component
export const Card = ({
    children,
    variant = 'default',
    hover = true,
    className = '',
    ...props
}) => {
    const variants = {
        default: 'glass-panel',
        elevated: 'card-elevated',
        flat: 'bg-surface-card border border-green-500/20 rounded-xl',
        gradient: 'bg-surface-elevated border border-green-500/30 rounded-xl shadow-elevated'
    };

    const hoverClass = hover ? 'hover:shadow-card-hover transition-all duration-150' : '';

    return (
        <div
            className={`${variants[variant]} ${hoverClass} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

// Card Header
export const CardHeader = ({
    title,
    subtitle,
    icon,
    action,
    className = '',
    ...props
}) => {
    return (
        <div
            className={`flex items-center justify-between p-6 border-b border-green-500/20 ${className}`}
            {...props}
        >
            <div className="flex items-center space-x-3">
                {icon && (
                    <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center shadow-glow">
                        <Icon name={icon} size={20} className="text-green-400" />
                    </div>
                )}
                <div>
                    <h3 className="text-xl font-semibold text-green-300 font-mono">{title}</h3>
                    {subtitle && (
                        <p className="text-neutral-400 text-sm font-mono">{subtitle}</p>
                    )}
                </div>
            </div>
            {action && (
                <div>{action}</div>
            )}
        </div>
    );
};

// Card Content
export const CardContent = ({ children, className = '', ...props }) => {
    return (
        <div className={`p-6 ${className}`} {...props}>
            {children}
        </div>
    );
};

// Card Footer
export const CardFooter = ({ children, className = '', ...props }) => {
    return (
        <div
            className={`p-6 pt-4 border-t border-green-500/20 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

// Metric Card
export const MetricCard = ({
    title,
    value,
    change,
    changeType = 'neutral',
    icon,
    className = '',
    ...props
}) => {
    const changeColors = {
        positive: 'text-green-400',
        negative: 'text-red-400',
        neutral: 'text-neutral-400'
    };

    return (
        <Card variant="elevated" className={`p-6 ${className}`} {...props}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-neutral-400 text-sm font-mono">{title}</p>
                    <p className="text-2xl font-semibold text-green-300 mt-1 font-mono">{value}</p>
                    {change && (
                        <p className={`text-sm mt-2 font-mono ${changeColors[changeType]}`}>
                            {change}
                        </p>
                    )}
                </div>
                {icon && (
                    <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center justify-center">
                        <Icon name={icon} size={24} className="text-green-400" />
                    </div>
                )}
            </div>
        </Card>
    );
};

// Status Card
export const StatusCard = ({
    status = 'success',
    title,
    message,
    icon,
    action,
    className = '',
    ...props
}) => {
    const statusStyles = {
        success: {
            bg: 'bg-green-500/10 border-green-500/30',
            icon: 'text-green-400',
            title: 'text-green-400'
        },
        warning: {
            bg: 'bg-yellow-500/10 border-yellow-500/30',
            icon: 'text-yellow-400',
            title: 'text-yellow-400'
        },
        error: {
            bg: 'bg-red-500/10 border-red-500/30',
            icon: 'text-red-400',
            title: 'text-red-400'
        },
        info: {
            bg: 'bg-accent-500/10 border-accent-500/30',
            icon: 'text-accent-400',
            title: 'text-accent-400'
        }
    };

    const style = statusStyles[status];

    return (
        <Card
            variant="flat"
            className={`p-6 ${style.bg} border ${className}`}
            {...props}
        >
            <div className="flex items-start space-x-4">
                {icon && (
                    <Icon name={icon} size={24} className={style.icon} />
                )}
                <div className="flex-1">
                    <h4 className={`font-semibold font-mono mb-2 ${style.title}`}>{title}</h4>
                    <p className="text-neutral-200 leading-relaxed font-mono">{message}</p>
                    {action && (
                        <div className="mt-4">{action}</div>
                    )}
                </div>
            </div>
        </Card>
    );
};

// Loading Card
export const LoadingCard = ({ title = 'Loading...', className = '' }) => {
    return (
        <Card className={`p-8 ${className}`}>
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-neutral-400 font-mono">{title}</p>
            </div>
        </Card>
    );
};

// Feature Card
export const FeatureCard = ({
    icon,
    title,
    description,
    badge,
    onClick,
    className = '',
    ...props
}) => {
    return (
        <Card
            variant="elevated"
            className={`p-6 cursor-pointer group ${className}`}
            onClick={onClick}
            {...props}
        >
            <div className="text-center">
                <div className="relative inline-block mb-4">
                    <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform duration-150">
                        <Icon name={icon} size={32} className="text-green-400" />
                    </div>
                    {badge && (
                        <div className="absolute -top-2 -right-2 px-2 py-1 bg-green-500 text-black text-xs font-semibold font-mono rounded-badge">
                            {badge}
                        </div>
                    )}
                </div>
                <h3 className="text-lg font-semibold text-green-300 mb-2 font-mono">{title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed font-mono">{description}</p>
            </div>
        </Card>
    );
};

export default {
    Card,
    CardHeader,
    CardContent,
    CardFooter,
    MetricCard,
    StatusCard,
    LoadingCard,
    FeatureCard
};
