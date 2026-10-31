/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#714B67',
          hover: '#5F3B56',
          light: '#F5EEF3',
          50: '#FAF6F9',
          100: '#F5EEF3',
          200: '#E6D3E1',
          300: '#D1ABC9',
          400: '#B47FA9',
          500: '#714B67',
          600: '#5F3B56',
          700: '#4D2F45',
          800: '#3D2437',
          900: '#2A1725',
        },
        secondary: {
          DEFAULT: '#A64D87',
          hover: '#8C3B70',
          light: '#FDF2F8',
          500: '#A64D87',
          600: '#8C3B70',
        },
        tertiary: {
          DEFAULT: '#25232A',
          hover: '#1B191F',
          500: '#25232A',
        },
        neutral: {
          bg: '#F7F6F8',
          card: '#FFFFFF',
          border: '#E8E6EB',
          text: '#1E1D22',
          muted: '#6E6B75',
          subtle: '#9A97A2',
        }
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(37, 35, 42, 0.04), 0 1px 2px -1px rgba(37, 35, 42, 0.04)',
        'elevated': '0 10px 25px -5px rgba(113, 75, 103, 0.08), 0 8px 10px -6px rgba(113, 75, 103, 0.04)',
        'pill': '0 4px 20px -2px rgba(37, 35, 42, 0.12)',
      }
    },
  },
  plugins: [],
};
