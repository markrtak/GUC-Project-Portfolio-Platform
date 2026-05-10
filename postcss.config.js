/**
 * postcss.config.js — PostCSS plugin pipeline
 *
 * PostCSS is a CSS transformer. Vite runs every CSS file through this pipeline
 * automatically during both development and build.
 *
 * tailwindcss  — generates all utility classes from our tailwind.config.js
 *   and injects them at the @tailwind directives in global.css.
 *
 * autoprefixer — reads the Browserslist config and adds vendor prefixes
 *   (e.g. -webkit-) where needed, ensuring cross-browser CSS compatibility.
 */

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
