import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiCheck, FiX, FiArrowRight, FiAlertTriangle, FiInfo, 
  FiDownload, FiShare2, FiCopy, FiExternalLink, FiLock, 
  FiUnlock, FiChevronDown, FiChevronUp, FiClock, FiCode, FiArrowDown
} from 'react-icons/fi';
import { RedirectResult, RedirectStep } from '@/types/redirect';
import StatusSummary from './StatusSummary';
import RedirectChain from './RedirectChain';
import HeadersTable from './HeadersTable';

interface ResultsViewProps {
  result: RedirectResult | null;
  isLoading: boolean;
  error: string | null;
  onCheckAnother: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ result, isLoading, error, onCheckAnother }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'chain' | 'headers' | 'raw'>('summary');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    summary: false,
    timeline: false,
    details: false
  });
  const [copied, setCopied] = useState<string | null>(null);

  // Don't show result content if loading or error or no result
  if (isLoading || error || !result) {
    return (
      <ResultsContainer>
        {isLoading && (
          <LoadingContainer>
            <LoadingSpinner />
            <LoadingText>
              Checking URL and following redirects...
              <LoadingSubtext>This may take a moment depending on the number of redirects</LoadingSubtext>
            </LoadingText>
          </LoadingContainer>
        )}
        
        {error && (
          <ErrorContainer>
            <ErrorIcon>⚠️</ErrorIcon>
            <ErrorMessage>{error}</ErrorMessage>
            <ErrorAction onClick={() => onCheckAnother()}>Dismiss</ErrorAction>
          </ErrorContainer>
        )}
      </ResultsContainer>
    );
  }

  // Determine banner type based on result
  const getBannerType = (): 'success' | 'warning' | 'error' | 'info' => {
    if (!result) return 'info';
    
    // Check if there was an error
    if (result.error) return 'error';
    
    // Check final status code
    const finalStatus = result.steps[result.steps.length - 1]?.statusCode || 0;
    
    // Check if any step has an error status code
    const hasErrorStatus = result.steps.some(step => step.statusCode >= 400);
    if (hasErrorStatus || finalStatus >= 400) return 'error';
    
    // Check if there are redirects
    const hasRedirects = result.steps.length > 1;
    
    if (finalStatus >= 300) return 'warning'; // 3xx that didn't redirect further
    if (hasRedirects) return 'info'; // Successful with redirects
    return 'success'; // 2xx with no redirects
  };

  // Get banner message
  const getBannerMessage = (): string => {
    if (!result) return 'Processing request...';
    
    // Check for error in the result
    if (result.error) {
      return `Error: ${result.error}`;
    }
    
    const redirectCount = result.steps.length - 1;
    const finalStatus = result.steps[result.steps.length - 1]?.statusCode || 0;
    
    // Check for error status codes
    const hasErrorStatus = result.steps.some(step => step.statusCode >= 400);
    
    if (hasErrorStatus || finalStatus >= 400) {
      if (finalStatus >= 400 && finalStatus < 500) {
        return 'Client error encountered - check URL validity';
      } else if (finalStatus >= 500) {
        return 'Server error encountered - the destination server may be experiencing issues';
      }
      return 'Error encountered during redirect chain';
    }
    
    if (redirectCount === 0 && finalStatus >= 200 && finalStatus < 300) {
      return 'Direct connection successful with no redirects';
    }
    
    if (redirectCount > 0 && finalStatus >= 200 && finalStatus < 300) {
      return `Successfully followed ${redirectCount} redirect${redirectCount > 1 ? 's' : ''}`;
    }
    
    if (finalStatus >= 300 && finalStatus < 400) {
      return 'Redirect chain incomplete - ended with a redirect status';
    }
    
    return 'Request completed';
  };

  // Handle copy functionality
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
      })
      .catch(err => console.error('Failed to copy: ', err));
  };

  // Handle export functionality
  const handleExport = (format: 'json' | 'csv' | 'pdf') => {
    // For JSON export
    if (format === 'json') {
      const dataStr = JSON.stringify(result, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportFileName = `redirect-check-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();
    }
    
    // Placeholder for other formats (in a real app, these would be implemented)
    if (format === 'csv' || format === 'pdf') {
      console.log(`Export as ${format} would be implemented here`);
      alert(`Exporting as ${format.toUpperCase()} will be available soon!`);
    }
  };

  // Toggle collapsible sections
  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!result) return null;

  return (
    <ResultsContainer>
      {/* Success Banner */}
      <BannerWrapper type={getBannerType()}>
        <BannerIcon>
          {getBannerType() === 'success' && <FiCheck size={20} />}
          {getBannerType() === 'warning' && <FiAlertTriangle size={20} />}
          {getBannerType() === 'error' && <FiX size={20} />}
          {getBannerType() === 'info' && <FiInfo size={20} />}
        </BannerIcon>
        <BannerMessage>{getBannerMessage()}</BannerMessage>
        
        {/* Security Indicator */}
        <SecurityIndicator isSecure={result.steps[0]?.url?.startsWith('https://')}>
          {result.steps[0]?.url?.startsWith('https://') ? (
            <>
              <FiLock size={14} />
              <span>Secure</span>
            </>
          ) : (
            <>
              <FiUnlock size={14} />
              <span>Not Secure</span>
            </>
          )}
        </SecurityIndicator>
      </BannerWrapper>
      
      {/* Breadcrumbs Navigation */}
      <BreadcrumbsContainer>
        {result.steps.map((step, index) => (
          <BreadcrumbRow key={index}>
            <BreadcrumbItem 
              status={step.statusCode} 
              isFinal={index === result.steps.length - 1}
            >
              {getStatusIcon(step.statusCode)}
              <BreadcrumbUrl>{new URL(step.url).hostname}</BreadcrumbUrl>
              <BreadcrumbStatus>{step.statusCode}</BreadcrumbStatus>
            </BreadcrumbItem>
            
            {index < result.steps.length - 1 && (
              <BreadcrumbDivider>
                <FiArrowDown size={14} />
              </BreadcrumbDivider>
            )}
          </BreadcrumbRow>
        ))}
      </BreadcrumbsContainer>
      
      {/* Action Buttons */}
      <ActionBar>
        <TabContainer>
          <TabButton 
            isActive={activeTab === 'summary'} 
            onClick={() => setActiveTab('summary')}
          >
            <FiInfo size={16} />
            Summary
          </TabButton>
          <TabButton 
            isActive={activeTab === 'chain'} 
            onClick={() => setActiveTab('chain')}
          >
            <FiArrowRight size={16} />
            Redirect Chain
          </TabButton>
          <TabButton 
            isActive={activeTab === 'headers'} 
            onClick={() => setActiveTab('headers')}
          >
            <FiCode size={16} />
            Headers
          </TabButton>
          <TabButton 
            isActive={activeTab === 'raw'} 
            onClick={() => setActiveTab('raw')}
          >
            <FiCode size={16} />
            Raw Data
          </TabButton>
        </TabContainer>
        
        <ActionButtons>
          <ActionDropdown>
            <ActionButton>
              <FiDownload size={16} />
              Export
            </ActionButton>
            <DropdownContent>
              <DropdownItem onClick={() => handleExport('json')}>
                Export as JSON
              </DropdownItem>
              <DropdownItem onClick={() => handleExport('csv')}>
                Export as CSV
              </DropdownItem>
              <DropdownItem onClick={() => handleExport('pdf')}>
                Export as PDF
              </DropdownItem>
            </DropdownContent>
          </ActionDropdown>
          
          <ActionButton>
            <FiShare2 size={16} />
            Share
          </ActionButton>
          
          <ActionButton 
            onClick={() => handleCopy(JSON.stringify(result, null, 2), 'results')}
          >
            {copied === 'results' ? <FiCheck size={16} /> : <FiCopy size={16} />}
            {copied === 'results' ? 'Copied!' : 'Copy All'}
          </ActionButton>
        </ActionButtons>
      </ActionBar>
      
      {/* Tab Content */}
      <TabContent active={activeTab === 'summary'}>
        <SummaryView>
          {result && <StatusSummary result={result} />}
          
          {/* Performance Insights */}
          {result && (
            <PerformanceInsights>
              <InsightHeader>Performance Insights</InsightHeader>
              <InsightList>
                <InsightItem type={result.steps.length > 3 ? 'warning' : 'success'}>
                  <InsightIcon>
                    {result.steps.length > 3 ? <FiAlertTriangle size={16} /> : <FiCheck size={16} />}
                  </InsightIcon>
                  <InsightContent>
                    <InsightTitle>Redirect Chain Length</InsightTitle>
                    <InsightDescription>
                      {result.steps.length > 3
                        ? `Long redirect chain (${result.steps.length - 1} redirects) may impact load time`
                        : `Healthy redirect chain length (${result.steps.length - 1} redirects)`}
                    </InsightDescription>
                  </InsightContent>
                </InsightItem>
                
                <InsightItem type={result.steps.some(s => !s.url.startsWith('https://')) ? 'warning' : 'success'}>
                  <InsightIcon>
                    {result.steps.some(s => !s.url.startsWith('https://')) 
                      ? <FiAlertTriangle size={16} /> 
                      : <FiCheck size={16} />}
                  </InsightIcon>
                  <InsightContent>
                    <InsightTitle>HTTPS Usage</InsightTitle>
                    <InsightDescription>
                      {result.steps.some(s => !s.url.startsWith('https://'))
                        ? 'Mixed content: some URLs use insecure HTTP'
                        : 'All redirects use secure HTTPS'}
                    </InsightDescription>
                  </InsightContent>
                </InsightItem>
              </InsightList>
            </PerformanceInsights>
          )}
        </SummaryView>
      </TabContent>

      <TabContent active={activeTab === 'chain'}>
        <ChainView>
          <TimelineContainer>
            {result && <RedirectChain result={result} />}
          </TimelineContainer>
        </ChainView>
      </TabContent>

      <TabContent active={activeTab === 'headers'}>
        <HeadersView>
          {result && <HeadersTable result={result} />}
        </HeadersView>
      </TabContent>

      <TabContent active={activeTab === 'raw'}>
        <RawDataView>
          <RawDataHeader>
            <h3>Raw Response Data</h3>
            <CopyButton 
              onClick={() => handleCopy(JSON.stringify(result, null, 2), 'raw')}
            >
              {copied === 'raw' ? <FiCheck size={16} /> : <FiCopy size={16} />}
              {copied === 'raw' ? 'Copied!' : 'Copy'}
            </CopyButton>
          </RawDataHeader>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </RawDataView>
      </TabContent>

      {/* Actions */}
      <ActionsContainer>
        <BackButton onClick={onCheckAnother}>
          Check Another URL
        </BackButton>
      </ActionsContainer>
    </ResultsContainer>
  );
};

// Helper function to get status icon based on status code
const getStatusIcon = (status: number) => {
  if (status >= 200 && status < 300) {
    return <StatusIcon status={status}><FiCheck /></StatusIcon>;
  }
  if (status >= 300 && status < 400) {
    return <StatusIcon status={status}><FiArrowRight /></StatusIcon>;
  }
  if (status >= 400 && status < 500) {
    return <StatusIcon status={status}><FiX /></StatusIcon>;
  }
  if (status >= 500) {
    return <StatusIcon status={status}><FiAlertTriangle /></StatusIcon>;
  }
  return <StatusIcon status={0}><FiInfo /></StatusIcon>;
};

// Styled Components
const ResultsContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.xl};
  animation: fadeIn 0.3s ease-out;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

interface BannerProps {
  type: 'success' | 'warning' | 'error' | 'info';
}

const BannerWrapper = styled.div<BannerProps>`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  background-color: ${props => {
    switch (props.type) {
      case 'success': return props.theme.colors.success + '20';
      case 'warning': return props.theme.colors.warning + '20';
      case 'error': return props.theme.colors.error + '20';
      case 'info': return props.theme.colors.info + '20';
      default: return props.theme.colors.info + '20';
    }
  }};
  border-left: 4px solid ${props => {
    switch (props.type) {
      case 'success': return props.theme.colors.success;
      case 'warning': return props.theme.colors.warning;
      case 'error': return props.theme.colors.error;
      case 'info': return props.theme.colors.info;
      default: return props.theme.colors.info;
    }
  }};
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const BannerIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: ${props => props.theme.spacing.md};
  color: inherit;
`;

const BannerMessage = styled.div`
  flex: 1;
  font-weight: ${props => props.theme.fonts.weights.medium};
`;

interface SecurityIndicatorProps {
  isSecure: boolean;
}

const SecurityIndicator = styled.div<SecurityIndicatorProps>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  background-color: ${props => props.isSecure ? props.theme.colors.success + '20' : props.theme.colors.warning + '20'};
  color: ${props => props.isSecure ? props.theme.colors.success : props.theme.colors.warning};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.fontSizes.xs};
  font-weight: ${props => props.theme.fonts.weights.medium};
`;

const BreadcrumbsContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
  max-width: 100%;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  background-color: ${props => props.theme.colors.background.card};
`;

const BreadcrumbRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xs};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const BreadcrumbDivider = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.text.secondary};
  margin-left: 15px;
  height: 24px;
`;

interface BreadcrumbItemProps {
  status: number;
  isFinal: boolean;
}

const BreadcrumbItem = styled.div<BreadcrumbItemProps>`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
  background-color: ${props => {
    if (props.status >= 200 && props.status < 300) return props.theme.colors.success + '20';
    if (props.status >= 300 && props.status < 400) return props.theme.colors.primary + '20';
    if (props.status >= 400 && props.status < 500) return props.theme.colors.warning + '20';
    if (props.status >= 500) return props.theme.colors.error + '20';
    return props.theme.colors.background.secondary;
  }};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.fontSizes.sm};
  flex: 1; /* Take up available space */
  border: 1px solid ${props => {
    if (props.status >= 200 && props.status < 300) return props.theme.colors.success + '40';
    if (props.status >= 300 && props.status < 400) return props.theme.colors.primary + '40';
    if (props.status >= 400 && props.status < 500) return props.theme.colors.warning + '40';
    if (props.status >= 500) return props.theme.colors.error + '40';
    return props.theme.colors.border;
  }};
  
  ${props => props.isFinal && `
    border: 2px solid ${(() => {
      if (props.status >= 200 && props.status < 300) return props.theme.colors.success;
      if (props.status >= 300 && props.status < 400) return props.theme.colors.primary;
      if (props.status >= 400 && props.status < 500) return props.theme.colors.warning;
      if (props.status >= 500) return props.theme.colors.error;
      return props.theme.colors.primary;
    })()};
    font-weight: ${props.theme.fonts.weights.semibold};
  `}
`;

const BreadcrumbUrl = styled.span`
  margin: 0 ${props => props.theme.spacing.xs};
`;

const BreadcrumbStatus = styled.span`
  font-weight: ${props => props.theme.fonts.weights.medium};
`;

interface StatusIconProps {
  status: number;
}

const StatusIcon = styled.div<StatusIconProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => {
    if (props.status >= 200 && props.status < 300) return props.theme.colors.success;
    if (props.status >= 300 && props.status < 400) return props.theme.colors.primary;
    if (props.status >= 400 && props.status < 500) return props.theme.colors.warning;
    if (props.status >= 500) return props.theme.colors.error;
    return props.theme.colors.text.secondary;
  }};
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    gap: ${props => props.theme.spacing.md};
    align-items: flex-start;
  }
`;

const TabContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  overflow-x: auto;
  padding-bottom: ${props => props.theme.spacing.xs};
  
  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    display: none;
  }
  
  /* Hide scrollbar for IE, Edge and Firefox */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
  }
`;

interface TabButtonProps {
  isActive: boolean;
}

const TabButton = styled.button<TabButtonProps>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background-color: ${props => props.isActive ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.isActive ? 'white' : props.theme.colors.text.primary};
  border: 1px solid ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: ${props => props.isActive ? props.theme.fonts.weights.medium : props.theme.fonts.weights.regular};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    background-color: ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.background.secondary};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
    justify-content: flex-end;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.fontSizes.sm};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.secondary};
  }
`;

const ActionDropdown = styled.div`
  position: relative;
  
  &:hover > div {
    display: block;
  }
`;

const DropdownContent = styled.div`
  display: none;
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 180px;
  background-color: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  box-shadow: ${props => props.theme.shadows.md};
  z-index: 1;
  overflow: hidden;
`;

const DropdownItem = styled.button`
  width: 100%;
  text-align: left;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.fontSizes.sm};
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.secondary};
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.theme.colors.border};
  }
`;

const TabContent = styled.div<{ active: boolean }>`
  display: ${props => props.active ? 'block' : 'none'};
  margin-top: 20px;
`;

const SummaryView = styled.div`
  padding: 0;
`;

const ChainView = styled.div`
  padding: 0;
`;

const HeadersView = styled.div`
  padding: 0; /* HeadersTable has its own padding */
`;

const RawDataView = styled.div`
  padding: 0;
  
  pre {
    background-color: ${props => props.theme.colors.background.secondary};
    padding: ${props => props.theme.spacing.md};
    margin: 0;
    border-radius: ${props => props.theme.borderRadius.sm};
    overflow: auto;
    font-family: ${props => props.theme.fonts.family.mono};
    font-size: ${props => props.theme.fontSizes.sm};
    line-height: 1.5;
  }
`;

const RawDataHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.md} 0;
  
  h3 {
    margin: 0;
    font-size: ${props => props.theme.fontSizes.lg};
  }
`;

const CopyButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  background-color: transparent;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.fontSizes.sm};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.secondary};
    color: ${props => props.theme.colors.text.primary};
  }
`;

const CollapsibleSection = styled.div`
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  overflow: hidden;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background.secondary + '50'};
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.secondary};
  }
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSizes.md};
  font-weight: ${props => props.theme.fonts.weights.medium};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const CollapseButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SectionContent = styled.div`
  padding: ${props => props.theme.spacing.lg};
`;

const TimelineContainer = styled.div`
  margin-top: 0;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const PerformanceInsights = styled.div`
  margin-top: ${props => props.theme.spacing.md};
  padding: 0 ${props => props.theme.spacing.md};
`;

const InsightHeader = styled.h3`
  font-size: ${props => props.theme.fontSizes.md};
  font-weight: ${props => props.theme.fonts.weights.medium};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const InsightList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

interface InsightItemProps {
  type: 'success' | 'warning' | 'error' | 'info';
}

const InsightItem = styled.div<InsightItemProps>`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => {
    switch (props.type) {
      case 'success': return props.theme.colors.success + '10';
      case 'warning': return props.theme.colors.warning + '10';
      case 'error': return props.theme.colors.error + '10';
      case 'info': return props.theme.colors.info + '10';
      default: return props.theme.colors.background.secondary;
    }
  }};
  border-left: 4px solid ${props => {
    switch (props.type) {
      case 'success': return props.theme.colors.success;
      case 'warning': return props.theme.colors.warning;
      case 'error': return props.theme.colors.error;
      case 'info': return props.theme.colors.info;
      default: return props.theme.colors.border;
    }
  }};
  border-radius: ${props => props.theme.borderRadius.sm};
`;

const InsightIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const InsightContent = styled.div`
  flex: 1;
`;

const InsightTitle = styled.h4`
  margin: 0 0 ${props => props.theme.spacing.xs} 0;
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: ${props => props.theme.fonts.weights.medium};
`;

const InsightDescription = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.text.secondary};
`;

const ActionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 30px;
`;

const BackButton = styled.button`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background-color: ${props => props.theme.colors.primary}dd;
  }
`;

// Add styled components for loading and error states
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 30px 0;
  padding: 30px;
  text-align: center;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid ${props => props.theme.colors.background.secondary};
  border-top: 4px solid ${props => props.theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  font-size: 16px;
  color: ${props => props.theme.colors.text.primary};
`;

const LoadingSubtext = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  margin-top: 8px;
`;

const ErrorContainer = styled.div`
  background-color: ${props => props.theme.colors.error}10;
  border: 1px solid ${props => props.theme.colors.error}30;
  border-left: 4px solid ${props => props.theme.colors.error};
  border-radius: 8px;
  padding: 20px;
  margin: 30px 0;
  display: flex;
  align-items: center;
`;

const ErrorIcon = styled.div`
  font-size: 24px;
  margin-right: 15px;
`;

const ErrorMessage = styled.div`
  flex: 1;
  font-size: 16px;
  color: ${props => props.theme.colors.text.primary};
`;

const ErrorAction = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.primary};
  font-size: 14px;
  cursor: pointer;
  margin-left: 15px;
  
  &:hover {
    text-decoration: underline;
  }
`;

export default ResultsView; 