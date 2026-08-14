tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace']
      },
      colors: {
        brand: {
          50: '#FFF8EB',
          100: '#FDEBC8',
          400: '#F2B84B',
          500: '#E8A33D',
          600: '#C98224'
        }
      },
      boxShadow: {
        soft: '0 18px 45px -24px rgba(15, 23, 42, .24)',
        glow: '0 16px 32px -18px rgba(232, 163, 61, .55)'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-18px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(18px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '.45' },
          '50%': { opacity: '.8' }
        }
      },
      animation: {
        'fade-in': 'fadeIn .35s ease-out both',
        'slide-in-left': 'slideInLeft .4s ease-out both',
        'slide-in-right': 'slideInRight .3s ease-out both',
        pop: 'pop .25s ease-out both',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite'
      }
    }
  }
};
