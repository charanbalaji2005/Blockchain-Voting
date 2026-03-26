/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        void: '#050508',
        ink: '#0C0C14',
        surface: '#12121E',
        card: '#181828',
        border: '#252538',
        accent: {
          DEFAULT: '#6C63FF',
          glow: '#8B85FF',
          dim: '#3D38A8',
        },
        cyan: {
          glow: '#00E5FF',
          dim: '#00B8CC',
        },
        gold: {
          DEFAULT: '#FFD700',
          dim: '#C8A900',
        },
        success: '#00E676',
        danger: '#FF4757',
        warning: '#FFA502',
        muted: '#6B7280',
        ghost: '#3A3A50',
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(108,99,255,0.05) 1px, transparent 1px), 
                         linear-gradient(90deg, rgba(108,99,255,0.05) 1px, transparent 1px)`,
        'glow-accent': 'radial-gradient(ellipse at center, rgba(108,99,255,0.15) 0%, transparent 70%)',
        'glow-cyan': 'radial-gradient(ellipse at center, rgba(0,229,255,0.1) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'accent': '0 0 30px rgba(108,99,255,0.3)',
        'accent-lg': '0 0 60px rgba(108,99,255,0.4)',
        'cyan': '0 0 30px rgba(0,229,255,0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'glow-sm': '0 0 15px rgba(108,99,255,0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
        'fade-up': 'fadeUp 0.5s ease forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scan: {
          '0%': { backgroundPosition: '0 -100vh' },
          '100%': { backgroundPosition: '0 100vh' },
        },
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        }
      },
    },
  },
  plugins: [],
}