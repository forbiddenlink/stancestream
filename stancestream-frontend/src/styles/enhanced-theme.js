// Enhanced Design System - Professional Enterprise-Grade Styling
export const enhancedColors = {
    // Primary palette with more sophistication
    primary: {
        50: '#fff1f3',
        100: '#ffe0e5',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#dc566c',
        600: '#b83a50',
        700: '#8f2b3f',
        800: '#1e40af',
        900: '#451520',
        950: '#172554'
    },

    // Professional secondary palette
    secondary: {
        50: '#fdf4ff',
        100: '#fae8ff',
        200: '#f5d0fe',
        300: '#f0abfc',
        400: '#e879f9',
        500: '#d946ef',
        600: '#c026d3',
        700: '#a21caf',
        800: '#86198f',
        900: '#701a75'
    },

    // Enterprise-grade neutrals
    neutral: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#e5e5e5',
        300: '#d4d4d4',
        400: '#a3a3a3',
        500: '#737373',
        600: '#525252',
        700: '#404040',
        800: '#262626',
        900: '#171717',
        950: '#0a0a0a'
    },

    // Professional surface colors
    surface: {
        'card-light': 'rgba(248, 250, 252, 0.95)',
        'card-dark': 'rgba(21, 8, 8, 0.95)',
        'panel-light': 'rgba(241, 245, 249, 0.90)',
        'panel-dark': 'rgba(35, 17, 16, 0.90)',
        'overlay': 'rgba(0, 0, 0, 0.50)',
        'glass-light': 'rgba(255, 255, 255, 0.10)',
        'glass-dark': 'rgba(0, 0, 0, 0.20)'
    },

    // Status indicators
    status: {
        success: {
            50: '#f0fdf4',
            500: '#ff7a55',
            600: '#cf3a16',
            900: '#14532d'
        },
        warning: {
            50: '#fffbeb',
            500: '#e9bb80',
            600: '#d97706',
            900: '#78350f'
        },
        error: {
            50: '#fef2f2',
            500: '#ea4560',
            600: '#c62f49',
            900: '#7f1d1d'
        },
        info: {
            50: '#fff1f3',
            500: '#dc566c',
            600: '#b83a50',
            900: '#451520'
        }
    }
};

export const enhancedGradients = {
    // Hero gradients for major sections
    hero: {
        primary: 'linear-gradient(135deg, #ff6a45 0%, #b83a2a 100%)',
        secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        dark: 'linear-gradient(135deg, #120707 0%, #1a1a1a 50%, #120707 100%)'
    },

    // Card backgrounds
    cards: {
        glass: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        darkGlass: 'linear-gradient(145deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 100%)',
        subtle: 'linear-gradient(145deg, rgba(248,250,252,0.95) 0%, rgba(241,245,249,0.95) 100%)',
        darkSubtle: 'linear-gradient(145deg, rgba(21,8,8,0.95) 0%, rgba(35,17,16,0.95) 100%)'
    },

    // Interactive elements
    interactive: {
        button: 'linear-gradient(135deg, #ff6a45 0%, #b83a2a 100%)',
        buttonHover: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
        accent: 'linear-gradient(90deg, #ff6a45 0%, #e9bb80 100%)'
    }
};

export const typography = {
    fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif']
    },

    fontSize: {
        xs: '0.75rem',     // 12px
        sm: '0.875rem',    // 14px
        base: '1rem',      // 16px
        lg: '1.125rem',    // 18px
        xl: '1.25rem',     // 20px
        '2xl': '1.5rem',   // 24px
        '3xl': '1.875rem', // 30px
        '4xl': '2.25rem',  // 36px
        '5xl': '3rem',     // 48px
    },

    fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800'
    }
};

export const spacing = {
    component: {
        xs: '0.5rem',    // 8px
        sm: '0.75rem',   // 12px
        md: '1rem',      // 16px
        lg: '1.5rem',    // 24px
        xl: '2rem',      // 32px
        '2xl': '3rem',   // 48px
        '3xl': '4rem'    // 64px
    },

    layout: {
        sidebar: '20rem',     // 320px
        header: '4rem',       // 64px
        container: '80rem',   // 1280px
        content: '60rem'      // 960px
    }
};

export const borderRadius = {
    xs: '0.125rem',   // 2px
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px'
};

export const shadows = {
    // Subtle elevation
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',

    // Standard elevation
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',

    // High elevation
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

    // Special effects
    glow: '0 0 20px rgba(220, 86, 108, 0.3)',
    glowHover: '0 0 30px rgba(220, 86, 108, 0.4)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
};

export const animations = {
    transition: {
        fast: 'all 0.15s ease-in-out',
        normal: 'all 0.25s ease-in-out',
        slow: 'all 0.4s ease-in-out'
    },

    keyframes: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        slideUp: 'slideUp 0.4s ease-out',
        slideDown: 'slideDown 0.4s ease-out',
        scaleIn: 'scaleIn 0.2s ease-out',
        shimmer: 'shimmer 2s linear infinite'
    }
};

export const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
};

// Component-specific styles
export const components = {
    button: {
        base: 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',

        variants: {
            primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl',
            secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30',
            ghost: 'hover:bg-white/10 text-white',
            danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
        },

        sizes: {
            sm: 'px-3 py-1.5 text-sm rounded-md',
            md: 'px-4 py-2 text-sm rounded-lg',
            lg: 'px-6 py-3 text-base rounded-lg',
            xl: 'px-8 py-4 text-lg rounded-xl'
        }
    },

    card: {
        base: 'backdrop-blur-sm border border-white/10 shadow-xl transition-all duration-300',

        variants: {
            glass: 'bg-gradient-to-br from-white/10 to-white/5',
            solid: 'bg-slate-800/95',
            elevated: 'bg-gradient-to-br from-slate-800/95 to-slate-900/95 shadow-2xl'
        }
    },

    input: {
        base: 'w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
    }
};

export default {
    colors: enhancedColors,
    gradients: enhancedGradients,
    typography,
    spacing,
    borderRadius,
    shadows,
    animations,
    breakpoints,
    components
};
