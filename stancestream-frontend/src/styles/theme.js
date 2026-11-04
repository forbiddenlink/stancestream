// Theme Constants - Consistent design system
export const colors = {
    primary: {
        50: '#fff1f3',
        100: '#ffe0e5',
        500: '#dc566c',
        600: '#b83a50',
        700: '#8f2b3f',
        900: '#451520',
    },
    success: {
        400: '#ff7a55',
        500: '#ff7a55',
        600: '#cf3a16',
    },
    warning: {
        400: '#e9bb80',
        500: '#eab308',
        600: '#ca8a04',
    },
    error: {
        400: '#ff7384',
        500: '#ea4560',
        600: '#c62f49',
    },
    slate: {
        600: '#927770',
        700: '#5b413c',
        800: '#382321',
        900: '#230f0e',
    }
};

export const gradients = {
    primary: 'from-blue-600 to-blue-700',
    secondary: 'from-purple-600 to-pink-600',
    success: 'from-green-600 to-emerald-600',
    warning: 'from-green-600 to-emerald-600',
    error: 'from-red-600 to-red-700',
    surface: 'from-slate-900/50 to-gray-900/50',
    surfaceLight: 'from-slate-800/40 via-slate-800/30 to-slate-800/40',
};

export const spacing = {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
};

export const borderRadius = {
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
};

export const shadows = {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

export const animations = {
    fadeIn: 'animate-fade-in',
    slideIn: 'animate-slide-in',
    pulse: 'animate-pulse',
    spin: 'animate-spin',
    bounce: 'animate-bounce',
};

export const viewModes = {
    standard: {
        key: 'standard',
        label: 'Standard',
        icon: 'target',
        gradient: gradients.primary,
        description: 'Single debate with detailed analysis'
    },
    multiDebate: {
        key: 'multi-debate',
        label: 'Multi-Debate',
        icon: 'multi-debate',
        gradient: gradients.secondary,
        description: 'Multiple concurrent debates'
    },
    analytics: {
        key: 'analytics',
        label: 'Analytics',
        icon: 'analytics',
        gradient: gradients.success,
        description: 'Performance metrics and insights'
    },
    business: {
        key: 'business',
        label: 'Business Intelligence',
        icon: 'trending-up',
        gradient: 'from-blue-600 to-cyan-600',
        description: 'ROI and business value metrics'
    },
    showcase: {
        key: 'showcase',
        label: 'System Showcase',
        icon: 'award',
        gradient: 'from-green-600 to-emerald-600',
        description: 'Premium demonstration interface'
    }
};

export const statusColors = {
    online: colors.success[400],
    offline: colors.error[400],
    warning: colors.warning[400],
    loading: colors.primary[500],
};

export default {
    colors,
    gradients,
    spacing,
    borderRadius,
    shadows,
    animations,
    viewModes,
    statusColors
};
