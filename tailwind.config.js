const { hairlineWidth } = require("nativewind/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/providers/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        app: {
          background: "hsl(var(--app-background) / <alpha-value>)",
          surface: "hsl(var(--app-surface) / <alpha-value>)",
          "surface-inset": "hsl(var(--app-surface-inset) / <alpha-value>)",
          border: "hsl(var(--app-border) / <alpha-value>)",
          "border-strong": "hsl(var(--app-border-strong) / <alpha-value>)",
          text: "hsl(var(--app-text) / <alpha-value>)",
          "text-muted": "hsl(var(--app-text-muted) / <alpha-value>)",
          "text-subtle": "hsl(var(--app-text-subtle) / <alpha-value>)",
          primary: {
            DEFAULT: "hsl(var(--app-primary) / <alpha-value>)",
            foreground: "hsl(var(--app-primary-foreground) / <alpha-value>)",
            surface: "hsl(var(--app-primary-surface) / <alpha-value>)",
            border: "hsl(var(--app-primary-border) / <alpha-value>)",
          },
          success: {
            DEFAULT: "hsl(var(--app-success) / <alpha-value>)",
            surface: "hsl(var(--app-success-surface) / <alpha-value>)",
            border: "hsl(var(--app-success-border) / <alpha-value>)",
          },
          destructive: {
            DEFAULT: "hsl(var(--app-destructive) / <alpha-value>)",
            surface: "hsl(var(--app-destructive-surface) / <alpha-value>)",
            border: "hsl(var(--app-destructive-border) / <alpha-value>)",
          },
          warning: {
            DEFAULT: "hsl(var(--app-warning) / <alpha-value>)",
            surface: "hsl(var(--app-warning-surface) / <alpha-value>)",
            border: "hsl(var(--app-warning-border) / <alpha-value>)",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [require("tailwindcss-animate")],
};
