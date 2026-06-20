/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: "hsl(var(--card) / <alpha-value>)",
        "card-foreground": "hsl(var(--card-foreground) / <alpha-value>)",
        primary: "hsl(var(--primary) / <alpha-value>)",
        "primary-foreground": "hsl(var(--primary-foreground) / <alpha-value>)",
        secondary: "hsl(var(--secondary) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        "muted-foreground": "hsl(var(--muted-foreground) / <alpha-value>)",
        accent: "hsl(var(--accent) / <alpha-value>)",
        "accent-foreground": "hsl(var(--accent-foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        gold: "hsl(var(--gold) / <alpha-value>)",
        "gold-glow": "hsl(var(--gold-glow) / <alpha-value>)",
        mystic: "hsl(var(--mystic) / <alpha-value>)",
        rose: "hsl(var(--rose) / <alpha-value>)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      backgroundImage: {
        cosmic: "var(--gradient-cosmic)",
        "gold-grad": "var(--gradient-gold)",
        "bubble-user": "var(--gradient-bubble-user)",
        "bubble-ginni": "var(--gradient-bubble-ginni)",
        "card-grad": "var(--gradient-card)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        glow: "var(--shadow-glow)",
        gold: "var(--shadow-gold)",
      },
      fontFamily: {
        serif: ["ui-serif", "Georgia", "Cambria", '"Times New Roman"', "Times", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        twinkle: {
          "0%,100%": { opacity: "0.1" },
          "50%": { opacity: "0.5" },
        },
        shuffle: {
          "0%,100%": { transform: "translateY(0) rotate(-7deg)" },
          "50%": { transform: "translateY(-12px) rotate(7deg)" },
        },
      },
      animation: {
        rise: "rise 0.5s ease-out both",
        twinkle: "twinkle 4s ease-in-out infinite",
        shuffle: "shuffle 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
