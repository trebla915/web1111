/**
 * Tailwind theme — projects the design tokens in styles/theme/tokens.css into
 * utility classes. Values live in that file; this file only names them.
 *
 * Every colour is declared as `rgb(var(--token) / <alpha-value>)` so opacity
 * modifiers compose correctly: `bg-surface/50`, `border-line-accent/30`.
 */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        /* ─── Semantic palette — prefer these in all component code ─────── */
        canvas: 'rgb(var(--canvas) / <alpha-value>)',

        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          raised:  'rgb(var(--surface-raised) / <alpha-value>)',
          hover:   'rgb(var(--surface-hover) / <alpha-value>)',
          lifted:  'rgb(var(--surface-lifted) / <alpha-value>)',
          sunken:  'rgb(var(--surface-sunken) / <alpha-value>)',
        },

        fg: {
          DEFAULT: 'rgb(var(--fg) / <alpha-value>)',
          dim:     'rgb(var(--fg-dim) / <alpha-value>)',
          muted:   'rgb(var(--fg-muted) / <alpha-value>)',
          subtle:  'rgb(var(--fg-subtle) / <alpha-value>)',
          faint:   'rgb(var(--fg-faint) / <alpha-value>)',
          inverse: 'rgb(var(--fg-inverse) / <alpha-value>)',
        },

        line: {
          DEFAULT: 'rgb(var(--line) / <alpha-value>)',
          subtle:  'rgb(var(--line-subtle) / <alpha-value>)',
          strong:  'rgb(var(--line-strong) / <alpha-value>)',
          accent:  'rgb(var(--line-accent) / <alpha-value>)',
        },

        accent: {
          100: 'rgb(var(--accent-100) / <alpha-value>)',
          200: 'rgb(var(--accent-200) / <alpha-value>)',
          300: 'rgb(var(--accent-300) / <alpha-value>)',
          400: 'rgb(var(--accent-400) / <alpha-value>)',
          500: 'rgb(var(--accent-500) / <alpha-value>)',
          600: 'rgb(var(--accent-600) / <alpha-value>)',
          700: 'rgb(var(--accent-700) / <alpha-value>)',
          800: 'rgb(var(--accent-800) / <alpha-value>)',
          900: 'rgb(var(--accent-900) / <alpha-value>)',
          950: 'rgb(var(--accent-950) / <alpha-value>)',
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          bright: 'rgb(var(--accent-bright) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
          pale: 'rgb(var(--accent-pale) / <alpha-value>)',
          dim: 'rgb(var(--accent-dim) / <alpha-value>)',
          deep: 'rgb(var(--accent-deep) / <alpha-value>)',
          deeper: 'rgb(var(--accent-deeper) / <alpha-value>)',
          abyss: 'rgb(var(--accent-abyss) / <alpha-value>)',
          foreground: 'rgb(var(--fg-inverse) / <alpha-value>)',
        },

        danger: {
          200: 'rgb(var(--danger-200) / <alpha-value>)',
          300: 'rgb(var(--danger-300) / <alpha-value>)',
          400: 'rgb(var(--danger-400) / <alpha-value>)',
          500: 'rgb(var(--danger-500) / <alpha-value>)',
          600: 'rgb(var(--danger-600) / <alpha-value>)',
          700: 'rgb(var(--danger-700) / <alpha-value>)',
          800: 'rgb(var(--danger-800) / <alpha-value>)',
          900: 'rgb(var(--danger-900) / <alpha-value>)',
          950: 'rgb(var(--danger-950) / <alpha-value>)',
          DEFAULT: 'rgb(var(--danger) / <alpha-value>)',
          bright: 'rgb(var(--danger-bright) / <alpha-value>)',
          line: 'rgb(var(--danger-line) / <alpha-value>)',
          deep: 'rgb(var(--danger-deep) / <alpha-value>)',
          abyss: 'rgb(var(--danger-abyss) / <alpha-value>)',
        },
        success: {
          300: 'rgb(var(--success-300) / <alpha-value>)',
          400: 'rgb(var(--success-400) / <alpha-value>)',
          500: 'rgb(var(--success-500) / <alpha-value>)',
          600: 'rgb(var(--success-600) / <alpha-value>)',
          700: 'rgb(var(--success-700) / <alpha-value>)',
          800: 'rgb(var(--success-800) / <alpha-value>)',
          900: 'rgb(var(--success-900) / <alpha-value>)',
          950: 'rgb(var(--success-950) / <alpha-value>)',
          DEFAULT: 'rgb(var(--success) / <alpha-value>)',
          bright: 'rgb(var(--success-bright) / <alpha-value>)',
          line: 'rgb(var(--success-line) / <alpha-value>)',
          deep: 'rgb(var(--success-deep) / <alpha-value>)',
          abyss: 'rgb(var(--success-abyss) / <alpha-value>)',
        },
        warning: {
          200: 'rgb(var(--warning-200) / <alpha-value>)',
          300: 'rgb(var(--warning-300) / <alpha-value>)',
          400: 'rgb(var(--warning-400) / <alpha-value>)',
          500: 'rgb(var(--warning-500) / <alpha-value>)',
          600: 'rgb(var(--warning-600) / <alpha-value>)',
          700: 'rgb(var(--warning-700) / <alpha-value>)',
          900: 'rgb(var(--warning-900) / <alpha-value>)',
          950: 'rgb(var(--warning-950) / <alpha-value>)',
          DEFAULT: 'rgb(var(--warning) / <alpha-value>)',
          bright: 'rgb(var(--warning-bright) / <alpha-value>)',
          line: 'rgb(var(--warning-line) / <alpha-value>)',
          deep: 'rgb(var(--warning-deep) / <alpha-value>)',
          abyss: 'rgb(var(--warning-abyss) / <alpha-value>)',
        },

        attention: {
          200: 'rgb(var(--attention-200) / <alpha-value>)',
          300: 'rgb(var(--attention-300) / <alpha-value>)',
          400: 'rgb(var(--attention-400) / <alpha-value>)',
          600: 'rgb(var(--attention-600) / <alpha-value>)',
          700: 'rgb(var(--attention-700) / <alpha-value>)',
          900: 'rgb(var(--attention-900) / <alpha-value>)',
        },
        confirm: {
          400: 'rgb(var(--confirm-400) / <alpha-value>)',
          600: 'rgb(var(--confirm-600) / <alpha-value>)',
          700: 'rgb(var(--confirm-700) / <alpha-value>)',
          900: 'rgb(var(--confirm-900) / <alpha-value>)',
        },
        revoke: {
          400: 'rgb(var(--revoke-400) / <alpha-value>)',
          600: 'rgb(var(--revoke-600) / <alpha-value>)',
          700: 'rgb(var(--revoke-700) / <alpha-value>)',
          900: 'rgb(var(--revoke-900) / <alpha-value>)',
        },

        /* ─── shadcn/ui class names ──────────────────────────────────────
           dialog, sheet and dropdown-menu are written against shadcn's colour
           names, so those class names must keep resolving. They point straight
           at the semantic tokens — there is no intermediate CSS variable. */
        background: 'rgb(var(--canvas) / <alpha-value>)',
        foreground: 'rgb(var(--fg) / <alpha-value>)',
        card: {
          DEFAULT:    'rgb(var(--surface) / <alpha-value>)',
          foreground: 'rgb(var(--fg) / <alpha-value>)',
        },
        popover: {
          DEFAULT:    'rgb(var(--surface) / <alpha-value>)',
          foreground: 'rgb(var(--fg) / <alpha-value>)',
        },
        primary: {
          DEFAULT:    'rgb(var(--fg) / <alpha-value>)',
          foreground: 'rgb(var(--fg-inverse) / <alpha-value>)',
        },
        secondary: {
          DEFAULT:    'rgb(var(--surface-raised) / <alpha-value>)',
          foreground: 'rgb(var(--fg) / <alpha-value>)',
        },
        muted: {
          DEFAULT:    'rgb(var(--surface-raised) / <alpha-value>)',
          foreground: 'rgb(var(--fg-muted) / <alpha-value>)',
        },
        destructive: {
          DEFAULT:    'rgb(var(--danger) / <alpha-value>)',
          foreground: 'rgb(var(--fg) / <alpha-value>)',
        },
        border: 'rgb(var(--line) / <alpha-value>)',
        input:  'rgb(var(--line) / <alpha-value>)',
        ring:   'rgb(var(--accent) / <alpha-value>)',
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      fontFamily: {
        sans:    ['var(--font-sans)'],
        heading: ['var(--font-heading)'],
        display: ['var(--font-display)'],
      },

      transitionTimingFunction: {
        /* Exponential easing. Bounce/elastic is deliberately not offered. */
        'out-expo': 'var(--ease-out)',
        'in-out-expo': 'var(--ease-in-out)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
        slow: 'var(--duration-slow)',
      },

      boxShadow: {
        'glow':        'var(--shadow-glow-white)',
        'glow-soft':   'var(--shadow-glow-soft)',
        'glow-accent': 'var(--shadow-glow-accent)',
        'card-hover':  'var(--shadow-card-hover)',
        'panel':       'var(--shadow-panel)',
        'stage':       'var(--shadow-stage)',
      },

      dropShadow: {
        'mark': 'var(--shadow-mark)',
      },

      animation: {
        'spin-slow':   'spin 3s linear infinite',
        'pulse-slow':  'pulse 4s var(--ease-in-out) infinite',
        'fadeIn':      'fadeIn var(--duration-slow) var(--ease-out)',
        'slideIn':     'slideIn var(--duration-base) var(--ease-out)',
        'slideInRight':'slideInRight var(--duration-base) var(--ease-out)',
        'slideOut':    'slideOut var(--duration-base) var(--ease-out)',
        'drift':       'drift 2.4s var(--ease-in-out) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        /* Replaces `animate-bounce` on the scroll cue — a settled drift
           instead of the elastic bounce the detector flagged. */
        drift: {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.6' },
          '50%':      { transform: 'translateY(6px)', opacity: '1' },
        },
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      backdropBlur: { xs: '2px' },
      spacing: { '18': '4.5rem', '88': '22rem' },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
