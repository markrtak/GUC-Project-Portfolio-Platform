/**
 * tailwind.config.js — Tailwind CSS theme configuration
 *
 * THEME: "Modern German Engineering" palette inspired by the German national
 * flag — high-contrast charcoal surfaces, bold engineering yellow for primary
 * actions, signal red for status, and crisp off-white typography.
 *
 *   • CORE BASE          #121212  → surface.900           (page background)
 *   • SURFACE / CARDS    #2A2A2A  → surface.700           (elevated panels)
 *   • PRIMARY ACTION     #FFCC00  → brand.500             (CTAs, public toggles, highlights)
 *   • SECONDARY / STATUS #DA291C  → accent.500            (notifications, errors, key status)
 *   • TYPOGRAPHY         #F5F5F5  → text-primary base     (high-readability copy)
 *
 * darkMode: 'class'  — Tailwind applies dark-mode variants when an ancestor
 *   element carries the class "dark". We add that class to <html> in
 *   index.html, making the whole app permanently dark-themed.
 *
 * content  — Tells Tailwind which files to scan for class names so that
 *   unused utilities are tree-shaken in the production build.
 *
 * theme.extend.colors  — Custom palette injected on top of Tailwind defaults:
 *   • surface.*  — layered charcoal background tones (page → card → input)
 *   • brand.*    — engineering yellow used for CTAs, highlights, and accents
 *   • accent.*   — signal red used for badges, statuses, and secondary highlights
 */

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Charcoal surface ladder
         *    900 = CORE BASE (#121212), 700 = CARDS (#2A2A2A) */
        surface: {
          950: '#0a0a0a',
          900: '#121212',
          800: '#1c1c1c',
          700: '#2a2a2a',
          600: '#3a3a3a',
          500: '#4a4a4a',
        },
        /* ── PRIMARY ACTION — Engineering yellow (#FFCC00)
         *    500 is the canonical brand colour; 50–900 are tinted variants
         *    used for hovers, glows, soft backgrounds, and disabled states. */
        brand: {
          50:  '#fffbe6',
          100: '#fff5b8',
          200: '#ffec80',
          300: '#ffe04d',
          400: '#ffd633',
          500: '#ffcc00',
          600: '#e6b800',
          700: '#b38f00',
          800: '#806600',
          900: '#4d3d00',
        },
        /* ── SECONDARY / STATUS — Signal red (#DA291C)
         *    Used for badges, secondary highlights, and key status colour. */
        accent: {
          300: '#f1857c',
          400: '#e75649',
          500: '#da291c',
          600: '#b72216',
          700: '#8e1a11',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 4px 24px 0 rgba(0,0,0,0.55)',
        glow: '0 0 0 3px rgba(255,204,0,0.35)',
      },
      animation: {
        'fade-in':    'fadeIn 0.25s ease-out',
        'slide-down': 'slideDown 0.25s ease-out',
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideDown: { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
