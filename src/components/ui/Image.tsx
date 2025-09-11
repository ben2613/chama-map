import { useState, useEffect } from 'react';

export default function Image({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  useEffect(() => {
    setIsLoading(true);
    setIsError(false);
  }, [src]);

  return (
    !isError && (
      <div
        className={
          isLoading || isError
            ? 'h-0 overflow-hidden'
            : 'h-[200px] overflow-hidden transition-all duration-450 ease-in-out'
        }
      >
        <img
          src={src}
          alt={alt}
          onError={() => setIsError(true)}
          onLoad={() => setIsLoading(false)}
          className={className}
        />
      </div>
    )
  );
}
