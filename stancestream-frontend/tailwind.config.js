/* global module */
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                'sans': ['Hanken Grotesk', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
                'mono': ['JetBrains Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
                'display': ['Big Shoulders Display', 'Hanken Grotesk', 'system-ui', 'sans-serif']
            },

            colors: {
                // Matrix Green - Primary brand color
                matrix: {
                    50: '#fff3ee',
                    100: '#ffe2d6',
                    200: '#ffc5ae',
                    300: '#ffa586',
                    400: '#ff7a55',
                    500: '#f2502a',
                    600: '#cf3a16',
                    700: '#a22d12',
                    800: '#75220f',
                    900: '#4a160c',
                },
                // Accent - Cyan for interactive highlights
                accent: {
                    400: '#f2c0b0',
                    500: '#dca391',
                    600: '#b98270',
                },
                // Neutral grays (replacing slate)
                neutral: {
                    50: '#fbf3ef',
                    100: '#f3e6e0',
                    200: '#e6d2ca',
                    300: '#d3b9af',
                    400: '#bba096',
                    500: '#a58a80',
                    600: '#927770',
                    700: '#5b413c',
                    800: '#382321',
                    900: '#230f0e',
                },
                // Surface levels for cards/panels
                surface: {
                    base: '#120707',
                    card: '#1b0d0c',
                    elevated: '#231110',
                    overlay: '#2e1816',
                },
                // Legacy support (keeping primary for gradual migration)
                primary: {
                    50: '#fff1f3',
                    100: '#ffe0e5',
                    200: '#ffc2cc',
                    300: '#fba5b3',
                    400: '#f27d90',
                    500: '#dc566c',
                    600: '#b83a50',
                    700: '#8f2b3f',
                    800: '#66202e',
                    900: '#451520',
                    950: '#2b0c14'
                },
            },

            backgroundImage: {
                'hero-gradient': 'linear-gradient(135deg, #ff6a45 0%, #b83a2a 100%)',
                'card-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                'button-gradient': 'linear-gradient(135deg, #ff6a45 0%, #b83a2a 100%)',
                'glass-gradient': 'linear-gradient(145deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 100%)'
            },

            boxShadow: {
                // Broadcast versus-arena glow system - two-hue (cool A / hot B)
                'glow': '0 0 24px rgba(244, 207, 198, 0.4)',        // arena-a (cool)
                'glow-hover': '0 0 34px rgba(244, 207, 198, 0.5)',
                'glow-strong': '0 0 32px rgba(255, 106, 69, 0.5)', // arena-b (hot)
                // Card shadows for dark surfaces
                'card': '0 4px 24px rgba(0, 0, 0, 0.5)',
                'card-hover': '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(244, 207, 198, 0.15)',
                'elevated': '0 8px 32px rgba(0, 0, 0, 0.8)',
                'modal': '0 16px 48px rgba(0, 0, 0, 0.9), 0 0 30px rgba(244, 207, 198, 0.12)',
                // Status glows
                'glow-success': '0 0 20px rgba(255, 122, 85, 0.4)',
                'glow-warning': '0 0 20px rgba(233, 187, 128, 0.4)',
                'glow-error': '0 0 20px rgba(234, 69, 96, 0.4)',
                'glow-info': '0 0 20px rgba(242, 192, 176, 0.4)',
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
