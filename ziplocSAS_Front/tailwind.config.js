/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fondo: '#F4F1EA',
        superficie: '#FFFFFF',
        textoPrincipal: '#1E1C1A',
        textoSecundario: '#5C5854',
        acento: '#C47A44',
        acentoHover: '#A65D2E',
        borde: '#E2DCD2',
        exito: '#2B6E3C',
        error: '#B13E3E',
      },
      fontFamily: {
        sans: ['Inter', 'DM Sans', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['14px', { lineHeight: '1.5' }],
        base: ['16px', { lineHeight: '1.5' }],
        lg: ['18px', { lineHeight: '1.5' }],
        xl: ['20px', { lineHeight: '1.2' }],
        '2xl': ['24px', { lineHeight: '1.2' }],
        '3xl': ['30px', { lineHeight: '1.2' }],
        '4xl': ['36px', { lineHeight: '1.2' }],
        '5xl': ['48px', { lineHeight: '1.2' }],
      },
      spacing: {
        0: '0px',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
        20: '80px',
      },
      boxShadow: {
        sutil: '0 1px 2px 0 rgb(0 0 0 / 0.03), 0 1px 3px 0 rgb(0 0 0 / 0.04)',
        media: '0 4px 6px -2px rgb(0 0 0 / 0.03), 0 2px 4px -2px rgb(0 0 0 / 0.02)',
        flotante: '0 12px 16px -8px rgb(0 0 0 / 0.04), 0 4px 6px -2px rgb(0 0 0 / 0.02)',
      },
      borderRadius: {
        sm: '2px',
        md: '4px',
        lg: '6px',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.2, 0, 0, 1)',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
      },
      keyframes: {
        toastEnter: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        toastExit: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        pageEnter: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        tooltipEnter: {
          '0%': { transform: 'translateY(4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      animation: {
        toastEnter: 'toastEnter 250ms cubic-bezier(0.2, 0, 0, 1) forwards',
        toastExit: 'toastExit 150ms cubic-bezier(0.2, 0, 0, 1) forwards',
        pageEnter: 'pageEnter 250ms cubic-bezier(0.2, 0, 0, 1) forwards',
        tooltipEnter: 'tooltipEnter 150ms 200ms cubic-bezier(0.2, 0, 0, 1) forwards',
      }
    },
  },
  plugins: [],
}
