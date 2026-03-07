/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "var(--surface-1)",
        textPrimary: "var(--text-primary)",
        textMuted: "var(--text-muted)",
        borderSoft: "var(--border-color)",
        iconBg: "var(--icon-bg)",
        iconFg: "var(--icon-fg)",
      },
      backgroundImage: {
        loginHero: "var(--hero-gradient-login)",
      },
      boxShadow: {
        softxl: "0 24px 70px rgba(15, 23, 42, 0.18)",
      },
    },
  },
  plugins: [],
};
