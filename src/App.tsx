import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ContentBlocks } from './components/ContentBlocks';
import { LanguageSwitch } from './components/LanguageSwitch';
import { PageShell } from './components/PageShell';
import { SectionNav } from './components/SectionNav';
import { sections, ui } from './content/sections';
import type { Locale, PublicContent } from './types/content';

export default function App() {
  const [locale, setLocale] = useState<Locale>('pt-BR');
  const [activeSection, setActiveSection] = useState('home');
  const [contentItems, setContentItems] = useState<PublicContent['items']>([]);
  const copy = ui[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = 'Living Labs & Collaborative Innovation';
  }, [locale]);

  useEffect(() => {
    let isCurrent = true;
    fetch(`${import.meta.env.BASE_URL}content.json`)
      .then((response) => {
        if (!response.ok) throw new Error('Public content unavailable');
        return response.json() as Promise<PublicContent>;
      })
      .then((data) => { if (isCurrent && Array.isArray(data.items)) setContentItems(data.items); })
      .catch(() => { if (isCurrent) setContentItems([]); });
    return () => { isCurrent = false; };
  }, []);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const targets = sections.map(({ id }) => document.getElementById(id)).filter((node): node is HTMLElement => node !== null);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) {
        setActiveSection(visible.target.id);
        visible.target.classList.add('is-visible');
      }
    }, { rootMargin: '-15% 0px -65% 0px', threshold: [0, 0.2, 0.5, 1] });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <PageShell
      locale={locale}
      header={<>
        <SectionNav locale={locale} activeSection={activeSection} onNavigate={setActiveSection} />
        <LanguageSwitch locale={locale} onChange={setLocale} />
      </>}
    >
      <a className="skip-link" href="#main-content">{copy.skip}</a>
      <main id="main-content" className="story" aria-label={copy.siteLabel}>
        {sections.map((section, index) => {
          const sectionCopy = section.copy[locale];
          const isHome = section.id === 'home';
          const itemsFor = (contentId: string) => contentItems.filter((item) => item.site_section_id === contentId);

          return (
            <section
              id={section.id}
              className={`story-section story-section--${section.tone} story-section--${section.id}`}
              key={section.id}
              aria-labelledby={`${section.id}-title`}
            >
              <div className="section-content">
                {isHome ? (
                  <div className="hero-photo">
                    <img
                      className="hero-photo-image"
                      src="https://images.unsplash.com/photo-1565351167686-7a19c5114965?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=2400"
                      alt={locale === 'pt-BR'
                        ? 'Fotografia ilustrativa de pessoas reunidas em torno de uma mesa.'
                        : 'Illustrative photograph of people gathered around a table.'}
                      fetchPriority="high"
                    />
                    <div className="hero-photo-shade" aria-hidden="true" />
                    <div className="hero-copy">
                      <p className="hero-kicker">{locale === 'en' ? sectionCopy.kicker : <>{sectionCopy.kicker} <span>·</span> Pesquisa</>}</p>
                      <ContentBlocks items={itemsFor(section.contentSectionIds[0])} locale={locale} />
                      <p className="hero-author">{locale === 'en' ? 'by Rayse Kiane de Souza' : 'por Rayse Kiane de Souza'}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <EditorialSectionHeader index={index} tone={section.tone} label={sectionCopy.kicker} />
                    <div className="section-heading-row">
                      <h2 id={`${section.id}-title`}>{sectionCopy.title}</h2>
                    </div>
                    {sectionCopy.description && <p className="section-description">{sectionCopy.description}</p>}
                    {section.subsections ? (
                      <div className={`subsection-grid subsection-grid--${section.id}`}>
                        {section.subsections.map((subsection, subIndex) => {
                          const subsectionItems = itemsFor(subsection.contentId);
                          return (
                            <article className="subsection-card" id={subsection.id} key={subsection.id}>
                              <div className="subsection-topline"><span>{String(subIndex + 1).padStart(2, '0')}</span><i aria-hidden="true" /></div>
                              <h3>{subsection.title[locale]}</h3>
                              {subsection.id === 'full-thesis' ? (
                                <div className="thesis-access-layout">
                                  <div className="thesis-access-copy">
                                    <ContentBlocks items={subsectionItems} locale={locale} />
                                    {subsectionItems.length === 0 && <p className="empty-state">{sectionCopy.empty}</p>}
                                  </div>
                                  <ThesisPartnerLogos locale={locale} />
                                </div>
                              ) : (
                                <>
                                  <ContentBlocks items={subsectionItems} locale={locale} />
                                  {subsectionItems.length === 0 && <p className="empty-state">{sectionCopy.empty}</p>}
                                </>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="results-panel">
                        {itemsFor(section.contentSectionIds[0]).length === 0 && <p className="empty-state">{sectionCopy.empty}</p>}
                        <ContentBlocks items={itemsFor(section.contentSectionIds[0])} locale={locale} />
                        <ResultsChart locale={locale} />
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          );
        })}
      </main>
      <footer className="page-footer">
        <span>Living Labs como ambientes colaborativos para a inovação: uma proposta de framework</span>
        <span>Rayse Kiane de Souza</span>
        <span>{copy.footer}</span>
      </footer>
    </PageShell>
  );
}

function ThesisPartnerLogos({ locale }: { locale: Locale }) {
  return (
    <div className="thesis-partner-logos" role="group" aria-label={locale === 'en' ? 'University and research group affiliations' : 'Universidade e grupo de pesquisa'}>
      <img src={`${import.meta.env.BASE_URL}images/logos/via.png`} alt="VIA Estação Conhecimento" loading="lazy" />
      <img src={`${import.meta.env.BASE_URL}images/logos/egc.png`} alt="EGC — Engenharia e Gestão do Conhecimento" loading="lazy" />
      <img src={`${import.meta.env.BASE_URL}images/logos/ufsc.png`} alt="UFSC — Universidade Federal de Santa Catarina" loading="lazy" />
    </div>
  );
}

function ResultsChart({ locale }: { locale: Locale }) {
  const isEnglish = locale === 'en';
  const stages = isEnglish
    ? [
      { name: 'Initial Definitions', value: 37.07 },
      { name: 'Stakeholder Mapping', value: 25.27 },
      { name: 'Qualification and Closure', value: 21.14 },
      { name: 'Implementation and Testing', value: 8.45 },
      { name: 'Open Call and Solution Selection', value: 8.07 },
    ]
    : [
      { name: 'Definições Iniciais', value: 37.07 },
      { name: 'Mapeamento de Stakeholders', value: 25.27 },
      { name: 'Qualificação e Encerramento', value: 21.14 },
      { name: 'Implantação e Testes', value: 8.45 },
      { name: 'Chamada Pública e Seleção das Soluções', value: 8.07 },
    ];
  const formatValue = (value: number) => `${new Intl.NumberFormat(isEnglish ? 'en' : 'pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}%`;

  return (
    <figure className="results-chart">
      <h3>{isEnglish ? 'What received the highest priority?' : 'O que recebeu maior prioridade?'}</h3>
      <p className="results-chart-subtitle">{isEnglish ? 'Relative importance assigned to the framework stages' : 'Importância relativa atribuída às etapas do framework'}</p>
      <ol className="results-chart-list">
        {stages.map(({ name, value }) => (
          <li className="results-chart-item" key={name}>
            <div className="results-chart-label"><span>{name}</span><strong>{formatValue(value)}</strong></div>
            <div className="results-chart-track" aria-hidden="true"><span style={{ width: `${value}%` }} /></div>
          </li>
        ))}
      </ol>
      <figcaption>{isEnglish ? 'Source: thesis results on the relative importance of the stages.' : 'Fonte: resultados da análise de importância relativa das etapas na tese.'}</figcaption>
    </figure>
  );
}

function EditorialSectionHeader({ index, tone, label }: { index: number; tone: 'paper' | 'tint' | 'ink'; label: ReactNode }) {
  return (
    <div className={`section-editorial-header section-editorial-header--${tone}`}>
      <span className="section-editorial-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <span className="section-editorial-rule" aria-hidden="true" />
      <p className="section-kicker">{label}</p>
    </div>
  );
}
