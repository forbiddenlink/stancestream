/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
                'mono': ['JetBrains Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
                'display': ['Poppins', 'Inter', 'system-ui', 'sans-serif']
            },

            colors: {
                // Matrix Green - Primary brand color
                matrix: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                },
                // Accent - Cyan for interactive highlights
                accent: {
                    400: '#22d3ee',
                    500: '#06b6d4',
                    600: '#0891b2',
                },
                // Neutral grays (replacing slate)
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
                },
                // Surface levels for cards/panels
                surface: {
                    base: '#000000',
                    card: '#0a0a0a',
                    elevated: '#111111',
                    overlay: '#1a1a1a',
                },
                // Legacy support (keeping primary for gradual migration)
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                    950: '#172554'
                },
            },

            backgroundImage: {
                'hero-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'card-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                'button-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'glass-gradient': 'linear-gradient(145deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 100%)'
            },

            boxShadow: {
                // Matrix glow system - green based
                'glow': '0 0 20px rgba(34, 197, 94, 0.3)',
                'glow-hover': '0 0 30px rgba(34, 197, 94, 0.4)',
                'glow-strong': '0 0 40px rgba(34, 197, 94, 0.5)',
                // Card shadows for dark surfaces
                'card': '0 4px 24px rgba(0, 0, 0, 0.5)',
                'card-hover': '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(34, 197, 94, 0.2)',
                'elevated': '0 8px 32px rgba(0, 0, 0, 0.8)',
                'modal': '0 16px 48px rgba(0, 0, 0, 0.9), 0 0 30px rgba(34, 197, 94, 0.15)',
                // Status glows
                'glow-success': '0 0 20px rgba(34, 197, 94, 0.4)',
                'glow-warning': '0 0 20px rgba(234, 179, 8, 0.4)',
                'glow-error': '0 0 20px rgba(239, 68, 68, 0.4)',
                'glow-info': '0 0 20px rgba(6, 182, 212, 0.4)',
            },

            // Border radius - unified to 12px
            borderRadius: {
                'card': '12px',
                'button': '8px',
                'input': '8px',
                'badge': '6px',
                'modal': '16px',
            },

            animation: {
                'pulse-slow': 'pulse 3s infinite',
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'shimmer': 'shimmer 2s linear infinite',
                'bounce-subtle': 'bounceSubtle 0.6s ease-in-out'
            },

            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' }
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' }
                },
                bounceSubtle: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-2px)' }
                }
            },

            backdropBlur: {
                'xs': '2px',
            },

            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '128': '32rem'
            }
        },
    },
    plugins: [],
}
