export interface RedirectStep {
  url: string;
  statusCode: number;
  statusText: string;
  location?: string;
  headers?: Record<string, string>;
  timing?: {
    start: number;
    end: number;
    duration: number;
  };
  performanceRating?: 'fast' | 'medium' | 'slow';
}

export interface RedirectResult {
  initialUrl: string;
  finalUrl: string;
  steps: RedirectStep[];
  redirectCount: number;
  totalTime?: number; // in milliseconds
  error?: string;
  recommendations?: Array<{
    type: 'warning' | 'info' | 'success';
    message: string;
    details?: string;
  }>;
}

export interface UrlCheckOptions {
  userAgent?: string;
  timeout?: number;
  followRedirects?: boolean;
  maxRedirects?: number;
} 