import { useState } from 'react';
import { sections, ui } from '../content/sections';
import type { Locale } from '../types/content';

interface SectionNavProps {
  locale: Locale;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export function SectionNav({ locale, activeSection, onNavigate }: SectionNavProps) {
  const [open, setOpen] = useState(false);
  const copy = ui[locale];

  return (
    <div className={`navigation-wrap${open ? ' navigation-wrap--open' : ''}`}>
      <button
        className="menu-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="primary-navigation"
        aria-label={open ? copy.closeMenu : copy.menu}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
      <nav id="primary-navigation" className="section-nav" aria-label={copy.navigation}>
        <ol>
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={activeSection === section.id ? 'location' : undefined}
                onClick={() => { onNavigate(section.id); setOpen(false); }}
              >
                {section.copy[locale].nav}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
