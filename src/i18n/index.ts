import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import srLatnCommon from './locales/sr-Latn/common.json';
import srLatnNavigation from './locales/sr-Latn/navigation.json';
import srLatnSettings from './locales/sr-Latn/settings.json';

import srCyrlCommon from './locales/sr-Cyrl/common.json';
import srCyrlNavigation from './locales/sr-Cyrl/navigation.json';
import srCyrlSettings from './locales/sr-Cyrl/settings.json';

import enCommon from './locales/en/common.json';
import enNavigation from './locales/en/navigation.json';
import enSettings from './locales/en/settings.json';

export type Locale = 'sr-Latn' | 'sr-Cyrl' | 'en';

export const LOCALES: { code: Locale; labelNative: string }[] = [
  { code: 'sr-Latn', labelNative: 'Srpski (latinica)' },
  { code: 'sr-Cyrl', labelNative: 'Српски (ћирилица)' },
  { code: 'en', labelNative: 'English' },
];

const resources = {
  'sr-Latn': {
    common: srLatnCommon,
    navigation: srLatnNavigation,
    settings: srLatnSettings,
  },
  'sr-Cyrl': {
    common: srCyrlCommon,
    navigation: srCyrlNavigation,
    settings: srCyrlSettings,
  },
  en: {
    common: enCommon,
    navigation: enNavigation,
    settings: enSettings,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'sr-Latn',
  fallbackLng: 'sr-Latn',
  ns: ['common', 'navigation', 'settings'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
