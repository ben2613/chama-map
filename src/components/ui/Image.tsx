import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function ImageContent({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  if (isError) {
    return (
      <div
        className="flex h-[200px] w-full flex-col items-center justify-center gap-1 bg-gray-100 text-gray-500"
        role="img"
        aria-label={alt ?? t('offline.imageUnavailable')}
      >
        <span className="text-2xl opacity-60" aria-hidden>
          🖼
        </span>
        <span className="px-2 text-center text-xs">{t('offline.imageUnavailable')}</span>
      </div>
    );
  }

  return (
    <div className="relative h-[200px] w-full overflow-hidden bg-gray-100">
      {isLoading && <div className="absolute inset-0 animate-pulse bg-gray-200" aria-hidden />}
      <img
        src={src}
        alt={alt}
        onError={() => setIsError(true)}
        onLoad={() => setIsLoading(false)}
        className={`${className ?? ''} ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      />
    </div>
  );
}

export default function Image({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  return <ImageContent key={src} src={src} alt={alt} className={className} />;
}
