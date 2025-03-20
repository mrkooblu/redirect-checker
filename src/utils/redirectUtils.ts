import axios from 'axios';
import { RedirectResult, RedirectStep, UrlCheckOptions } from '@/types/redirect';

// Default options for URL checking
const defaultOptions: UrlCheckOptions = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36',
  timeout: 10000, // 10 seconds
  followRedirects: true,
  maxRedirects: 20,
};

/**
 * Check a single URL and follow redirects to get the final destination
 */
export async function checkUrl(url: string, options: UrlCheckOptions = {}): Promise<RedirectResult> {
  const startTime = Date.now();
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Initialize result object
  const result: RedirectResult = {
    initialUrl: url,
    finalUrl: url,
    steps: [],
    redirectCount: 0,
    error: undefined,
  };

  try {
    // Validate the URL
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      throw new Error('Invalid URL. Please include the protocol (http:// or https://)');
    }

    // If following redirects is disabled, just make one request
    if (!mergedOptions.followRedirects) {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': mergedOptions.userAgent,
        },
        maxRedirects: 0,
        validateStatus: () => true, // Accept any status code
        timeout: mergedOptions.timeout,
      });

      const step: RedirectStep = {
        url,
        statusCode: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        location: response.headers.location,
      };

      result.steps.push(step);
      result.finalUrl = url;
      
      // Add timing information
      result.totalTime = Date.now() - startTime;
      
      return result;
    }

    // Track redirect chain manually to get all steps
    let currentUrl = url;
    let redirectCount = 0;
    let maxRedirects = mergedOptions.maxRedirects || 20;

    while (maxRedirects > 0) {
      const response = await axios.get(currentUrl, {
        headers: {
          'User-Agent': mergedOptions.userAgent,
        },
        maxRedirects: 0, // Prevent axios from automatically following redirects
        validateStatus: () => true, // Accept any status code
        timeout: mergedOptions.timeout,
      });

      // Record this step
      const step: RedirectStep = {
        url: currentUrl,
        statusCode: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        location: response.headers.location,
      };

      result.steps.push(step);

      // Check if we've reached the end
      if (response.status < 300 || response.status >= 400 || !response.headers.location) {
        break;
      }

      // Continue to next URL
      currentUrl = new URL(response.headers.location, currentUrl).href;
      redirectCount++;
      maxRedirects--;

      // Check for circular redirects
      if (result.steps.some(s => s.url === currentUrl)) {
        result.error = 'Circular redirect detected';
        break;
      }
    }

    if (maxRedirects === 0 && redirectCount >= mergedOptions.maxRedirects!) {
      result.error = `Maximum number of redirects (${mergedOptions.maxRedirects}) reached`;
    }

    result.finalUrl = result.steps[result.steps.length - 1].url;
    result.redirectCount = redirectCount;
    result.totalTime = Date.now() - startTime;

    return result;
  } catch (error) {
    // Handle any errors
    if (axios.isAxiosError(error)) {
      result.error = error.message;
      if (error.response) {
        const step: RedirectStep = {
          url: error.config?.url || url,
          statusCode: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers as Record<string, string>,
        };
        result.steps.push(step);
      }
    } else if (error instanceof Error) {
      result.error = error.message;
    } else {
      result.error = 'An unknown error occurred';
    }

    result.finalUrl = result.steps.length > 0 ? result.steps[result.steps.length - 1].url : url;
    result.redirectCount = result.steps.length - 1 > 0 ? result.steps.length - 1 : 0;
    result.totalTime = Date.now() - startTime;
    
    return result;
  }
}

/**
 * Get status code description
 */
export function getStatusDescription(statusCode: number): string {
  const statusMap: Record<number, string> = {
    // 2xx
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    204: 'No Content',
    
    // 3xx
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    302: 'Found',
    303: 'See Other',
    304: 'Not Modified',
    307: 'Temporary Redirect',
    308: 'Permanent Redirect',
    
    // 4xx
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    429: 'Too Many Requests',
    
    // 5xx
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };
  
  return statusMap[statusCode] || 'Unknown Status';
}

/**
 * Get the CSS class for a status code
 */
export function getStatusCodeClass(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) {
    return 'status-2xx';
  } else if (statusCode >= 300 && statusCode < 400) {
    return 'status-3xx';
  } else if (statusCode >= 400 && statusCode < 500) {
    return 'status-4xx';
  } else if (statusCode >= 500) {
    return 'status-5xx';
  }
  return '';
} 