# URL Redirect Checker Application - Development Instructions

## Overview

This document provides instructions for developing a URL Redirect Checker application that allows users to:
- Check the HTTP status of any URL
- Track and analyze redirect chains
- View detailed HTTP response headers
- Export and save results

## Application Requirements

### Core Functionality
1. Accept user input for target URL(s)
2. Send HTTP requests to the provided URL(s)
3. Follow and track any redirects (301, 302, 307, etc.)
4. Display HTTP status codes for initial and final URLs
5. Show detailed response headers
6. Present results in a clear, organized interface

### Technology Stack
- Frontend: HTML, CSS, JavaScript (React recommended)
- Backend: Node.js with Express
- Optional: Database for saving historical checks

## UI Components

### URL Input Section
- Text input field for URL entry (with placeholder: "https://example.com")
- Option to check multiple URLs (batch processing)
- Submit button labeled "Check" or "Find redirects"
- Consider adding a "Canonical domain check" option checkbox

### Results Display
1. **Summary Section**
   - HTTP status code with color indicators:
     - 200-299: Green
     - 300-399: Blue
     - 400-499: Orange/Yellow
     - 500-599: Red
   - Redirect count (0 if none)
   - Final destination URL (if redirected)

2. **Detailed Response Headers Table**
   - Two-column layout (Header name | Value)
   - Include common headers:
     - Accept-Ranges
     - Age
     - Cache-Control
     - Cache Status
     - Content-Length
     - Content-Type
     - Date
     - ETag
     - Server
     - Security headers (X-Content-Type-Options, X-Frame-Options, etc.)

3. **Redirect Chain Visualization** (if redirects exist)
   - Sequential display of each hop in the redirect chain
   - Status code for each redirect
   - Notes about each redirect (e.g., "OK", "Temporary Redirect", etc.)

### Additional Features
- Export options: CSV, Sheets export
- Filter options for status codes and redirect types
- Settings panel for advanced configurations
- Mobile-responsive design

## API Implementation

### Request Handler
```javascript
// Pseudocode for request handler
async function checkUrl(url, options = {}) {
  const results = {
    initialUrl: url,
    statusCode: null,
    redirects: [],
    headers: {},
    finalUrl: url,
    error: null
  };
  
  try {
    // Make request with redirect following enabled
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': options.userAgent || 'Default Browser'
      }
    });
    
    // Capture final status and headers
    results.statusCode = response.status;
    results.headers = Object.fromEntries(response.headers.entries());
    results.finalUrl = response.url;
    
    // Calculate redirect count
    results.redirectCount = results.finalUrl !== url ? 1 : 0;
    
    return results;
  } catch (error) {
    results.error = error.message;
    return results;
  }
}
```

### Redirect Tracking
For detailed redirect chains, implement a more sophisticated approach:

```javascript
// Pseudocode for tracking full redirect chain
async function trackRedirectChain(url) {
  const chain = [];
  let currentUrl = url;
  let maxRedirects = 20; // Safety limit
  
  while (maxRedirects > 0) {
    const response = await fetch(currentUrl, {
      method: 'HEAD', // Use HEAD to be efficient
      redirect: 'manual' // Don't auto-follow
    });
    
    // Record this step
    chain.push({
      url: currentUrl,
      statusCode: response.status,
      statusText: response.statusText,
      location: response.headers.get('location')
    });
    
    // Check if we've reached the end
    if (response.status < 300 || response.status >= 400 || !response.headers.get('location')) {
      break;
    }
    
    // Continue to next URL
    currentUrl = new URL(response.headers.get('location'), currentUrl).href;
    maxRedirects--;
  }
  
  return chain;
}
```

## UI Implementation

### Main Layout Structure
```html
<div class="container">
  <header>
    <h1>HTTP Status and Redirect Checker</h1>
    <p>Check the HTTP status of any URL instantly with our free HTTP status & redirect checker. Review all response headers, client errors, and redirects.</p>
  </header>
  
  <div class="input-section">
    <input type="text" id="url-input" placeholder="https://example.com">
    <button id="check-button">Check</button>
  </div>
  
  <div class="results-section">
    <!-- Status summary -->
    <div class="status-summary">
      <div class="url-display"></div>
      <div class="status-code"></div>
    </div>
    
    <!-- Detailed results -->
    <div class="detailed-results">
      <h2>Response Headers</h2>
      <table class="headers-table">
        <!-- Headers will be inserted here -->
      </table>
    </div>
    
    <!-- Redirect chain (if applicable) -->
    <div class="redirect-chain">
      <!-- Redirect information will be inserted here -->
    </div>
  </div>
  
  <div class="export-options">
    <button id="export-csv">Download CSV</button>
    <button id="export-sheets">Export to Sheets</button>
  </div>
</div>
```

### Styling Considerations
- Use a clean, professional design with adequate spacing
- Implement responsive design for mobile compatibility
- Use color coding for status codes (green for 200s, orange for 400s, etc.)
- Consider a dark/light theme toggle
- Use a fixed-width font for technical data display

## Advanced Features

### Batch URL Processing
Allow users to check multiple URLs at once:
- Input box for multiple URLs (one per line)
- Bulk import from CSV
- Processing queue with progress indicator

### Historical Data
- Save previous checks with timestamps
- Allow users to compare results over time
- Implement simple analytics on common issues

### Security Checks
Extend functionality to evaluate:
- SSL certificate validity
- Security headers presence
- Mixed content warnings
- HSTS implementation

## Testing Recommendations
1. Test with a variety of URLs:
   - URLs with no redirects
   - URLs with single redirects
   - URLs with multiple redirect chains
   - URLs with different status codes (200, 404, 500, etc.)
   - Internationalized domain names
   - URLs with query parameters and fragments

2. Test edge cases:
   - Extremely long URLs
   - Circular redirects
   - Slow-responding websites
   - Malformed URLs

## Deployment Considerations
1. Set appropriate timeouts for requests
2. Implement rate limiting to prevent abuse
3. Consider caching results to improve performance
4. Add proper error handling for all network requests

## Resources and References
- HTTP Status Codes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
- HTTP Headers: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers
- Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

## Example Components and Styling

We've provided reference components and styling in the `docs/example-code` directory to help guide your implementation. This directory contains:

- **Components**: Check `docs/example-code/src/components` for reusable React components that demonstrate UI patterns similar to what's needed for this project. Pay special attention to the component structure and organization patterns.

- **Styling**: The `docs/example-code/src/styles` directory contains examples of styling approaches, including global styles, theming, and styled components implementation.

- **Project Structure**: The overall project structure follows best practices for a modern React application. Use this as a reference for organizing your code.

When implementing the redirect checker, leverage these examples to maintain consistency with our codebase's conventions and styling approach. You don't need to copy these components directly, but they serve as valuable references for architecture, styling patterns, and code organization.

This document provides the foundational requirements for developing a URL Redirect Checker application. The implementation should focus on accuracy, performance, and usability while maintaining a clean and intuitive user interface.