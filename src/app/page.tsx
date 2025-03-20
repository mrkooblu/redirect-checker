'use client';

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { ThemeProvider } from 'styled-components';
import GlobalStyle from '@/styles/GlobalStyle';
import theme from '@/styles/theme';
import UrlInputForm from '@/components/UrlInputForm';
import StatusSummary from '@/components/StatusSummary';
import RedirectChain from '@/components/RedirectChain';
import HeadersTable from '@/components/HeadersTable';
import ResultsView from '@/components/ResultsView';
import { RedirectResult } from '@/types/redirect';
import { FiLink, FiArrowRight, FiClock, FiCode } from 'react-icons/fi';

// Define animations OUTSIDE of the component function
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulseAnimation = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 0.8; }
  100% { opacity: 0.6; }
`;

// Styled components that use animations
const Container = styled.div<{ $isFirstVisit: boolean }>`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
  background-color: ${props => props.theme.colors.background.primary};
  animation: ${props => props.$isFirstVisit ? fadeIn : 'none'} 0.8s ease-out;
`;

const ResultsContainer = styled.div`
  animation: ${fadeIn} 0.5s ease-out;
`;

// Component function begins here
export default function Home() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RedirectResult | null>(null);
  const [activeTab, setActiveTab] = useState<'chain' | 'headers'>('chain');
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(true);

  // Clear the first visit flag after component mounts
  useEffect(() => {
    // Small delay to ensure the animation plays
    const timer = setTimeout(() => {
      setIsFirstVisit(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleCheckUrl = async (url: string, options?: { userAgent?: string, timeout?: number }) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/check-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, ...options }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check URL');
      }

      const data = await response.json();
      setResult(data);
      // Set active tab to 'chain' if there are redirects, otherwise to 'headers'
      setActiveTab(data.redirectCount > 0 ? 'chain' : 'headers');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <BackgroundPattern />
      <Container $isFirstVisit={isFirstVisit}>
        <Header>
          <h1>HTTP Status & Redirect Checker</h1>
          <Description>
            Check the HTTP status of any URL instantly. Track redirect chains, view response headers, 
            and analyze HTTP status codes.
          </Description>
          <HeroIllustration>
            <IconContainer color="primary">
              <FiLink size={28} />
            </IconContainer>
            <ArrowContainer>
              <FiArrowRight size={20} />
            </ArrowContainer>
            <IconContainer color="info">
              <FiArrowRight size={28} />
            </IconContainer>
            <ArrowContainer>
              <FiArrowRight size={20} />
            </ArrowContainer>
            <IconContainer color="success">
              <FiCode size={28} />
            </IconContainer>
          </HeroIllustration>
        </Header>

        <MainContent>
          <UrlInputForm onSubmit={handleCheckUrl} isLoading={loading} />
          
          <ResultsContainer>
            <ResultsView 
              result={result} 
              isLoading={loading}
              error={error}
              onCheckAnother={() => {
                setResult(null);
                setError(null);
              }}
            />
          </ResultsContainer>
        </MainContent>
      </Container>
    </ThemeProvider>
  );
}

const BackgroundPattern = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  background-color: ${props => props.theme.colors.background.primary};
  background-image: radial-gradient(${props => props.theme.colors.background.secondary}20 1px, transparent 1px);
  background-size: 30px 30px;
  opacity: 0.4;
`;

const Header = styled.header`
  padding: ${props => props.theme.spacing.xl} 0;
  text-align: center;
  background-color: ${props => props.theme.colors.background.secondary};
  position: relative;
  overflow: hidden;
  
  h1 {
    margin-bottom: ${props => props.theme.spacing.md};
    font-size: clamp(2rem, 5vw, 2.5rem);
  }
`;

const Description = styled.p`
  max-width: 700px;
  margin: 0 auto;
  color: ${props => props.theme.colors.text.secondary};
`;

const HeroIllustration = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: ${props => props.theme.spacing.xl} auto;
  max-width: 500px;
`;

interface IconContainerProps {
  color: 'primary' | 'success' | 'info' | 'warning' | 'error';
}

const IconContainer = styled.div<IconContainerProps>`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${props => props.theme.colors[props.color]};
  color: white;
  box-shadow: ${props => props.theme.shadows.md};
`;

const ArrowContainer = styled.div`
  margin: 0 ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.secondary};
`;

const MainContent = styled.main`
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.xl};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.lg};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.md};
  }
`;