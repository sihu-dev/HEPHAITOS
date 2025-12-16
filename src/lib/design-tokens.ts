/**
 * HEPHAITOS Design System
 * Inherited from CATALYST AI + Linear Design Language
 * 
 * Primary: #5E6AD2 (Linear Purple)
 * Dark Mode Only: #0D0D0F Background
 * Glass Effect: backdrop-blur-xl
 * Accent: #7C8AEA
 */

// ============================================
// COLOR PALETTE
// ============================================

export const colors = {
  // Primary Brand Colors (Linear Purple)
  primary: {
    DEFAULT: '#5E6AD2',
    50: '#F0F1FA',
    100: '#E0E2F4',
    200: '#C1C5E9',
    300: '#A2A8DE',
    400: '#838BD3',
    500: '#5E6AD2',  // Main Primary
    600: '#4B56C8',
    700: '#3A44A8',
    800: '#2D3585',
    900: '#1F2562',
  },

  // Accent Colors
  accent: {
    DEFAULT: '#7C8AEA',
    light: '#9BA5F0',
    dark: '#5D6BD8',
    hover: '#8B98EE',
    muted: '#7C8AEA40',
  },

  // Background Colors (Deep Space Theme)
  background: {
    primary: '#0D0D0F',      // Main background
    secondary: '#111113',    // Slightly lighter
    tertiary: '#161618',     // Cards/elevated
    elevated: '#1A1A1D',     // Modals/popups
    hover: '#1E1E21',        // Hover states
    overlay: 'rgba(0, 0, 0, 0.8)',
  },

  // Surface Colors (for cards, panels)
  surface: {
    DEFAULT: 'rgba(255, 255, 255, 0.02)',
    raised: 'rgba(255, 255, 255, 0.04)',
    overlay: 'rgba(255, 255, 255, 0.06)',
    glass: 'rgba(255, 255, 255, 0.03)',
    border: 'rgba(255, 255, 255, 0.06)',
  },

  // Text Colors
  text: {
    primary: '#FFFFFF',
    secondary: '#A1A1AA',    // zinc-400
    tertiary: '#71717A',     // zinc-500
    muted: '#52525B',        // zinc-600
    disabled: '#3F3F46',     // zinc-700
    inverse: '#0D0D0F',
  },

  // Border Colors
  border: {
    DEFAULT: 'rgba(255, 255, 255, 0.06)',
    light: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(255, 255, 255, 0.12)',
    focus: '#5E6AD2',
    accent: 'rgba(94, 106, 210, 0.4)',
  },

  // Status Colors
  status: {
    success: '#22C55E',
    successBg: 'rgba(34, 197, 94, 0.1)',
    warning: '#F59E0B',
    warningBg: 'rgba(245, 158, 11, 0.1)',
    error: '#EF4444',
    errorBg: 'rgba(239, 68, 68, 0.1)',
    info: '#3B82F6',
    infoBg: 'rgba(59, 130, 246, 0.1)',
  },

  // Trading-specific Colors
  trading: {
    profit: '#22C55E',      // Green
    profitBg: 'rgba(34, 197, 94, 0.1)',
    loss: '#EF4444',        // Red
    lossBg: 'rgba(239, 68, 68, 0.1)',
    neutral: '#A1A1AA',
    chart: {
      line: '#5E6AD2',
      grid: 'rgba(255, 255, 255, 0.04)',
      candle: {
        up: '#22C55E',
        down: '#EF4444',
      },
    },
  },
} as const;

// ============================================
// TYPOGRAPHY
// ============================================

export const typography = {
  fontFamily: {
    sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['JetBrains Mono', 'SF Mono', 'Consolas', 'monospace'],
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1.2' }],       // 48px
    '6xl': ['3.75rem', { lineHeight: '1.1' }],    // 60px
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
} as const;

// ============================================
// SPACING
// ============================================

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
} as const;

// ============================================
// BORDER RADIUS
// ============================================

export const borderRadius = {
  none: '0',
  sm: '0.125rem',    // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  '3xl': '1.5rem',   // 24px
  full: '9999px',
} as const;

// ============================================
// SHADOWS
// ============================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px -1px rgba(0, 0, 0, 0.5)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
  
  // Glow effects
  glow: {
    primary: '0 0 20px rgba(94, 106, 210, 0.3)',
    accent: '0 0 20px rgba(124, 138, 234, 0.3)',
    success: '0 0 20px rgba(34, 197, 94, 0.3)',
    error: '0 0 20px rgba(239, 68, 68, 0.3)',
  },
  
  // Inner shadows
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
} as const;

// ============================================
// GLASS EFFECTS (Core Feature)
// ============================================

export const glassEffects = {
  // Standard glass panels
  glass: {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropBlur: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  
  // Stronger glass effect
  glassStrong: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropBlur: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  
  // Ultra glass (for modals, important panels)
  glassUltra: {
    background: 'rgba(255, 255, 255, 0.06)',
    backdropBlur: 'blur(40px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },

  // Liquid glass with gradient
  liquidGlass: {
    background: `linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.05) 0%,
      rgba(255, 255, 255, 0.02) 100%
    )`,
    backdropBlur: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },

  // Primary tinted glass
  primaryGlass: {
    background: 'rgba(94, 106, 210, 0.08)',
    backdropBlur: 'blur(16px)',
    border: '1px solid rgba(94, 106, 210, 0.2)',
  },
} as const;

// ============================================
// TRANSITIONS & ANIMATIONS
// ============================================

export const transitions = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  
  easing: {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

export const animations = {
  // Fade animations
  fadeIn: 'fadeIn 0.2s ease-out',
  fadeOut: 'fadeOut 0.2s ease-in',
  
  // Scale animations
  scaleIn: 'scaleIn 0.2s ease-out',
  scaleOut: 'scaleOut 0.15s ease-in',
  
  // Slide animations
  slideUp: 'slideUp 0.3s ease-out',
  slideDown: 'slideDown 0.3s ease-out',
  slideLeft: 'slideLeft 0.3s ease-out',
  slideRight: 'slideRight 0.3s ease-out',
  
  // Special effects
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  shimmer: 'shimmer 2s linear infinite',
  glow: 'glow 2s ease-in-out infinite alternate',
  float: 'float 3s ease-in-out infinite',
} as const;

// Keyframes (to be added to global CSS)
export const keyframes = {
  fadeIn: {
    from: { opacity: '0' },
    to: { opacity: '1' },
  },
  fadeOut: {
    from: { opacity: '1' },
    to: { opacity: '0' },
  },
  scaleIn: {
    from: { opacity: '0', transform: 'scale(0.95)' },
    to: { opacity: '1', transform: 'scale(1)' },
  },
  scaleOut: {
    from: { opacity: '1', transform: 'scale(1)' },
    to: { opacity: '0', transform: 'scale(0.95)' },
  },
  slideUp: {
    from: { opacity: '0', transform: 'translateY(10px)' },
    to: { opacity: '1', transform: 'translateY(0)' },
  },
  slideDown: {
    from: { opacity: '0', transform: 'translateY(-10px)' },
    to: { opacity: '1', transform: 'translateY(0)' },
  },
  pulse: {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.5' },
  },
  shimmer: {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  },
  glow: {
    from: { boxShadow: '0 0 20px rgba(94, 106, 210, 0.2)' },
    to: { boxShadow: '0 0 30px rgba(94, 106, 210, 0.4)' },
  },
  float: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-10px)' },
  },
} as const;

// ============================================
// Z-INDEX SCALE
// ============================================

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1600,
  tooltip: 1700,
} as const;

// ============================================
// BREAKPOINTS
// ============================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================
// COMPONENT STYLES
// ============================================

export const componentStyles = {
  // Button Variants
  button: {
    primary: {
      background: colors.primary.DEFAULT,
      color: colors.text.primary,
      hover: colors.primary[600],
      active: colors.primary[700],
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.06)',
      color: colors.text.primary,
      hover: 'rgba(255, 255, 255, 0.1)',
      active: 'rgba(255, 255, 255, 0.08)',
      border: colors.border.light,
    },
    ghost: {
      background: 'transparent',
      color: colors.text.secondary,
      hover: 'rgba(255, 255, 255, 0.06)',
      active: 'rgba(255, 255, 255, 0.04)',
    },
    danger: {
      background: colors.status.error,
      color: colors.text.primary,
      hover: '#DC2626',
      active: '#B91C1C',
    },
  },

  // Card Variants
  card: {
    default: {
      background: colors.surface.DEFAULT,
      border: colors.border.DEFAULT,
      borderRadius: borderRadius.xl,
    },
    elevated: {
      background: colors.background.elevated,
      border: colors.border.light,
      borderRadius: borderRadius.xl,
      shadow: shadows.lg,
    },
    glass: {
      ...glassEffects.glass,
      borderRadius: borderRadius.xl,
    },
    interactive: {
      background: colors.surface.DEFAULT,
      border: colors.border.DEFAULT,
      borderRadius: borderRadius.xl,
      hover: {
        background: colors.surface.raised,
        border: colors.border.light,
      },
    },
  },

  // Input Variants
  input: {
    default: {
      background: 'rgba(255, 255, 255, 0.04)',
      border: colors.border.DEFAULT,
      borderRadius: borderRadius.lg,
      color: colors.text.primary,
      placeholder: colors.text.muted,
      focus: {
        border: colors.primary.DEFAULT,
        ring: `0 0 0 2px ${colors.primary[500]}20`,
      },
    },
    error: {
      border: colors.status.error,
      focus: {
        border: colors.status.error,
        ring: `0 0 0 2px ${colors.status.error}20`,
      },
    },
  },

  // Badge/Tag Variants
  badge: {
    default: {
      background: 'rgba(255, 255, 255, 0.06)',
      color: colors.text.secondary,
      border: colors.border.DEFAULT,
    },
    primary: {
      background: `${colors.primary.DEFAULT}20`,
      color: colors.accent.DEFAULT,
      border: `${colors.primary.DEFAULT}40`,
    },
    success: {
      background: colors.status.successBg,
      color: colors.status.success,
    },
    warning: {
      background: colors.status.warningBg,
      color: colors.status.warning,
    },
    error: {
      background: colors.status.errorBg,
      color: colors.status.error,
    },
  },
} as const;

// ============================================
// UTILITY CLASSES (CSS-in-JS helpers)
// ============================================

export const utilities = {
  // Text truncation
  truncate: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  
  // Line clamp
  lineClamp: (lines: number) => ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  }),
  
  // Flex utilities
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  flexBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  // Absolute fill
  absoluteFill: {
    position: 'absolute' as const,
    inset: 0,
  },
  
  // Screen reader only
  srOnly: {
    position: 'absolute' as const,
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    borderWidth: 0,
  },
} as const;

// ============================================
// EXPORT ALL
// ============================================

export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  glassEffects,
  transitions,
  animations,
  keyframes,
  zIndex,
  breakpoints,
  componentStyles,
  utilities,
} as const;

export default designTokens;
