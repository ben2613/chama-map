import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import DynamicMetadata from '@/components/ui/DynamicMetadata';
import TranslationProvider from '@/components/providers/TranslationProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  title: 'Haachama Radar',
  description: 'Find where the Haachama are!',
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH}manifest.json`,
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH}favicon.ico`,
    apple: `${process.env.NEXT_PUBLIC_BASE_PATH}apple-icon.png`
  },
  openGraph: {
    title: 'Haachama Radar',
    description: 'Find where the Haachama are!',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Haachama Radar',
    description: 'Find where the Haachama are!'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <DynamicMetadata />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TranslationProvider>{children}</TranslationProvider>
      </body>
    </html>
  );
}
