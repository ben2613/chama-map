import { useState } from 'react';

function ImageContent({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  if (isError) return null;

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
