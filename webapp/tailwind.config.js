/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#007C84',
          50: '#E6F4F5',
          100: '#D9F2F4',
          200: '#B3E5E9',
          300: '#80D0D8',
          400: '#4DB5C2',
          500: '#1CA39E',
          600: '#007C84',
          700: '#006A71',
          800: '#00565C',
          900: '#004248',
        },
        coral: {
          DEFAULT: '#E55B3C',
          50: '#FDF0ED',
          100: '#FBE0DA',
          200: '#F6C2B6',
          300: '#F09A86',
          400: '#E9785F',
          500: '#E55B3C',
          600: '#C9482D',
          700: '#A83A23',
          800: '#872D1B',
          900: '#66211A',
        },
        gold: {
          DEFAULT: '#DDA027',
          50: '#FCF6E9',
          100: '#F9EED3',
          200: '#F3DDA7',
          300: '#EDC776',
          400: '#E8B34D',
          500: '#DDA027',
          600: '#C28A20',
          700: '#9E6E1A',
          800: '#7A5414',
          900: '#563B0E',
        },
        danger: {
          DEFAULT: '#C83E3B',
          50: '#FBEEED',
          100: '#F7DCDB',
          200: '#EDB6B4',
          300: '#E18C89',
          400: '#D56A66',
          500: '#C83E3B',
          600: '#AD3431',
          700: '#8C2A28',
          800: '#6B201F',
          900: '#4A1615',
        },
        ink: {
          DEFAULT: '#1A2426',
          soft: '#68737A',
        },
        mist: {
          DEFAULT: '#DCE3E6',
          light: '#F8FAFC',
        },
        mint: {
          DEFAULT: '#D9F2F4',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        'card-lg': '16px',
        btn: '10px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(7, 28, 30, 0.06), 0 1px 2px -1px rgba(7, 28, 30, 0.04)',
        'card-hover': '0 8px 24px -6px rgba(7, 28, 30, 0.12), 0 2px 6px -2px rgba(7, 28, 30, 0.06)',
        nav: '0 1px 0 0 rgba(7, 28, 30, 0.06)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-smooth',
        'slide-up': 'slide-up 0.25s ease-smooth',
        'slide-down': 'slide-down 0.25s ease-smooth',
        'scale-in': 'scale-in 0.2s ease-smooth',
      },
    },
  },
  plugins: [],
};
