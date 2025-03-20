import type { Metadata } from 'next';
import StyledComponentsRegistry from '@/lib/registry';

export const metadata: Metadata = {
  title: '301 URL Redirect & HTTP Status Checker - Track Redirect Chains',
  description: 'Check HTTP status of any URL, analyze redirect chains, view response headers, and track HTTP status codes.',
};

// NoFlash component to avoid FOUC (Flash Of Unstyled Content)
function NoFlash() {
  return (
    <script dangerouslySetInnerHTML={{
      __html: `
        (function() {
          // This injects critical styles to avoid FOUC
          var css = document.createElement('style');
          css.type = 'text/css';
          var cssCode = 'body { visibility: hidden; }';
          css.appendChild(document.createTextNode(cssCode));
          document.head.appendChild(css);
          
          // After styles are fully loaded
          window.addEventListener('DOMContentLoaded', function() {
            document.body.style.visibility = 'visible';
          });
        })();
      `
    }} />
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <NoFlash />
        <link 
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Roboto+Mono&display=swap" 
          rel="stylesheet" 
        />
        <style dangerouslySetInnerHTML={{ __html: `
          /* Critical CSS to prevent FOUC */
          html { visibility: visible; opacity: 1; }
          body { background-color: #ffffff; color: #333333; font-family: 'Manrope', sans-serif; }
        `}} />
      </head>
      <body>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
      </body>
    </html>
  );
} 