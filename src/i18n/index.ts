import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zhCN from './locales/zh-CN.json'
import en from './locales/en.json'

const STORAGE_KEY = 'magic-cube-solver.locale'

export function syncDocumentLang(lng: string): void {
  document.documentElement.lang = lng.startsWith('en') ? 'en' : 'zh-CN'
}

function getInitialLanguage(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'zh-CN') return saved
  } catch {
    /* private mode etc. */
  }
  if (typeof navigator === 'undefined') return 'zh-CN'
  const nav = navigator.language || 'zh-CN'
  return nav.toLowerCase().startsWith('en') ? 'en' : 'zh-CN'
}

void i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    en: { translation: en },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'zh-CN',
  interpolation: { escapeValue: false },
})

syncDocumentLang(i18n.language)

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    /* ignore */
  }
  syncDocumentLang(lng)
})

export default i18n
