/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#f8fafc",
        "on-surface": "#1e293b",
        "on-surface-variant": "#64748b",
        "surface-container": "#f1f5f9",
        "surface-container-lowest": "#ffffff",
        primary: {
          DEFAULT: "#16a34a",
          container: "#dcfce7",
          "fixed-dim": "#86efac",
        },
        "on-primary": {
          DEFAULT: "#ffffff",
          container: "#14532d",
        },
        "secondary-fixed": "#bbf7d0",
        "outline-variant": "#94a3b8",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
      },
      fontSize: {
        "label-md": "0.875rem",
        "body-md": "1rem",
        "headline-lg": "1.75rem",
      },
    },
  },
  plugins: [],
};
