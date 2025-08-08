import { t, changeLanguage, getCurrentLanguage } from '@/lib/i18n';

// Example utility functions that use translations without hooks
export const getWelcomeMessage = (name: string) => {
  return t('common.welcome', { name });
};

export const getMapTitle = () => {
  return t('map.title');
};

export const switchToJapanese = () => {
  changeLanguage('ja');
  return getCurrentLanguage();
};

export const switchToEnglish = () => {
  changeLanguage('en');
  return getCurrentLanguage();
};

// Example for API responses
export const getLocalizedErrorMessage = (errorCode: string) => {
  const errorMessages: Record<string, string> = {
    network_error: t('errors.network'),
    not_found: t('errors.notFound'),
    unauthorized: t('errors.unauthorized')
  };

  return errorMessages[errorCode] || t('errors.unknown');
};

// Example for form validation messages
export const getValidationMessage = (field: string, rule: string) => {
  return t(`validation.${field}.${rule}`);
};
