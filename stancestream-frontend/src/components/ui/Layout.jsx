// Enhanced Container System - Professional Layout Management
import React from 'react';
import { cn } from '../ui';

// Main Container Component
export const Container = ({
    children,
    className = '',
    maxWidth = 'max-w-7xl',
    padding = 'px-4 sm:px-6 lg:px-8',
    animate = true,
    ...props
}) => {
    return (
        <div
            className={cn(
                'mx-auto w-full',
                maxWidth,
                padding,
                animate && 'animate-fade-in-up',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

// Section Container
export const Section = ({
    children,
    className = '',
    background = 'transparent',
    spacing = 'py-12',
    animate = true,
    ...props
}) => {
    const backgroundClasses = {
        transparent: '',
        glass: 'bg-surface-card/80 backdrop-blur-lg border border-green-500/20',
        gradient: 'bg-gradient-to-br from-green-900/20 to-black/50',
        dark: 'bg-surface-card/50',
    };

    return (
        <section
            className={cn(
                'relative',
                spacing,
                backgroundClasses[background],
                animate && 'animate-fade-in-up',
                className
            )}
            {...props}
        >
            {children}
        </section>
    );
};

// Grid Container
export const Grid = ({
    children,
    columns = 1,
    gap = 'gap-6',
    className = '',
    responsive = true,
    ...props
}) => {
    const getGridCols = () => {
        if (!responsive) return `grid-cols-${columns}`;

        switch (columns) {
            case 1: return 'grid-cols-1';
            case 2: return 'grid-cols-1 md:grid-cols-2';
            case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
            case 4: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
            case 6: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';
            default: return `grid-cols-1 lg:grid-cols-${columns}`;
        }
    };

    return (
        <div
            className={cn(
                'grid',
                getGridCols(),
                gap,
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

// Flex Container
export const Flex = ({
    children,
    direction = 'row',
    align = 'start',
    justify = 'start',
    wrap = false,
    gap = 'gap-4',
    className = '',
    ...props
}) => {
    const directionClass = direction === 'col' ? 'flex-col' : 'flex-row';
    const alignClass = `items-${align}`;
    const justifyClass = `justify-${justify}`;
    const wrapClass = wrap ? 'flex-wrap' : '';

    return (
        <div
            className={cn(
                'flex',
                directionClass,
                alignClass,
                justifyClass,
                wrapClass,
                gap,
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

// Stack Container (Vertical spacing)
export const Stack = ({
    children,
    spacing = 'space-y-4',
    className = '',
    ...props
}) => {
    return (
        <div
            className={cn(
                spacing,
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

// Hero Container
export const Hero = ({
    children,
    className = '',
    background = 'gradient',
    height = 'min-h-screen',
    overlay = true,
    ...props
}) => {
    const backgroundClasses = {
        gradient: 'bg-gradient-to-br from-green-900/60 via-black to-green-950/40',
        image: 'bg-cover bg-center bg-no-repeat',
        dark: 'bg-surface-base',
        transparent: '',
    };

    return (
        <div
            className={cn(
                'relative flex items-center justify-center',
                height,
                backgroundClasses[background],
                className
            )}
            {...props}
        >
            {overlay && background !== 'transparent' && (
                <div className="absolute inset-0 bg-black/20" />
            )}
            <div className="relative z-10 w-full">
                {children}
            </div>
        </div>
    );
};

// Card Grid Container
export const CardGrid = ({
    children,
    columns = 3,
    className = '',
    animated = true,
    ...props
}) => {
    return (
        <Grid
            columns={columns}
            gap="gap-6"
            className={cn(
                animated && 'space-y-0',
                className
            )}
            {...props}
        >
            {React.Children.map(children, (child, index) => (
                <div
                    className={animated ? `animate-fade-in-up stagger-${Math.min(index + 1, 5)}` : ''}
                    key={index}
                >
                    {child}
                </div>
            ))}
        </Grid>
    );
};

// Sidebar Layout
export const SidebarLayout = ({
    sidebar,
    children,
    sidebarWidth = 'w-64',
    className = '',
    ...props
}) => {
    return (
        <div
            className={cn(
                'flex min-h-screen',
                className
            )}
            {...props}
        >
            <aside className={cn('flex-shrink-0', sidebarWidth)}>
                {sidebar}
            </aside>
            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    );
};

// Dashboard Layout
export const DashboardLayout = ({
    header,
    sidebar,
    children,
    className = '',
    ...props
}) => {
    return (
        <div
            className={cn(
                'min-h-screen bg-black',
                className
            )}
            {...props}
        >
            {header && (
                <header className="bg-surface-card/80 border border-green-500/20 backdrop-blur-sm">
                    {header}
                </header>
            )}
            <div className="flex">
                {sidebar && (
                    <aside className="w-64 min-h-screen bg-surface-card/80 border-r border-green-500/20 backdrop-blur-sm">
                        {sidebar}
                    </aside>
                )}
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default {
    Container,
    Section,
    Grid,
    Flex,
    Stack,
    Hero,
    CardGrid,
    SidebarLayout,
    DashboardLayout,
};
