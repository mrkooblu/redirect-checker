import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FiCheck, FiChevronDown, FiChevronUp } from 'react-icons/fi';

interface UrlInputFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

// Array of example URLs that will rotate in the placeholder
const EXAMPLE_URLS = [
  'example.com',
  'github.com/redirect',
  'twitter.com',
  'wikipedia.org',
  'linkedin.com'
];

const UrlInputForm: React.FC<UrlInputFormProps> = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);
  const [userAgent, setUserAgent] = useState<string>('Default Browser');
  const [timeout, setTimeout] = useState<number>(10);
  const [placeholderIndex, setPlaceholderIndex] = useState<number>(0);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [batchUrls, setBatchUrls] = useState<string>('');

  // Validate URL as user types
  useEffect(() => {
    if (!url) {
      setIsValid(null);
      setError('');
      return;
    }

    // Basic URL validation - can be extended for more thorough validation
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/;
    const isValidUrl = urlPattern.test(url);
    
    setIsValid(isValidUrl);
    setError(isValidUrl ? '' : 'Please enter a valid URL');
  }, [url]);

  // Rotate placeholder examples
  useEffect(() => {
    if (!isFocused) {
      const interval = setInterval(() => {
        setPlaceholderIndex((prevIndex) => (prevIndex + 1) % EXAMPLE_URLS.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isFocused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!url) {
      setError('Please enter a URL');
      return;
    }
    
    // Clear any previous errors
    setError('');
    
    // Add protocol if not present
    let formattedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      formattedUrl = `https://${url}`;
    }
    
    onSubmit(formattedUrl);
  };

  // Quick action URLs to test
  const quickActionUrls = [
    { name: 'Google → Gmail', url: 'mail.google.com' },
    { name: 'Twitter → X', url: 'twitter.com' },
    { name: 'Bitly Links', url: 'bit.ly/2UQR3aw' }
  ];

  const handleQuickAction = (actionUrl: string) => {
    setUrl(actionUrl);
    setIsValid(true);
    setError('');
  };

  const toggleAdvanced = () => {
    setAdvancedOpen(!advancedOpen);
  };

  // Add a batch submit handler
  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!batchUrls) {
      setError('Please enter at least one URL');
      return;
    }
    
    // Get the first URL for demonstration (in a real app, you'd process all URLs)
    const urlList = batchUrls.split('\n').filter(u => u.trim());
    if (urlList.length === 0) {
      setError('Please enter at least one valid URL');
      return;
    }
    
    // Clear any previous errors
    setError('');
    
    // Format the first URL and submit
    let formattedUrl = urlList[0];
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }
    
    onSubmit(formattedUrl);
  };

  return (
    <FormContainer>
      <InputCard>
        <FormHeader>
          <h2>Check URL Redirects</h2>
          <FormDescription>
            Enter any URL below to check its HTTP status and redirect chain
          </FormDescription>
        </FormHeader>

        {mode === 'single' ? (
          <form onSubmit={handleSubmit}>
            <InputGroup>
              <InputWrapper 
                $isFocused={isFocused} 
                $isValid={isValid === true} 
                $isInvalid={isValid === false}
              >
                <StyledInput
                  type="text"
                  placeholder={`Try: ${EXAMPLE_URLS[placeholderIndex]}`}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
                {isValid && <ValidationIcon><FiCheck /></ValidationIcon>}
              </InputWrapper>
              <StyledButton type="submit" disabled={isLoading}>
                {isLoading ? 'Checking...' : 'Check'}
              </StyledButton>
            </InputGroup>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            
            <InputHelper>
              Protocol (http:// or https://) will be added automatically if missing
            </InputHelper>
            
            <QuickActionsSection>
              <QuickActionsLabel>Try these popular redirects:</QuickActionsLabel>
              <QuickActionsButtons>
                {quickActionUrls.map((action, index) => (
                  <QuickActionButton 
                    key={index} 
                    type="button"
                    onClick={() => handleQuickAction(action.url)}
                    disabled={isLoading}
                  >
                    {action.name}
                  </QuickActionButton>
                ))}
              </QuickActionsButtons>
            </QuickActionsSection>
            
            <AdvancedToggle onClick={toggleAdvanced} type="button">
              Advanced Options {advancedOpen ? <FiChevronUp /> : <FiChevronDown />}
            </AdvancedToggle>
            
            {advancedOpen && (
              <AdvancedSection>
                <AdvancedOption>
                  <AdvancedLabel>User Agent:</AdvancedLabel>
                  <AdvancedSelect
                    value={userAgent}
                    onChange={(e) => setUserAgent(e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="Default Browser">Default Browser</option>
                    <option value="Googlebot">Googlebot</option>
                    <option value="Bingbot">Bingbot</option>
                    <option value="Mobile Device">Mobile Device</option>
                  </AdvancedSelect>
                </AdvancedOption>
                
                <AdvancedOption>
                  <AdvancedLabel>Timeout (seconds):</AdvancedLabel>
                  <AdvancedInput
                    type="number"
                    min="1"
                    max="30"
                    value={timeout}
                    onChange={(e) => setTimeout(parseInt(e.target.value))}
                    disabled={isLoading}
                  />
                </AdvancedOption>
                
                <AdvancedOption>
                  <AdvancedLabel>Options:</AdvancedLabel>
                  <CheckboxGroup>
                    <CheckboxLabel>
                      <input type="checkbox" checked={true} disabled={isLoading} />
                      Follow redirects
                    </CheckboxLabel>
                    <CheckboxLabel>
                      <input type="checkbox" checked={true} disabled={isLoading} />
                      Show response headers
                    </CheckboxLabel>
                  </CheckboxGroup>
                </AdvancedOption>
              </AdvancedSection>
            )}
          </form>
        ) : (
          <form onSubmit={handleBatchSubmit}>
            <BatchInputWrapper>
              <BatchTextArea
                placeholder="Enter multiple URLs (one per line)&#10;example.com&#10;github.com&#10;wikipedia.org"
                value={batchUrls}
                onChange={(e) => setBatchUrls(e.target.value)}
                disabled={isLoading}
                rows={6}
              />
            </BatchInputWrapper>
            
            <InputGroup>
              <StyledButton type="submit" disabled={isLoading} style={{ marginLeft: 'auto' }}>
                {isLoading ? 'Checking...' : 'Check URLs'}
              </StyledButton>
            </InputGroup>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            
            <InputHelper>
              Enter one URL per line. Protocol (http:// or https://) will be added automatically if missing.
            </InputHelper>
          </form>
        )}
        
        <TabsContainer>
          <Tab $active={mode === 'single'} onClick={() => setMode('single')}>Single URL</Tab>
          <Tab $active={mode === 'batch'} onClick={() => setMode('batch')}>Batch Check</Tab>
        </TabsContainer>
      </InputCard>
    </FormContainer>
  );
};

const shine = keyframes`
  0% {
    background-position: -100px;
  }
  40%, 100% {
    background-position: 320px;
  }
`;

const focusAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

const FormContainer = styled.div`
  width: 100%;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const InputCard = styled.div`
  background-color: ${props => props.theme.colors.background.card};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.md};
  padding: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.xl};
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 6px;
    background: linear-gradient(90deg, 
      ${props => props.theme.colors.primary}, 
      ${props => props.theme.colors.success},
      ${props => props.theme.colors.info});
  }
`;

const FormHeader = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
  text-align: left;
  
  h2 {
    font-size: ${props => props.theme.fontSizes['2xl']};
    margin-bottom: ${props => props.theme.spacing.sm};
  }
`;

const FormDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.md};
`;

interface InputWrapperProps {
  $isFocused: boolean;
  $isValid: boolean;
  $isInvalid: boolean;
}

const InputWrapper = styled.div<InputWrapperProps>`
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  
  ${props => props.$isFocused && css`
    animation: ${focusAnimation} 0.3s ease;
  `}
  
  ${props => props.$isValid && css`
    & input {
      border-color: ${props.theme.colors.success};
    }
  `}
  
  ${props => props.$isInvalid && css`
    & input {
      border-color: ${props.theme.colors.error};
    }
  `}
`;

const InputGroup = styled.div`
  display: flex;
  width: 100%;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
  }
`;

const StyledInput = styled.input`
  flex: 1;
  width: 100%;
  padding: ${props => props.theme.spacing.md};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.fontSizes.md};
  outline: none;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}33;
  }
  
  &:disabled {
    background-color: ${props => props.theme.colors.background.secondary};
    cursor: not-allowed;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    margin-bottom: ${props => props.theme.spacing.sm};
  }
`;

const ValidationIcon = styled.div`
  position: absolute;
  right: 12px;
  color: ${props => props.theme.colors.success};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledButton = styled.button`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  margin-left: ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: ${props => props.theme.fonts.weights.semibold};
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.theme.colors.hover};
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    background-color: ${props => props.theme.colors.primary}80;
    cursor: not-allowed;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    margin-left: 0;
    width: 100%;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.3) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: rotate(30deg);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover:not(:disabled)::after {
    opacity: 1;
    animation: ${shine} 1.5s infinite;
  }
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.error};
  font-size: ${props => props.theme.fontSizes.sm};
  margin-top: ${props => props.theme.spacing.sm};
`;

const InputHelper = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.fontSizes.xs};
  margin-top: ${props => props.theme.spacing.xs};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const QuickActionsSection = styled.div`
  margin-top: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const QuickActionsLabel = styled.div`
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const QuickActionsButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.sm};
`;

const QuickActionButton = styled.button`
  background-color: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.theme.colors.background.secondary}; 
    border-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primary};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AdvancedToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.xs};
  background: none;
  border: none;
  color: ${props => props.theme.colors.primary};
  font-size: ${props => props.theme.fontSizes.sm};
  cursor: pointer;
  margin: ${props => props.theme.spacing.md} auto;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.sm};
  
  &:hover {
    background-color: ${props => props.theme.colors.primary}10;
  }
`;

const AdvancedSection = styled.div`
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.md};
`;

const AdvancedOption = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const AdvancedLabel = styled.label`
  display: block;
  margin-bottom: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: ${props => props.theme.fonts.weights.medium};
`;

const AdvancedInput = styled.input`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.fontSizes.sm};
  width: 100%;
  max-width: 120px;
`;

const AdvancedSelect = styled.select`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.fontSizes.sm};
  width: 100%;
  max-width: 200px;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.fontSizes.sm};
  
  input {
    margin: 0;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  margin-top: ${props => props.theme.spacing.xl};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

interface TabProps {
  $active: boolean;
}

const Tab = styled.button<TabProps>`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.text.secondary};
  font-weight: ${props => props.$active ? props.theme.fonts.weights.semibold : props.theme.fonts.weights.regular};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

// Add styled components for batch mode
const BatchInputWrapper = styled.div`
  position: relative;
  margin-bottom: ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  transition: all 0.2s ease;
  
  &:focus-within {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}30;
  }
`;

const BatchTextArea = styled.textarea`
  width: 100%;
  padding: ${props => props.theme.spacing.md};
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.fontSizes.md};
  resize: vertical;
  min-height: 120px;
  
  &:focus {
    outline: none;
  }
`;

export default UrlInputForm;