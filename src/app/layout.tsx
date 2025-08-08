'use client';

// import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import StoreProvider from './utils/StoreProvider';
import DynamicMetadata from './components/DynamicMetadata';
import '../lib/i18n'; // Initialize i18n

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

// export const metadata: Metadata = {
//   title: 'Haachama Radar',
//   description: 'Find where the Haachama are!'
// };

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <DynamicMetadata />
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
