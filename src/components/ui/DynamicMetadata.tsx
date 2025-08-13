'use client';

import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

import '@/lib/i18n';

interface DynamicMetadataProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

/**
 * DynamicMetadata component that updates meta tags on the client side.
 *
 * This component works with static site generation by:
 * 1. Using static meta tags from Next.js metadata API in the initial HTML
 * 2. Updating these meta tags dynamically when the component mounts or language changes
 *
 * Usage:
 * ```tsx
 * // Use default translations
 * <DynamicMetadata />
 *
 * // Use custom values
 * <DynamicMetadata
 *   title="Custom Title"
 *   description="Custom description"
 *   image="/custom-image.jpg"
 *   url="https://example.com"
 * />
 * ```
 */
export default function DynamicMetadata({ title, description, image, url }: DynamicMetadataProps) {
  const { t, i18n } = useTranslation();

  const defaultTitle = t('meta.title');
  const defaultDescription = t('meta.description');

  const finalTitle = title || defaultTitle;
  const finalDescription = description || defaultDescription;

  // Update meta tags when language changes or component mounts
  useEffect(() => {
    // Update document title
    document.title = finalTitle;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', finalDescription);

    // Update Open Graph tags
    const updateMetaTag = (property: string, content: string) => {
      let metaTag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('property', property);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', content);
    };

    updateMetaTag('og:title', finalTitle);
    updateMetaTag('og:description', finalDescription);
    if (image) {
      updateMetaTag('og:image', image);
    }
    if (url) {
      updateMetaTag('og:url', url);
    }

    // Update Twitter Card tags
    const updateTwitterTag = (name: string, content: string) => {
      let metaTag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', name);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', content);
    };

    updateTwitterTag('twitter:title', finalTitle);
    updateTwitterTag('twitter:description', finalDescription);
    if (image) {
      updateTwitterTag('twitter:image', image);
    }
  }, [finalTitle, finalDescription, image, url, i18n.language]);

  // This component doesn't render anything visible
  return null;
}
