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
                'mono': ['Hanken Grotesk', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
                'display': ['Source Serif 4', 'Iowan Old Style', 'Georgia', 'serif'],
                'serif': ['Source Serif 4', 'Iowan Old Style', 'Georgia', 'serif']
            },

            colors: {
                // Rust: primary brand colour (side B)
                matrix: {
                    50: '#3a0f06', 100: '#5c1709', 200: '#7a1f0c', 300: '#8f2410', 400: '#a22d12',
                    500: '#b32f12', 600: '#c9603f', 700: '#dd9a82', 800: '#ecc4b4', 900: '#f4ddd3',
                },
                // Accent: deep teal (side A)
                accent: {
                    400: '#1d4656',
                    500: '#24505f',
                    600: '#5d8190',
                },
                // Neutrals: grey-green, ink (50) to paper (900)
                neutral: {
                    50: '#131a16', 100: '#17201b', 200: '#243029', 300: '#33423a', 400: '#3f4f46',
                    500: '#4a5a51', 600: '#66776e', 700: '#a9b6ae', 800: '#c9d3cd', 900: '#eef2ef',
                },
                // Surface levels for cards/panels: paper, raised paper, deeper paper
                surface: {
                    base: '#e3e9e5',
                    card: '#eef2ef',
                    elevated: '#f4f7f5',
                    overlay: '#d3dcd6',
                },
                // Legacy support (kept for gradual migration): rose ramp, ink to paper
                primary: {
                    50: '#2b0c14', 100: '#451520', 200: '#66202e', 300: '#7a2535', 400: '#8f2b3f',
                    500: '#a8344a', 600: '#c7788a', 700: '#dba5b1', 800: '#ecd0d6', 900: '#f4e2e6',
                    950: '#faf0f2'
                },
            },

            backgroundImage: {
                'hero-gradient': 'linear-gradient(135deg, #b32f12 0%, #8f2410 100%)',
                'card-gradient': 'linear-gradient(145deg, rgba(23,32,27,0.04) 0%, rgba(23,32,27,0.02) 100%)',
                'button-gradient': 'linear-gradient(135deg, #b32f12 0%, #8f2410 100%)',
                'glass-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)'
            },

            boxShadow: {
                // Flat paper: rules do the work, shadows stay faint. Names kept so
                // existing utilities (shadow-card, shadow-glow...) keep resolving.
                'glow': '0 0 0 1px rgba(36, 80, 95, 0.35)',
                'glow-hover': '0 0 0 1px rgba(36, 80, 95, 0.5)',
                'glow-strong': '0 0 0 1px rgba(179, 47, 18, 0.5)',
                'card': '0 1px 0 rgba(23, 32, 27, 0.08)',
                'card-hover': '0 1px 0 rgba(23, 32, 27, 0.2)',
                'elevated': '0 1px 0 rgba(23, 32, 27, 0.12)',
                'modal': '0 12px 32px rgba(23, 32, 27, 0.25)',
                'glow-success': '0 0 0 1px rgba(162, 45, 18, 0.4)',
                'glow-warning': '0 0 0 1px rgba(138, 91, 20, 0.4)',
                'glow-error': '0 0 0 1px rgba(143, 31, 51, 0.4)',
                'glow-info': '0 0 0 1px rgba(36, 80, 95, 0.4)',
            },

            // Border radius: square-cornered, like the record's rules
            borderRadius: {
                'card': '2px',
                'button': '2px',
                'input': '2px',
                'badge': '2px',
                'modal': '2px',
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
