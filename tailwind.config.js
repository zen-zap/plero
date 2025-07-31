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