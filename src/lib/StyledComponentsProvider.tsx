'use client';

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'styled-components';
import GlobalStyle from '@/styles/GlobalStyle';
import theme from '@/styles/theme';

interface StyledComponentsProviderProps {
  children: React.ReactNode;
}

// A simple loading indicator
const LoadingIndicator = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  }}>
    <div style={{
      width: '50px',
      height: '50px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #3498db',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }} />
    <style jsx>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default function StyledComponentsProvider({ children }: StyledComponentsProviderProps) {
  const [mounted, setMounted] = useState(false);
  
  // After the component is mounted, we can render children that depend on client side features
  useEffect(() => {
    setMounted(true);
  }, []);

  // This prevents hydration errors and ensures styles are properly applied
  // before rendering the actual content
  if (!mounted) {
    return <LoadingIndicator />;
  }

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  );
} 