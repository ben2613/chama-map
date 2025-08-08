'use client';
import { t, changeLanguage } from '@/lib/i18n';

export default function TranslationExample() {
  // Example event handler without hooks
  const handleLanguageChange = (language: string) => {
    changeLanguage(language);
    console.log('Language changed to:', language);
  };

  // Example function that uses translations
  const showWelcomeMessage = () => {
    const message = t('map.title');
    alert(message);
  };

  // Example with interpolation
  const showPersonalizedMessage = (name: string) => {
    const message = t('common.welcome', { name });
    alert(message);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Translation Examples (No Hooks)</h2>

      <div className="space-y-2">
        <button
          onClick={() => handleLanguageChange('en')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Switch to English
        </button>

        <button
          onClick={() => handleLanguageChange('ja')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Switch to Japanese
        </button>
      </div>

      <div className="space-y-2">
        <button onClick={showWelcomeMessage} className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
          Show Map Title
        </button>

        <button
          onClick={() => showPersonalizedMessage('Haachama')}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Show Personalized Message
        </button>
      </div>

      <div className="mt-4 p-3 bg-gray-100 rounded">
        <p>
          <strong>Current Title:</strong> {t('map.title')}
        </p>
        <p>
          <strong>Current Description:</strong> {t('map.description')}
        </p>
      </div>
    </div>
  );
}
