/** @type {import('tailwindcss').Config} */
const { grayPalettes, colorPalettes } = require('./colors');
const { createScrollbarStyles } = require('../utils/scrollbarUtils');
const { getContrastRatio, hexToRgb } = require('../utils/colorUtils');

const fontSizeMultiplier = 1.15; // Optimized for readability

// Configuration settings
const config = {
  brandColor: 'indigo', // Changed to indigo for better visual appeal and readability
  grayColor: 'slate', // Changed to slate for better contrast with indigo
};

// Get active palette references
const brandPalette = colorPalettes[config.brandColor];
const grayPalette = grayPalettes[config.grayColor];

// Function to generate glass class styles
function createGlassStyles(background, border, boxShadow, scrollbarConfig) {
  return {
    background,
    border,
    'box-shadow': boxShadow,
    'border-radius': '0.65rem', // Increased for better visual appearance
    ...createScrollbarStyles(
      scrollbarConfig.trackBg,
      scrollbarConfig.thumbBg,
      scrollbarConfig.thumbBorder,
      scrollbarConfig.thumbHoverBg
    ),
  };
}

// Function to generate merged glass classes with the active brand color and matching scrollbars
function generateMergedGlassClasses() {
  const lightText = grayPalette[50]; // e.g., #f9fafb
  const darkText = grayPalette[800]; // Using 800 instead of 900 for less harsh contrast

  return {
    '.glass': {
      ...createGlassStyles(
        `rgba(${hexToRgb(grayPalette[50])}, 0.25)`, // Slightly increased opacity for better visibility
        `1px solid rgba(${hexToRgb(grayPalette[200])}, 0.3)`, // Changed to slightly darker border
        `0 4px 30px rgba(${hexToRgb(grayPalette[900])}, 0.15)`, // Increased shadow opacity
        {
          trackBg: `rgba(${hexToRgb(grayPalette[100])}, 0.2)`, // Darker track for better visibility
          thumbBg: `rgba(${hexToRgb(grayPalette[300])}, 0.3)`, // Darker thumb
          thumbBorder: `2px solid rgba(${hexToRgb(grayPalette[200])}, 0.2)`, // Darker border
          thumbHoverBg: `rgba(${hexToRgb(grayPalette[400])}, 0.4)`, // Darker hover state
        }
      ),
      color: darkText, // Dark text for light backgrounds
    },
    '.glass-dark': {
      ...createGlassStyles(
        `rgba(${hexToRgb(grayPalette[900])}, 0.7)`, // Increased opacity for better visibility
        `1px solid rgba(${hexToRgb(grayPalette[700])}, 0.2)`, // Darker border for better definition
        `0 6px 32px rgba(${hexToRgb(grayPalette[900])}, 0.25)`, // Increased shadow size and opacity
        {
          trackBg: `rgba(${hexToRgb(grayPalette[800])}, 0.4)`, // Darker track
          thumbBg: `rgba(${hexToRgb(grayPalette[600])}, 0.6)`, // Lighter thumb for better visibility
          thumbBorder: `2px solid rgba(${hexToRgb(grayPalette[700])}, 0.3)`, // Lighter border
          thumbHoverBg: `rgba(${hexToRgb(grayPalette[500])}, 0.7)`, // Even lighter on hover
        }
      ),
      color: lightText, // Light text for dark backgrounds
    },
    '.glass-brand': {
      ...createGlassStyles(
        `rgba(${hexToRgb(brandPalette[50])}, 0.6)`, // Using much lighter shade with higher opacity
        `1px solid rgba(${hexToRgb(brandPalette[200])}, 0.4)`, // Lighter border with higher opacity
        `0 6px 30px rgba(${hexToRgb(brandPalette[500])}, 0.15)`, // Using mid-tone for shadows
        {
          trackBg: `rgba(${hexToRgb(brandPalette[100])}, 0.3)`, // Lighter track
          thumbBg: `rgba(${hexToRgb(brandPalette[400])}, 0.5)`, // Using mid-tone for thumb
          thumbBorder: `2px solid rgba(${hexToRgb(brandPalette[300])}, 0.3)`, // Lighter border
          thumbHoverBg: `rgba(${hexToRgb(brandPalette[500])}, 0.6)`, // Darker on hover for better feedback
        }
      ),
      color: darkText, // Dark text for light backgrounds
    },
    '.glass-brand-dark': {
      ...createGlassStyles(
        `rgba(${hexToRgb(brandPalette[800])}, 0.8)`, // Darker base with higher opacity for better readability
        `1px solid rgba(${hexToRgb(brandPalette[600])}, 0.5)`, // Mid-tone border with higher opacity
        `0 8px 36px rgba(${hexToRgb(brandPalette[900])}, 0.3)`, // Increased shadow size and opacity
        {
          trackBg: `rgba(${hexToRgb(brandPalette[700])}, 0.4)`, // Darker track
          thumbBg: `rgba(${hexToRgb(brandPalette[400])}, 0.7)`, // Much lighter thumb for contrast
          thumbBorder: `2px solid rgba(${hexToRgb(brandPalette[500])}, 0.5)`, // Lighter border with increased opacity
          thumbHoverBg: `rgba(${hexToRgb(brandPalette[300])}, 0.8)`, // Even lighter on hover for clear feedback
        }
      ),
      color: lightText, // Light text for dark backgrounds
    },
  };
}

// Generate font size configuration with optimized readability
function generateFontSizes() {
  const sizes = {
    'xs': [0.75, 1.3], // Increased line height for better readability
    'sm': [0.875, 1.55], // Increased line height for better readability
    'base': [1, 1.65], // Optimal line height for main text
    'lg': [1.125, 1.6], // Slightly reduced line height for larger text
    'xl': [1.25, 1.55], // Adjusted for headings
    '2xl': [1.5, 1.4], // Adjusted for headings
    '3xl': [1.875, 1.3], // Adjusted for headings
    '4xl': [2.25, 1.2], // Headings need less line height
    '5xl': [3, 1.1], // Improved for very large text
    '6xl': [3.75, 1.05], // Improved for very large text
  };

  return Object.entries(sizes).reduce((acc, [key, [size, lineHeight]]) => {
    acc[key] = [
      `${size * fontSizeMultiplier}rem`,
      {
        lineHeight: `${
          typeof lineHeight === 'number'
            ? lineHeight * fontSizeMultiplier
            : lineHeight
        }rem`,
        letterSpacing:
          key === 'xs' || key === 'sm'
            ? '0.01em'
            : key === 'base'
            ? '0.005em'
            : '0em', // Improved letter spacing for small text
      },
    ];
    return acc;
  }, {});
}

// Generate safelist for colors
function generateSafelist() {
  const colorTypes = [
    { palettes: colorPalettes, prefix: '' },
    { palettes: grayPalettes, prefix: '' },
  ];

  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const modifiers = [
    'bg',
    'text',
    'hover:bg',
    'hover:text',
    'focus:bg',
    'focus:text',
    'border',
    'hover:border',
  ];

  const colorClasses = colorTypes.flatMap(({ palettes, prefix }) =>
    Object.keys(palettes).flatMap((color) =>
      shades.flatMap((shade) =>
        modifiers.map((modifier) => `${modifier}-${prefix}${color}-${shade}`)
      )
    )
  );

  const glassClasses = [
    'glass',
    'glass-dark',
    'glass-brand',
    'glass-brand-dark',
    'hover:glass',
    'hover:glass-dark',
    'hover:glass-brand',
    'hover:glass-brand-dark',
  ];

  const accessibilityClasses = [
    'text-accessible-light',
    'text-accessible-dark',
    'text-accessible-on-brand',
    'text-accessible-on-glass',
    'text-on-dark',
    'text-on-light',
  ];

  const cursorClasses = [
    'cursor-pointer',
    'cursor-default',
    'cursor-wait',
    'cursor-text',
    'cursor-move',
    'cursor-not-allowed',
  ];

  // Enhanced utility classes for UI/UX readability
  const extraClasses = [
    // Text colors
    'text-gray-400',
    'text-gray-500',
    'text-gray-600',
    'text-primary',
    'text-secondary',
    'text-muted',

    // Shadows for depth
    'shadow-sm',
    'shadow',
    'shadow-lg',
    'shadow-xl',
    'shadow-subtle',
    'shadow-elevation-1',
    'shadow-elevation-2',
    'shadow-elevation-3',

    // Border radius
    'rounded-xs',
    'rounded-sm',
    'rounded',
    'rounded-md',
    'rounded-lg',
    'rounded-xl',
    'rounded-2xl',

    // Opacity
    'opacity-75',
    'opacity-90',
    'opacity-95',

    // Transitions
    'transition-all-fast',
    'transition-colors',
    'transition-opacity',
    'transition-transform',
    'ease-smooth',

    // Text effects
    'text-shadow-sm',
    'text-shadow',
    'text-shadow-lg',
    'font-smooth',
    'text-balance',
    'text-readable',

    // Transforms
    'scale-95',
    'scale-98',
    'scale-100',
    'scale-102',
    'scale-105',
    'hover:scale-102',
    'hover:scale-105',
    'focus:scale-102',
    'focus:scale-105',

    // Line heights
    'leading-tighter',
    'leading-relaxed',

    // Font weights for readability
    'font-normal',
    'font-medium',
    'font-semibold',

    // Letter spacing
    'tracking-tight',
    'tracking-normal',
    'tracking-wide',
  ];

  return [
    ...colorClasses,
    ...glassClasses,
    ...accessibilityClasses,
    ...cursorClasses,
    ...extraClasses,
  ];
}

// Generate accessible color utilities with improved readability focus
function generateAccessibleTextUtilities() {
  // Determine contrast-optimized text colors for each background context
  const isDarkBrand =
    getContrastRatio(brandPalette[600], grayPalette[50]) >= 4.5;

  // Using 100 instead of 50 for light text - slightly darker for reduced eye strain
  const lightTextColor = grayPalette[100];

  // Using 800 instead of 900 for dark text - slightly lighter for less harsh contrast
  const darkTextColor = grayPalette[800];

  // Define background contexts and their accessible text colors
  const accessibleTextUtilities = {
    // For light backgrounds (use dark text)
    '.text-accessible-light': {
      color: darkTextColor,
      'font-weight': '450', // Slightly heavier than normal for better readability on light backgrounds
    },

    // For dark backgrounds (use light text)
    '.text-accessible-dark': {
      color: lightTextColor,
      'font-weight': '400', // Normal weight for readability on dark backgrounds
      'letter-spacing': '0.01em', // Slightly increased letter spacing for better readability on dark
    },

    // For brand color backgrounds (dynamically choose based on brand color's brightness)
    '.text-accessible-on-brand': {
      color: isDarkBrand ? lightTextColor : darkTextColor,
      'font-weight': isDarkBrand ? '400' : '450', // Adaptive font weight
      'letter-spacing': isDarkBrand ? '0.01em' : 'normal', // Adaptive letter spacing
    },

    // For glass elements (general, assumes darkish background)
    '.text-accessible-on-glass': {
      'color': lightTextColor,
      'text-shadow': `0 1px 3px rgba(${hexToRgb(grayPalette[900])}, 0.6)`, // Stronger text shadow for better readability
      'letter-spacing': '0.01em', // Slightly increased letter spacing
    },

    // For dark backgrounds (e.g., .glass-dark, .glass-brand-dark)
    '.text-on-dark': {
      color: grayPalette[200], // Light text for dark backgrounds
      'font-weight': '400', // Normal weight
      'letter-spacing': '0.01em', // Slightly increased letter spacing
    },

    // For light backgrounds (e.g., .glass, .glass-brand)
    '.text-on-light': {
      color: grayPalette[700], // Dark text for light backgrounds
      'font-weight': '450', // Slightly heavier than normal
    },

    // New: For primary UI elements
    '.text-primary': {
      color: brandPalette[600],
      'font-weight': '500', // Medium weight for emphasis
    },

    // New: For secondary/supporting text
    '.text-secondary': {
      color: grayPalette[500],
      'font-weight': '400', // Normal weight
    },
  };

  return accessibleTextUtilities;
}

module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx,astro,html}',
    './pages/**/*.{js,jsx,ts,tsx,astro,html}',
    './components/**/*.{js,jsx,ts,tsx,astro,html}',
  ],
  theme: {
    extend: {
      fontSize: generateFontSizes(),
      colors: {
        // Set the active brand color
        brand: brandPalette,
        // Set the active gray color
        gray: grayPalette,
      },
      boxShadow: {
        'glass': `0 4px 30px rgba(${hexToRgb(grayPalette[900])}, 0.1)`,
        'glass-lg': `0 8px 32px rgba(${hexToRgb(grayPalette[900])}, 0.15)`,
        'subtle': `0 1px 3px rgba(${hexToRgb(grayPalette[900])}, 0.08)`,
        'elevation-1': `0 1px 2px rgba(${hexToRgb(
          grayPalette[900]
        )}, 0.05), 0 1px 4px rgba(${hexToRgb(grayPalette[900])}, 0.1)`,
        'elevation-2': `0 2px 4px rgba(${hexToRgb(
          grayPalette[900]
        )}, 0.05), 0 3px 6px rgba(${hexToRgb(grayPalette[900])}, 0.1)`,
        'elevation-3': `0 4px 8px rgba(${hexToRgb(
          grayPalette[900]
        )}, 0.05), 0 8px 16px rgba(${hexToRgb(grayPalette[900])}, 0.1)`,
      },
      // Add accessible text color combinations
      textColor: {
        'accessible': {
          'on-light': grayPalette[800], // Using 800 instead of 900 for less harsh contrast
          'on-dark': grayPalette[100], // Using 100 instead of 50 for reduced eye strain
          'on-brand':
            getContrastRatio(brandPalette[600], grayPalette[50]) >= 4.5
              ? grayPalette[100]
              : grayPalette[800],
        },
        'primary': brandPalette[600],
        'secondary': grayPalette[500],
        'muted': grayPalette[400],
      },
      borderRadius: {
        'xs': '0.125rem',
        'sm': '0.25rem',
        'DEFAULT': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '18': '4.5rem',
      },
      lineHeight: {
        'tighter': '1.15',
        'relaxed': '1.75',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),

    // Merged plugin for glass morphism effects with scrollbars
    function ({ addUtilities }) {
      addUtilities(generateMergedGlassClasses(), ['responsive', 'hover']);
    },

    // New plugin for accessible text utilities
    function ({ addUtilities }) {
      addUtilities(generateAccessibleTextUtilities());
    },

    // Enhanced typography and readability utilities
    function ({ addUtilities }) {
      addUtilities({
        '.min-text-size': {
          'font-size': 'max(1rem, 1.6vw)', // Optimized for readability across screen sizes
        },
        '.text-shadow-sm': {
          'text-shadow': `0 1px 2px rgba(${hexToRgb(grayPalette[900])}, 0.15)`, // Using theme colors for consistency
        },
        '.text-shadow': {
          'text-shadow': `0 2px 4px rgba(${hexToRgb(grayPalette[900])}, 0.15)`, // Using theme colors for consistency
        },
        '.text-shadow-lg': {
          'text-shadow': `0 4px 6px rgba(${hexToRgb(grayPalette[900])}, 0.2)`, // Using theme colors for consistency
        },
        '.transition-all-fast': {
          'transition': 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)', // Slightly smoother easing
        },
        '.font-smooth': {
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
        },
        '.text-balance': {
          'text-wrap': 'balance', // Modern text balancing for better typography
        },
        '.text-readable': {
          'max-width': '70ch', // Optimal line length for readability
          'word-spacing': '0.05em', // Slightly increased word spacing
        },
      });
    },
  ],
  // Generate safelist for all color palettes
  safelist: generateSafelist(),
};
