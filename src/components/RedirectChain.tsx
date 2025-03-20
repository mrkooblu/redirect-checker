import React, { useState } from 'react';
import styled from 'styled-components';
import { RedirectResult, RedirectStep } from '@/types/redirect';
import { getStatusCodeClass, getStatusDescription } from '@/utils/redirectUtils';
import { FiArrowDown, FiExternalLink, FiCode, FiChevronDown, FiChevronUp, FiArrowRight } from 'react-icons/fi';

interface RedirectChainProps {
  result: RedirectResult;
}

const RedirectChain: React.FC<RedirectChainProps> = ({ result }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  if (!result || !result.steps || result.steps.length <= 1) {
    return null;
  }

  const toggleExpandStep = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <ChainContainer>
      <ChainHeader>
        <h2>Redirect Chain</h2>
        <ChainSummary>
          {result.steps.length} steps • {result.redirectCount} redirects
        </ChainSummary>
      </ChainHeader>
      
      {/* Vertical Timeline View */}
      <VerticalTimelineContainer>
        {result.steps.map((step, index) => (
          <TimelineItem 
            key={index}
            onClick={() => toggleExpandStep(index)}
            isExpanded={expandedIndex === index}
            className={getStatusCodeClass(step.statusCode)}
          >
            <TimelineConnector 
              isFirst={index === 0} 
              isLast={index === result.steps.length - 1}
            >
              <StepIndicator className={getStatusCodeClass(step.statusCode)}>
                <StepNumber>{index + 1}</StepNumber>
              </StepIndicator>
              {index < result.steps.length - 1 && (
                <ConnectorLine className={getStatusCodeClass(step.statusCode)}>
                  <FiArrowDown size={16} />
                </ConnectorLine>
              )}
            </TimelineConnector>
            
            <TimelineContent>
              <TimelineHeader>
                <StatusBadge className={getStatusCodeClass(step.statusCode)}>
                  {step.statusCode}
                </StatusBadge>
                <StepInfo>
                  <StepUrl>{truncateUrl(step.url)}</StepUrl>
                  <StepStatusText>{getStatusDescription(step.statusCode)}</StepStatusText>
                </StepInfo>
                <ExpandButton>
                  {expandedIndex === index ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                </ExpandButton>
              </TimelineHeader>
              
              {expandedIndex === index && (
                <TimelineDetails>
                  <DetailSection>
                    <DetailLabel>Full URL</DetailLabel>
                    <DetailValue>
                      <FullUrl>{step.url}</FullUrl>
                      <ViewStepLink href={step.url} target="_blank" rel="noopener noreferrer">
                        <FiExternalLink size={14} />
                        <span>Visit</span>
                      </ViewStepLink>
                    </DetailValue>
                  </DetailSection>
                  
                  {step.location && (
                    <DetailSection>
                      <DetailLabel>Location Header</DetailLabel>
                      <DetailValue>
                        <LocationUrl>{step.location}</LocationUrl>
                      </DetailValue>
                    </DetailSection>
                  )}
                  
                  {step.headers && (
                    <DetailSection>
                      <DetailLabel>Key Headers</DetailLabel>
                      <HeadersList>
                        {getImportantHeaders(step.headers).map((header, headerIndex) => (
                          <HeaderItem key={headerIndex}>
                            <HeaderName>{header.name}:</HeaderName>
                            <HeaderValue>{header.value}</HeaderValue>
                          </HeaderItem>
                        ))}
                        {Object.keys(step.headers).length > 5 && (
                          <MoreHeadersNote>
                            + {Object.keys(step.headers).length - 5} more headers (see Headers tab)
                          </MoreHeadersNote>
                        )}
                      </HeadersList>
                    </DetailSection>
                  )}
                </TimelineDetails>
              )}
            </TimelineContent>
          </TimelineItem>
        ))}
      </VerticalTimelineContainer>
      
      <ChainLegend>
        <LegendTitle>LEGEND</LegendTitle>
        <LegendGrid>
          <LegendItem>
            <LegendBadge className="status-2xx">
              <LegendCode>2XX</LegendCode>
            </LegendBadge>
            <LegendLabel>Success</LegendLabel>
          </LegendItem>
          <LegendItem>
            <LegendBadge className="status-3xx">
              <LegendCode>3XX</LegendCode>
            </LegendBadge>
            <LegendLabel>Redirect</LegendLabel>
          </LegendItem>
          <LegendItem>
            <LegendBadge className="status-4xx">
              <LegendCode>4XX</LegendCode>
            </LegendBadge>
            <LegendLabel>Client Error</LegendLabel>
          </LegendItem>
          <LegendItem>
            <LegendBadge className="status-5xx">
              <LegendCode>5XX</LegendCode>
            </LegendBadge>
            <LegendLabel>Server Error</LegendLabel>
          </LegendItem>
        </LegendGrid>
      </ChainLegend>
    </ChainContainer>
  );
};

// Helper functions
const truncateUrl = (url: string, maxLength = 50) => {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
};

const getImportantHeaders = (headers: Record<string, string>) => {
  // Priority list of important headers
  const priorityHeaders = [
    'content-type',
    'cache-control',
    'server',
    'content-length',
    'set-cookie',
    'strict-transport-security',
    'x-frame-options',
    'x-content-type-options'
  ];
  
  const result = [];
  
  // First add the priority headers that exist
  for (const headerName of priorityHeaders) {
    if (headers[headerName]) {
      result.push({
        name: headerName,
        value: headers[headerName]
      });
      
      if (result.length >= 5) break;
    }
  }
  
  // If we still have room, add other headers
  if (result.length < 5) {
    const remainingHeaders = Object.entries(headers)
      .filter(([name]) => !priorityHeaders.includes(name.toLowerCase()))
      .slice(0, 5 - result.length);
    
    for (const [name, value] of remainingHeaders) {
      result.push({ name, value });
    }
  }
  
  return result;
};

// Styled Components
const ChainContainer = styled.div`
  background-color: ${props => props.theme.colors.background.card};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.card};
  margin-bottom: ${props => props.theme.spacing.xl};
  overflow: hidden;
  width: 100%;
`;

const ChainHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
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

const ChainSummary = styled.div`
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.text.secondary};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
`;

// New Vertical Timeline Components
const VerticalTimelineContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${props => props.theme.spacing.lg};
  position: relative;
`;

interface TimelineItemProps {
  isExpanded: boolean;
}

const TimelineItem = styled.div<TimelineItemProps>`
  display: flex;
  margin-bottom: ${props => props.theme.spacing.lg};
  cursor: pointer;
  position: relative;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  ${props => props.isExpanded && `
    z-index: 2;
  `}
`;

interface TimelineConnectorProps {
  isFirst: boolean;
  isLast: boolean;
}

const TimelineConnector = styled.div<TimelineConnectorProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-right: ${props => props.theme.spacing.md};
  position: relative;
  min-width: 40px;
`;

const StepIndicator = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.background.card};
  border: 2px solid ${props => props.theme.colors.border};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 2;
  
  &.status-2xx {
    background-color: ${props => props.theme.colors.success};
    border-color: ${props => props.theme.colors.success};
    color: white;
  }
  
  &.status-3xx {
    background-color: ${props => props.theme.colors.info};
    border-color: ${props => props.theme.colors.info};
    color: white;
  }
  
  &.status-4xx {
    background-color: ${props => props.theme.colors.warning};
    border-color: ${props => props.theme.colors.warning};
    color: white;
  }
  
  &.status-5xx {
    background-color: ${props => props.theme.colors.error};
    border-color: ${props => props.theme.colors.error};
    color: white;
  }
`;

const StepNumber = styled.div`
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: ${props => props.theme.fonts.weights.bold};
`;

const ConnectorLine = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${props => props.theme.colors.text.secondary};
  position: absolute;
  top: 30px;
  left: 14px;
  bottom: -30px;
  
  &.status-2xx {
    color: ${props => props.theme.colors.success};
  }
  
  &.status-3xx {
    color: ${props => props.theme.colors.info};
  }
  
  &.status-4xx {
    color: ${props => props.theme.colors.warning};
  }
  
  &.status-5xx {
    color: ${props => props.theme.colors.error};
  }
  
  /* Add dotted line */
  &::before {
    content: '';
    position: absolute;
    top: 10px;
    bottom: 16px;
    left: 50%;
    width: 2px;
    background: currentColor;
    opacity: 0.4;
  }
`;

const TimelineContent = styled.div`
  flex: 1;
  background-color: ${props => props.theme.colors.background.card};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
`;

const TimelineHeader = styled.div`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.secondary}50;
  }
`;

const TimelineDetails = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-top: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.background.secondary}20;
`;

const StepInfo = styled.div`
  flex: 1;
`;

// Keeping some of the existing styled components

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  height: 28px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-weight: ${props => props.theme.fonts.weights.bold};
  font-size: ${props => props.theme.fontSizes.sm};
  margin-right: ${props => props.theme.spacing.md};
  
  &.status-2xx {
    background-color: ${props => props.theme.colors.success}20;
    color: ${props => props.theme.colors.success};
  }
  
  &.status-3xx {
    background-color: ${props => props.theme.colors.info}20;
    color: ${props => props.theme.colors.info};
  }
  
  &.status-4xx {
    background-color: ${props => props.theme.colors.warning}20;
    color: ${props => props.theme.colors.warning};
  }
  
  &.status-5xx {
    background-color: ${props => props.theme.colors.error}20;
    color: ${props => props.theme.colors.error};
  }
`;

const StepUrl = styled.div`
  font-weight: ${props => props.theme.fonts.weights.medium};
  margin-bottom: 2px;
  word-break: break-all;
  line-height: 1.4;
`;

const StepStatusText = styled.div`
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.text.secondary};
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  margin-left: ${props => props.theme.spacing.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
    background-color: ${props => props.theme.colors.background.secondary}50;
    border-radius: 50%;
  }
`;

const DetailSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.div`
  font-size: ${props => props.theme.fontSizes.xs};
  text-transform: uppercase;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const DetailValue = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  word-break: break-all;
  font-family: ${props => props.theme.fonts.family.mono};
  font-size: ${props => props.theme.fontSizes.sm};
  background-color: ${props => props.theme.colors.background.secondary}30;
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
`;

const FullUrl = styled.div`
  flex: 1;
  line-height: 1.5;
  overflow-wrap: break-word;
`;

const LocationUrl = styled.div`
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.background.secondary}30;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-family: ${props => props.theme.fonts.family.mono};
  font-size: ${props => props.theme.fontSizes.sm};
  word-break: break-all;
  line-height: 1.5;
`;

const ViewStepLink = styled.a`
  display: flex;
  align-items: center;
  white-space: nowrap;
  margin-left: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  font-family: sans-serif;
  font-size: ${props => props.theme.fontSizes.sm};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  
  &:hover {
    background-color: ${props => props.theme.colors.primary}10;
    text-decoration: underline;
  }
  
  span {
    margin-left: ${props => props.theme.spacing.xs};
  }
`;

const HeadersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
  max-height: 300px;
  overflow-y: auto;
  background-color: ${props => props.theme.colors.background.secondary}20;
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
`;

const HeaderItem = styled.div`
  display: flex;
  font-size: ${props => props.theme.fontSizes.sm};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.background.card};
  border-radius: ${props => props.theme.borderRadius.sm};
`;

const HeaderName = styled.div`
  font-weight: ${props => props.theme.fonts.weights.medium};
  margin-right: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.secondary};
`;

const HeaderValue = styled.div`
  font-family: ${props => props.theme.fonts.family.mono};
  word-break: break-all;
`;

const MoreHeadersNote = styled.div`
  font-size: ${props => props.theme.fontSizes.xs};
  color: ${props => props.theme.colors.text.secondary};
  margin-top: ${props => props.theme.spacing.xs};
  font-style: italic;
  text-align: center;
`;

const ChainLegend = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border-top: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.background.secondary}50;
  border-radius: 0 0 ${props => props.theme.borderRadius.md} ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-top: none;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const LegendTitle = styled.div`
  font-size: ${props => props.theme.fontSizes.md};
  font-weight: ${props => props.theme.fonts.weights.bold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.lg};
  text-align: center;
`;

const LegendGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${props => props.theme.spacing.xl};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
    gap: ${props => props.theme.spacing.lg};
  }
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background.card};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const LegendBadge = styled.div`
  width: 60px;
  height: 60px;
  border-radius: ${props => props.theme.borderRadius.md};
  margin-right: ${props => props.theme.spacing.md};
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.status-2xx {
    background-color: ${props => props.theme.colors.success};
  }
  
  &.status-3xx {
    background-color: ${props => props.theme.colors.info};
  }
  
  &.status-4xx {
    background-color: ${props => props.theme.colors.warning};
  }
  
  &.status-5xx {
    background-color: ${props => props.theme.colors.error};
  }
`;

const LegendCode = styled.span`
  font-family: ${props => props.theme.fonts.family.mono};
  font-size: ${props => props.theme.fontSizes.lg};
  font-weight: ${props => props.theme.fonts.weights.bold};
  color: white;
`;

const LegendLabel = styled.div`
  font-size: ${props => props.theme.fontSizes.md};
  color: ${props => props.theme.colors.text.primary};
  font-weight: ${props => props.theme.fonts.weights.medium};
`;

export default RedirectChain; 