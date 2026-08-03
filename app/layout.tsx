import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SBC 2026 - Admin Panel',
  description: 'Event registration management system',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
