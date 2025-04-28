'use client';

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import UrlInputForm from '@/components/UrlInputForm';
import StatusSummary from '@/components/StatusSummary';
import RedirectChain from '@/components/RedirectChain';
import HeadersTable from '@/components/HeadersTable';
import ResultsView from '@/components/ResultsView';
import { RedirectResult } from '@/types/redirect';
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
  
  // Load cached result on first render
  useEffect(() => {
    try {
      // Removed code that loaded cached results
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
        <HeaderSection>
          <AppContainer>
            <HeroContent>
              <MainTitle>301 URL Redirect & HTTP Status Checker</MainTitle>
              <Description>
                Check the HTTP status of any URL instantly. Track redirect chains and analyze HTTP status codes.
              </Description>
            </HeroContent>
          </AppContainer>
        </HeaderSection>

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

// Main header container that spans the full width
const HeaderSection = styled.div`
  position: relative;
  margin-bottom: 2.5rem;
  padding: 4.2rem 0;
  background: #121737 url('/images/tools-background.svg') no-repeat center center;
  background-size: cover;
  width: 100%;
  overflow: hidden;
  
  @media (max-width: 768px) {
    padding: 2rem 0;
    margin-bottom: 1.5rem;
  }
`;

// Container to center content and control max-width
const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

// Content wrapper for hero text elements
const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  max-width: 850px;
  margin: 0;
  padding: 0;
  text-align: left;
  
  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

// Main title styling
const MainTitle = styled.h1`
  font-family: 'Manrope', sans-serif;
  font-size: 44px;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 2rem;
  line-height: 1.3;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
  }
`;

// Description text styling
const Description = styled.p`
  font-family: 'Manrope', sans-serif;
  color: rgba(255, 255, 255, 0.8);
  font-size: 18px;
  line-height: 1.8;
  margin-bottom: 2.5rem;
  max-width: 750px;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 2rem;
    line-height: 1.6;
  }
`;

const MainContent = styled.main`
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.xl};
  
  @media (max-width: 768px) {
    padding: ${props => props.theme.spacing.lg};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.md};
  }
`;