import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VRM AI Avatar Chat',
  description: 'Interactive 3D AI Avatar with Vietnamese voice and lip sync',
  keywords: ['VRM', 'AI', 'Avatar', '3D', 'Chat', 'Vietnamese', 'DeepSeek'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
