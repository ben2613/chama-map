import { useState, useEffect } from 'react';
import { FaSpinner } from 'react-icons/fa6';

export default function Image({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  useEffect(() => {
    setIsLoading(true);
    setIsError(false);
  }, [src]);
  return (
    !isError && (
      <div>
        {isLoading && (
          <div className="flex justify-center items-center h-[200px]">
            <FaSpinner className="animate-spin" />
          </div>
        )}
        <img
          src={src}
          alt={alt}
          onError={() => setIsError(true)}
          onLoad={() => setIsLoading(false)}
          className={isLoading ? 'hidden' : className}
        />
      </div>
    )
  );
}
