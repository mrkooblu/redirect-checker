import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { 
  FiCheck, FiX, FiArrowRight, FiAlertTriangle, FiInfo, 
  FiCopy, FiExternalLink, FiLock, 
  FiUnlock, FiChevronDown, FiChevronUp, FiClock, FiCode, FiArrowDown,
  FiTrendingUp, FiSearch, FiLink, FiZap, FiBarChart2
} from 'react-icons/fi';
import Image from 'next/image';
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

// Define animations
const pulseAnimation = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 0.8; }
  100% { opacity: 0.6; }
`;

const ResultsView: React.FC<ResultsViewProps> = ({ result, isLoading, error, onCheckAnother }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'chain' | 'headers' | 'raw'>('summary');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    summary: false,
    timeline: false,
    details: false,
    performance: false
  });
  const [copied, setCopied] = useState<string | null>(null);

  // Calculate SEO Impact Score based on redirect characteristics
  const calculateSeoImpactScore = (): number => {
    if (!result) return 0;
    
    let score = 100; // Start with perfect score
    
    // Deduct for redirect chain length
    if (result.steps.length > 1) {
      score -= (result.steps.length - 1) * 5; // -5 points per redirect
    }
    
    // Deduct for HTTP (non-HTTPS) URLs
    if (result.steps.some(step => !step.url.startsWith('https://'))) {
      score -= 15;
    }
    
    // Deduct for 4xx or 5xx status codes
    if (result.steps.some(step => step.statusCode >= 400)) {
      score -= 30;
    }
    
    // Deduct for redirect loops
    const urls = new Set();
    let hasLoop = false;
    for (const step of result.steps) {
      if (urls.has(step.url)) {
        hasLoop = true;
        break;
      }
      urls.add(step.url);
    }
    if (hasLoop) {
      score -= 25;
    }
    
    // Deduct for temporary redirects (302, 307)
    if (result.steps.some(step => step.statusCode === 302 || step.statusCode === 307)) {
      score -= 10;
    }
    
    // Ensure score doesn't go below 0
    return Math.max(0, score);
  };
  
  // Get score deduction details for visual breakdown
  const getScoreDeductions = (): Array<{factor: string, deduction: number, detected: boolean}> => {
    if (!result) return [];
    
    return [
      {
        factor: 'Redirect Chain Length',
        deduction: result.steps.length > 1 ? (result.steps.length - 1) * 5 : 0,
        detected: result.steps.length > 1
      },
      {
        factor: 'Non-HTTPS URLs',
        deduction: result.steps.some(step => !step.url.startsWith('https://')) ? 15 : 0,
        detected: result.steps.some(step => !step.url.startsWith('https://'))
      },
      {
        factor: 'Error Status Codes (4xx/5xx)',
        deduction: result.steps.some(step => step.statusCode >= 400) ? 30 : 0,
        detected: result.steps.some(step => step.statusCode >= 400)
      },
      {
        factor: 'Redirect Loops',
        deduction: (() => {
          const urls = new Set();
          for (const step of result.steps) {
            if (urls.has(step.url)) {
              return 25;
            }
            urls.add(step.url);
          }
          return 0;
        })(),
        detected: (() => {
          const urls = new Set();
          for (const step of result.steps) {
            if (urls.has(step.url)) {
              return true;
            }
            urls.add(step.url);
          }
          return false;
        })()
      },
      {
        factor: 'Temporary Redirects (302/307)',
        deduction: result.steps.some(step => step.statusCode === 302 || step.statusCode === 307) ? 10 : 0,
        detected: result.steps.some(step => step.statusCode === 302 || step.statusCode === 307)
      }
    ];
  };
  
  // Get the SEO Impact description based on score
  const getSeoImpactDescription = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    if (score >= 30) return 'Poor';
    return 'Critical';
  };
  
  // Get recommendation based on result
  const getResultBasedRecommendation = (): { title: string, description: string, cta: string, link: string } => {
    if (!result) {
      return {
        title: 'Optimize your website',
        description: 'Discover opportunities to improve your SEO',
        cta: 'Try Semrush',
        link: 'https://www.semrush.com/signup/'
      };
    }
    
    // For sites with many redirects
    if (result.steps.length > 3) {
      return {
        title: 'Too many redirects detected',
        description: 'Long redirect chains can slow down your website and waste crawl budget',
        cta: 'Fix redirect chains with Semrush',
        link: 'https://www.semrush.com/siteaudit/'
      };
    }
    
    // For mixed HTTP/HTTPS
    if (result.steps.some(step => step.url.startsWith('http:')) && 
        result.steps.some(step => step.url.startsWith('https:'))) {
      return {
        title: 'Mixed HTTP/HTTPS content',
        description: 'Mixed content can lead to security warnings and affect user trust',
        cta: 'Fix security issues with Semrush Site Audit',
        link: 'https://www.semrush.com/siteaudit/'
      };
    }
    
    // For 4xx or 5xx errors
    if (result.steps.some(step => step.statusCode >= 400)) {
      return {
        title: 'Error status codes detected',
        description: 'Error pages can negatively impact user experience and SEO',
        cta: 'Find and fix broken links with Semrush',
        link: 'https://www.semrush.com/analytics/backlinks/'
      };
    }
    
    // For temporary redirects
    if (result.steps.some(step => step.statusCode === 302 || step.statusCode === 307)) {
      return {
        title: 'Temporary redirects found',
        description: 'Consider using permanent (301) redirects for SEO benefits',
        cta: 'Learn redirect best practices with Semrush',
        link: 'https://www.semrush.com/blog/301-vs-302-redirect/'
      };
    }
    
    // Default recommendation
    return {
      title: 'Analyze your competition',
      description: 'See how your redirects compare to industry standards',
      cta: 'Try Semrush competitive analysis',
      link: 'https://www.semrush.com/analytics/overview/'
    };
  };

  // Don't show result content if loading or error or no result
  if (isLoading) {
    return (
      <ResultsContainer>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>
            Checking URL and following redirects...
            <LoadingSubtext>This may take a moment depending on the number of redirects</LoadingSubtext>
          </LoadingText>
          <PlaceholderContent />
        </LoadingContainer>
      </ResultsContainer>
    );
  }
  
  if (error || !result) {
    return (
      <ResultsContainer>
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

  // Toggle collapsible sections
  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Semrush promotion - determine which tools to recommend based on the results
  const getSemrushRecommendations = () => {
    if (!result) return [];
    
    const recommendations = [];
    
    // Check for redirect chains
    if (result.steps.length > 2) {
      recommendations.push({
        issue: 'Multiple redirects detected',
        description: 'Long redirect chains can slow down your website and waste crawl budget',
        tool: 'Log File Analyzer',
        link: 'https://www.semrush.com/log-file-analyzer/'
      });
    }
    
    // Check for mixed HTTP/HTTPS
    if (result.steps.some(step => step.url.startsWith('http:')) && 
        result.steps.some(step => step.url.startsWith('https:'))) {
      recommendations.push({
        issue: 'Mixed HTTP/HTTPS content',
        description: 'Mixed content can lead to security warnings and affect user trust',
        tool: 'Site Audit',
        link: 'https://www.semrush.com/siteaudit/'
      });
    }
    
    // Check for 4xx or 5xx errors
    if (result.steps.some(step => step.statusCode >= 400)) {
      recommendations.push({
        issue: 'Error status codes detected',
        description: 'Error pages can negatively impact user experience and SEO',
        tool: 'On Page SEO Checker',
        link: 'https://www.semrush.com/on-page-seo-checker/'
      });
    }
    
    // If slow redirect (simulate with multiple redirects)
    if (result.totalTime && result.totalTime > 1000) {
      recommendations.push({
        issue: 'Slow redirects detected',
        description: 'Slow redirects can hurt user experience and SEO performance',
        tool: 'Site Audit',
        link: 'https://www.semrush.com/siteaudit/'
      });
    }
    
    // If no specific issues found, recommend general tools
    if (recommendations.length === 0) {
      recommendations.push({
        issue: 'Optimize your SEO strategy',
        description: 'Discover more opportunities to improve your website\'s performance',
        tool: 'Semrush Suite',
        link: 'https://www.semrush.com/signup/'
      });
    }
    
    return recommendations;
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
      
      {/* Results First - Breadcrumbs Navigation */}
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
      
      {/* Key Findings Summary with Result-Based Recommendation */}
      <KeyFindingsCard>
        <KeyFindingsHeader>
          <FiInfo size={18} />
          <span>Key Findings</span>
        </KeyFindingsHeader>
        <KeyFindingsContent>
          {/* Result-Based Recommendation */}
          <ResultBasedRecommendation>
            <RecIcon><FiZap size={20} /></RecIcon>
            <RecContent>
              <RecTitle>{getResultBasedRecommendation().title}</RecTitle>
              <RecDescription>{getResultBasedRecommendation().description}</RecDescription>
            </RecContent>
            <RecCta 
              href={getResultBasedRecommendation().link} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {getResultBasedRecommendation().cta} <FiExternalLink size={14} />
            </RecCta>
          </ResultBasedRecommendation>
          
          {/* SEO Impact Score Summary */}
          <SeoImpactSummary>
            <SeoScoreCircle score={calculateSeoImpactScore()}>
              {calculateSeoImpactScore()}
            </SeoScoreCircle>
            <SeoSummaryDetails>
              <SeoSummaryTitle>SEO Impact Score: <strong>{getSeoImpactDescription(calculateSeoImpactScore())}</strong></SeoSummaryTitle>
              <SeoSummaryDescription>
                {getScoreDeductions().filter(item => item.detected).length > 0 
                  ? `${getScoreDeductions().filter(item => item.detected).length} issues detected`
                  : "No issues detected"}
              </SeoSummaryDescription>
            </SeoSummaryDetails>
          </SeoImpactSummary>
        </KeyFindingsContent>
      </KeyFindingsCard>
      
      {/* Simplified Action Buttons */}
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
        </TabContainer>
        
        <ActionButtons>
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
          {/* Performance Insights with Educational Content */}
          <CollapsibleSection>
            <SectionHeader onClick={() => toggleSection('performance')}>
              <SectionTitle>
                <FiBarChart2 size={18} />
                <span>Performance Insights & SEO Impact</span>
              </SectionTitle>
              <CollapseButton>
                {collapsedSections.performance ? <FiChevronDown size={18} /> : <FiChevronUp size={18} />}
              </CollapseButton>
            </SectionHeader>
            {!collapsedSections.performance && (
              <SectionContent>
                {/* SEO Impact Score Detailed */}
                <SeoImpactContainer>
                  <SeoScoreHeader>
                    <FiBarChart2 size={18} />
                    <span>SEO Impact Score</span>
                  </SeoScoreHeader>
                  <SeoScoreContent>
                    <SeoScoreCircle score={calculateSeoImpactScore()}>
                      {calculateSeoImpactScore()}
                    </SeoScoreCircle>
                    <SeoScoreDetails>
                      <SeoScoreRating>{getSeoImpactDescription(calculateSeoImpactScore())}</SeoScoreRating>
                      <SeoScoreDescription>
                        This simplified score reflects the potential SEO impact of your redirect setup.
                      </SeoScoreDescription>
                    </SeoScoreDetails>
                  </SeoScoreContent>
                  
                  {/* Score Breakdown Section */}
                  <ScoreBreakdownSection>
                    <ScoreBreakdownHeader>
                      Score Breakdown
                    </ScoreBreakdownHeader>
                    
                    {/* Visual Bar Chart */}
                    <ScoreBar>
                      <ScoreBarFull>
                        <ScoreBarText>Perfect Score: 100</ScoreBarText>
                      </ScoreBarFull>
                    </ScoreBar>
                    
                    {/* Deduction Factors */}
                    {getScoreDeductions().map((item, index) => (
                      item.detected && (
                        <DeductionItem key={index}>
                          <DeductionInfo>
                            <DeductionFactor>
                              <DeductionIcon>
                                <FiAlertTriangle size={14} />
                              </DeductionIcon>
                              <span>{item.factor}</span>
                            </DeductionFactor>
                            <DeductionPoints>-{item.deduction} points</DeductionPoints>
                          </DeductionInfo>
                          <DeductionBar>
                            <DeductionBarTrack>
                              <DeductionBarFill deduction={item.deduction} />
                            </DeductionBarTrack>
                          </DeductionBar>
                        </DeductionItem>
                      )
                    ))}
                    
                    {/* Final Score */}
                    <FinalScoreItem>
                      <FinalScoreLabel>Your SEO Impact Score</FinalScoreLabel>
                      <FinalScoreValue score={calculateSeoImpactScore()}>
                        {calculateSeoImpactScore()}
                      </FinalScoreValue>
                    </FinalScoreItem>
                  </ScoreBreakdownSection>
                  
                  {/* Only show explanations if issues are detected */}
                  {getScoreDeductions().some(item => item.detected) && (
                    <ContextualExplanations>
                      <ExplanationsHeader>What These Issues Mean</ExplanationsHeader>
                      
                      {getScoreDeductions()
                        .filter(item => item.detected)
                        .map((item, index) => (
                          <ExplanationItem key={index}>
                            <ExplanationIcon>
                              <FiInfo size={16} />
                            </ExplanationIcon>
                            <ExplanationContent>
                              <ExplanationTitle>
                                {item.factor} <span style={{ color: '#EF4444' }}>(-{item.deduction} points)</span>
                              </ExplanationTitle>
                              <ExplanationText>
                                {getExplanationText(item.factor)}
                              </ExplanationText>
                              {/* Add contextual educational link */}
                              {item.factor === 'Redirect Chain Length' && (
                                <ContextualLink href="https://www.semrush.com/blog/redirects/" target="_blank" rel="noopener noreferrer">
                                  Learn more about redirect chains <FiExternalLink size={12} />
                                </ContextualLink>
                              )}
                              {item.factor === 'Non-HTTPS URLs' && (
                                <ContextualLink href="https://www.semrush.com/blog/http-vs-https/" target="_blank" rel="noopener noreferrer">
                                  Learn more about HTTPS security <FiExternalLink size={12} />
                                </ContextualLink>
                              )}
                              {item.factor === 'Temporary Redirects (302/307)' && (
                                <ContextualLink href="https://www.semrush.com/blog/301-vs-302-redirect/" target="_blank" rel="noopener noreferrer">
                                  Learn more about redirect types <FiExternalLink size={12} />
                                </ContextualLink>
                              )}
                              {item.factor === 'Temporary Redirects (302/307)' && (
                                <ContextualLink href="https://www.semrush.com/blog/307-redirect/" target="_blank" rel="noopener noreferrer">
                                  Learn about 307 redirects <FiExternalLink size={12} />
                                </ContextualLink>
                              )}
                            </ExplanationContent>
                          </ExplanationItem>
                        ))
                      }
                    </ContextualExplanations>
                  )}
                </SeoImpactContainer>
                
                {/* Educational Content about redirects */}
                <EducationalContent>
                  <EducationalHeader>Why redirects matter for SEO</EducationalHeader>
                  <EducationalList>
                    <EducationalItem>
                      <EducationalNumber>1</EducationalNumber>
                      <EducationalText>
                        <strong>Link Equity Preservation:</strong> Proper redirects preserve your hard-earned link equity and authority from old pages.
                      </EducationalText>
                    </EducationalItem>
                    <EducationalItem>
                      <EducationalNumber>2</EducationalNumber>
                      <EducationalText>
                        <strong>User Experience:</strong> Good redirects ensure visitors reach their intended destination, reducing bounce rates.
                      </EducationalText>
                    </EducationalItem>
                    <EducationalItem>
                      <EducationalNumber>3</EducationalNumber>
                      <EducationalText>
                        <strong>Crawl Budget Efficiency:</strong> Minimizing redirect chains helps search engines crawl your site more efficiently.
                      </EducationalText>
                    </EducationalItem>
                    <EducationalItem>
                      <EducationalNumber>4</EducationalNumber>
                      <EducationalText>
                        <strong>Site Migrations:</strong> Properly implemented redirects are crucial during website migrations to maintain rankings.
                      </EducationalText>
                    </EducationalItem>
                  </EducationalList>
                </EducationalContent>
              </SectionContent>
            )}
          </CollapsibleSection>
          
          {/* Technical Details */}
          <CollapsibleSection>
            <SectionHeader onClick={() => toggleSection('details')}>
              <SectionTitle>
                <FiCode size={18} />
                <span>Technical Details</span>
              </SectionTitle>
              <CollapseButton>
                {collapsedSections.details ? <FiChevronDown size={18} /> : <FiChevronUp size={18} />}
              </CollapseButton>
            </SectionHeader>
            {!collapsedSections.details && (
              <SectionContent>
                {result && <StatusSummary result={result} />}
              </SectionContent>
            )}
          </CollapsibleSection>
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
      
      {/* Consolidated Semrush CTA */}
      <ConsolidatedSemrushCTA>
        <SemrushCTAContent>
          <SemrushCTALeft>
            <SemrushCTALogo>
              <Image 
                src="/images/semrush-logo-black-font.png" 
                alt="Semrush logo" 
                width={120} 
                height={35}
                priority
              />
            </SemrushCTALogo>
            <SemrushCTAText>
              {result.steps.length > 3 ? 
                "Fix redirect chains and other technical SEO issues with Semrush's complete Site Audit tool" :
                "Compare your redirects to competitors and discover more SEO opportunities with Semrush"}
            </SemrushCTAText>
          </SemrushCTALeft>
          <SemrushCTAButton 
            href="https://www.semrush.com/siteaudit/" 
            target="_blank"
            rel="noopener noreferrer"
          >
            Try For Free <FiExternalLink size={14} />
          </SemrushCTAButton>
        </SemrushCTAContent>
      </ConsolidatedSemrushCTA>
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

// Helper function to get explanation text for each factor
const getExplanationText = (factor: string): string => {
  switch (factor) {
    case 'Redirect Chain Length':
      return 'Each redirect adds latency and can waste crawl budget. Keep chains as short as possible by redirecting directly to the final destination.';
    case 'Non-HTTPS URLs':
      return 'HTTPS is a ranking factor and builds user trust. Modern browsers may also show security warnings for HTTP content.';
    case 'Error Status Codes (4xx/5xx)':
      return 'Error codes can damage user experience and SEO. Ensure all redirects lead to valid, accessible pages.';
    case 'Redirect Loops':
      return 'Loops create infinite redirect cycles that browsers will eventually stop following, resulting in error pages for users.';
    case 'Temporary Redirects (302/307)':
      return 'Temporary redirects do not pass full link equity. Use 301 (permanent) redirects for SEO benefit unless the redirect is genuinely temporary.';
    default:
      return 'This factor affects your overall SEO performance.';
  }
};

// Styled Components
const ResultsContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
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
  border-bottom: 1px solid ${props => props.theme.colors.border};
  padding: ${props => props.theme.spacing.xs} 0;
  margin-bottom: ${props => props.theme.spacing.md};
  
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
  background-color: ${props => props.isActive ? props.theme.colors.primary + '15' : 'transparent'};
  color: ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.text.secondary};
  border: none;
  border-bottom: 2px solid ${props => props.isActive ? props.theme.colors.primary : 'transparent'};
  border-radius: ${props => `${props.theme.borderRadius.sm} ${props.theme.borderRadius.sm} 0 0`};
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: ${props => props.isActive ? props.theme.fonts.weights.medium : props.theme.fonts.weights.regular};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    background-color: ${props => props.isActive ? props.theme.colors.primary + '15' : props.theme.colors.background.secondary};
    color: ${props => props.theme.colors.primary};
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

const RawDataContent = styled.div`
  padding: ${props => props.theme.spacing.md};
`;

const CollapsibleSection = styled.div`
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  overflow: hidden;
  margin-bottom: ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.background.card};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.background.secondary + '80'};
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
  
  /* Add spacing between elements in section content */
  & > div:not(:last-child) {
    margin-bottom: ${props => props.theme.spacing.lg};
  }
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

const PostResultsCTA = styled.div`
  margin-top: ${props => props.theme.spacing.xl};
  background-color: #030F4D;
  border-radius: ${props => props.theme.borderRadius.md};
  overflow: hidden;
`;

const CTAContent = styled.div`
  display: flex;
  padding: ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    gap: ${props => props.theme.spacing.md};
  }
`;

const CTALeft = styled.div`
  flex: 3;
`;

const CTARight = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CTATitle = styled.h3`
  color: white;
  font-size: ${props => props.theme.fontSizes.xl};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const CTADescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const CTAButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${props => props.theme.spacing.sm};
  }
`;

const CTAPrimaryButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background-color: #FF622D;
  color: white;
  padding: ${props => `${props.theme.spacing.sm} ${props.theme.spacing.md}`};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-weight: ${props => props.theme.fonts.weights.medium};
  text-decoration: none;
  
  &:hover {
    background-color: #E55A29;
    text-decoration: none;
  }
`;

const CTASecondaryButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background-color: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.4);
  padding: ${props => `${props.theme.spacing.sm} ${props.theme.spacing.md}`};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-weight: ${props => props.theme.fonts.weights.medium};
  text-decoration: none;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    text-decoration: none;
  }
`;

const CTAIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  color: #FF622D;
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

const PlaceholderContent = styled.div`
  height: 200px;
  background-color: ${props => props.theme.colors.background.secondary}30;
  border-radius: ${props => props.theme.borderRadius.md};
  margin-top: ${props => props.theme.spacing.xl};
  opacity: 0.6;
  animation: ${pulseAnimation} 1.5s infinite ease-in-out;
`;

// Semrush Banner Styles
const SemrushBanner = styled.div`
  display: flex;
  align-items: center;
  background-color: #FFD540;
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${props => props.theme.spacing.sm};
  }
`;

const SemrushLogo = styled.div`
  display: flex;
  align-items: center;
  margin-right: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    margin-right: 0;
    margin-bottom: ${props => props.theme.spacing.xs};
  }
`;

const SemrushCTALogoWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  margin: 0 ${props => props.theme.spacing.xs};
`;

const SemrushBannerText = styled.div`
  flex: 1;
  color: #000000;
  font-weight: ${props => props.theme.fonts.weights.medium};
`;

const SemrushCTAButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background-color: #FF622D;
  color: white;
  padding: ${props => `${props.theme.spacing.sm} ${props.theme.spacing.md}`};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-weight: ${props => props.theme.fonts.weights.medium};
  text-decoration: none;
  white-space: nowrap;
  
  &:hover {
    background-color: #E55A29;
    text-decoration: none;
  }
`;

// Update the existing EducationalContent component to be more semantic
const EducationalList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.md};
`;

// Add new ContextualLink component
const ContextualLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.primary};
  font-size: ${props => props.theme.fontSizes.sm};
  margin-top: ${props => props.theme.spacing.xs};
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

// Add new styled components for the enhanced UI
const KeyFindingsCard = styled.div`
  background-color: ${props => props.theme.colors.background.card};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  margin-bottom: ${props => props.theme.spacing.md};
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const KeyFindingsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background.secondary};
  font-weight: ${props => props.theme.fonts.weights.medium};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const KeyFindingsContent = styled.div`
  padding: ${props => props.theme.spacing.md};
`;

const SeoImpactSummary = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.md};
  padding-top: ${props => props.theme.spacing.md};
  border-top: 1px solid ${props => props.theme.colors.border}50;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const SeoSummaryDetails = styled.div`
  flex: 1;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
    margin-top: ${props => props.theme.spacing.sm};
  }
`;

const SeoSummaryTitle = styled.div`
  font-size: ${props => props.theme.fontSizes.md};
  margin-bottom: ${props => props.theme.spacing.xs};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    text-align: center;
  }
`;

const SeoSummaryDescription = styled.div`
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.text.secondary};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    text-align: center;
  }
`;

const ConsolidatedSemrushCTA = styled.div`
  background-color: #FFD540;
  border-radius: ${props => props.theme.borderRadius.md};
  margin-top: ${props => props.theme.spacing.lg};
  overflow: hidden;
`;

const SemrushCTAContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${props => props.theme.spacing.md};
  }
`;

const SemrushCTALeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const SemrushCTALogo = styled.div`
`;

const SemrushCTAText = styled.div`
  font-weight: ${props => props.theme.fonts.weights.medium};
  color: #000000;
`;

const EducationalHeader = styled.div`
  font-size: ${props => props.theme.fontSizes.md};
  font-weight: ${props => props.theme.fonts.weights.medium};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const EducationalContent = styled.div`
  padding: ${props => props.theme.spacing.md};
`;

const EducationalItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const EducationalNumber = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: ${props => props.theme.fonts.weights.semibold};
  color: white;
`;

const EducationalText = styled.div`
  flex: 1;
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: ${props => props.theme.fonts.weights.medium};
`;

const ScoreBreakdownSection = styled.div`
  margin-top: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.md};
  border-top: 1px solid ${props => props.theme.colors.border};
`;

const ScoreBreakdownHeader = styled.h4`
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  font-size: ${props => props.theme.fontSizes.md};
  font-weight: ${props => props.theme.fonts.weights.medium};
`;

const ScoreBar = styled.div`
  margin: ${props => props.theme.spacing.md} 0;
`;

const ScoreBarFull = styled.div`
  height: 30px;
  background-color: ${props => props.theme.colors.success}40;
  border-radius: ${props => props.theme.borderRadius.sm};
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 ${props => props.theme.spacing.md};
`;

const ScoreBarText = styled.span`
  font-weight: ${props => props.theme.fonts.weights.medium};
  color: ${props => props.theme.colors.text.secondary};
`;

const DeductionItem = styled.div`
  margin: ${props => props.theme.spacing.sm} 0;
`;

const DeductionInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const DeductionFactor = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: ${props => props.theme.fonts.weights.medium};
`;

const DeductionIcon = styled.span`
  color: ${props => props.theme.colors.warning};
`;

const DeductionPoints = styled.span`
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: ${props => props.theme.fonts.weights.semibold};
  color: ${props => props.theme.colors.error};
`;

const DeductionBar = styled.div`
  margin: ${props => props.theme.spacing.xs} 0;
`;

const DeductionBarTrack = styled.div`
  height: 8px;
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  overflow: hidden;
`;

const DeductionBarFill = styled.div<{ deduction: number }>`
  height: 100%;
  width: ${props => `${Math.min(100, props.deduction * 2)}%`}; // Scale for visibility
  background-color: ${props => props.theme.colors.error};
`;

const FinalScoreItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${props => props.theme.spacing.md};
  padding-top: ${props => props.theme.spacing.md};
  border-top: 1px dashed ${props => props.theme.colors.border};
`;

const FinalScoreLabel = styled.span`
  font-size: ${props => props.theme.fontSizes.md};
  font-weight: ${props => props.theme.fonts.weights.medium};
`;

const FinalScoreValue = styled.span<{ score: number }>`
  font-size: ${props => props.theme.fontSizes.lg};
  font-weight: ${props => props.theme.fonts.weights.semibold};
  color: ${props => {
    if (props.score >= 90) return props.theme.colors.success;
    if (props.score >= 70) return props.theme.colors.warning;
    if (props.score >= 50) return props.theme.colors.info;
    return props.theme.colors.error;
  }};
`;

const ContextualExplanations = styled.div`
  margin-top: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background.secondary}40;
  border-radius: ${props => props.theme.borderRadius.md};
`;

const ExplanationsHeader = styled.h4`
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  font-size: ${props => props.theme.fontSizes.md};
  font-weight: ${props => props.theme.fonts.weights.medium};
`;

const ExplanationItem = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const ExplanationIcon = styled.div`
  color: ${props => props.theme.colors.info};
  flex-shrink: 0;
  margin-top: 2px;
`;

const ExplanationContent = styled.div`
  flex: 1;
`;

const ExplanationTitle = styled.h4`
  margin-bottom: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.fontSizes.md};
  font-weight: ${props => props.theme.fonts.weights.semibold};
  color: ${props => props.theme.colors.text.primary};
`;

const ExplanationText = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.text.secondary};
`;

const ResultBasedRecommendation = styled.div`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background.card};
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: ${props => props.theme.spacing.md};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${props => props.theme.spacing.md};
  }
`;

const RecIcon = styled.div`
  margin-right: ${props => props.theme.spacing.md};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    margin-right: 0;
  }
`;

const RecContent = styled.div`
  flex: 1;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
  }
`;

const RecTitle = styled.h3`
  margin: 0 0 ${props => props.theme.spacing.xs} 0;
  font-size: ${props => props.theme.fontSizes.md};
  font-weight: ${props => props.theme.fonts.weights.medium};
`;

const RecDescription = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.text.secondary};
`;

const RecCta = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background-color: ${props => props.theme.colors.primary};
  color: white;
  padding: ${props => `${props.theme.spacing.sm} ${props.theme.spacing.md}`};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-weight: ${props => props.theme.fonts.weights.medium};
  text-decoration: none;
  
  &:hover {
    background-color: ${props => props.theme.colors.primary}80;
    text-decoration: none;
  }

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
    justify-content: center;
  }
`;

const SeoImpactContainer = styled.div`
  margin-top: 0;
  padding: 0;
  background-color: transparent;
  border-radius: 0;
  border: none;
`;

const SeoScoreHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.fontSizes.lg};
  font-weight: ${props => props.theme.fonts.weights.medium};
`;

const SeoScoreContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.md} 0;
`;

const SeoScoreCircle = styled.div<{ score: number }>`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: ${props => {
    if (props.score >= 90) return props.theme.colors.success;
    if (props.score >= 70) return props.theme.colors.warning;
    if (props.score >= 50) return props.theme.colors.info;
    return props.theme.colors.error;
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => props.theme.fontSizes.xl};
  font-weight: ${props => props.theme.fonts.weights.semibold};
  color: white;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    margin: 0 auto;
    width: 65px;
    height: 65px;
    font-size: ${props => props.theme.fontSizes.xl};
  }
`;

const SeoScoreDetails = styled.div`
  flex: 1;
`;

const SeoScoreRating = styled.div`
  margin-bottom: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.fontSizes.md};
  font-weight: ${props => props.theme.fonts.weights.medium};
`;

const SeoScoreDescription = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.fontSizes.sm};
`;

const SeoScoreAction = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background-color: ${props => props.theme.colors.primary};
  color: white;
  padding: ${props => `${props.theme.spacing.sm} ${props.theme.spacing.md}`};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-weight: ${props => props.theme.fonts.weights.medium};
  text-decoration: none;
  
  &:hover {
    background-color: ${props => props.theme.colors.primary}80;
    text-decoration: none;
  }
`;

export default ResultsView; 