/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/renderer/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Sea Theme
        'ink-black': '#0d1b2a',
        'prussian-blue': '#1b263b',
        'dusk-blue': '#415a77',
        'lavender-grey': '#778da9',
        'alabaster-grey': '#e0e1dd',
        // VSCode-like dark theme colors
        'editor-bg': '#1e1e1e',
        'sidebar-bg': '#252526',
        'activity-bar': '#333333',
        'menu-bg': '#2d2d30',
        'border': '#464647',
      }
    },
  },
  plugins: [],
}