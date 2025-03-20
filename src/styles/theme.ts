export const lightTheme = {
  colors: {
    primary: '#3B82F6',
    secondary: '#1D4ED8',
    background: {
      primary: '#FFFFFF',
      secondary: '#F9FAFB',
      card: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#4B5563',
    },
    border: '#E5E7EB',
    hover: '#2563EB',
    success: '#10B981', // 200-299 status codes
    info: '#3B82F6',    // 300-399 status codes
    warning: '#F59E0B', // 400-499 status codes
    error: '#EF4444',   // 500-599 status codes
  },
  fonts: {
    family: {
      primary: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
      mono: "'Roboto Mono', monospace", // For displaying code/technical data
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },
  fontSizes: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
  },
  heading: {
    h1: {
      fontSize: '32px',
      lineHeight: '40px',
      fontWeight: 800,
    },
    h2: {
      fontSize: '24px',
      lineHeight: '32px',
      fontWeight: 700,
    },
    h3: {
      fontSize: '20px',
      lineHeight: '28px',
      fontWeight: 600,
    },
    body: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 400,
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    card: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
  transition: {
    default: '0.2s ease-in-out',
  },
};

// Export both as named export and default export for backward compatibility
export const theme = lightTheme;
export default lightTheme; 