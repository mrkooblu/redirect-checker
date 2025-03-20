import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'URL Redirect Checker - Check HTTP Status and Redirect Chains',
  description: 'Check HTTP status of any URL, analyze redirect chains, view response headers, and track HTTP status codes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Roboto+Mono&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body>{children}</body>
    </html>
  );
} 