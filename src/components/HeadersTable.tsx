import React, { useState, useMemo, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { RedirectResult } from '@/types/redirect';
import { FiSearch, FiFilter, FiX, FiChevronUp, FiChevronDown, FiCopy, FiCheck, FiInfo, FiClock } from 'react-icons/fi';

interface HeadersTableProps {
  result: RedirectResult;
}

// Common header categories with color coding
const HEADER_CATEGORIES = {
  'security': {
    headers: ['strict-transport-security', 'content-security-policy', 'x-content-type-options', 'x-frame-options', 'x-xss-protection'],
    color: '#3498db',
    description: 'Security-related headers that help protect against common web vulnerabilities'
  },
  'caching': {
    headers: ['cache-control', 'expires', 'etag', 'last-modified', 'age'],
    color: '#2ecc71',
    description: 'Headers that control how content is cached by browsers and proxies'
  },
  'content': {
    headers: ['content-type', 'content-length', 'content-encoding', 'content-language', 'content-disposition'],
    color: '#9b59b6',
    description: 'Headers that describe the content being transferred'
  },
  'cors': {
    headers: ['access-control-allow-origin', 'access-control-allow-methods', 'access-control-allow-headers', 'access-control-max-age'],
    color: '#e67e22',
    description: 'Cross-Origin Resource Sharing headers that control cross-domain access'
  },
  'cookie': {
    headers: ['set-cookie'],
    color: '#e74c3c',
    description: 'Headers related to cookies and session management'
  }
};

// Header descriptions for tooltips
const HEADER_DESCRIPTIONS: Record<string, string> = {
  'strict-transport-security': 'Enforces secure (HTTPS) connections to the server',
  'content-security-policy': 'Controls resources the user agent is allowed to load',
  'x-content-type-options': 'Prevents browsers from MIME-sniffing a response from the declared content-type',
  'x-frame-options': 'Indicates whether a browser should be allowed to render a page in a frame/iframe',
  'content-type': 'Indicates the media type of the resource',
  'cache-control': 'Directives for caching mechanisms in both requests and responses',
  'expires': 'The date/time after which the response is considered stale',
  'etag': 'Unique identifier for a specific version of a resource',
  'set-cookie': 'Send a cookie to the client',
  'access-control-allow-origin': 'Indicates whether the response can be shared with resources with the given origin',
  'content-length': 'The size of the resource, in decimal bytes',
  'server': 'Information about the software used by the origin server',
  'x-xss-protection': 'Enables Cross-site scripting (XSS) filtering in browsers',
  'last-modified': 'The last modification date of the resource',
  'location': 'Indicates the URL to redirect to',
  'transfer-encoding': 'Specifies the form of encoding used to transfer the resource',
};

const HeadersTable: React.FC<HeadersTableProps> = ({ result }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStep, setSelectedStep] = useState<number>(
    result?.steps?.length ? result.steps.length - 1 : 0
  );
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [copiedHeader, setCopiedHeader] = useState<string | null>(null);
  const [expandedHeaders, setExpandedHeaders] = useState<string[]>([]);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check for mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);

  // Reset to the last step when result changes
  useEffect(() => {
    if (result?.steps?.length) {
      setSelectedStep(result.steps.length - 1);
    }
  }, [result]);

  // Hide tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Define getHeaderCategory function before it's used
  const getHeaderCategory = (name: string): string | null => {
    for (const [category, info] of Object.entries(HEADER_CATEGORIES)) {
      if (info.headers.includes(name)) {
        return category;
      }
    }
    return 'other';
  };
  
  // Define getCategoryColor function before it's used
  const getCategoryColor = (category: string): string => {
    return HEADER_CATEGORIES[category as keyof typeof HEADER_CATEGORIES]?.color || '#95a5a6';
  };

  const handleCopyHeader = (headerName: string, headerValue: string) => {
    navigator.clipboard.writeText(`${headerName}: ${headerValue}`);
    setCopiedHeader(headerName);
    setTimeout(() => setCopiedHeader(null), 2000);
  };

  const toggleHeaderExpand = (headerName: string) => {
    setExpandedHeaders(prev => 
      prev.includes(headerName) 
        ? prev.filter(name => name !== headerName) 
        : [...prev, headerName]
    );
  };

  const toggleControlsVisibility = () => {
    setIsControlsVisible(prev => !prev);
  };

  const isHeaderExpanded = (headerName: string) => {
    return expandedHeaders.includes(headerName) || !isMobileView;
  };

  const getPerformanceIndicator = (headerName: string, value: string) => {
    // Example of header-specific performance indicators
    if (headerName === 'cache-control' && value.includes('max-age')) {
      const maxAge = parseInt(value.match(/max-age=(\d+)/)?.[1] || '0');
      if (maxAge > 86400) return { rating: 'fast' as const, label: 'Long cache' };
      if (maxAge > 3600) return { rating: 'medium' as const, label: 'Medium cache' };
      if (maxAge > 0) return { rating: 'slow' as const, label: 'Short cache' };
      return { rating: 'slow' as const, label: 'No cache' };
    }
    
    if (headerName === 'content-encoding' && (value.includes('gzip') || value.includes('br'))) {
      return { rating: 'fast' as const, label: 'Compressed' };
    }
    
    return null;
  };

  const headers = useMemo(() => {
    if (!result?.steps?.[selectedStep]?.headers) {
      return [];
    }

    const headersObj = result.steps[selectedStep].headers;
    
    // Convert headers object to array
    let headersArray = Object.entries(headersObj).map(([name, value]) => ({
      name: name.toLowerCase(),
      value,
      category: getHeaderCategory(name.toLowerCase()),
      performance: getPerformanceIndicator(name.toLowerCase(), value)
    }));

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      headersArray = headersArray.filter(
        header => header.name.toLowerCase().includes(term) || 
                  header.value.toLowerCase().includes(term)
      );
    }

    // Filter by category
    if (filterCategory) {
      headersArray = headersArray.filter(header => header.category === filterCategory);
    }

    // Sort headers
    headersArray.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

    return headersArray;
  }, [result, selectedStep, searchTerm, filterCategory, sortOrder]);

  // Group headers by category
  const groupedHeaders = useMemo(() => {
    if (!groupByCategory) return null;
    
    const groups: Record<string, typeof headers> = {
      'security': [],
      'caching': [],
      'content': [],
      'cors': [],
      'cookie': [],
      'other': []
    };
    
    headers.forEach(header => {
      const category = header.category || 'other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(header);
    });
    
    // Remove empty categories
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) delete groups[key];
    });
    
    return groups;
  }, [headers, groupByCategory]);

  return (
    <TableContainer>
      <TableHeader>
        <h2>HTTP Headers</h2>
        <StepSelector>
          {result?.steps?.map((step, index) => (
            <StepButton
              key={index}
              onClick={() => setSelectedStep(index)}
              isActive={selectedStep === index}
            >
              Step {index + 1}: {step.statusCode}
            </StepButton>
          ))}
        </StepSelector>
      </TableHeader>
      
      {isMobileView && (
        <MobileToggle onClick={toggleControlsVisibility}>
          {isControlsVisible ? 'Hide Filters' : 'Show Filters'}
          {isControlsVisible ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
        </MobileToggle>
      )}

      {(!isMobileView || isControlsVisible) && (
        <ControlsBar>
          <SearchWrapper>
            <SearchIcon>
              <FiSearch />
            </SearchIcon>
            <SearchInput 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search headers..."
            />
            {searchTerm && (
              <ClearSearchButton onClick={() => setSearchTerm('')}>
                <FiX size={16} />
              </ClearSearchButton>
            )}
          </SearchWrapper>

          <ActionButtons>
            <FilterDropdown>
              <FilterButton>
                <FiFilter size={14} />
                <span>Filter</span>
              </FilterButton>
              <DropdownContent>
                <DropdownItem 
                  isActive={filterCategory === null} 
                  onClick={() => setFilterCategory(null)}
                >
                  All Headers
                </DropdownItem>
                <DropdownDivider />
                {Object.entries(HEADER_CATEGORIES).map(([category, info]) => (
                  <DropdownItem 
                    key={category} 
                    isActive={filterCategory === category}
                    onClick={() => setFilterCategory(category)}
                  >
                    <CategoryColor style={{ backgroundColor: info.color }} />
                    <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                  </DropdownItem>
                ))}
              </DropdownContent>
            </FilterDropdown>

            <SortButton onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
              {sortOrder === 'asc' ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
              <span>Sort</span>
            </SortButton>

            <GroupButton 
              isActive={groupByCategory}
              onClick={() => setGroupByCategory(!groupByCategory)}
            >
              Group
            </GroupButton>
          </ActionButtons>
        </ControlsBar>
      )}

      {/* Headers Summary */}
      <HeadersSummary>
        Found <strong>{headers.length}</strong> headers
        {searchTerm && ` matching "${searchTerm}"`}
        {filterCategory && ` in category "${filterCategory}"`}
      </HeadersSummary>

      {/* Headers Table */}
      {headers.length === 0 ? (
        <NoHeadersMessage>No headers found for this request step.</NoHeadersMessage>
      ) : groupByCategory && groupedHeaders ? (
        // Grouped view
        <GroupedView>
          {Object.entries(groupedHeaders).map(([category, categoryHeaders]) => (
            <HeaderGroup key={category}>
              <GroupHeader>
                <CategoryName>
                  <CategoryColor style={{ backgroundColor: getCategoryColor(category) }} />
                  {category.charAt(0).toUpperCase() + category.slice(1)} Headers
                </CategoryName>
                <HeaderCount>{categoryHeaders.length}</HeaderCount>
              </GroupHeader>
              
              <CategoryDescription>
                {HEADER_CATEGORIES[category as keyof typeof HEADER_CATEGORIES]?.description || 
                'Miscellaneous headers not belonging to a specific category'}
              </CategoryDescription>
              
              <HeadersList>
                {categoryHeaders.map((header, index) => (
                  <HeaderItem key={index}>
                    <HeaderNameCell
                      onClick={() => isMobileView && toggleHeaderExpand(header.name)}
                      expanded={isHeaderExpanded(header.name)}
                    >
                      <HeaderNameContent>
                        {header.name}
                        {HEADER_DESCRIPTIONS[header.name] && (
                          <InfoIconWrapper 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowTooltip(showTooltip === header.name ? null : header.name);
                            }}
                          >
                            <FiInfo size={14} />
                            {showTooltip === header.name && (
                              <Tooltip ref={tooltipRef}>
                                {HEADER_DESCRIPTIONS[header.name]}
                              </Tooltip>
                            )}
                          </InfoIconWrapper>
                        )}
                        {header.performance && (
                          <PerformanceBadge rating={header.performance.rating}>
                            <FiClock size={12} />
                            <span>{header.performance.label}</span>
                          </PerformanceBadge>
                        )}
                        {isMobileView && (
                          <ExpandIndicator>
                            {isHeaderExpanded(header.name) ? (
                              <FiChevronUp size={16} />
                            ) : (
                              <FiChevronDown size={16} />
                            )}
                          </ExpandIndicator>
                        )}
                      </HeaderNameContent>
                      <CopyButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyHeader(header.name, header.value);
                        }}
                        title="Copy header"
                      >
                        {copiedHeader === header.name ? <FiCheck size={14} /> : <FiCopy size={14} />}
                      </CopyButton>
                    </HeaderNameCell>
                    {isHeaderExpanded(header.name) && (
                      <HeaderValueCell>
                        {header.value}
                      </HeaderValueCell>
                    )}
                  </HeaderItem>
                ))}
              </HeadersList>
            </HeaderGroup>
          ))}
        </GroupedView>
      ) : (
        // Flat view
        <HeadersList>
          {headers.map((header, index) => (
            <HeaderItem key={index}>
              <HeaderNameCell
                onClick={() => isMobileView && toggleHeaderExpand(header.name)}
                expanded={isHeaderExpanded(header.name)}
              >
                <HeaderNameContent>
                  {header.category !== 'other' && (
                    <CategoryBadge style={{ backgroundColor: getCategoryColor(header.category || 'other') }} />
                  )}
                  {header.name}
                  {HEADER_DESCRIPTIONS[header.name] && (
                    <InfoIconWrapper 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTooltip(showTooltip === header.name ? null : header.name);
                      }}
                    >
                      <FiInfo size={14} />
                      {showTooltip === header.name && (
                        <Tooltip ref={tooltipRef}>
                          {HEADER_DESCRIPTIONS[header.name]}
                        </Tooltip>
                      )}
                    </InfoIconWrapper>
                  )}
                  {header.performance && (
                    <PerformanceBadge rating={header.performance.rating}>
                      <FiClock size={12} />
                      <span>{header.performance.label}</span>
                    </PerformanceBadge>
                  )}
                  {isMobileView && (
                    <ExpandIndicator>
                      {isHeaderExpanded(header.name) ? (
                        <FiChevronUp size={16} />
                      ) : (
                        <FiChevronDown size={16} />
                      )}
                    </ExpandIndicator>
                  )}
                </HeaderNameContent>
                <CopyButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyHeader(header.name, header.value);
                  }}
                  title="Copy header"
                >
                  {copiedHeader === header.name ? <FiCheck size={14} /> : <FiCopy size={14} />}
                </CopyButton>
              </HeaderNameCell>
              {isHeaderExpanded(header.name) && (
                <HeaderValueCell>
                  {header.value}
                </HeaderValueCell>
              )}
            </HeaderItem>
          ))}
        </HeadersList>
      )}
    </TableContainer>
  );
};

// Styled Components
const TableContainer = styled.div`
  background-color: ${props => props.theme.colors.background.card};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.card};
  margin-bottom: ${props => props.theme.spacing.xl};
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  h2 {
    margin: 0;
    font-size: ${props => props.theme.fontSizes.xl};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
    
    h2 {
      margin-bottom: ${props => props.theme.spacing.md};
    }
  }
`;

const StepSelector = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  flex-wrap: wrap;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
    overflow-x: auto;
    padding-bottom: ${props => props.theme.spacing.xs};
    
    /* Add scrollbar styling */
    &::-webkit-scrollbar {
      height: 4px;
    }
    
    &::-webkit-scrollbar-track {
      background: ${props => props.theme.colors.background.secondary};
      border-radius: 2px;
    }
    
    &::-webkit-scrollbar-thumb {
      background-color: ${props => props.theme.colors.border};
      border-radius: 2px;
    }
  }
`;

const MobileToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.background.secondary}30;
  border: none;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  font-size: ${props => props.theme.fontSizes.md};
  font-weight: ${props => props.theme.fonts.weights.medium};
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.secondary}50;
  }
  
  @media (min-width: 769px) {
    display: none;
  }
`;

interface StepButtonProps {
  isActive: boolean;
}

const StepButton = styled.button<StepButtonProps>`
  background-color: ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.background.card};
  color: ${props => props.isActive ? 'white' : props.theme.colors.text.primary};
  border: 1px solid ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.fontSizes.sm};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.background.secondary};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
    white-space: nowrap;
    flex: 0 0 auto;
  }
`;

const ControlsBar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.background.secondary}10;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${props => props.theme.spacing.md};
  }
`;

const SearchWrapper = styled.div`
  position: relative;
  flex: 1;
  max-width: 400px;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    max-width: 100%;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: ${props => props.theme.spacing.sm};
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.text.secondary};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.sm} ${props => props.theme.spacing.sm} ${props => props.theme.spacing.xl};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.fontSizes.sm};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}20;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  }
`;

const ClearSearchButton = styled.button`
  position: absolute;
  right: ${props => props.theme.spacing.sm};
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    justify-content: flex-end;
  }
`;

const FilterDropdown = styled.div`
  position: relative;
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background-color: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.fontSizes.sm};
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.secondary};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  }
`;

const DropdownContent = styled.div`
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: ${props => props.theme.spacing.xs};
  background-color: ${props => props.theme.colors.background.card};
  box-shadow: ${props => props.theme.shadows.md};
  border-radius: ${props => props.theme.borderRadius.md};
  min-width: 200px;
  z-index: 10;
  display: none;
  
  ${FilterDropdown}:hover & {
    display: block;
  }
`;

const DropdownDivider = styled.div`
  height: 1px;
  background-color: ${props => props.theme.colors.border};
  margin: ${props => props.theme.spacing.xs} 0;
`;

interface DropdownItemProps {
  isActive?: boolean;
}

const DropdownItem = styled.div<DropdownItemProps>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  cursor: pointer;
  background-color: ${props => props.isActive ? props.theme.colors.primary + '10' : 'transparent'};
  color: ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.text.primary};
  
  &:hover {
    background-color: ${props => props.theme.colors.background.secondary};
  }
  
  &:first-child {
    border-top-left-radius: ${props => props.theme.borderRadius.sm};
    border-top-right-radius: ${props => props.theme.borderRadius.sm};
  }
  
  &:last-child {
    border-bottom-left-radius: ${props => props.theme.borderRadius.sm};
    border-bottom-right-radius: ${props => props.theme.borderRadius.sm};
  }
`;

const CategoryColor = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: ${props => props.theme.spacing.md};
`;

const SortButton = styled(FilterButton)``;

interface GroupButtonProps {
  isActive: boolean;
}

const GroupButton = styled(FilterButton)<GroupButtonProps>`
  background-color: ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.background.card};
  color: ${props => props.isActive ? 'white' : props.theme.colors.text.primary};
  border-color: ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.border};
  
  &:hover {
    background-color: ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.background.secondary};
  }
`;

const HeadersSummary = styled.div`
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.text.secondary};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const NoHeadersMessage = styled.div`
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  color: ${props => props.theme.colors.text.secondary};
`;

const GroupedView = styled.div`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg} ${props => props.theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};
`;

const HeaderGroup = styled.div`
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  overflow: hidden;
`;

const GroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background.secondary}50;
`;

const CategoryName = styled.div`
  display: flex;
  align-items: center;
  font-weight: ${props => props.theme.fonts.weights.medium};
`;

const HeaderCount = styled.div`
  font-size: ${props => props.theme.fontSizes.xs};
  background-color: ${props => props.theme.colors.background.secondary};
  padding: 2px ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
`;

const CategoryDescription = styled.div`
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.text.secondary};
  padding: 0 ${props => props.theme.spacing.md} ${props => props.theme.spacing.sm};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const HeadersList = styled.div`
  display: flex;
  flex-direction: column;
`;

const HeaderItem = styled.div`
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  &:last-child {
    border-bottom: none;
  }
`;

interface HeaderNameCellProps {
  expanded: boolean;
}

const HeaderNameCell = styled.div<HeaderNameCellProps>`
  position: relative;
  padding: ${props => props.theme.spacing.md};
  font-weight: ${props => props.theme.fonts.weights.medium};
  background-color: ${props => props.theme.colors.background.secondary}20;
  word-break: break-all;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  @media (max-width: 768px) {
    cursor: pointer;
    min-height: 48px;
    padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.md};
    ${props => props.expanded && `
      border-bottom: 1px dashed ${props.theme.colors.border};
    `}
  }
`;

const HeaderNameContent = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  gap: ${props => props.theme.spacing.xs};
`;

const ExpandIndicator = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  color: ${props => props.theme.colors.text.secondary};
`;

const HeaderValueCell = styled.div`
  padding: ${props => props.theme.spacing.md};
  font-family: ${props => props.theme.fonts.family.mono};
  font-size: ${props => props.theme.fontSizes.sm};
  word-break: break-all;
  
  @media (max-width: 768px) {
    padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.md};
    background-color: ${props => props.theme.colors.background.secondary}10;
  }
`;

const CategoryBadge = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: ${props => props.theme.spacing.sm};
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme.colors.text.secondary};
  padding: ${props => props.theme.spacing.xs};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
  }
  
  @media (max-width: 768px) {
    padding: ${props => props.theme.spacing.md};
  }
`;

const InfoIconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-left: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.info};
  cursor: pointer;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const Tooltip = styled.div`
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background.card};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.fontSizes.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  box-shadow: ${props => props.theme.shadows.md};
  width: 200px;
  text-align: center;
  z-index: 100;
  font-weight: normal;
  
  &:after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-bottom-color: ${props => props.theme.colors.background.card};
  }
`;

interface PerformanceBadgeProps {
  rating: 'fast' | 'medium' | 'slow';
}

const PerformanceBadge = styled.div<PerformanceBadgeProps>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background-color: ${props => {
    switch (props.rating) {
      case 'fast': return props.theme.colors.success + '30';
      case 'medium': return props.theme.colors.warning + '30';
      case 'slow': return props.theme.colors.error + '30';
      default: return props.theme.colors.background.secondary;
    }
  }};
  color: ${props => {
    switch (props.rating) {
      case 'fast': return props.theme.colors.success;
      case 'medium': return props.theme.colors.warning;
      case 'slow': return props.theme.colors.error;
      default: return props.theme.colors.text.secondary;
    }
  }};
  padding: 2px ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.fontSizes.xs};
  margin-left: ${props => props.theme.spacing.sm};
  
  span {
    line-height: 1;
  }
`;

export default HeadersTable; 