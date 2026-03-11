import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import srLatnCommon from './locales/sr-Latn/common.json';
import srLatnNavigation from './locales/sr-Latn/navigation.json';
import srLatnSettings from './locales/sr-Latn/settings.json';
import srLatnClients from './locales/sr-Latn/clients.json';
import srLatnCases from './locales/sr-Latn/cases.json';

import srCyrlCommon from './locales/sr-Cyrl/common.json';
import srCyrlNavigation from './locales/sr-Cyrl/navigation.json';
import srCyrlSettings from './locales/sr-Cyrl/settings.json';
import srCyrlClients from './locales/sr-Cyrl/clients.json';
import srCyrlCases from './locales/sr-Cyrl/cases.json';

import enCommon from './locales/en/common.json';
import enNavigation from './locales/en/navigation.json';
import enSettings from './locales/en/settings.json';
import enClients from './locales/en/clients.json';
import enCases from './locales/en/cases.json';

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
    clients: srLatnClients,
    cases: srLatnCases,
  },
  'sr-Cyrl': {
    common: srCyrlCommon,
    navigation: srCyrlNavigation,
    settings: srCyrlSettings,
    clients: srCyrlClients,
    cases: srCyrlCases,
  },
  en: {
    common: enCommon,
    navigation: enNavigation,
    settings: enSettings,
    clients: enClients,
    cases: enCases,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'sr-Latn',
  fallbackLng: 'sr-Latn',
  ns: ['common', 'navigation', 'settings', 'clients', 'cases'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
