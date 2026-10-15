import type { Locale } from '../types/content';

interface LanguageSwitchProps {
  locale: Locale;
  onChange: (locale: Locale) => void;
}

export function LanguageSwitch({ locale, onChange }: LanguageSwitchProps) {
  return (
    <div className="language-switch" role="group" aria-label="Language / Idioma">
      <button type="button" aria-pressed={locale === 'pt-BR'} onClick={() => onChange('pt-BR')}>
        PT
      </button>
      <button type="button" aria-pressed={locale === 'en'} onClick={() => onChange('en')}>
        EN
      </button>
    </div>
  );
}
