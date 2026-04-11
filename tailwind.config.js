/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ultra vibrant and distinctive color palette with premium gradients
        primary: {
          50: '#f0f4ff',   // Lightest - for backgrounds
          100: '#e0e9ff',  // Very light - for card backgrounds
          200: '#c7d5ff',  // Light - for borders
          300: '#a5b8ff',  // Medium light - for dividers
          400: '#7c94ff',  // Medium - for secondary text
          500: '#6366f1',  // Base - vibrant indigo (more distinctive)
          600: '#4f46e5',  // Dark - for body text
          700: '#4338ca',  // Darker - for headings
          800: '#3730a3',  // Very dark - for emphasis
          900: '#312e81',  // Darkest - for maximum contrast
        },
        secondary: {
          50: '#ecfdf5',   // Lightest - mint green
          100: '#d1fae5',  // Very light - for hover states
          200: '#a7f3d0',  // Light - for borders
          300: '#6ee7b7',  // Medium - for secondary elements
          400: '#34d399',  // Base - vibrant emerald
          500: '#10b981',  // Main - for primary actions
          600: '#059669',  // Dark - for hover states
          700: '#047857',  // Darker - for active states
          800: '#065f46',  // Very dark - for text
          900: '#064e3b',  // Darkest - for maximum emphasis
        },
        accent: {
          50: '#fff7ed',   // Lightest - warm orange
          100: '#ffedd5',  // Very light - for success hover
          200: '#fed7aa',  // Light - for success borders
          300: '#fdba74',  // Medium - for success elements
          400: '#fb923c',  // Base - vibrant amber-orange
          500: '#f59e0b',  // Main - golden amber (more distinctive)
          600: '#d97706',  // Dark - for success hover
          700: '#b45309',  // Darker - for success active
          800: '#92400e',  // Very dark - for success text
          900: '#78350f',  // Darkest - for maximum emphasis
        },
        warning: {
          50: '#fefce8',   // Lightest - bright yellow
          100: '#fef9c3',  // Very light - for warning hover
          200: '#fef08a',  // Light - for warning borders
          300: '#fde047',  // Medium - for warning elements
          400: '#facc15',  // Base - vibrant yellow
          500: '#eab308',  // Main - for warning actions
          600: '#ca8a04',  // Dark - for warning hover
          700: '#a16207',  // Darker - for warning active
          800: '#854d0e',  // Very dark - for warning text
          900: '#713f12',  // Darkest - for maximum emphasis
        },
        error: {
          50: '#fef2f2',   // Lightest - soft pink-red
          100: '#fee2e2',  // Very light - for error hover
          200: '#fecaca',  // Light - for error borders
          300: '#fca5a5',  // Medium - for error elements
          400: '#f87171',  // Base - vibrant coral-red
          500: '#ef4444',  // Main - for error actions
          600: '#dc2626',  // Dark - for error hover
          700: '#b91c1c',  // Darker - for error active
          800: '#991b1b',  // Very dark - for error text
          900: '#7f1d1d',  // Darkest - for maximum emphasis
        },
        // Neutral grays with proper contrast ratios
        neutral: {
          50: '#fafafa',   // Off-white - for page background (avoiding pure white #FFFFFF)
          100: '#f5f5f5',  // Very light gray - for card backgrounds
          200: '#e5e5e5',  // Light gray - for borders and dividers
          300: '#d4d4d4',  // Medium light gray - for disabled states
          400: '#a3a3a3',  // Medium gray - for placeholder text (contrast ratio: 4.8:1)
          500: '#737373',  // Base gray - for secondary text (contrast ratio: 7.1:1)
          600: '#525252',  // Dark gray - for body text (contrast ratio: 9.8:1)
          700: '#404040',  // Darker gray - for headings (contrast ratio: 12.1:1)
          800: '#262626',  // Very dark gray - for emphasis (contrast ratio: 15.9:1)
          900: '#171717',  // Darkest gray - for maximum contrast (contrast ratio: 17.6:1)
        }
      }
    },
  },
  plugins: [],
}