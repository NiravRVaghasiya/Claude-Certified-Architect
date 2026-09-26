import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
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
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
          subtle: "hsl(var(--muted-subtle))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          subtle: "hsl(var(--accent-subtle))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        elevated: "hsl(var(--elevated))",
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        code: {
          DEFAULT: "hsl(var(--code-bg))",
          foreground: "hsl(var(--code-fg))",
          border: "hsl(var(--code-border))",
          chrome: "hsl(var(--code-chrome))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: "hsl(var(--warning))",
        info: "hsl(var(--info))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        foundation: {
          DEFAULT: "hsl(var(--foundation))",
          foreground: "hsl(var(--foundation-foreground))",
        },
        professional: {
          DEFAULT: "hsl(var(--professional))",
          foreground: "hsl(var(--professional-foreground))",
        },
      },
      borderRadius: {
        xs: "calc(var(--radius) - 6px)",
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 16px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        // Metadata / labels. No letterSpacing here — `.eyebrow` pairs this with
        // `tracking-label`, and a size-bundled letter-spacing would race it.
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
        // Fluid editorial scale (kept stable across the redesign — used by page headers)
        "fluid-sm": ["clamp(0.875rem, 0.85rem + 0.1vw, 0.9375rem)", { lineHeight: "1.55" }],
        "fluid-base": ["clamp(1rem, 0.97rem + 0.15vw, 1.0625rem)", { lineHeight: "1.65" }],
        "fluid-lg": ["clamp(1.125rem, 1.05rem + 0.35vw, 1.375rem)", { lineHeight: "1.4" }],
        "fluid-xl": ["clamp(1.375rem, 1.2rem + 0.7vw, 1.875rem)", { lineHeight: "1.25" }],
        "fluid-2xl": ["clamp(1.75rem, 1.45rem + 1.3vw, 2.625rem)", { lineHeight: "1.12" }],
        "fluid-3xl": ["clamp(2.25rem, 1.75rem + 2.2vw, 3.5rem)", { lineHeight: "1.05" }],
      },
      letterSpacing: {
        display: "-0.022em",
        label: "0.06em",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        ring: "var(--shadow-ring)",
      },
      maxWidth: {
        prose: "72ch",
        shell: "1480px",
      },
      spacing: {
        header: "var(--header-h)",
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
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 1.6s infinite",
      },
      transitionTimingFunction: {
        emphasis: "cubic-bezier(0.22, 0.61, 0.36, 1)",
      },
      typography: () => ({
        DEFAULT: {
          css: {
            "--tw-prose-body": "hsl(var(--foreground) / 0.88)",
            "--tw-prose-headings": "hsl(var(--foreground))",
            "--tw-prose-lead": "hsl(var(--muted-foreground))",
            "--tw-prose-links": "hsl(var(--foreground))",
            "--tw-prose-bold": "hsl(var(--foreground))",
            "--tw-prose-counters": "hsl(var(--muted-foreground))",
            "--tw-prose-bullets": "hsl(var(--border-strong))",
            "--tw-prose-hr": "hsl(var(--border))",
            "--tw-prose-quotes": "hsl(var(--foreground))",
            "--tw-prose-quote-borders": "hsl(var(--accent) / 0.4)",
            "--tw-prose-captions": "hsl(var(--muted-foreground))",
            "--tw-prose-code": "hsl(var(--foreground))",
            "--tw-prose-pre-code": "hsl(var(--code-fg))",
            "--tw-prose-pre-bg": "hsl(var(--code-bg))",
            "--tw-prose-th-borders": "hsl(var(--border))",
            "--tw-prose-td-borders": "hsl(var(--border))",
            maxWidth: "none",
            lineHeight: "1.72",
            "h2, h3, h4": {
              letterSpacing: "-0.015em",
              scrollMarginTop: "calc(var(--header-h) + 1.5rem)",
            },
            a: {
              textDecorationColor: "hsl(var(--accent) / 0.45)",
              textUnderlineOffset: "3px",
              fontWeight: "500",
              transition: "color 150ms var(--ease-emphasis), text-decoration-color 150ms",
            },
            "a:hover": { color: "hsl(var(--accent))" },
          },
        },
      }),
    },
  },
  plugins: [typography],
};

export default config;
