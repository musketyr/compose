import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Scribe - Collaborative Article Writing',
  description: 'Write articles with AI assistance',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
