import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { RedirectResult } from '@/types/redirect';
import { getStatusCodeClass, getStatusDescription } from '@/utils/redirectUtils';
import { FiExternalLink, FiCheck, FiAlertTriangle, FiInfo, FiRefreshCw } from 'react-icons/fi';

interface StatusSummaryProps {
  result: RedirectResult;
}

const StatusSummary: React.FC<StatusSummaryProps> = ({ result }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !result || !result.steps || result.steps.length === 0) {
    return null;
  }

  const initialStep = result.steps[0];
  const finalStep = result.steps[result.steps.length - 1];
  
  // Determine the overall status icon and color
  const getStatusIcon = () => {
    if (result.error) {
      return <StatusIcon className="error"><FiAlertTriangle size={24} /></StatusIcon>;
    }
    
    const statusCode = finalStep.statusCode;
    if (statusCode >= 200 && statusCode < 300) {
      return <StatusIcon className="success"><FiCheck size={24} /></StatusIcon>;
    } else if (statusCode >= 300 && statusCode < 400) {
      return <StatusIcon className="info"><FiRefreshCw size={24} /></StatusIcon>;
    } else if (statusCode >= 400 && statusCode < 500) {
      return <StatusIcon className="warning"><FiInfo size={24} /></StatusIcon>;
    } else {
      return <StatusIcon className="error"><FiAlertTriangle size={24} /></StatusIcon>;
    }
  };
  
  // Determine banner message
  const getBannerMessage = () => {
    if (result.error) {
      return "Error processing request";
    }
    
    const statusCode = finalStep.statusCode;
    if (statusCode >= 200 && statusCode < 300) {
      return result.redirectCount > 0 
        ? "Successfully followed all redirects" 
        : "URL loaded successfully";
    } else if (statusCode >= 300 && statusCode < 400) {
      return "Redirect detected but not followed";
    } else if (statusCode >= 400 && statusCode < 500) {
      return "Client error detected";
    } else {
      return "Server error detected";
    }
  };
  
  return (
    <SummaryContainer>
      <SummaryHeader>
        <SummaryTitle>
          <h2>Status Summary</h2>
          {result.totalTime && (
            <TotalTime>
              <FiInfo size={14} />
              <span>Total time: {result.totalTime}ms</span>
            </TotalTime>
          )}
        </SummaryTitle>
        
        <StatusBanner className={getStatusCodeClass(finalStep.statusCode)}>
          {getStatusIcon()}
          <StatusBannerText>{getBannerMessage()}</StatusBannerText>
        </StatusBanner>
      </SummaryHeader>
      
      <SummaryContent>
        <SummaryColumn>
          <SummaryCard>
            <CardTitle>Initial Request</CardTitle>
            <UrlDisplay>
              <UrlLabel>URL</UrlLabel>
              <UrlValue>{initialStep.url}</UrlValue>
              <CopyButton
                onClick={() => navigator.clipboard.writeText(initialStep.url)}
                title="Copy URL"
              >
                Copy
              </CopyButton>
            </UrlDisplay>
            <StatusDisplay className={getStatusCodeClass(initialStep.statusCode)}>
              <StatusCode>{initialStep.statusCode}</StatusCode>
              <StatusText>{getStatusDescription(initialStep.statusCode)}</StatusText>
            </StatusDisplay>
          </SummaryCard>
        </SummaryColumn>
        
        <RedirectCountColumn>
          <RedirectCountCard>
            <CountCircle>
              <RedirectCount>{result.redirectCount}</RedirectCount>
            </CountCircle>
            <RedirectLabel>Redirects</RedirectLabel>
          </RedirectCountCard>
        </RedirectCountColumn>
        
        {result.redirectCount > 0 && (
          <SummaryColumn>
            <SummaryCard highlight>
              <TitleRow>
                <CardTitle>Final Destination</CardTitle>
                <ExternalLinkButton 
                  href={finalStep.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title="Visit URL"
                >
                  <FiExternalLink size={14} />
                </ExternalLinkButton>
              </TitleRow>
              <UrlDisplay>
                <UrlLabel>URL</UrlLabel>
                <UrlValue>{finalStep.url}</UrlValue>
                <CopyButton
                  onClick={() => navigator.clipboard.writeText(finalStep.url)}
                  title="Copy URL"
                >
                  Copy
                </CopyButton>
              </UrlDisplay>
              <StatusDisplay className={getStatusCodeClass(finalStep.statusCode)}>
                <StatusCode>{finalStep.statusCode}</StatusCode>
                <StatusText>{getStatusDescription(finalStep.statusCode)}</StatusText>
              </StatusDisplay>
            </SummaryCard>
          </SummaryColumn>
        )}
      </SummaryContent>
      
      {/* Error (if any) */}
      {result.error && (
        <ErrorPanel>
          <ErrorTitle>Error Details</ErrorTitle>
          <ErrorMessage>{result.error}</ErrorMessage>
        </ErrorPanel>
      )}
    </SummaryContainer>
  );
};

const SummaryContainer = styled.div`
  background-color: ${props => props.theme.colors.background.card};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.card};
  margin-bottom: ${props => props.theme.spacing.xl};
  overflow: hidden;
`;

const SummaryHeader = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const SummaryTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
  
  h2 {
    margin: 0;
    font-size: ${props => props.theme.fontSizes.xl};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: flex-start;
    
    h2 {
      margin-bottom: ${props => props.theme.spacing.sm};
    }
  }
`;

const TotalTime = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.text.secondary};
  background-color: ${props => props.theme.colors.background.secondary};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
`;

const StatusBanner = styled.div`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  
  &.status-2xx {
    background-color: ${props => props.theme.colors.success}15;
  }
  
  &.status-3xx {
    background-color: ${props => props.theme.colors.info}15;
  }
  
  &.status-4xx {
    background-color: ${props => props.theme.colors.warning}15;
  }
  
  &.status-5xx {
    background-color: ${props => props.theme.colors.error}15;
  }
`;

const StatusIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: ${props => props.theme.spacing.md};
  
  &.success {
    background-color: ${props => props.theme.colors.success};
    color: white;
  }
  
  &.info {
    background-color: ${props => props.theme.colors.info};
    color: white;
  }
  
  &.warning {
    background-color: ${props => props.theme.colors.warning};
    color: white;
  }
  
  &.error {
    background-color: ${props => props.theme.colors.error};
    color: white;
  }
`;

const StatusBannerText = styled.div`
  font-size: ${props => props.theme.fontSizes.md};
  font-weight: ${props => props.theme.fonts.weights.medium};
`;

const SummaryContent = styled.div`
  display: flex;
  padding: ${props => props.theme.spacing.lg};
  gap: ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
  }
`;

const SummaryColumn = styled.div`
  flex: 1;
`;

const RedirectCountColumn = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.md} 0;
  }
`;

interface SummaryCardProps {
  highlight?: boolean;
}

const SummaryCard = styled.div<SummaryCardProps>`
  padding: ${props => props.theme.spacing.lg};
  background-color: ${props => props.highlight 
    ? props.theme.colors.background.secondary
    : props.theme.colors.background.card};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.highlight 
    ? props.theme.colors.primary + '30'
    : props.theme.colors.border};
  height: 100%;
  
  ${props => props.highlight && `
    box-shadow: ${props.theme.shadows.sm};
  `}
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSizes.md};
  color: ${props => props.theme.colors.text.secondary};
`;

const UrlDisplay = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
  position: relative;
`;

const UrlLabel = styled.div`
  font-size: ${props => props.theme.fontSizes.xs};
  text-transform: uppercase;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const UrlValue = styled.div`
  font-family: ${props => props.theme.fonts.family.mono};
  font-size: ${props => props.theme.fontSizes.sm};
  word-break: break-all;
  padding-right: 50px; /* Space for copy button */
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  background-color: transparent;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.fontSizes.xs};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.secondary};
    border-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primary};
  }
`;

const StatusActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: flex-start;
    
    & > * + * {
      margin-top: ${props => props.theme.spacing.md};
    }
  }
`;

const StatusDisplay = styled.div`
  display: inline-flex;
  align-items: center;
  padding: ${props => `${props.theme.spacing.sm} ${props.theme.spacing.md}`};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-weight: ${props => props.theme.fonts.weights.medium};
  
  &.status-2xx {
    background-color: ${props => props.theme.colors.success}20;
    border: 1px solid ${props => props.theme.colors.success}40;
  }
  
  &.status-3xx {
    background-color: ${props => props.theme.colors.info}20;
    border: 1px solid ${props => props.theme.colors.info}40;
  }
  
  &.status-4xx {
    background-color: ${props => props.theme.colors.warning}20;
    border: 1px solid ${props => props.theme.colors.warning}40;
  }
  
  &.status-5xx {
    background-color: ${props => props.theme.colors.error}20;
    border: 1px solid ${props => props.theme.colors.error}40;
  }
`;

const StatusCode = styled.span`
  font-weight: ${props => props.theme.fonts.weights.bold};
  margin-right: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.fontSizes.md};
  
  .status-2xx & {
    color: ${props => props.theme.colors.success};
  }
  
  .status-3xx & {
    color: ${props => props.theme.colors.info};
  }
  
  .status-4xx & {
    color: ${props => props.theme.colors.warning};
  }
  
  .status-5xx & {
    color: ${props => props.theme.colors.error};
  }
`;

const StatusText = styled.span`
  color: ${props => props.theme.colors.text.secondary};
`;

const RedirectCountCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const CountCircle = styled.div`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.info}15;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${props => props.theme.spacing.sm};
  border: 2px solid ${props => props.theme.colors.info};
`;

const RedirectCount = styled.span`
  font-weight: ${props => props.theme.fonts.weights.bold};
  font-size: ${props => props.theme.fontSizes['2xl']};
  color: ${props => props.theme.colors.info};
`;

const RedirectLabel = styled.div`
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.text.secondary};
`;

const ViewButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => `${props.theme.spacing.xs} ${props.theme.spacing.md}`};
  background-color: ${props => props.theme.colors.background.secondary};
  color: ${props => props.theme.colors.primary};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.fontSizes.sm};
  text-decoration: none;
  transition: all 0.2s ease;
  height: ${props => props.theme.spacing.xl};
  
  &:hover {
    background-color: ${props => props.theme.colors.primary}15;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ErrorPanel = styled.div`
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.error}10;
  border-top: 1px solid ${props => props.theme.colors.error}30;
`;

const ErrorTitle = styled.h4`
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
  color: ${props => props.theme.colors.error};
  font-size: ${props => props.theme.fontSizes.md};
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-family: ${props => props.theme.fonts.family.mono};
  font-size: ${props => props.theme.fontSizes.sm};
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.background.card};
  border-radius: ${props => props.theme.borderRadius.sm};
  border: 1px solid ${props => props.theme.colors.error}30;
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const ExternalLinkButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.primary};
  border-radius: ${props => props.theme.borderRadius.sm};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.primary}15;
  }
`;

export default StatusSummary; 