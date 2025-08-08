'use client';

import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

import '@/lib/i18n';

interface DynamicMetadataProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export default function DynamicMetadata({ title, description, image, url }: DynamicMetadataProps) {
  const { t, i18n } = useTranslation();

  const defaultTitle = t('meta.title', 'Haachama Radar');
  const defaultDescription = t('meta.description', 'Find where the Haachama are!');

  const finalTitle = title || defaultTitle;
  const finalDescription = description || defaultDescription;

  // Update document title when language changes
  useEffect(() => {
    document.title = finalTitle;
  }, [finalTitle, i18n.language]);

  return (
    <Head>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Open Graph */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      {image && <meta name="twitter:image" content={image} />}
    </Head>
  );
}
