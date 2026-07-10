import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
      screens: { sm: "640px", md: "768px", lg: "1024px", xl: "1120px" },
    },
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-raised": "var(--surface-raised)",
        text: "var(--text)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
        border: "var(--border)",
        "border-subtle": "var(--border-subtle)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          light: "var(--primary-light)",
        },
        accent: "var(--accent)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      transitionTimingFunction: {
        "out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      maxWidth: {
        content: "1120px",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
