import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import DynamicMetadata from '@/components/ui/DynamicMetadata';
import TranslationProvider from '@/components/providers/TranslationProvider';
import translation from '@/../public/locales/en/translation.json';
import StoreProvider from '@/components/providers/StoreProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#c42e23'
};

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  title: translation.meta.title,
  description: translation.meta.description,
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH}manifest.json`,
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH}favicon.ico`,
    apple: `${process.env.NEXT_PUBLIC_BASE_PATH}apple-icon.png`
  },
  openGraph: {
    title: translation.meta.title,
    description: translation.meta.description,
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: translation.meta.title,
    description: translation.meta.description
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
        <StoreProvider>
          <TranslationProvider>{children}</TranslationProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
