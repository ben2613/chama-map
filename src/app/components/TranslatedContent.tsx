'use client';
import { useAppTranslation } from '@/lib/hooks';

export default function TranslatedContent() {
  const { t } = useAppTranslation();

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">{t('map.title')}</h1>
      <p className="text-gray-600 mb-4">{t('map.description')}</p>
      <div className="space-y-2">
        <p>
          <strong>{t('map.prefecture')}:</strong> Tokyo
        </p>
        <p>
          <strong>{t('map.location')}:</strong> Akihabara
        </p>
        <p>
          <strong>{t('map.date')}:</strong> 2024-01-15
        </p>
      </div>
      <div className="mt-4 text-sm text-gray-500">{t('common.loading')}</div>
    </div>
  );
}
