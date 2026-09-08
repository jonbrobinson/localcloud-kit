/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-plex-sans)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "var(--font-plex-mono)",
          "SF Mono",
          "Monaco",
          "Inconsolata",
          "Roboto Mono",
          "Source Code Pro",
          "Menlo",
          "Consolas",
          "DejaVu Sans Mono",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
