// import type { Metadata } from 'next';
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
        <TranslationProvider>{children}</TranslationProvider>
      </body>
    </html>
  );
}
