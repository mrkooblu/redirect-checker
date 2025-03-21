'use client';

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import UrlInputForm from '@/components/UrlInputForm';
import StatusSummary from '@/components/StatusSummary';
import RedirectChain from '@/components/RedirectChain';
import HeadersTable from '@/components/HeadersTable';
import ResultsView from '@/components/ResultsView';
import { RedirectResult } from '@/types/redirect';
import { FiLink, FiArrowRight, FiClock, FiCode, FiExternalLink } from 'react-icons/fi';
import StyledComponentsProvider from '@/lib/StyledComponentsProvider';

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
  animation: ${fadeIn} 0.5s ease-out;
  transition: opacity 0.3s ease-in-out;
  opacity: ${props => props.$isFirstVisit ? 0.99 : 1};
`;

const ResultsContainer = styled.div`
  animation: ${fadeIn} 0.5s ease-out;
  transition: opacity 0.3s ease;
`;

// Loading indicator for initial style loading
const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

// Component function begins here
export default function Home() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RedirectResult | null>(null);
  const [activeTab, setActiveTab] = useState<'chain' | 'headers'>('chain');
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(true);
  const [stylesLoaded, setStylesLoaded] = useState<boolean>(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean>(false);
  
  // Load cached result on first render
  useEffect(() => {
    try {
      // Removed code that loaded cached results
      
      // Check if user has seen welcome message before
      const hasSeenWelcomeMessage = localStorage.getItem('hasSeenWelcome');
      if (hasSeenWelcomeMessage) {
        setHasSeenWelcome(true);
      }
    } catch (err) {
      console.error('Error loading cached data:', err);
    }
  }, []);

  // Clear the first visit flag after component mounts
  useEffect(() => {
    // Small delay to ensure the animation plays
    const timer = setTimeout(() => {
      setIsFirstVisit(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  // Set styles loaded after initial render
  useEffect(() => {
    // Small delay to ensure styles are applied
    const timer = setTimeout(() => {
      setStylesLoaded(true);
    }, 300);
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
      // Removed caching code
      
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

  if (!stylesLoaded) {
    return (
      <LoadingOverlay>
        <LoadingSpinner />
      </LoadingOverlay>
    );
  }

  return (
    <StyledComponentsProvider>
      <BackgroundPattern />
      <Container $isFirstVisit={isFirstVisit}>
        <Header>
          <h1>301 URL Redirect & HTTP Status Checker</h1>
          <Description>
            Check the HTTP status of any URL instantly. Track redirect chains and analyze HTTP status codes.
          </Description>
          <HeroIllustration>
            <IconContainer color="primary">
              <FiLink size={24} />
            </IconContainer>
            <ArrowContainer>
              <FiArrowRight size={16} />
            </ArrowContainer>
            <IconContainer color="success">
              <FiCode size={24} />
            </IconContainer>
          </HeroIllustration>
        </Header>

        {!hasSeenWelcome && (
          <WelcomeMessage>
            <WelcomeIcon>👋</WelcomeIcon>
            <WelcomeContent>
              <WelcomeTitle>Welcome to the Redirect Checker</WelcomeTitle>
              <WelcomeText>
                This tool helps you analyze URL redirects, find redirect chains, and detect SEO issues. 
                <strong> Unlock more SEO tools</strong> with a Semrush free trial.
              </WelcomeText>
              <WelcomeActions>
                <WelcomeButton 
                  href="https://www.semrush.com/signup/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Try Semrush Free <FiExternalLink size={14} />
                </WelcomeButton>
                <WelcomeDismiss 
                  onClick={() => {
                    setHasSeenWelcome(true);
                    localStorage.setItem('hasSeenWelcome', 'true');
                  }}
                >
                  Continue to Tool
                </WelcomeDismiss>
              </WelcomeActions>
            </WelcomeContent>
          </WelcomeMessage>
        )}

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
    </StyledComponentsProvider>
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
  padding: ${props => props.theme.spacing.lg} 0;
  text-align: center;
  background-color: white;
  position: relative;
  overflow: hidden;
  margin: ${props => props.theme.spacing.md} auto;
  max-width: 1000px;
  
  h1 {
    margin-bottom: ${props => props.theme.spacing.sm};
    font-size: clamp(1.8rem, 4vw, 2.2rem);
  }
`;

const Description = styled.p`
  max-width: 700px;
  margin: 0 auto;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
`;

const HeroIllustration = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: ${props => props.theme.spacing.md} auto;
  max-width: 400px;
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

const WelcomeMessage = styled.div`
  background-color: ${props => props.theme.colors.background.secondary};
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.xl};
  display: flex;
  align-items: center;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const WelcomeIcon = styled.span`
  font-size: 2rem;
  margin-right: ${props => props.theme.spacing.md};
`;

const WelcomeContent = styled.div`
  flex: 1;
`;

const WelcomeTitle = styled.h2`
  margin-bottom: ${props => props.theme.spacing.sm};
  font-size: 1.5rem;
  color: ${props => props.theme.colors.text.primary};
`;

const WelcomeText = styled.p`
  margin-bottom: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.secondary};
`;

const WelcomeActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  align-items: center;
`;

const WelcomeButton = styled.a`
  background-color: ${props => props.theme.colors.success};
  color: white;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.spacing.sm};
  text-decoration: none;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};

  &:hover {
    opacity: 0.85;
  }
`;

const WelcomeDismiss = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  padding: ${props => props.theme.spacing.sm};
  text-decoration: underline;
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
  }
`;