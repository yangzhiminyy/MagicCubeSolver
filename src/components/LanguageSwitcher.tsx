import { useTranslation } from 'react-i18next'
import './LanguageSwitcher.css'

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const isEn = (i18n.resolvedLanguage || i18n.language || '').startsWith('en')

  return (
    <div className="language-switcher" role="group" aria-label="Language">
      <button
        type="button"
        className={`lang-btn ${!isEn ? 'active' : ''}`}
        onClick={() => {
          void i18n.changeLanguage('zh-CN')
        }}
      >
        {t('language.zh')}
      </button>
      <span className="lang-sep" aria-hidden>
        |
      </span>
      <button
        type="button"
        className={`lang-btn ${isEn ? 'active' : ''}`}
        onClick={() => {
          void i18n.changeLanguage('en')
        }}
      >
        {t('language.en')}
      </button>
    </div>
  )
}
