import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const OfflineBanner: React.FC = () => {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-[10003] flex justify-center px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
    >
      <p className="max-w-xl rounded-sm border border-amber-300 bg-amber-50/95 px-3 py-2 text-center text-xs text-amber-950 shadow-md">
        {t('offline.banner')}
      </p>
    </div>
  );
};

export default OfflineBanner;
